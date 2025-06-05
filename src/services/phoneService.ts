
import { supabase } from "@/integrations/supabase/client";

interface CallDetails {
  phoneNumber: string;
  userId: string;
  patientName?: string;
}

/**
 * Initiates an emergency call to the user's phone using the Twilio-powered backend
 * @param phoneNumber The user's phone number to call
 */
export async function initiateEmergencyCall(callDetails: CallDetails) {
  try {
    const { phoneNumber, userId, patientName } = callDetails;
    
    // Check if phone number is valid
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new Error("Invalid phone number");
    }
    
    // Call our Supabase Edge Function to initiate the call
    const { data, error } = await supabase.functions.invoke("emergency-call", {
      body: { 
        phoneNumber, 
        userId,
        patientName: patientName || "Patient" 
      }
    });
    
    if (error) {
      console.error("Error initiating call:", error);
      
      // Check if it's likely a credentials issue based on the error pattern
      if (error.message && error.message.includes("non-2xx status code")) {
        throw new Error("Failed to initiate call. The emergency call service is not properly configured. Please contact support.");
      }
      
      throw error;
    }
    
    // Check if there's an error message in the data (from the edge function)
    if (data && data.error) {
      console.error("Error from edge function:", data);
      
      // If we have missing credentials info, pass it along
      if (data.missingCredentials) {
        const customError = new Error(data.error) as any;
        customError.missingCredentials = data.missingCredentials;
        throw customError;
      }
      
      throw new Error(data.error);
    }
    
    return {
      callSid: data.callSid,
      status: data.status,
      emergencyCallId: data.emergencyCallId
    };
  } catch (error) {
    console.error("Failed to initiate emergency call:", error);
    throw error;
  }
}

/**
 * Gets the status of an ongoing emergency call
 * @param callSid The Twilio call SID to check
 */
export async function getCallStatus(callSid: string) {
  try {
    const { data, error } = await supabase.functions.invoke("call-status", {
      body: { callSid }
    });
    
    if (error) {
      console.error("Error getting call status:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to get call status:", error);
    throw error;
  }
}

/**
 * Gets the details of an emergency call from the database
 * @param emergencyCallId The ID of the emergency call record
 */
export async function getEmergencyCallDetails(emergencyCallId: string) {
  try {
    const { data, error } = await supabase
      .from('emergency_calls')
      .select('*')
      .eq('id', emergencyCallId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching emergency call details:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to get emergency call details:", error);
    throw error;
  }
}
