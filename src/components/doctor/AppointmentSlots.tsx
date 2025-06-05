
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus, ChevronDown, ChevronUp, Clock, Loader2, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parseISO } from 'date-fns';
import { useDoctorSlots } from '@/services/doctorService';
import { useAuth } from '@/contexts/AuthContext';

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`];
}).flat();

const AppointmentSlots = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  
  const [newSlot, setNewSlot] = useState({
    start_time: '09:00',
    duration: 30,
    max_patients: 1,
    status: 'available' as const,
  });
  
  const { slots, loading, error, createSlot, deleteSlot, updateSlotStatus } = useDoctorSlots();
  
  const handleCreateSlot = async () => {
    try {
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "You need to be logged in to create slots.",
          variant: "destructive",
        });
        return;
      }
      
      const [hours, minutes] = newSlot.start_time.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0);
      
      const endDateTime = addMinutes(startDateTime, newSlot.duration);
      const end_time = format(endDateTime, 'HH:mm');
      
      await createSlot({
        doctor_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: newSlot.start_time,
        end_time: end_time,
        duration: newSlot.duration,
        max_patients: newSlot.max_patients,
        status: newSlot.status,
      });
      
      setShowSlotDialog(false);
      toast({
        title: "Slot created",
        description: "Appointment slot has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment slot. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
      toast({
        title: "Slot deleted",
        description: "Appointment slot has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment slot. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleStatusChange = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    try {
      await updateSlotStatus(slotId, status);
      toast({
        title: "Status updated",
        description: `Appointment slot status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating slot status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment slot status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const slotsByDate = slots?.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);
  
  const toggleDayExpansion = (date: string) => {
    if (expandedDay === date) {
      setExpandedDay(null);
    } else {
      setExpandedDay(date);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Create Appointment Slots</h3>
          <p className="text-sm text-slate-500">Set up available time slots for patient bookings</p>
        </div>
        
        <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Create New Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Appointment Slot</DialogTitle>
              <DialogDescription>
                Set available time for patient appointments on {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'selected date'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  Start Time
                </Label>
                <Select 
                  value={newSlot.start_time} 
                  onValueChange={(value) => setNewSlot({...newSlot, start_time: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <Select 
                  value={newSlot.duration.toString()} 
                  onValueChange={(value) => setNewSlot({...newSlot, duration: parseInt(value)})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max_patients" className="text-right">
                  Max Patients
                </Label>
                <Input
                  id="max_patients"
                  type="number"
                  min={1}
                  max={10}
                  value={newSlot.max_patients}
                  onChange={(e) => setNewSlot({...newSlot, max_patients: parseInt(e.target.value)})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSlot}>Create Slot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading slots...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error loading slots. Please try again.</div>
        ) : (
          <>
            {slotsByDate && Object.keys(slotsByDate).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <Card key={date}>
                    <CardHeader className="py-3 cursor-pointer" onClick={() => toggleDayExpansion(date)}>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                          <span className="ml-2 text-sm text-slate-500">
                            ({dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''})
                          </span>
                        </CardTitle>
                        {expandedDay === date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                    
                    {expandedDay === date && (
                      <CardContent>
                        <div className="space-y-2">
                          {dateSlots.map((slot) => (
                            <div 
                              key={slot.id} 
                              className="flex items-center justify-between p-2 border rounded-lg"
                            >
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-slate-500" />
                                <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                                <span className="ml-3 text-sm text-slate-500">
                                  ({slot.duration} mins, {slot.max_patients} patient{slot.max_patients !== 1 ? 's' : ''})
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Select
                                  value={slot.status}
                                  onValueChange={(value: 'available' | 'booked' | 'cancelled') => {
                                    updateSlotStatus(slot.id, value);
                                  }}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="booked">Booked</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="ml-2"
                                  onClick={() => deleteSlot(slot.id)}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg">
                <p className="text-slate-500">No appointment slots created yet.</p>
                <p className="text-sm mt-1">Create your first slot to start booking appointments.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentSlots;
