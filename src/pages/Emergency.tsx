
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EmergencyForm } from '@/components/sos/EmergencyForm';
import TavusVideoAssistant from '@/components/sos/TavusVideoAssistant';
import PhoneCallInterface from '@/components/sos/PhoneCallInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneIcon, ClipboardIcon, VideoIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Emergency() {
  const [activeTab, setActiveTab] = useState<string>("video");
  const isMobile = useIsMobile();
  
  return (
    <div className="container px-3 py-4 md:px-4 md:py-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">Emergency Medical Services</h1>
          <p className="text-gray-600 text-center max-w-2xl text-sm md:text-base px-2">
            Get immediate medical assistance with our AI-powered emergency service.
            Choose between our video assistant, phone call agent, or manual form.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
          <TabsList className={`${isMobile ? 'grid grid-cols-1 h-auto space-y-1 bg-white/60 p-1' : 'grid grid-cols-3'} mb-6 md:mb-8`}>
            <TabsTrigger 
              value="video" 
              className={`flex items-center justify-center text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              <VideoIcon className="mr-2 h-4 w-4" /> 
              <span>Video Assistant</span>
            </TabsTrigger>
            <TabsTrigger 
              value="phone"
              className={`flex items-center justify-center text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              <PhoneIcon className="mr-2 h-4 w-4" />
              <span>Phone Call</span>
            </TabsTrigger>
            <TabsTrigger 
              value="form"
              className={`flex items-center justify-center text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
            >
              <ClipboardIcon className="mr-2 h-4 w-4" />
              <span>Form Interface</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="px-2 md:px-0">
            <TabsContent value="video">
              <TavusVideoAssistant />
            </TabsContent>
            
            <TabsContent value="phone">
              <PhoneCallInterface />
            </TabsContent>
            
            <TabsContent value="form">
              <EmergencyForm />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
}
