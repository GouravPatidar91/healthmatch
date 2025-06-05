
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, FileText } from "lucide-react";
import { format, parseISO, isBefore } from 'date-fns';
import { useAppointmentBooking } from '@/services/appointmentService';
import { useIsMobile } from '@/hooks/use-mobile';

interface PatientAppointment {
  id: string;
  user_id: string;
  doctor_name: string;
  doctor_specialty?: string;
  date: string;
  time: string;
  reason?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPatientAppointments } = useAppointmentBooking();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getPatientAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const today = new Date();
  const upcomingAppointments = appointments.filter(apt => 
    !isBefore(parseISO(`${apt.date}T${apt.time}`), today) && apt.status !== 'completed' && apt.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(apt => 
    isBefore(parseISO(`${apt.date}T${apt.time}`), today) || apt.status === 'completed' || apt.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  const AppointmentMobileCard = ({ appointment }: { appointment: PatientAppointment }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">{appointment.doctor_name}</span>
        </div>
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-blue-500" />
          {format(parseISO(appointment.date), 'MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 text-blue-500" />
          {appointment.time}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-blue-500" />
          {appointment.reason || 'General consultation'}
        </div>
      </div>
    </div>
  );

  const AppointmentTable = ({ appointments }: { appointments: PatientAppointment[] }) => (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {appointment.doctor_name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(appointment.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {appointment.time}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {appointment.reason || 'General consultation'}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const AppointmentMobileList = ({ appointments }: { appointments: PatientAppointment[] }) => (
    <div className="md:hidden space-y-3">
      {appointments.map((appointment) => (
        <AppointmentMobileCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="text-gray-900">My Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="text-sm">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcomingAppointments.length > 0 ? (
              <>
                <AppointmentTable appointments={upcomingAppointments} />
                <AppointmentMobileList appointments={upcomingAppointments} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {pastAppointments.length > 0 ? (
              <>
                <AppointmentTable appointments={pastAppointments} />
                <AppointmentMobileList appointments={pastAppointments} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No past appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientAppointments;
