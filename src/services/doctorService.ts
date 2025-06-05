import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  region: string;
  address: string;
  email?: string;
  availability?: {
    day: string;
    slots: string[];
  }[];
  rating?: number;
  degrees?: string;
  experience?: number;
  verified?: boolean;
  available?: boolean;
}

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_patients: number;
  status: 'available' | 'booked' | 'cancelled';
}

export interface DoctorAppointment {
  id: string;
  patientName?: string;
  time: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'confirmed';
  date: string;
  notes?: string;
}

// Custom hook to fetch all doctors
export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('verified', true)
          .eq('available', true);

        if (error) {
          throw error;
        }

        setDoctors(data || []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch doctors'));
        toast({
          title: "Error",
          description: "Failed to fetch doctors list",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [toast]);

  const findNearbyDoctors = async () => {
    try {
      setLoading(true);
      
      if (!navigator.geolocation) {
        toast({
          title: "Location not supported",
          description: "Your browser doesn't support location services",
          variant: "destructive"
        });
        return false;
      }

      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              
              // Show success toast for location access
              toast({
                title: "Location found",
                description: "Finding doctors near your location...",
              });
              
              const nearbyDoctors = await findNearestDoctors(latitude, longitude);
              const formattedDoctors = nearbyDoctors.map((doctor: any) => ({
                ...doctor,
                region: doctor.region || 'Unknown',
              }));
              
              setDoctors(formattedDoctors);
              
              toast({
                title: "Nearby doctors found",
                description: `Found ${formattedDoctors.length} doctors near you`,
              });
              
              resolve(true);
            } catch (error) {
              console.error('Error finding nearby doctors:', error);
              toast({
                title: "Error",
                description: "Failed to find nearby doctors",
                variant: "destructive"
              });
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            setLoading(false);
            let errorMessage = 'Location access denied';
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Please allow location access to find nearby doctors';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Your location is not available';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }
            
            toast({
              title: "Location error",
              description: errorMessage,
              variant: "destructive"
            });
            
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch (error) {
      setLoading(false);
      console.error('Error accessing location:', error);
      toast({
        title: "Error",
        description: "Failed to access location services",
        variant: "destructive"
      });
      return false;
    }
  };

  return { doctors, loading, error, findNearbyDoctors };
};

// Custom hook to fetch doctors by specialization
export const useDoctorsBySpecialization = (specialization?: string) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        let query = supabase
          .from('doctors')
          .select('*')
          .eq('verified', true)
          .eq('available', true);

        if (specialization) {
          query = query.eq('specialization', specialization);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setDoctors(data || []);
      } catch (err) {
        console.error('Error fetching doctors by specialization:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch doctors'));
        toast({
          title: "Error",
          description: "Failed to fetch doctors list",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialization, toast]);

  return { doctors, loading, error };
};

// Custom hook for doctor appointments - updated to fetch from appointments table
export const useDoctorAppointments = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get the doctor's information first
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('name')
          .eq('id', user.id)
          .single();

        if (doctorError) {
          console.error('Error fetching doctor data:', doctorError);
          return;
        }

        // Fetch appointments from the appointments table where doctor matches
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            profiles(first_name, last_name)
          `)
          .eq('doctor_name', doctorData.name)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) {
          throw error;
        }

        // Transform the data to match our interface
        const transformedAppointments: DoctorAppointment[] = (data || []).map(apt => ({
          id: apt.id,
          patientName: apt.profiles ? `${apt.profiles.first_name || ''} ${apt.profiles.last_name || ''}`.trim() || 'Patient' : 'Patient',
          time: apt.time,
          reason: apt.reason || 'General consultation',
          status: apt.status as 'pending' | 'completed' | 'cancelled' | 'confirmed',
          date: apt.date,
          notes: apt.notes || undefined
        }));
        
        setAppointments(transformedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const markAppointmentAsCompleted = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'completed' as const } : apt
        )
      );

      toast({
        title: "Appointment completed",
        description: "The appointment has been marked as completed.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        )
      );

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'confirmed' as const } : apt
        )
      );

      toast({
        title: "Appointment confirmed",
        description: "The appointment has been confirmed.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm appointment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { 
    appointments, 
    loading, 
    error, 
    markAppointmentAsCompleted, 
    cancelAppointment,
    confirmAppointment
  };
};

// Custom hook for doctor slots
export const useDoctorSlots = () => {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_slots')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching slots:', error);
          setSlots([]);
        } else {
          // Map the database column names to our interface
          const mappedSlots = (data || []).map(slot => ({
            id: slot.id,
            doctor_id: slot.doctor_id,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            duration: slot.duration,
            max_patients: slot.max_patients,
            status: slot.status as 'available' | 'booked' | 'cancelled'
          }));
          setSlots(mappedSlots);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch slots'));
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const createSlot = async (slotData: Omit<AppointmentSlot, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('appointment_slots')
        .insert([{
          doctor_id: slotData.doctor_id,
          date: slotData.date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          duration: slotData.duration,
          max_patients: slotData.max_patients,
          status: slotData.status,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newSlot: AppointmentSlot = {
          id: data.id,
          doctor_id: data.doctor_id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          duration: data.duration,
          max_patients: data.max_patients,
          status: data.status as 'available' | 'booked' | 'cancelled'
        };
        setSlots(prev => [...prev, newSlot]);
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      throw error;
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Error deleting slot:', error);
      throw error;
    }
  };

  const updateSlotStatus = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .update({ status })
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      setSlots(prev => 
        prev.map(slot => 
          slot.id === slotId ? { ...slot, status } : slot
        )
      );
    } catch (error) {
      console.error('Error updating slot status:', error);
      throw error;
    }
  };

  return { 
    slots, 
    loading, 
    error, 
    createSlot, 
    deleteSlot, 
    updateSlotStatus 
  };
};

// Function to check if user has doctor access
export const checkDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking doctor access:', error);
      return false;
    }

    return !!data?.is_doctor;
  } catch (error) {
    console.error('Error checking doctor access:', error);
    return false;
  }
};

// Function to grant doctor access
export const grantDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: true })
      .eq('id', userId);

    if (error) {
      console.error('Error granting doctor access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error granting doctor access:', error);
    return false;
  }
};

// Function to revoke doctor access
export const revokeDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: false })
      .eq('id', userId);

    if (error) {
      console.error('Error revoking doctor access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error revoking doctor access:', error);
    return false;
  }
};

// Function to find nearest doctors using Supabase function
export const findNearestDoctors = async (
  latitude: number,
  longitude: number,
  specialization?: string
) => {
  try {
    const { data, error } = await supabase.rpc('find_nearest_doctor', {
      lat: latitude,
      long: longitude,
      specialization_filter: specialization || null
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error finding nearest doctors:', err);
    throw err;
  }
};
