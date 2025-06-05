import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HealthCheck } from "./userDataService";

export interface DoctorNotification {
  id?: string;
  doctor_id: string;
  patient_id: string;
  appointment_id: string;
  health_check_id: string;
  symptoms_data: any;
  created_at?: string;
  status?: 'sent' | 'read' | 'acknowledged';
}

// Function to send health check data to doctor when appointment is booked
export const sendHealthCheckToDoctor = async (
  healthCheckData: HealthCheck,
  appointmentId: string,
  doctorId: string = 'placeholder-doctor'
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare comprehensive symptom data for doctor
    const symptomsDataForDoctor = {
      symptoms: healthCheckData.symptoms || [],
      severity: healthCheckData.severity || '',
      duration: healthCheckData.duration || '',
      previous_conditions: healthCheckData.previous_conditions || [],
      medications: healthCheckData.medications || [],
      notes: healthCheckData.notes || '',
      analysis_results: healthCheckData.analysis_results ? JSON.parse(JSON.stringify(healthCheckData.analysis_results)) : null,
      urgency_level: healthCheckData.urgency_level || '',
      overall_assessment: healthCheckData.overall_assessment || '',
      comprehensive_analysis: healthCheckData.comprehensive_analysis || false,
      check_date: healthCheckData.created_at || new Date().toISOString(),
      symptom_photos: healthCheckData.symptom_photos || {},
      forwarded_from: 'health_check_booking',
      booking_context: {
        appointment_id: appointmentId,
        forwarded_at: new Date().toISOString(),
        patient_notes: 'Health check data automatically forwarded from appointment booking'
      }
    };

    // Store notification for doctor using direct insert with type assertion
    const { error } = await supabase
      .from('doctor_notifications')
      .insert([{
        doctor_id: doctorId,
        patient_id: user.id,
        appointment_id: appointmentId,
        health_check_id: healthCheckData.id || '',
        symptoms_data: symptomsDataForDoctor as any, // Type assertion for JSONB compatibility
        status: 'sent'
      }]);

    if (error) {
      throw error;
    }

    console.log('Health check data forwarded to doctor successfully for appointment:', appointmentId);
    return true;
  } catch (error) {
    console.error('Error forwarding health check to doctor:', error);
    return false;
  }
};

// Function to check for upcoming appointments after health check
export const checkUpcomingAppointments = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get appointments in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return appointments || [];
  } catch (error) {
    console.error('Error checking upcoming appointments:', error);
    return [];
  }
};

// Enhanced hook for health check to doctor integration with appointment booking
export const useHealthCheckDoctorIntegration = () => {
  const { toast } = useToast();

  const sendToDoctor = async (healthCheckData: HealthCheck, appointmentId?: string) => {
    try {
      // If appointment ID is provided, use it directly (from booking flow)
      if (appointmentId) {
        const success = await sendHealthCheckToDoctor(
          healthCheckData,
          appointmentId,
          'placeholder-doctor' // This would need to be resolved from the appointment
        );

        if (success) {
          toast({
            title: "Health Check Shared",
            description: "Your health check has been automatically shared with the doctor for your appointment",
          });
        }

        return success;
      }

      // Otherwise, check for upcoming appointments (existing flow)
      const upcomingAppointments = await checkUpcomingAppointments();
      
      if (upcomingAppointments.length === 0) {
        console.log('No upcoming appointments found');
        return false;
      }

      // Send to the nearest appointment's doctor
      const nearestAppointment = upcomingAppointments[0];
      
      const success = await sendHealthCheckToDoctor(
        healthCheckData,
        nearestAppointment.id,
        'doctor-id-placeholder' // This would need to be resolved from the appointment
      );

      if (success) {
        toast({
          title: "Health Check Shared",
          description: `Your health check has been shared with your doctor for the upcoming appointment on ${nearestAppointment.date}`,
        });
      }

      return success;
    } catch (error) {
      console.error('Error in health check doctor integration:', error);
      toast({
        title: "Error",
        description: "Failed to share health check with doctor",
        variant: "destructive"
      });
      return false;
    }
  };

  return { sendToDoctor };
};
