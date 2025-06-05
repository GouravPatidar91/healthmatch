
import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmergencyCallData, createEmergencyCall, findNearbyDoctors, assignDoctorToEmergencyCall } from '@/services/emergencyService';
import { geocodeAddress, getCurrentPosition } from '@/utils/geolocation';

export function useEmergencyService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const submitEmergencyCall = async (callData: EmergencyCallData, doctorId?: string) => {
    if (!user) {
      setError('You must be logged in to create an emergency call');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create emergency call
      const callResult = await createEmergencyCall(callData);
      
      // If doctor ID is provided, assign the doctor
      if (doctorId && callResult?.id) {
        await assignDoctorToEmergencyCall(callResult.id, doctorId);
        toast({
          title: "Doctor assigned",
          description: "The doctor has been notified and will contact you shortly."
        });
      }
      
      return callResult;
      
    } catch (err) {
      console.error("Error in emergency service:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const findDoctors = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get coordinates from address
      const { latitude, longitude } = await geocodeAddress(address);
      
      // Find nearby doctors
      const doctors = await findNearbyDoctors(latitude, longitude);
      return doctors;
      
    } catch (err) {
      console.error("Error finding doctors:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error finding doctors",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user's current location and find nearby doctors
   */
  const findDoctorsNearCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current position
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Find nearby doctors
      const doctors = await findNearbyDoctors(latitude, longitude);
      return doctors;
      
    } catch (err) {
      console.error("Error finding doctors near current location:", err);
      const errorMessage = err instanceof Error ? err.message : 'Could not access your location';
      setError(errorMessage);
      toast({
        title: "Location error",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    submitEmergencyCall,
    findDoctors,
    findDoctorsNearCurrentLocation,
  };
}
