
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
    
    console.log('Received location information:', speechResult);
    console.log('Call SID:', callSid);

    // Get call parameters from our database
    const { data: callData } = await supabase
      .from('emergency_calls')
      .select('id, user_id, patient_name, symptoms, severity')
      .eq('twilio_sid', callSid)
      .maybeSingle();

    // Generate TwiML for the final step - call completion
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          Thank you for providing your location. We have recorded all your information and will find the nearest available doctor for you.
          Medical assistance will be coordinated based on your condition. Please stay on the line for further instructions or hang up if you need to prepare for emergency services.
        </Say>
        <Pause length="2"/>
        <Say voice="Polly.Joanna">
          If this is a life-threatening emergency, please dial 911 directly. Thank you for using our emergency service.
        </Say>
        <Hangup />
      </Response>
    `;

    // Update the emergency call record with the location and mark as complete
    if (callData?.id && speechResult) {
      const { error } = await supabase
        .from('emergency_calls')
        .update({
          address: speechResult.toString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) {
        console.error('Error updating emergency call record with location:', error);
      } else {
        console.log('Successfully completed data collection for call ID:', callData.id);
        
        // Try to find doctors nearby - this will be used by the frontend
        if (callData.severity === 'high' || callData.severity === 'critical') {
          console.log('High severity case - attempting to find doctors');
          // Here we would normally trigger a notification to doctors
          // For now we just log it
        }
      }
    } else if (!callData && callSid && speechResult && from) {
      // If we don't have a record yet but have a call SID, create one
      const { error } = await supabase
        .from('emergency_calls')
        .insert({
          twilio_sid: callSid.toString(),
          patient_name: 'Unknown Patient',
          symptoms: ['Symptoms unknown'],
          severity: 'medium',
          address: speechResult.toString(),
          status: 'completed',
          phone_number: from.toString()
        });

      if (error) {
        console.error('Error creating completed emergency call record:', error);
      } else {
        console.log('Created and completed new emergency call record for call with SID:', callSid);
      }
    }

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error in collect-location:', error);
    
    // Return a simple TwiML with an error message
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          I'm sorry, we're experiencing technical difficulties processing your location. Your information has been recorded, and we will try to contact you. Please hang up and dial 911 directly if this is a medical emergency.
        </Say>
        <Hangup />
      </Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
