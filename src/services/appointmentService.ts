
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface PatientAppointment {
  id: string;
  user_id: string;
  doctor_id?: string;
  doctor_name: string;
  doctor_specialty?: string;
  slot_id?: string;
  date: string;
  time?: string;
  preferred_time?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason?: string;
  notes?: string;
  created_at?: string;
}

// Custom hook to book appointments
export const useAppointmentBooking = () => {
  const { toast } = useToast();

  const bookAppointment = async (appointmentData: {
    doctor_id: string;
    slot_id: string;
    date: string;
    time: string;
    reason?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, update the slot status to 'booked'
      const { error: slotError } = await supabase
        .from('appointment_slots')
        .update({ status: 'booked' })
        .eq('id', appointmentData.slot_id);

      if (slotError) {
        throw slotError;
      }

      // Then create the appointment record
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          doctor_name: 'Doctor', // This will be updated with actual doctor name
          date: appointmentData.date,
          time: appointmentData.time,
          reason: appointmentData.reason || 'General consultation',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment booked",
        description: "Your appointment has been successfully booked.",
      });

      return data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bookDirectAppointment = async (appointmentData: {
    doctor_id: string;
    doctor_name: string;
    doctor_specialty?: string;
    date: string;
    preferred_time: string;
    reason?: string;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          doctor_name: appointmentData.doctor_name,
          doctor_specialty: appointmentData.doctor_specialty,
          date: appointmentData.date,
          time: appointmentData.preferred_time,
          reason: appointmentData.reason || 'General consultation',
          notes: appointmentData.notes ? `Preferred time: ${appointmentData.preferred_time}. Notes: ${appointmentData.notes}` : `Preferred time: ${appointmentData.preferred_time}`,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Appointment request sent",
        description: `Your appointment request has been sent to Dr. ${appointmentData.doctor_name}. They will confirm your preferred time.`,
      });

      return data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to send appointment request. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getPatientAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  };

  return { bookAppointment, bookDirectAppointment, getPatientAppointments };
};

// Custom hook to get available slots for a doctor
export const useAvailableSlots = (doctorId?: string) => {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctorId) {
        setSlots([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('appointment_slots')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('status', 'available')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        setSlots(data || []);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch slots'));
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [doctorId]);

  return { slots, loading, error };
};
