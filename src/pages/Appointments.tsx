
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin, Phone, Stethoscope, Star, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentBooking } from "@/services/appointmentService";
import { useDoctors } from "@/services/doctorService";
import PatientAppointments from "@/components/appointments/PatientAppointments";
import DoctorSlots from "@/components/appointments/DoctorSlots";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { useIsMobile } from "@/hooks/use-mobile";

const specializations = [
  "Cardiology",
  "Dermatology", 
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology"
];

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const isMobile = useIsMobile();
  
  const { doctors, loading, findNearbyDoctors } = useDoctors();

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const specializedDoctors = selectedSpecialization === 'all' 
    ? filteredDoctors 
    : filteredDoctors.filter(doctor => 
        doctor.specialization.toLowerCase() === selectedSpecialization.toLowerCase()
      );

  const handleFindNearbyDoctors = async () => {
    const success = await findNearbyDoctors();
    if (success) {
      setActiveTab('browse');
    }
  };

  const handleBookAppointment = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
  };

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Book Appointments</h1>
          <p className="text-gray-600 text-sm md:text-base">Find and book appointments with verified doctors</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${isMobile ? 'grid w-full grid-cols-1 h-auto space-y-1' : 'grid w-full max-w-lg grid-cols-3'}`}>
            <TabsTrigger value="my-appointments" className="text-xs md:text-sm">My Appointments</TabsTrigger>
            <TabsTrigger value="browse" className="text-xs md:text-sm">Browse Doctors</TabsTrigger>
            <TabsTrigger value="nearby" className="text-xs md:text-sm">Find Nearby</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-appointments" className="space-y-4 md:space-y-6">
            <PatientAppointments />
          </TabsContent>
          
          <TabsContent value="browse" className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search doctors, specializations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-blue-200 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 text-sm md:text-base">
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-blue-200 z-50">
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading doctors...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {specializedDoctors.map((doctor) => (
                  <Card key={doctor.id} className="modern-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                            <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{doctor.name}</span>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1 text-xs md:text-sm">
                            <Stethoscope className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{doctor.specialization}</span>
                          </CardDescription>
                        </div>
                        {doctor.verified && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 md:space-y-4 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{doctor.address}</span>
                        </div>
                        {doctor.experience && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                            <span>{doctor.experience} years experience</span>
                          </div>
                        )}
                        {doctor.rating && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                            <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            <span>{doctor.rating}/5</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => handleBookAppointment(doctor)}
                        className="btn-modern w-full text-xs md:text-sm"
                      >
                        <CalendarDays className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Book Appointment
                      </Button>

                      <DoctorSlots doctor={doctor} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && specializedDoctors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No doctors found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nearby" className="space-y-4 md:space-y-6">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg md:text-xl">Find Doctors Near You</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Allow location access to find doctors closest to your current location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleFindNearbyDoctors} className="btn-modern w-full text-sm md:text-base">
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Nearby Doctors
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BookAppointmentDialog 
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          selectedDoctor={selectedDoctor}
        />
      </div>
    </div>
  );
};

export default Appointments;
