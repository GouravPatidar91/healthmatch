import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useUserHealthChecks, AnalysisCondition, HealthCheck } from '@/services/userDataService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Image } from "@/components/ui/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthCheckDoctorIntegration, checkUpcomingAppointments } from '@/services/healthCheckService';
import { NearbyDoctorsCard } from '@/components/appointments/NearbyDoctorsCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HealthCheckData {
  symptoms: string[];
  severity?: string;
  duration?: string;
  previous_conditions?: string[];
  medications?: string[];
  notes?: string;
  analysis_results?: AnalysisCondition[];
  symptom_photos?: {[symptom: string]: string};
  comprehensive_analysis?: boolean;
  urgency_level?: string;
  overall_assessment?: string;
}

const HealthCheckResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveHealthCheck } = useUserHealthChecks();
  const { sendToDoctor } = useHealthCheckDoctorIntegration();
  const [saving, setSaving] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [sendingToDoctor, setSendingToDoctor] = useState(false);
  const [showDoctorsDialog, setShowDoctorsDialog] = useState(false);
  const [savedHealthCheck, setSavedHealthCheck] = useState<HealthCheck | null>(null);

  // Extract health check data from location state
  const healthCheckData = location.state?.healthCheckData as HealthCheckData | undefined;

  // If no data is provided, redirect back to health check form
  if (!healthCheckData || !healthCheckData.analysis_results) {
    navigate('/health-check');
    return null;
  }

  // Check for upcoming appointments on component mount
  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        const appointments = await checkUpcomingAppointments();
        setUpcomingAppointments(appointments);
      } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  // Helper functions to categorize symptoms
  const isEyeSymptom = (symptom: string): boolean => {
    const eyeSymptoms = [
      "Blurry vision", "Eye redness", "Eye pain", "Dry eyes", 
      "Watery eyes", "Eye discharge", "Light sensitivity", 
      "Double vision", "Eye strain"
    ];
    return eyeSymptoms.includes(symptom);
  };

  const isSkinSymptom = (symptom: string): boolean => {
    const skinSymptoms = [
      "Rash", "Itching", "Bruising", "Dryness", 
      "Sores", "Changes in mole"
    ];
    return skinSymptoms.includes(symptom);
  };

  // Count how many visual symptoms (eye or skin) have photos
  const visualPhotosCount = healthCheckData.symptom_photos 
    ? Object.keys(healthCheckData.symptom_photos).filter(symptom => 
        isEyeSymptom(symptom) || isSkinSymptom(symptom)
      ).length 
    : 0;

  // Check if results include visual analysis markers
  const hasVisualDiagnosticFeatures = healthCheckData.analysis_results.some(
    condition => condition.visualDiagnosticFeatures && condition.visualDiagnosticFeatures.length > 0
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure we're passing the analysis_results properly for database storage
      const dataToSave = {
        ...healthCheckData,
        // Make sure the analysis results are properly formatted
        analysis_results: healthCheckData.analysis_results
      };
      
      console.log("Saving health check with data:", dataToSave);
      
      const savedCheck = await saveHealthCheck(dataToSave);
      setSavedHealthCheck(savedCheck);
      
      // Automatically send to doctor if there are upcoming appointments
      if (upcomingAppointments.length > 0) {
        setSendingToDoctor(true);
        try {
          await sendToDoctor(savedCheck);
        } catch (error) {
          console.error('Error sending to doctor:', error);
        } finally {
          setSendingToDoctor(false);
        }
      }
      
      toast({
        title: "Health check saved",
        description: upcomingAppointments.length > 0 
          ? "Your health information has been saved and shared with your doctor"
          : "Your health information has been saved successfully"
      });
      navigate('/health-check-history');
    } catch (error) {
      console.error("Error saving health check:", error);
      toast({
        title: "Error",
        description: "Failed to save your health check information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBookAppointment = async () => {
    // First save the health check if not already saved
    if (!savedHealthCheck) {
      setSaving(true);
      try {
        const dataToSave = {
          ...healthCheckData,
          analysis_results: healthCheckData.analysis_results
        };
        
        const savedCheck = await saveHealthCheck(dataToSave);
        setSavedHealthCheck(savedCheck);
        
        toast({
          title: "Health check saved",
          description: "Your health check has been saved and will be shared with the doctor you book with"
        });
      } catch (error) {
        console.error("Error saving health check:", error);
        toast({
          title: "Error",
          description: "Failed to save your health check information",
          variant: "destructive"
        });
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }
    
    setShowDoctorsDialog(true);
  };

  const handleAppointmentBooked = () => {
    setShowDoctorsDialog(false);
    toast({
      title: "Success",
      description: "Your appointment has been booked and health data shared!",
    });
    navigate('/appointments');
  };

  const handleSendToDoctor = async () => {
    if (upcomingAppointments.length === 0) {
      toast({
        title: "No upcoming appointments",
        description: "You need to have an upcoming appointment to share with a doctor",
        variant: "destructive"
      });
      return;
    }

    setSendingToDoctor(true);
    try {
      await sendToDoctor(healthCheckData as HealthCheck);
    } finally {
      setSendingToDoctor(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">
          {healthCheckData.comprehensive_analysis ? "Comprehensive Health Analysis" : "Health Check Results"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to Form
          </Button>
          <Button variant="outline" onClick={() => navigate('/health-check-history')}>
            View History
          </Button>
        </div>
      </div>

      {/* Show upcoming appointments notification */}
      {upcomingAppointments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Upcoming Appointment Detected
            </CardTitle>
            <CardDescription className="text-blue-700">
              You have an appointment on {upcomingAppointments[0].date} at {upcomingAppointments[0].time} with {upcomingAppointments[0].doctor_name}.
              Your health check data will be automatically shared with your doctor when you save it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSendToDoctor}
              disabled={sendingToDoctor}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingToDoctor ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send to Doctor Now'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Summary Card with urgency level */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comprehensive Assessment Summary</CardTitle>
              <CardDescription>
                {healthCheckData.comprehensive_analysis 
                  ? "Analysis based on symptoms, medical history, medications, and additional information"
                  : "Based on your reported symptoms"}
              </CardDescription>
            </div>
            {healthCheckData.urgency_level && (
              <Badge className={`${
                healthCheckData.urgency_level === 'high' 
                  ? 'bg-red-100 text-red-800' 
                  : healthCheckData.urgency_level === 'moderate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}>
                {healthCheckData.urgency_level.toUpperCase()} URGENCY
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Assessment if available */}
          {healthCheckData.overall_assessment && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Overall Assessment</h3>
              <p className="text-blue-700">{healthCheckData.overall_assessment}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reported Symptoms</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {healthCheckData.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {symptom}
                    {healthCheckData.symptom_photos && healthCheckData.symptom_photos[symptom] && (
                      <Camera className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Severity</h3>
                <p>{healthCheckData.severity || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p>{healthCheckData.duration || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Enhanced Medical History Display */}
          {(healthCheckData.previous_conditions?.length || healthCheckData.medications?.length) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="font-medium text-amber-800 mb-2">Medical History Considered in Analysis</h3>
              <div className="grid gap-2 md:grid-cols-2 text-sm text-amber-700">
                {healthCheckData.previous_conditions?.length > 0 && (
                  <div>
                    <span className="font-medium">Previous Conditions:</span> {healthCheckData.previous_conditions.join(", ")}
                  </div>
                )}
                {healthCheckData.medications?.length > 0 && (
                  <div>
                    <span className="font-medium">Current Medications:</span> {healthCheckData.medications.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display symptom photos if any */}
          {healthCheckData.symptom_photos && Object.keys(healthCheckData.symptom_photos).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                Symptom Photos 
                {visualPhotosCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> AI Analysis Included
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(healthCheckData.symptom_photos).map(([symptom, photoSrc]) => (
                  photoSrc && (
                    <div key={symptom} className={`border rounded-md p-2 ${isEyeSymptom(symptom) || isSkinSymptom(symptom) ? 'border-blue-200 bg-blue-50' : ''}`}>
                      <div className="flex items-center mb-1">
                        <p className="text-xs text-gray-500">{symptom}</p>
                        {(isEyeSymptom(symptom) || isSkinSymptom(symptom)) && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Analyzed
                          </span>
                        )}
                      </div>
                      <Image 
                        src={photoSrc} 
                        alt={`${symptom} photo`} 
                        className="w-full h-auto object-cover rounded"
                        style={{ maxHeight: '150px' }}
                        fallback="/placeholder.svg"
                      />
                      {(isEyeSymptom(symptom) || isSkinSymptom(symptom)) && (
                        <p className="mt-1 text-xs text-blue-700">
                          {isEyeSymptom(symptom) 
                            ? "AI analyzed for eye conditions" 
                            : "AI analyzed for skin conditions"}
                        </p>
                      )}
                    </div>
                  )
                ))}
              </div>
              
              {/* Visual analysis explanation */}
              {visualPhotosCount > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> How AI Analyzes Your Photos
                  </h4>
                  <div className="mt-2 text-sm text-blue-700 space-y-1">
                    {Object.keys(healthCheckData.symptom_photos).some(s => isEyeSymptom(s)) && (
                      <p><span className="font-medium">Eye Photos:</span> AI examines redness, discharge, corneal clarity, pupil appearance, eyelid condition, conjunctiva inflammation, and overall structural abnormalities.</p>
                    )}
                    {Object.keys(healthCheckData.symptom_photos).some(s => isSkinSymptom(s)) && (
                      <p><span className="font-medium">Skin Photos:</span> AI analyzes color, pattern, texture, border definition, associated features (swelling, blisters), distribution, and specific lesion types.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis Results</CardTitle>
          <CardDescription>
            {healthCheckData.comprehensive_analysis 
              ? `Comprehensive conditions assessment considering all provided information` 
              : `Possible conditions based on your symptoms`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {healthCheckData.analysis_results?.map((condition, idx) => (
              <AccordionItem key={idx} value={`condition-${idx}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{condition.name}</span>
                      <Badge className={`${condition.matchScore > 80 
                        ? 'bg-red-100 text-red-800' 
                        : condition.matchScore > 60 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'}`}>
                        {condition.matchScore}% match
                      </Badge>
                      {condition.visualDiagnosticFeatures && condition.visualDiagnosticFeatures.length > 0 && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                          Photo-Based
                        </Badge>
                      )}
                      {healthCheckData.comprehensive_analysis && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Comprehensive
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-1">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="mb-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        {condition.visualDiagnosticFeatures && condition.visualDiagnosticFeatures.length > 0 && (
                          <TabsTrigger value="visual">Visual Analysis</TabsTrigger>
                        )}
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                        {healthCheckData.comprehensive_analysis && (
                          <TabsTrigger value="medical-context">Medical Context</TabsTrigger>
                        )}
                      </TabsList>
                      
                      <TabsContent value="overview">
                        <div className="space-y-3">
                          <p className="text-gray-700">{condition.description}</p>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Matched Symptoms:</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {condition.matchedSymptoms.map((symptom, i) => (
                                <Badge key={i} variant="outline" className="flex items-center gap-1">
                                  {symptom}
                                  {healthCheckData.symptom_photos && healthCheckData.symptom_photos[symptom] && (
                                    <Camera className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {condition.visualDiagnosticFeatures && condition.visualDiagnosticFeatures.length > 0 && (
                        <TabsContent value="visual">
                          <div className="space-y-3">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                              <h4 className="font-medium text-green-800">Visual Diagnostic Features</h4>
                              <p className="text-sm text-green-700 mt-1">The AI identified the following visual characteristics in your photos:</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-green-700">
                                {condition.visualDiagnosticFeatures.map((feature, i) => (
                                  <li key={i}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <p className="text-sm text-gray-600">
                              These visual characteristics, combined with your reported symptoms, were used to identify this potential condition.
                            </p>
                          </div>
                        </TabsContent>
                      )}
                      
                      <TabsContent value="recommendations">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Recommendations:</h4>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {condition.recommendedActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {condition.seekMedicalAttention && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <h4 className="font-medium text-sm text-red-700">When to seek medical attention:</h4>
                              <p className="text-sm text-red-700 mt-1">{condition.seekMedicalAttention}</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {healthCheckData.comprehensive_analysis && (
                        <TabsContent value="medical-context">
                          <div className="space-y-3">
                            {condition.medicalHistoryRelevance && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="font-medium text-blue-800">Medical History Relevance:</h4>
                                <p className="text-sm text-blue-700 mt-1">{condition.medicalHistoryRelevance}</p>
                              </div>
                            )}
                            
                            {condition.medicationConsiderations && (
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <h4 className="font-medium text-orange-800">Medication Considerations:</h4>
                                <p className="text-sm text-orange-700 mt-1">{condition.medicationConsiderations}</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {/* Photo Analysis Method explanation if available */}
          {healthCheckData.analysis_results[0]?.photoAnalysisMethod && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Photo Analysis Method
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                {healthCheckData.analysis_results[0].photoAnalysisMethod}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardFooter className="flex gap-4">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={saving || sendingToDoctor}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : sendingToDoctor ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending to Doctor...
              </>
            ) : (
              upcomingAppointments.length > 0 
                ? 'Save & Share with Doctor'
                : 'Save to Health Records'
            )}
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBookAppointment}
            disabled={saving}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </CardFooter>
      </Card>

      {/* Additional Information - Enhanced */}
      {(healthCheckData.previous_conditions?.length || healthCheckData.medications?.length || healthCheckData.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Patient Information</CardTitle>
            <CardDescription>Medical history and notes considered in analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthCheckData.previous_conditions?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Previous Medical Conditions</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {healthCheckData.previous_conditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {healthCheckData.medications?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Medications</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {healthCheckData.medications.map((medication, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {healthCheckData.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Additional Notes</h3>
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">{healthCheckData.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nearby Doctors Dialog */}
      <Dialog open={showDoctorsDialog} onOpenChange={setShowDoctorsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment with Nearby Doctors</DialogTitle>
            <DialogDescription>
              Select a doctor to book an appointment. Your health check data will be automatically shared.
            </DialogDescription>
          </DialogHeader>
          
          <NearbyDoctorsCard
            healthCheckData={savedHealthCheck}
            onAppointmentBooked={handleAppointmentBooked}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthCheckResults;
