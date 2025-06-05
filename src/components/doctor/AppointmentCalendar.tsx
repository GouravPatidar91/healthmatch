
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { format, addDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAppointments, useDoctorSlots } from "@/services/doctorService";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle, Clock, Edit, X, Check } from "lucide-react";

const AppointmentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { toast } = useToast();
  
  const { appointments, loading: appointmentsLoading, error: appointmentsError, markAppointmentAsCompleted, cancelAppointment, confirmAppointment } = useDoctorAppointments();
  const { slots, loading: slotsLoading } = useDoctorSlots();

  // Get appointments for the selected date
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Get appointment slots for the selected date
  const getSlotsForDate = (date: Date) => {
    if (!slots) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(slot => slot.date === dateStr);
  };
  
  const appointmentsForSelectedDate = getAppointmentsForDate(selectedDate);
  const slotsForSelectedDate = getSlotsForDate(selectedDate);
  
  const handleStatusChange = async (appointmentId: string, status: string) => {
    try {
      if (status === 'completed') {
        await markAppointmentAsCompleted(appointmentId);
      } else if (status === 'cancelled') {
        await cancelAppointment(appointmentId);
      } else if (status === 'confirmed') {
        await confirmAppointment(appointmentId);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const loading = appointmentsLoading || slotsLoading;
  const error = appointmentsError;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal border-sage-200 hover:bg-sage-50">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-sage-200">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Select value={view} onValueChange={(value) => setView(value as 'daily' | 'weekly' | 'monthly')}>
          <SelectTrigger className="w-[180px] border-sage-200 focus:ring-sage-500">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent className="bg-white border-sage-200">
            <SelectItem value="daily">Daily View</SelectItem>
            <SelectItem value="weekly">Weekly View</SelectItem>
            <SelectItem value="monthly">Monthly View</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-500 mx-auto"></div>
          <p className="mt-4 text-slate-custom">Loading calendar data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-coral-600">Error loading calendar data. Please try again.</div>
      ) : (
        <div className="border border-sage-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {view === 'daily' && (
            <>
              <div className="p-4 border-b border-sage-200 bg-sage-50">
                <h3 className="font-medium text-sage-700">Available Slots</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slotsForSelectedDate.length > 0 ? (
                    slotsForSelectedDate.map((slot) => (
                      <Badge 
                        key={slot.id} 
                        variant={slot.status === 'available' ? 'default' : 
                                slot.status === 'booked' ? 'outline' : 
                                'destructive'}
                        className={`px-3 py-1 ${
                          slot.status === 'available' ? 'bg-sage-100 text-sage-800' : 
                          slot.status === 'booked' ? 'bg-coral-100 text-coral-800' : 
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {slot.start_time} - {slot.end_time} ({slot.status})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No slots available for this day</p>
                  )}
                </div>
              </div>
            
              <Table>
                <TableHeader>
                  <TableRow className="border-sage-200">
                    <TableHead className="text-slate-custom">Time</TableHead>
                    <TableHead className="text-slate-custom">Patient</TableHead>
                    <TableHead className="text-slate-custom">Reason</TableHead>
                    <TableHead className="text-slate-custom">Status</TableHead>
                    <TableHead className="w-[120px] text-slate-custom">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentsForSelectedDate.length > 0 ? (
                    appointmentsForSelectedDate.map((appointment) => (
                      <TableRow key={appointment.id} className="border-sage-200">
                        <TableCell className="font-medium text-slate-custom">
                          {appointment.time}
                        </TableCell>
                        <TableCell className="text-slate-custom">
                          {appointment.patientName || 'Patient Name'}
                        </TableCell>
                        <TableCell className="text-slate-custom">
                          <div>
                            <p>{appointment.reason || 'Consultation'}</p>
                            {appointment.notes && (
                              <p className="text-xs text-slate-400 mt-1">{appointment.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusBadgeVariant(appointment.status)}
                            className={getStatusColor(appointment.status)}
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {appointment.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                title="Confirm appointment"
                                className="h-8 w-8 hover:bg-sage-100"
                              >
                                <Check className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                              title="Mark as completed"
                              className="h-8 w-8 hover:bg-sage-100"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              title="Cancel appointment"
                              className="h-8 w-8 hover:bg-sage-100"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-custom">
                        No appointments for this day
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
          
          {view === 'weekly' && (
            <div className="grid grid-cols-7 gap-1 p-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(selectedDate, i - selectedDate.getDay());
                const dayAppointments = getAppointmentsForDate(date);
                const daySlots = getSlotsForDate(date);
                
                return (
                  <Card key={i} className={`border-sage-200 ${format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'border-sage-500' : ''}`}>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium text-slate-custom">
                        {format(date, 'EEE, MMM d')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      {daySlots.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium mb-1 text-slate-custom">Slots:</p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {daySlots.map(slot => (
                              <div key={slot.id} className="p-1 text-xs border border-sage-200 rounded flex items-center bg-sage-50">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="text-slate-custom">{slot.start_time}</span>
                                <Badge variant="outline" className="ml-auto text-[10px] border-sage-200">
                                  {slot.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {dayAppointments.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-1 text-slate-custom">Appointments:</p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {dayAppointments.map(appointment => (
                              <div key={appointment.id} className="p-1 text-xs border border-sage-200 rounded flex items-center bg-white">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="text-slate-custom">{appointment.time}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`ml-auto text-[10px] ${getStatusColor(appointment.status)} border-0`}
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">No appointments</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {view === 'monthly' && (
            <div className="text-center py-8 text-slate-custom">
              Monthly view coming soon
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
