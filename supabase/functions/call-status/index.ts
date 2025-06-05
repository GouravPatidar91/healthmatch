
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';

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
    const { callSid } = await req.json();

    // Check for required credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error('Missing Twilio credentials. Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set as environment variables.');
      return new Response(
        JSON.stringify({ 
          error: 'Twilio credentials are not configured. Please set up the required environment variables.',
          missingCredentials: {
            accountSid: !TWILIO_ACCOUNT_SID,
            authToken: !TWILIO_AUTH_TOKEN
          }
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (!callSid) {
      return new Response(
        JSON.stringify({ error: 'Call SID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Make the API call to Twilio to get call status
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`;
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioApiUrl, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.json();
      console.error('Twilio API Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve call status', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callData = await twilioResponse.json();

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: callData.status,
        duration: callData.duration,
        direction: callData.direction,
        from: callData.from,
        to: callData.to,
        dateCreated: callData.date_created,
        dateUpdated: callData.date_updated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting call status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
