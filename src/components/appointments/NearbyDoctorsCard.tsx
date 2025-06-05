import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Phone, Calendar, Loader2, Stethoscope, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoctors } from "@/services/doctorService";
import { useAppointmentBooking } from "@/services/appointmentService";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NearbyDoctorsCardProps {
  healthCheckData?: HealthCheck | null;
  onAppointmentBooked?: () => void;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

export const NearbyDoctorsCard = ({ healthCheckData, onAppointmentBooked }: NearbyDoctorsCardProps) => {
  const { toast } = useToast();
  const { doctors, loading, error, findNearbyDoctors } = useDoctors();
  const { bookDirectAppointment } = useAppointmentBooking();
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);
  const [locationAccess, setLocationAccess] = useState<boolean | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const tryFindNearby = async () => {
      const success = await findNearbyDoctors();
      setLocationAccess(success);
      
      if (!success) {
        toast({
          title: "Location Access",
          description: "Unable to access location. Showing all available doctors.",
        });
      }
    };

    tryFindNearby();
  }, [findNearbyDoctors, toast]);

  const handleSelectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setSelectedTime("10:00");
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive"
      });
      return;
    }

    setBookingDoctor(selectedDoctor.id);
    
    try {
      // Prepare reason with health check summary if available
      let reason = "General consultation";
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        reason = `Health Check Follow-up: ${symptomsText}${urgencyText}`;
      }

      // Book the appointment
      const appointment = await bookDirectAppointment({
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        doctor_specialty: selectedDoctor.specialization,
        date: format(selectedDate, 'yyyy-MM-dd'),
        preferred_time: selectedTime,
        reason: reason,
        notes: notes || healthCheckData?.notes || undefined
      });

      // If health check data exists, send it to the doctor
      if (healthCheckData && appointment) {
        try {
          await sendHealthCheckToDoctor(
            healthCheckData,
            appointment.id,
            selectedDoctor.id
          );
          
          toast({
            title: "Appointment Booked Successfully",
            description: `Your appointment with Dr. ${selectedDoctor.name} has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime} and your health check data has been shared.`,
          });
        } catch (error) {
          console.error('Error sending health check to doctor:', error);
          toast({
            title: "Appointment Booked",
            description: `Your appointment with Dr. ${selectedDoctor.name} has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}. Health check data sharing will be attempted later.`,
          });
        }
      } else {
        toast({
          title: "Appointment Booked Successfully",
          description: `Your appointment request has been sent to Dr. ${selectedDoctor.name} for ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
        });
      }

      setShowBookingDialog(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
      onAppointmentBooked?.();
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingDoctor(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finding Nearby Doctors</CardTitle>
          <CardDescription>Locating available doctors in your area...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || doctors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Doctors Available</CardTitle>
          <CardDescription>
            {error ? "Error loading doctors" : "No doctors found in your area"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please try again later or contact support for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {locationAccess ? "Nearby Doctors" : "Available Doctors"}
          </h3>
          {healthCheckData && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Health data will be shared
            </Badge>
          )}
        </div>

        {healthCheckData && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Health Check Summary:</p>
                <p className="text-blue-700">
                  <span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}
                </p>
                {healthCheckData.urgency_level && (
                  <p className="text-blue-700">
                    <span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {doctors.slice(0, 6).map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Stethoscope className="h-4 w-4" />
                      {doctor.specialization}
                    </CardDescription>
                  </div>
                  {doctor.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{doctor.rating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{doctor.hospital}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{doctor.address}</span>
                  </div>
                  
                  {doctor.experience && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{doctor.experience} years experience</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Available
                  </Badge>
                  
                  <Button
                    onClick={() => handleSelectDoctor(doctor)}
                    disabled={bookingDoctor === doctor.id}
                    className="ml-2"
                  >
                    {bookingDoctor === doctor.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Appointment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Dialog with Date and Time Selection */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment with Dr. {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>
              Select your preferred date and time for the appointment.
              {healthCheckData && " Your health check data will be automatically shared."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>Select Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific concerns or additional information..."
                rows={3}
              />
            </div>

            {/* Health Check Summary */}
            {healthCheckData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Health Check Data to Share</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}</p>
                  {healthCheckData.urgency_level && (
                    <p><span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookAppointment}
                disabled={!selectedDate || !selectedTime || bookingDoctor === selectedDoctor?.id}
                className="flex-1"
              >
                {bookingDoctor === selectedDoctor?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
