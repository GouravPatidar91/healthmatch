
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';
const BASE_URL = Deno.env.get('BASE_URL') || 'https://bpflebtklgnivcanhlbp.supabase.co';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    // Get the request body
    const { phoneNumber, userId, patientName } = await req.json();

    // Check for required credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio credentials. Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set as environment variables.');
      return new Response(
        JSON.stringify({ 
          error: 'Twilio credentials are not configured. Please set up the required environment variables.',
          missingCredentials: {
            accountSid: !TWILIO_ACCOUNT_SID,
            authToken: !TWILIO_AUTH_TOKEN, 
            phoneNumber: !TWILIO_PHONE_NUMBER
          }
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate inputs
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    // First create an emergency call record
    const { data: emergencyCall, error: emergencyCallError } = await supabase
      .from('emergency_calls')
      .insert({
        user_id: userId || null,
        patient_name: patientName || 'Unknown',
        status: 'initiated',
        symptoms: [],
        address: 'To be collected',
        phone_number: formattedPhone
      })
      .select()
      .single();

    if (emergencyCallError) {
      console.error('Error creating emergency call record:', emergencyCallError);
    } else {
      console.log('Created emergency call record:', emergencyCall.id);
    }

    // Build the TwiML for the call
    const twimlUrl = `${BASE_URL}/functions/v1/call-twiml?patientName=${encodeURIComponent(patientName)}&userId=${encodeURIComponent(userId || '')}`;

    // Make the API call to Twilio to initiate the call
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Url: twimlUrl,
        StatusCallback: `${BASE_URL}/functions/v1/call-status-webhook`,
        StatusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'].join(' '),
        StatusCallbackMethod: 'POST',
      }).toString(),
    });

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.json();
      console.error('Twilio API Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callData = await twilioResponse.json();

    // Update the emergency call with the Twilio SID
    if (emergencyCall?.id) {
      const { error: updateError } = await supabase
        .from('emergency_calls')
        .update({ 
          twilio_sid: callData.sid,
          status: callData.status 
        })
        .eq('id', emergencyCall.id);
      
      if (updateError) {
        console.error('Error updating emergency call with SID:', updateError);
      } else {
        console.log('Updated emergency call with Twilio SID:', callData.sid);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: callData.sid, 
        status: callData.status,
        emergencyCallId: emergencyCall?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in emergency call function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
