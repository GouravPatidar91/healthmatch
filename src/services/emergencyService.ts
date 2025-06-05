
import { supabase } from "@/integrations/supabase/client";

export interface EmergencyCallData {
  patient_name: string;
  age?: number | null;
  gender?: string | null;
  address: string;
  symptoms: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical' | null;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  address: string;
  distance: number;
}

export async function createEmergencyCall(callData: EmergencyCallData) {
  try {
    const { data: user } = await supabase.auth.getSession();
    
    if (!user.session?.user) {
      throw new Error("User must be logged in to create an emergency call");
    }
    
    const { data, error } = await supabase
      .from("emergency_calls")
      .insert({
        user_id: user.session.user.id,
        patient_name: callData.patient_name,
        age: callData.age,
        gender: callData.gender,
        address: callData.address,
        symptoms: callData.symptoms,
        severity: callData.severity,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating emergency call:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to create emergency call:", error);
    throw error;
  }
}

export async function findNearbyDoctors(latitude: number, longitude: number, specialization?: string) {
  try {
    const { data, error } = await supabase
      .rpc('find_nearest_doctor', { 
        lat: latitude, 
        long: longitude,
        specialization_filter: specialization || null
      });

    if (error) {
      console.error("Error finding nearby doctors:", error);
      throw error;
    }
    
    return data as Doctor[];
  } catch (error) {
    console.error("Failed to find nearby doctors:", error);
    throw error;
  }
}

export async function getUserEmergencyCalls() {
  try {
    const { data: user } = await supabase.auth.getSession();
    
    if (!user.session?.user) {
      throw new Error("User must be logged in to view emergency calls");
    }
    
    const { data, error } = await supabase
      .from("emergency_calls")
      .select()
      .eq('user_id', user.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching emergency calls:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch emergency calls:", error);
    throw error;
  }
}

export async function assignDoctorToEmergencyCall(emergencyCallId: string, doctorId: string) {
  try {
    const { data: user } = await supabase.auth.getSession();
    
    if (!user.session?.user) {
      throw new Error("User must be logged in to update emergency calls");
    }
    
    const { data, error } = await supabase
      .from("emergency_calls")
      .update({
        doctor_id: doctorId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', emergencyCallId)
      .eq('user_id', user.session.user.id) // Ensure user only updates their own calls
      .select()
      .single();

    if (error) {
      console.error("Error assigning doctor to emergency call:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to assign doctor to emergency call:", error);
    throw error;
  }
}
