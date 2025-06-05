
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
    
    console.log('Received speech result:', speechResult);
    console.log('Call SID:', callSid);
    console.log('Call from:', from);
    console.log('Call to:', to);
    
    // Validate that this is a call from our Twilio number
    const isFromTwilio = to === TWILIO_PHONE_NUMBER;
    if (!isFromTwilio) {
      console.log('Warning: Call not from our Twilio number. Received on:', to);
    }

    // Get call parameters from our database
    const { data: callData } = await supabase
      .from('emergency_calls')
      .select('id, user_id, patient_name')
      .eq('twilio_sid', callSid)
      .maybeSingle();

    // Generate TwiML for the next step
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          Thank you for describing your symptoms. Now, I need to understand the severity of your condition.
        </Say>
        
        <Gather input="speech" timeout="5" action="${BASE_URL}/functions/v1/collect-severity" method="POST">
          <Say voice="Polly.Joanna">
            On a scale from low to critical, how severe is your condition? Please say low, medium, high, or critical.
          </Say>
        </Gather>
        
        <Say voice="Polly.Joanna">
          I didn't hear anything. Let's try again.
        </Say>
        
        <Redirect>${BASE_URL}/functions/v1/collect-symptoms</Redirect>
      </Response>
    `;

    // Update the emergency call record with the symptoms
    if (callData?.id && speechResult) {
      const { error } = await supabase
        .from('emergency_calls')
        .update({
          symptoms: [speechResult.toString()],
          status: 'collecting_data',
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) {
        console.error('Error updating emergency call record:', error);
      } else {
        console.log('Successfully stored symptoms for call ID:', callData.id);
      }
    } else if (!callData && callSid && speechResult && from) {
      // If we don't have a record yet but have a call SID, create one
      const { error } = await supabase
        .from('emergency_calls')
        .insert({
          twilio_sid: callSid.toString(),
          patient_name: 'Unknown Patient',
          symptoms: [speechResult.toString()],
          address: 'Location unknown',
          status: 'collecting_data',
          phone_number: from.toString()
        });

      if (error) {
        console.error('Error creating new emergency call record:', error);
      } else {
        console.log('Created new emergency call record for untracked call with SID:', callSid);
      }
    }

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error in collect-symptoms:', error);
    
    // Return a simple TwiML with an error message
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          I'm sorry, we're experiencing technical difficulties processing your symptoms. Please hang up and dial 911 directly if this is a medical emergency.
        </Say>
        <Hangup />
      </Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
