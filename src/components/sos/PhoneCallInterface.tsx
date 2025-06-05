
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PhoneIcon, PhoneOffIcon, Loader2Icon, InfoIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { initiateEmergencyCall, getCallStatus, getEmergencyCallDetails } from "@/services/phoneService";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface PhoneCallFormData {
  phoneNumber: string;
  patientName: string;
}

interface EmergencyCallDetails {
  id: string;
  patient_name: string;
  symptoms: string[];
  severity: string | null;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
  phone_number?: string;
}

const PhoneCallInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [emergencyCallId, setEmergencyCallId] = useState<string | null>(null);
  const [emergencyCallDetails, setEmergencyCallDetails] = useState<EmergencyCallDetails | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  
  const form = useForm<PhoneCallFormData>({
    defaultValues: {
      phoneNumber: "",
      patientName: user?.user_metadata?.name || ""
    }
  });

  // Fetch emergency call details when we have an ID
  useEffect(() => {
    if (emergencyCallId && isCallActive) {
      const fetchCallDetails = async () => {
        try {
          const details = await getEmergencyCallDetails(emergencyCallId);
          if (details) {
            setEmergencyCallDetails(details);
          }
        } catch (error) {
          console.error("Error fetching emergency call details:", error);
        }
      };
      
      // Call immediately then poll
      fetchCallDetails();
      const detailsInterval = setInterval(fetchCallDetails, 5000);
      
      return () => clearInterval(detailsInterval);
    }
  }, [emergencyCallId, isCallActive]);

  // Start an emergency call
  const startEmergencyCall = async (data: PhoneCallFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to make emergency calls",
        variant: "destructive"
      });
      return;
    }

    setIsCallLoading(true);
    
    try {
      const result = await initiateEmergencyCall({
        phoneNumber: data.phoneNumber,
        userId: user.id,
        patientName: data.patientName
      });
      
      setCallSid(result.callSid);
      setCallStatus(result.status);
      setEmergencyCallId(result.emergencyCallId || null);
      setIsCallActive(true);
      
      toast({
        title: "Emergency Call Initiated",
        description: `We're calling ${data.phoneNumber} now. Please answer your phone.`,
      });
      
      // Start polling for call status
      if (result.callSid) {
        pollCallStatus(result.callSid);
      }
      
    } catch (error: any) {
      console.error("Error starting emergency call:", error);
      
      // If the error contains missingCredentials data, show the detailed error sheet
      if (error.missingCredentials) {
        setErrorDetails(error);
        setShowErrorDetails(true);
      }
      
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to initiate emergency call",
        variant: "destructive"
      });
    } finally {
      setIsCallLoading(false);
    }
  };
  
  // Poll for call status updates
  const pollCallStatus = async (sid: string) => {
    try {
      const statusResult = await getCallStatus(sid);
      setCallStatus(statusResult.status);
      
      // Continue polling if the call is not completed
      if (statusResult.status !== 'completed' && 
          statusResult.status !== 'failed' && 
          statusResult.status !== 'busy' && 
          statusResult.status !== 'no-answer') {
        setTimeout(() => pollCallStatus(sid), 5000); // Poll every 5 seconds
      } else {
        // Call is completed or failed
        if (statusResult.status === 'completed') {
          toast({
            title: "Call Ended",
            description: `Your emergency call has ended. Health information collected.`,
          });
        } else {
          toast({
            title: "Call Ended",
            description: `Your emergency call has ended with status: ${statusResult.status}`,
            variant: "destructive"
          });
          setIsCallActive(false);
        }
      }
      
    } catch (error) {
      console.error("Error polling call status:", error);
    }
  };
  
  // End the emergency call
  const endEmergencyCall = () => {
    setIsCallActive(false);
    setCallSid(null);
    setCallStatus(null);
    setEmergencyCallId(null);
    setEmergencyCallDetails(null);
    
    toast({
      title: "Call Request Cancelled",
      description: "Your emergency call request has been cancelled."
    });
  };

  // Helper function to get severity badge color
  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'critical':
        return "bg-red-500 hover:bg-red-600";
      case 'high':
        return "bg-orange-500 hover:bg-orange-600";
      case 'medium':
        return "bg-yellow-500 hover:bg-yellow-600";
      case 'low':
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Emergency Phone Assistance</CardTitle>
          <CardDescription>
            {isCallActive 
              ? "Our AI assistant will call you and collect emergency details" 
              : "Enter your phone number to receive an emergency call from our AI assistant"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isCallActive ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(startEmergencyCall)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  rules={{ 
                    required: "Phone number is required",
                    pattern: {
                      value: /^\+?[0-9]{10,15}$/,
                      message: "Please enter a valid phone number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormDescription>Enter your phone number to receive the emergency call</FormDescription>
                      <FormControl>
                        <Input placeholder="555-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="patientName"
                  rules={{ 
                    required: "Patient name is required"
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormDescription>Who needs medical assistance?</FormDescription>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={isCallLoading}
                  className="bg-red-600 hover:bg-red-700 w-full mt-4 text-white font-bold py-4 rounded-full"
                >
                  {isCallLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Initiating Call
                    </>
                  ) : (
                    <>
                      <PhoneIcon className="mr-2" /> Start Emergency Call
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <PhoneIcon className="h-4 w-4 text-blue-500" />
                <AlertTitle>Call in Progress</AlertTitle>
                <AlertDescription>
                  {callStatus === 'queued' && "Your call is queued and will begin shortly..."}
                  {callStatus === 'initiated' && "Call is being connected to your phone..."}
                  {callStatus === 'ringing' && "Your phone is ringing. Please answer the call."}
                  {callStatus === 'in-progress' && "Call is active. Please respond to the AI assistant's questions."}
                  {callStatus === 'completed' && "Call has completed. Health information has been collected."}
                  {!callStatus && "Connecting to emergency services..."}
                </AlertDescription>
              </Alert>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                  </div>
                  <div className="relative h-32 w-32 rounded-full bg-red-600 flex items-center justify-center">
                    <PhoneIcon size={48} className="text-white" />
                  </div>
                </div>
              </motion.div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Call Status: {callStatus || "Connecting..."}</p>
              </div>
              
              {/* Show health information if available */}
              {emergencyCallDetails && (emergencyCallDetails.symptoms?.length > 0 || emergencyCallDetails.severity) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-lg border border-gray-200 mt-4"
                >
                  <div className="flex items-center mb-3">
                    <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="font-medium">Health Information Collected</h3>
                  </div>
                  
                  {emergencyCallDetails.symptoms?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {emergencyCallDetails.symptoms.map((symptom, index) => (
                          <li key={index} className="text-sm text-gray-600">{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {emergencyCallDetails.severity && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Severity:</p>
                      <Badge className={`mt-1 ${getSeverityColor(emergencyCallDetails.severity)}`}>
                        {emergencyCallDetails.severity.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  {emergencyCallDetails.address && emergencyCallDetails.address !== "To be collected" && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location:</p>
                      <p className="text-sm text-gray-600">{emergencyCallDetails.address}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {isCallActive && (
            <Button 
              variant="destructive"
              className="w-full"
              onClick={endEmergencyCall}
            >
              <PhoneOffIcon className="mr-2" /> {callStatus === 'completed' ? 'Close' : 'Cancel Call Request'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Error Details Sheet */}
      <Sheet open={showErrorDetails} onOpenChange={setShowErrorDetails}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configuration Error</SheetTitle>
            <SheetDescription>
              The emergency call service is missing required Twilio credentials.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Missing Twilio Configuration</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>The following credentials are required to make emergency calls:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {errorDetails?.missingCredentials?.accountSid && (
                    <li>Twilio Account SID</li>
                  )}
                  {errorDetails?.missingCredentials?.authToken && (
                    <li>Twilio Auth Token</li>
                  )}
                  {errorDetails?.missingCredentials?.phoneNumber && (
                    <li>Twilio Phone Number</li>
                  )}
                </ul>
                <p className="pt-2">Please contact system administrator to configure these credentials.</p>
              </AlertDescription>
            </Alert>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PhoneCallInterface;
