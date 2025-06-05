
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface DoctorNotification {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id: string;
  health_check_id: string;
  symptoms_data: any;
  created_at: string;
  status: 'sent' | 'read' | 'acknowledged';
  patient_name?: string;
  appointment_date?: string;
  appointment_time?: string;
}

// Custom hook for doctors to view patient health check notifications
export const useDoctorNotifications = () => {
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch notifications for the current doctor using raw query to avoid type issues
        const { data, error } = await supabase
          .from('doctor_notifications' as any)
          .select(`
            *,
            patient_profiles:profiles!doctor_notifications_patient_id_fkey(first_name, last_name),
            appointments!doctor_notifications_appointment_id_fkey(date, time)
          `)
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform the data to include patient names and appointment details
        const transformedNotifications: DoctorNotification[] = (data || []).map((notification: any) => ({
          ...notification,
          patient_name: notification.patient_profiles 
            ? `${notification.patient_profiles.first_name || ''} ${notification.patient_profiles.last_name || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient',
          appointment_date: notification.appointments?.date,
          appointment_time: notification.appointments?.time
        }));

        setNotifications(transformedNotifications);
      } catch (err) {
        console.error('Error fetching doctor notifications:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        toast({
          title: "Error",
          description: "Failed to fetch patient health check notifications",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications' as any)
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'read' as const }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const markAsAcknowledged = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications' as any)
        .update({ status: 'acknowledged' })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'acknowledged' as const }
            : notification
        )
      );

      toast({
        title: "Acknowledged",
        description: "Patient health check has been acknowledged"
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive"
      });
    }
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAsAcknowledged
  };
};
