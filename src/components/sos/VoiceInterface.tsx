
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MicIcon, PhoneIcon, PhoneOffIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { getCurrentPosition } from "@/utils/geolocation";

interface VoiceInterfaceProps {
  onComplete?: (callData: any) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [currentStep, setCurrentStep] = useState<'intro' | 'name' | 'symptoms' | 'severity' | 'location' | 'processing' | 'complete'>('intro');
  const [callData, setCallData] = useState<{
    patient_name: string;
    symptoms: string[];
    severity: string | null;
    address: string;
  }>({
    patient_name: "",
    symptoms: [],
    severity: null,
    address: ""
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            processUserSpeech(finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}`,
            variant: "destructive"
          });
        };
      } else {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive"
        });
      }
      
      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, [toast]);
  
  // Process user speech based on current step
  const processUserSpeech = (speech: string) => {
    const lowerSpeech = speech.toLowerCase();
    
    switch (currentStep) {
      case 'intro':
        if (lowerSpeech.includes('yes') || lowerSpeech.includes('help') || lowerSpeech.includes('emergency')) {
          setCurrentStep('name');
          speak("Please tell me your name");
        }
        break;
        
      case 'name':
        setCallData(prev => ({ ...prev, patient_name: speech }));
        setCurrentStep('symptoms');
        speak("Thank you. Please describe your symptoms or medical emergency");
        break;
        
      case 'symptoms':
        setCallData(prev => ({ ...prev, symptoms: [speech] }));
        setCurrentStep('severity');
        speak("On a scale from low to critical, how severe is your condition? Please say low, medium, high, or critical.");
        break;
        
      case 'severity':
        const severityLevel = determineSeverity(lowerSpeech);
        setCallData(prev => ({ ...prev, severity: severityLevel }));
        setCurrentStep('location');
        speak("Thank you. Please tell me your current location or address");
        break;
        
      case 'location':
        setCallData(prev => ({ ...prev, address: speech }));
        setCurrentStep('processing');
        speak("Thank you for providing all the information. I'm now locating the nearest available doctor for you. Please wait a moment.");
        
        // After a short delay, move to complete
        setTimeout(() => {
          setCurrentStep('complete');
          if (onComplete) onComplete(callData);
          speak("A doctor has been notified of your emergency and will be contacting you shortly. Please stay on the line.");
        }, 3000);
        break;
        
      default:
        break;
    }
  };
  
  // Determine severity level from speech
  const determineSeverity = (speech: string): 'low' | 'medium' | 'high' | 'critical' | null => {
    if (speech.includes('critical') || speech.includes('severe') || speech.includes('very bad')) {
      return 'critical';
    } else if (speech.includes('high') || speech.includes('bad') || speech.includes('serious')) {
      return 'high';
    } else if (speech.includes('medium') || speech.includes('moderate')) {
      return 'medium';
    } else if (speech.includes('low') || speech.includes('mild') || speech.includes('minor')) {
      return 'low';
    }
    return null;
  };
  
  // Text-to-speech function
  const speak = (text: string) => {
    setAiResponse(text);
    
    if (synthRef.current) {
      // Cancel any current speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      synthRef.current.speak(utterance);
    }
  };
  
  // Start the emergency call
  const startEmergencyCall = () => {
    setIsCallActive(true);
    setCurrentStep('intro');
    
    // Get user's location
    getCurrentPosition()
      .then(position => {
        console.log('User position:', position);
      })
      .catch(error => {
        console.error('Error getting position:', error);
      });
    
    // Start speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        
        // Initial greeting
        setTimeout(() => {
          speak("Hello, this is the emergency medical assistant. Do you need medical help?");
        }, 1000);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };
  
  // End the emergency call
  const endEmergencyCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    setIsCallActive(false);
    setIsListening(false);
    setTranscript("");
    setAiResponse("");
    setCurrentStep('intro');
    setCallData({
      patient_name: "",
      symptoms: [],
      severity: null,
      address: ""
    });
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Emergency Voice Assistant</CardTitle>
        <CardDescription>
          Call our AI assistant for immediate medical help
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isCallActive ? (
          <div className="flex flex-col items-center justify-center py-8">
            <PhoneIcon size={64} className="text-primary mb-4" />
            <p className="text-center text-gray-600 mb-8">
              Press the button below to connect with our AI emergency assistant.
              The assistant will collect your information and connect you with a doctor.
            </p>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full"
              onClick={startEmergencyCall}
            >
              <PhoneIcon className="mr-2" /> Start Emergency Call
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className={`${isListening ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <MicIcon className={`h-4 w-4 ${isListening ? 'text-green-500' : 'text-gray-500'}`} />
              <AlertTitle>
                {isListening ? 'Listening...' : 'Microphone inactive'}
              </AlertTitle>
              <AlertDescription>{transcript || 'Waiting for speech...'}</AlertDescription>
            </Alert>
            
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 p-4 rounded-lg"
              >
                <p className="font-medium">Assistant:</p>
                <p>{aiResponse}</p>
              </motion.div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Current step: {currentStep}</p>
              <div className="flex justify-center space-x-2">
                <div className={`h-2 w-12 rounded-full ${currentStep === 'intro' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-12 rounded-full ${currentStep === 'name' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-12 rounded-full ${currentStep === 'symptoms' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-12 rounded-full ${currentStep === 'severity' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-12 rounded-full ${currentStep === 'location' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-12 rounded-full ${currentStep === 'processing' || currentStep === 'complete' ? 'bg-primary' : 'bg-gray-200'}`}></div>
              </div>
            </div>
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
            <PhoneOffIcon className="mr-2" /> End Call
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VoiceInterface;
