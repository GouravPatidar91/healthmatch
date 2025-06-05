
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import AppointmentSlots from '@/components/doctor/AppointmentSlots';
import DoctorNotifications from '@/components/doctor/DoctorNotifications';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkDoctorAccess } from '@/services/doctorService';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("calendar");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Check if user has doctor access
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        try {
          const hasDocAccess = await checkDoctorAccess(user.id);
          setHasAccess(hasDocAccess);
          
          if (!hasDocAccess) {
            // Check if user has a pending doctor application
            const { data, error } = await supabase
              .from('doctors')
              .select('verified')
              .eq('id', user.id)
              .maybeSingle();
            
            if (!error && data && data.verified === false) {
              setIsPending(true);
              toast({
                title: "Application Pending",
                description: "Your doctor application is still pending approval from an admin.",
                variant: "default"
              });
            } else {
              toast({
                title: "Access Denied",
                description: "You don't have permission to access the doctor dashboard.",
                variant: "destructive"
              });
            }
            
            navigate('/dashboard');
          }
        } catch (error) {
          console.error("Error checking doctor access:", error);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        navigate('/');
      }
    };
    
    checkAccess();
  }, [user, navigate, toast]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !hasAccess) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600">Doctor Dashboard</h1>
          <p className="text-slate-500 text-sm md:text-base">Manage your appointments, schedule, and patient health checks</p>
        </div>

        <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${isMobile ? 'grid grid-cols-1 h-auto space-y-1 bg-white/60 p-1' : 'grid grid-cols-3'} w-full max-w-2xl`}>
            <TabsTrigger 
              value="calendar"
              className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              Calendar View
            </TabsTrigger>
            <TabsTrigger 
              value="slots"
              className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              Appointment Slots
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              Patient Health Checks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Appointment Calendar</CardTitle>
                <CardDescription className="text-sm md:text-base">View and manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentCalendar />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slots">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Appointment Slots</CardTitle>
                <CardDescription className="text-sm md:text-base">Create and manage your available appointment slots</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentSlots />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Patient Health Check Notifications</CardTitle>
                <CardDescription className="text-sm md:text-base">Review health check data shared by your patients for upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorNotifications />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
