
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BASE_URL = Deno.env.get('BASE_URL') || 'https://bpflebtklgnivcanhlbp.supabase.co';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to determine severity level
function determineSeverity(speech: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerSpeech = speech.toLowerCase();
  
  if (lowerSpeech.includes('critical') || lowerSpeech.includes('severe') || 
      lowerSpeech.includes('very bad') || lowerSpeech.includes('emergency')) {
    return 'critical';
  } 
  else if (lowerSpeech.includes('high') || lowerSpeech.includes('bad') || 
           lowerSpeech.includes('serious')) {
    return 'high';
  } 
  else if (lowerSpeech.includes('medium') || lowerSpeech.includes('moderate')) {
    return 'medium';
  } 
  else {
    return 'low';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse form data from Twilio
    const formData = await req.formData();
    const speechResult = formData.get('SpeechResult');
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    const to = formData.get('To');
    
    console.log('Received severity assessment:', speechResult);
    console.log('Call SID:', callSid);

    // Validate that this is a call from our Twilio number
    const isFromTwilio = to === TWILIO_PHONE_NUMBER;
    if (!isFromTwilio) {
      console.log('Warning: Call not from our Twilio number. Received on:', to);
    }

    // Get call parameters from our database
    const { data: callData } = await supabase
      .from('emergency_calls')
      .select('id, user_id, patient_name, symptoms')
      .eq('twilio_sid', callSid)
      .maybeSingle();

    // If we have speech data, determine severity
    let severity = 'medium'; // Default
    if (speechResult) {
      severity = determineSeverity(speechResult.toString());
    }

    // Generate TwiML for the next step - location gathering
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          Thank you for providing your severity level. Now, I need to know your location.
        </Say>
        
        <Gather input="speech" timeout="5" action="${BASE_URL}/functions/v1/collect-location" method="POST">
          <Say voice="Polly.Joanna">
            Please state your current address or location so we can send help.
          </Say>
        </Gather>
        
        <Say voice="Polly.Joanna">
          I didn't hear anything. Let's try again.
        </Say>
        
        <Redirect>${BASE_URL}/functions/v1/collect-severity</Redirect>
      </Response>
    `;

    // Update the emergency call record with the severity
    if (callData?.id && speechResult) {
      const { error } = await supabase
        .from('emergency_calls')
        .update({
          severity: severity,
          status: 'collecting_location',
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) {
        console.error('Error updating emergency call record with severity:', error);
      } else {
        console.log('Successfully stored severity for call ID:', callData.id);
      }
    } else if (!callData && callSid && speechResult && from) {
      // If we don't have a record yet but have a call SID, create one
      const { error } = await supabase
        .from('emergency_calls')
        .insert({
          twilio_sid: callSid.toString(),
          patient_name: 'Unknown Patient',
          symptoms: ['Symptoms unknown'],
          severity: severity,
          address: 'Location unknown',
          status: 'collecting_location',
          phone_number: from.toString()
        });

      if (error) {
        console.error('Error creating emergency call record with severity:', error);
      } else {
        console.log('Created new emergency call record for untracked call with SID:', callSid);
      }
    }

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error in collect-severity:', error);
    
    // Return a simple TwiML with an error message
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          I'm sorry, we're experiencing technical difficulties processing your information. Please hang up and dial 911 directly if this is a medical emergency.
        </Say>
        <Hangup />
      </Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
