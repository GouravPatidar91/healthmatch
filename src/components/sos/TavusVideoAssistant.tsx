import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { VideoIcon, PhoneOffIcon, Loader2Icon, UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useEmergencyService } from "@/hooks/useEmergencyService";
import { useIsMobile } from "@/hooks/use-mobile";

interface TavusVideoAssistantProps {
  onComplete?: (callData: any) => void;
}

interface PersonaDetails {
  persona_id: string;
  persona_name: string;
  system_prompt: string;
  replica_id: string;
  created_at: string;
}

const TavusVideoAssistant: React.FC<TavusVideoAssistantProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitEmergencyCall, loading } = useEmergencyService();
  const isMobile = useIsMobile();
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [personaDetails, setPersonaDetails] = useState<PersonaDetails | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callData, setCallData] = useState<{
    patient_name: string;
    symptoms: string[];
    severity: string | null;
    address: string;
  }>({
    patient_name: user?.user_metadata?.name || "",
    symptoms: [],
    severity: null,
    address: ""
  });
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Tavus configuration
  const TAVUS_API_KEY = "1f2bbfa81a08407ea011a4d717a52bf9";
  const TAVUS_REPLICA_ID = "r6ae5b6efc9d";
  const TAVUS_PERSONA_ID = "p92039232c9e";

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-fullscreen on mobile when video starts
  const enterFullscreen = async () => {
    if (isMobile && fullscreenContainerRef.current && !document.fullscreenElement) {
      try {
        await fullscreenContainerRef.current.requestFullscreen();
      } catch (error) {
        console.log('Fullscreen not supported or failed:', error);
      }
    }
  };

  // Exit fullscreen
  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.log('Exit fullscreen failed:', error);
      }
    }
  };

  // Fetch persona details using the exact pattern provided
  useEffect(() => {
    const fetchPersonaDetails = async () => {
      try {
        console.log('Fetching AI assistant persona details...');
        
        const options = {
          method: 'GET', 
          headers: {'x-api-key': '1f2bbfa81a08407ea011a4d717a52bf9'}
        };

        const response = await fetch('https://tavusapi.com/v2/personas/p92039232c9e', options);
        const personaData = await response.json();
        
        console.log('AI Assistant Persona loaded:', personaData);
        setPersonaDetails(personaData);
        
      } catch (err) {
        console.error('Error loading AI assistant:', err);
      }
    };

    fetchPersonaDetails();
  }, []);

  // Initialize AI video assistant conversation
  const initializeAIVideoAssistant = async () => {
    try {
      setIsLoading(true);
      
      console.log('Starting AI Medical Assistant video call...');
      
      // Create conversation with AI assistant
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        },
        body: JSON.stringify({
          replica_id: TAVUS_REPLICA_ID,
          persona_id: TAVUS_PERSONA_ID,
          conversation_name: `Emergency AI Assistant - ${user?.user_metadata?.name || 'Patient'}`,
          properties: {
            max_call_duration: 600, // 10 minutes for emergency consultation
            participant_left_timeout: 30,
            participant_absent_timeout: 30,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start AI assistant: ${response.status}`);
      }

      const conversationData = await response.json();
      console.log('AI Assistant conversation created:', conversationData);
      
      setConversationId(conversationData.conversation_id);
      setIsVideoActive(true);
      
      // Start the AI video call immediately
      await startAIVideoCall(conversationData.conversation_url);
      
    } catch (error) {
      console.error('Error starting AI video assistant:', error);
      toast({
        title: "AI Assistant Error",
        description: "Failed to connect to AI medical assistant. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Start AI video call with iframe and auto-fullscreen on mobile
  const startAIVideoCall = async (conversationUrl: string) => {
    try {
      console.log('Loading AI assistant video interface...');
      
      // Wait for video container to be ready
      let retries = 0;
      const containerRef = isFullscreen ? fullscreenContainerRef : videoContainerRef;
      while (!containerRef.current && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!containerRef.current) {
        throw new Error('Video container not ready');
      }

      // Create iframe for AI assistant
      const iframe = document.createElement('iframe');
      iframe.src = conversationUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = isFullscreen ? '0' : '8px';
      iframe.allow = 'camera; microphone; fullscreen; autoplay';
      iframe.allowFullscreen = true;

      // Load AI assistant interface
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);

      setIsLoading(false);

      // Auto-fullscreen on mobile
      if (isMobile) {
        setTimeout(() => {
          enterFullscreen();
        }, 1000); // Small delay to ensure iframe is loaded
      }

      toast({
        title: "AI Medical Assistant Connected",
        description: `${personaDetails?.persona_name || 'AI Assistant'} is ready to help with your emergency consultation.`,
      });

      iframe.onload = () => {
        console.log('AI Assistant video call loaded successfully');
      };

    } catch (error) {
      console.error('Error loading AI assistant video:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to AI assistant. Please try again.",
        variant: "destructive"
      });
      setIsVideoActive(false);
      setIsLoading(false);
    }
  };

  // Handle emergency call completion
  const handleCallComplete = async () => {
    try {
      const emergencyData = {
        patient_name: callData.patient_name || user?.user_metadata?.name || "Patient",
        symptoms: ["AI consultation completed"],
        severity: "medium" as const,
        address: "To be determined"
      };

      await submitEmergencyCall(emergencyData);
      
      if (onComplete) {
        onComplete(emergencyData);
      }

      toast({
        title: "Emergency Consultation Complete",
        description: "AI assistant has recorded your information and is coordinating care.",
      });

    } catch (error) {
      console.error('Error completing emergency call:', error);
      toast({
        title: "Error",
        description: "Failed to process emergency consultation data.",
        variant: "destructive"
      });
    }
  };

  // End the AI video call and exit fullscreen
  const endAIVideoCall = () => {
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = '';
    }
    if (fullscreenContainerRef.current) {
      fullscreenContainerRef.current.innerHTML = '';
    }
    
    // Exit fullscreen if active
    exitFullscreen();
    
    setIsVideoActive(false);
    setConversationId(null);
    
    toast({
      title: "AI Consultation Ended",
      description: "Your emergency video consultation has been completed."
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
      if (fullscreenContainerRef.current) {
        fullscreenContainerRef.current.innerHTML = '';
      }
      exitFullscreen();
    };
  }, []);

  return (
    <>
      {/* Fullscreen container for mobile */}
      <div 
        ref={fullscreenContainerRef}
        className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'hidden'}`}
        style={{ display: isFullscreen ? 'block' : 'none' }}
      >
        {isFullscreen && isVideoActive && (
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="destructive"
              size="sm"
              onClick={endAIVideoCall}
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOffIcon className="mr-2 h-4 w-4" /> End Call
            </Button>
          </div>
        )}
      </div>

      {/* Regular card container */}
      <Card className={`w-full max-w-3xl mx-auto ${isFullscreen ? 'hidden' : ''}`}>
        <CardHeader>
          <CardTitle>AI Video Medical Assistant</CardTitle>
          <CardDescription>
            {personaDetails 
              ? `Connect with ${personaDetails.persona_name} - AI Medical Assistant for immediate emergency consultation`
              : "Connect with our AI video assistant for immediate medical consultation"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {personaDetails && !isVideoActive && (
            <Alert className="bg-blue-50 border-blue-200">
              <UserIcon className="h-4 w-4 text-blue-500" />
              <AlertTitle>AI Medical Assistant Ready</AlertTitle>
              <AlertDescription>
                {personaDetails.persona_name} is a specialized AI medical assistant ready to assess your emergency situation, provide guidance, and coordinate appropriate medical care.
              </AlertDescription>
            </Alert>
          )}

          {!isVideoActive ? (
            <div className="flex flex-col items-center justify-center py-8">
              <VideoIcon size={64} className="text-primary mb-4" />
              <p className="text-center text-gray-600 mb-8 max-w-md">
                Start an emergency video call with our AI medical assistant. The AI will assess your symptoms, 
                determine severity, and help coordinate appropriate medical care immediately.
                {isMobile && " On mobile, the video will automatically go fullscreen for the best experience."}
              </p>
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full"
                onClick={initializeAIVideoAssistant}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> 
                    Connecting to AI Assistant...
                  </>
                ) : (
                  <>
                    <VideoIcon className="mr-2" /> 
                    Start AI Emergency Consultation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <VideoIcon className="h-4 w-4 text-green-500" />
                <AlertTitle>AI Assistant Active</AlertTitle>
                <AlertDescription>
                  You are now connected with {personaDetails?.persona_name || 'AI Medical Assistant'}. Please describe your emergency situation clearly for immediate assessment.
                  {isMobile && !isFullscreen && " Tap the video to go fullscreen for better experience."}
                </AlertDescription>
              </Alert>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-black rounded-lg overflow-hidden cursor-pointer"
                style={{ aspectRatio: '16/9', minHeight: '400px' }}
                onClick={() => isMobile && !isFullscreen && enterFullscreen()}
              >
                <div 
                  ref={videoContainerRef}
                  className="w-full h-full"
                  style={{ minHeight: '400px' }}
                />
                
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Loading AI Medical Assistant...</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  🚨 Emergency AI Consultation - {personaDetails?.persona_name || 'AI Assistant'}
                </div>
                
                {conversationId && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                    Session: {conversationId.slice(-8)}
                  </div>
                )}

                {isMobile && !isFullscreen && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                    Tap to go fullscreen
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {isVideoActive && !isFullscreen && (
            <Button 
              variant="destructive"
              className="w-full"
              onClick={endAIVideoCall}
            >
              <PhoneOffIcon className="mr-2" /> End AI Consultation
            </Button>
          )}
          
          {!isVideoActive && !isLoading && (
            <div className="w-full text-center text-sm text-gray-500">
              <p>AI video consultations powered by Tavus AI technology</p>
              {personaDetails && (
                <p className="mt-1 text-xs">AI Assistant: {personaDetails.persona_name} - Medical Emergency Specialist</p>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
};

export default TavusVideoAssistant;
