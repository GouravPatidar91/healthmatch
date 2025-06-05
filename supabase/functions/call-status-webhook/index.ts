
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

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
    // Parse form data from Twilio
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const callDuration = formData.get('CallDuration');
    
    console.log(`Received status update for call ${callSid}: ${callStatus}`);
    
    // Try to update any emergency calls with this SID
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && callSid && callStatus) {
      try {
        const { data, error } = await supabase
          .from('emergency_calls')
          .update({ 
            status: callStatus.toString(),
            call_duration: callDuration ? parseInt(callDuration.toString()) : null,
            updated_at: new Date().toISOString()
          })
          .eq('twilio_sid', callSid);
          
        if (error) {
          console.error('Error updating call record:', error);
        } else {
          console.log('Updated call record for SID:', callSid);
        }
        
        // If call is completed or failed, check if we need to take additional actions
        if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
          // Get the emergency call details
          const { data: emergencyCall } = await supabase
            .from('emergency_calls')
            .select('*')
            .eq('twilio_sid', callSid)
            .maybeSingle();
            
          if (emergencyCall) {
            // Check if we have all the required information
            if (!emergencyCall.symptoms || emergencyCall.symptoms.length === 0) {
              console.log('Warning: Call completed without collecting symptoms');
              
              // Update with a note about the incomplete data collection
              await supabase
                .from('emergency_calls')
                .update({ 
                  status: 'incomplete',
                  updated_at: new Date().toISOString()
                })
                .eq('id', emergencyCall.id);
            }
          }
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
      }
    }
    
    // Twilio expects a TwiML response
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>
    `;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
    
  } catch (error) {
    console.error('Error in call-status-webhook:', error);
    
    // Still return a valid TwiML response to Twilio
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
