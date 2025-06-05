
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SymptomCategories } from './SymptomCategories';
import { EmergencyCallData, createEmergencyCall, findNearbyDoctors, assignDoctorToEmergencyCall, Doctor } from '@/services/emergencyService';
import { geocodeAddress } from '@/utils/geolocation';
import { SymptomCategory } from '@/types';

const symptomCategories: SymptomCategory[] = [
  {
    category: 'Respiratory',
    symptoms: ['Shortness of breath', 'Coughing', 'Wheezing', 'Chest pain', 'Rapid breathing', 'Coughing up blood']
  },
  {
    category: 'Cardiovascular',
    symptoms: ['Chest pain', 'Palpitations', 'Shortness of breath', 'Dizziness', 'Fainting', 'Swelling in legs']
  },
  {
    category: 'Gastrointestinal',
    symptoms: ['Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Blood in stool']
  },
  {
    category: 'Neurological',
    symptoms: ['Headache', 'Dizziness', 'Confusion', 'Weakness', 'Numbness', 'Vision changes', 'Speech problems']
  },
  {
    category: 'Musculoskeletal',
    symptoms: ['Joint pain', 'Muscle pain', 'Swelling', 'Limited range of motion', 'Back pain', 'Fracture']
  },
  {
    category: 'General',
    symptoms: ['Fever', 'Fatigue', 'Weight loss', 'Chills', 'Night sweats', 'General weakness']
  }
];

export function EmergencyForm() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [formData, setFormData] = useState<EmergencyCallData>({
    patient_name: '',
    age: null,
    gender: '',
    address: '',
    symptoms: [],
    severity: null
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [emergencyCallId, setEmergencyCallId] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (step === 1) {
        if (!formData.patient_name || !formData.address) {
          toast({
            title: "Missing information",
            description: "Please fill in all required fields.",
            variant: "destructive"
          });
          return;
        }
        setStep(2);
      } 
      else if (step === 2) {
        if (formData.symptoms.length === 0) {
          toast({
            title: "Missing symptoms",
            description: "Please select at least one symptom.",
            variant: "destructive"
          });
          return;
        }
        
        // Create the emergency call
        const result = await createEmergencyCall(formData);
        setEmergencyCallId(result.id);
        
        // Get coordinates from address
        const { latitude, longitude } = await geocodeAddress(formData.address);
        
        // Find nearby doctors
        const doctors = await findNearbyDoctors(latitude, longitude);
        setNearbyDoctors(doctors);
        
        setStep(3);
      }
      else if (step === 3) {
        if (!selectedDoctor || !emergencyCallId) {
          toast({
            title: "No doctor selected",
            description: "Please select a doctor for your emergency.",
            variant: "destructive"
          });
          return;
        }
        
        // Assign doctor to the emergency call
        await assignDoctorToEmergencyCall(emergencyCallId, selectedDoctor);
        
        toast({
          title: "Emergency call created",
          description: "A doctor has been assigned and will contact you shortly.",
        });
        
        // Reset the form
        setFormData({
          patient_name: '',
          age: null,
          gender: '',
          address: '',
          symptoms: [],
          severity: null
        });
        setStep(1);
        setSelectedDoctor(null);
        setEmergencyCallId(null);
        setNearbyDoctors([]);
      }
    } catch (error) {
      console.error('Error processing emergency form:', error);
      toast({
        title: "Error",
        description: "Failed to process your emergency request.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Emergency Medical Assistance</CardTitle>
        <CardDescription>
          {step === 1 && "Please provide your personal information"}
          {step === 2 && "Tell us about your symptoms"}
          {step === 3 && "Select a doctor for immediate assistance"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Full Name *</Label>
                  <Input 
                    id="patient_name" 
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    name="age"
                    type="number"
                    value={formData.age?.toString() || ''}
                    onChange={handleNumberChange}
                    placeholder="Enter your age"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <RadioGroup 
                  name="gender" 
                  value={formData.gender || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea 
                  id="address" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your current address"
                  required
                />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <SymptomCategories
                categories={symptomCategories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedSymptoms={formData.symptoms}
                onSymptomsChange={(symptoms) => setFormData(prev => ({ ...prev, symptoms }))}
              />
              
              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level</Label>
                <RadioGroup 
                  name="severity" 
                  value={formData.severity || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as 'low' | 'medium' | 'high' | 'critical' }))}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="critical" id="critical" />
                      <Label htmlFor="critical">Critical</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nearby Available Doctors</h3>
              {nearbyDoctors.length > 0 ? (
                <div className="grid gap-4">
                  {nearbyDoctors.map(doctor => (
                    <div 
                      key={doctor.id} 
                      className={`p-4 border rounded-md cursor-pointer ${selectedDoctor === doctor.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-gray-600">{doctor.specialization}</div>
                      <div className="text-sm text-gray-500">{doctor.hospital}</div>
                      <div className="text-sm text-gray-500">{doctor.address}</div>
                      <div className="text-sm text-gray-500 mt-1">Distance: {doctor.distance.toFixed(2)} km</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>No doctors found nearby.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step !== 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(prev => prev === 3 ? 2 : 1 as 1 | 2 | 3)}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : step === 3 ? 'Confirm Doctor' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
