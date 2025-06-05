
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { useAvailableSlots, useAppointmentBooking } from '@/services/appointmentService';
import { Doctor } from '@/services/doctorService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

interface DoctorSlotsProps {
  doctor: Doctor;
}

const DoctorSlots: React.FC<DoctorSlotsProps> = ({ doctor }) => {
  const { slots, loading } = useAvailableSlots(doctor.id);
  const { bookAppointment } = useAppointmentBooking();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const isMobile = useIsMobile();

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    setShowBookingDialog(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    try {
      await bookAppointment({
        doctor_id: doctor.id,
        slot_id: selectedSlot.id,
        date: selectedSlot.date,
        time: selectedSlot.start_time,
        reason: reason || 'General consultation'
      });
      
      setShowBookingDialog(false);
      setSelectedSlot(null);
      setReason('');
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-3 md:mt-4 p-3 md:p-4 border border-sage-200 rounded-xl bg-sage-50">
        <p className="text-xs md:text-sm text-slate-custom">Loading available slots...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="mt-3 md:mt-4 p-3 md:p-4 border border-sage-200 rounded-xl bg-sage-50">
        <p className="text-xs md:text-sm text-slate-custom">No available slots at the moment</p>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="mt-3 md:mt-4">
      <h4 className="font-medium mb-2 md:mb-3 flex items-center text-slate-custom text-sm md:text-base">
        <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-sage-600" />
        Available Slots
      </h4>
      
      <div className="space-y-2 md:space-y-3">
        {Object.entries(slotsByDate).slice(0, isMobile ? 2 : 3).map(([date, dateSlots]) => (
          <div key={date} className="border border-sage-200 rounded-lg md:rounded-xl p-2 md:p-3 bg-sage-50">
            <p className="text-xs md:text-sm font-medium mb-1 md:mb-2 text-slate-custom">
              {format(parseISO(date), isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="flex flex-wrap gap-1 md:gap-2">
              {(dateSlots as any[]).slice(0, isMobile ? 3 : 4).map((slot) => (
                <Button
                  key={slot.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotSelect(slot)}
                  className="text-xs border-sage-300 hover:bg-sage-100 hover:border-sage-400 px-2 py-1 h-auto"
                >
                  <Clock className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                  {slot.start_time}
                </Button>
              ))}
              {(dateSlots as any[]).length > (isMobile ? 3 : 4) && (
                <Badge variant="secondary" className="text-xs bg-coral-100 text-coral-700 px-1 py-0.5 h-auto">
                  +{(dateSlots as any[]).length - (isMobile ? 3 : 4)} more
                </Badge>
              )}
            </div>
          </div>
        ))}
        
        {Object.keys(slotsByDate).length > (isMobile ? 2 : 3) && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              +{Object.keys(slotsByDate).length - (isMobile ? 2 : 3)} more days available
            </Badge>
          </div>
        )}
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="glass-effect w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-sage-700 text-base md:text-lg">Book Appointment</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Book an appointment with {doctor.name} on{' '}
              {selectedSlot && format(parseISO(selectedSlot.date), 'MMMM d, yyyy')} at{' '}
              {selectedSlot?.start_time}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="reason" className="text-slate-custom text-sm">Reason for visit (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Describe your symptoms or reason for the appointment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 border-sage-200 focus:ring-sage-500 text-sm"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowBookingDialog(false)}
              className="border-sage-200 text-slate-custom hover:bg-sage-50 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment} 
              disabled={isBooking}
              className="btn-primary w-full sm:w-auto order-1 sm:order-2"
            >
              {isBooking ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSlots;
