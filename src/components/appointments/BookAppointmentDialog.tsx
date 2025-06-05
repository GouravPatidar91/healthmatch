
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDoctor?: any;
  healthCheckData?: HealthCheck | null;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

const specialties = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology"
];

export const BookAppointmentDialog = ({ open, onOpenChange, selectedDoctor, healthCheckData }: BookAppointmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    doctorName: selectedDoctor?.name || '',
    doctorSpecialty: selectedDoctor?.specialization || '',
    time: '',
    reason: '',
    notes: ''
  });

  // Update form data when selectedDoctor changes
  React.useEffect(() => {
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorName: selectedDoctor.name || '',
        doctorSpecialty: selectedDoctor.specialization || ''
      }));
    }
  }, [selectedDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !formData.doctorName || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare reason with health check summary if available
      let appointmentReason = formData.reason;
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        appointmentReason = `Health Check Follow-up: ${symptomsText}${urgencyText}${formData.reason ? ' - ' + formData.reason : ''}`;
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          doctor_name: formData.doctorName,
          doctor_specialty: formData.doctorSpecialty || null,
          date: format(date, 'yyyy-MM-dd'),
          time: formData.time,
          reason: appointmentReason,
          notes: formData.notes || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      // If health check data exists, send it to the doctor
      if (healthCheckData && appointment) {
        try {
          const success = await sendHealthCheckToDoctor(
            healthCheckData,
            appointment.id,
            selectedDoctor?.id || 'doctor-placeholder'
          );
          
          if (success) {
            toast({
              title: "Appointment Booked Successfully",
              description: "Your appointment has been scheduled and your health check data has been shared with the doctor",
            });
          } else {
            toast({
              title: "Appointment Booked",
              description: "Your appointment has been scheduled. Health check data sharing will be attempted later.",
            });
          }
        } catch (error) {
          console.error('Error sending health check to doctor:', error);
          toast({
            title: "Appointment Booked",
            description: "Your appointment has been scheduled. Health check data sharing will be attempted later.",
          });
        }
      } else {
        toast({
          title: "Appointment Booked Successfully",
          description: "Your appointment has been scheduled",
        });
      }

      // Reset form and close dialog
      setFormData({
        doctorName: '',
        doctorSpecialty: '',
        time: '',
        reason: '',
        notes: ''
      });
      setDate(undefined);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            {healthCheckData 
              ? "Schedule an appointment with a doctor. Your health check data will be automatically shared."
              : "Schedule an appointment with a doctor"
            }
          </DialogDescription>
        </DialogHeader>

        {healthCheckData && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Health Check Data to Share</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}</p>
              {healthCheckData.urgency_level && (
                <p><span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}</p>
              )}
              {healthCheckData.overall_assessment && (
                <p><span className="font-medium">Assessment:</span> {healthCheckData.overall_assessment}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName">Doctor Name *</Label>
            <Input
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              placeholder="Enter doctor's name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorSpecialty">Specialty</Label>
            <Select
              value={formData.doctorSpecialty}
              onValueChange={(value) => setFormData({ ...formData, doctorSpecialty: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={healthCheckData ? "Additional details..." : "Enter reason for visit"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information for the doctor"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
