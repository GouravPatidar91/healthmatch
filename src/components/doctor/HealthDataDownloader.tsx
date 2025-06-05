
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthDataDownloaderProps {
  healthCheckData: any;
  patientName?: string;
  appointmentDate?: string;
}

export const HealthDataDownloader = ({ 
  healthCheckData, 
  patientName = "Patient",
  appointmentDate 
}: HealthDataDownloaderProps) => {
  const { toast } = useToast();

  const downloadAsJSON = () => {
    try {
      const dataToDownload = {
        patient_name: patientName,
        appointment_date: appointmentDate,
        download_date: new Date().toISOString(),
        health_check_data: healthCheckData
      };

      const dataStr = JSON.stringify(dataToDownload, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `health_check_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Health check data downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download health check data",
        variant: "destructive"
      });
    }
  };

  const downloadAsPDF = () => {
    try {
      // Create a formatted text version for PDF-like content
      let content = `HEALTH CHECK REPORT\n`;
      content += `==================\n\n`;
      content += `Patient: ${patientName}\n`;
      content += `Appointment Date: ${appointmentDate || 'N/A'}\n`;
      content += `Report Generated: ${new Date().toLocaleString()}\n\n`;
      
      content += `SYMPTOMS:\n`;
      content += `${healthCheckData.symptoms?.join(', ') || 'None reported'}\n\n`;
      
      if (healthCheckData.severity) {
        content += `SEVERITY: ${healthCheckData.severity}\n\n`;
      }
      
      if (healthCheckData.duration) {
        content += `DURATION: ${healthCheckData.duration}\n\n`;
      }
      
      if (healthCheckData.urgency_level) {
        content += `URGENCY LEVEL: ${healthCheckData.urgency_level.toUpperCase()}\n\n`;
      }
      
      if (healthCheckData.overall_assessment) {
        content += `OVERALL ASSESSMENT:\n${healthCheckData.overall_assessment}\n\n`;
      }
      
      if (healthCheckData.previous_conditions?.length > 0) {
        content += `PREVIOUS CONDITIONS:\n${healthCheckData.previous_conditions.join(', ')}\n\n`;
      }
      
      if (healthCheckData.medications?.length > 0) {
        content += `CURRENT MEDICATIONS:\n${healthCheckData.medications.join(', ')}\n\n`;
      }
      
      if (healthCheckData.analysis_results?.length > 0) {
        content += `ANALYSIS RESULTS:\n`;
        healthCheckData.analysis_results.forEach((result: any, index: number) => {
          content += `${index + 1}. ${result.name} (${result.matchScore}% match)\n`;
          content += `   Description: ${result.description}\n`;
          content += `   Matched Symptoms: ${result.matchedSymptoms?.join(', ')}\n`;
          if (result.recommendedActions?.length > 0) {
            content += `   Recommendations: ${result.recommendedActions.join('; ')}\n`;
          }
          content += `\n`;
        });
      }
      
      if (healthCheckData.notes) {
        content += `ADDITIONAL NOTES:\n${healthCheckData.notes}\n\n`;
      }
      
      content += `\nThis report was generated from an AI-assisted health check and should be reviewed by a qualified healthcare professional.`;

      const dataBlob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `health_report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Health report downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download health report",
        variant: "destructive"
      });
    }
  };

  const downloadSymptomPhotos = () => {
    try {
      if (!healthCheckData.symptom_photos || Object.keys(healthCheckData.symptom_photos).length === 0) {
        toast({
          title: "No Photos",
          description: "No symptom photos available for download",
          variant: "destructive"
        });
        return;
      }

      // For now, we'll create a JSON file with photo data
      // In a real implementation, you'd want to zip the actual image files
      const photoData = {
        patient_name: patientName,
        appointment_date: appointmentDate,
        download_date: new Date().toISOString(),
        symptom_photos: healthCheckData.symptom_photos,
        note: "Photo data URLs - in production, these would be actual image files"
      };

      const dataStr = JSON.stringify(photoData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `symptom_photos_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Symptom photos data downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading photos:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download symptom photos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={downloadAsJSON}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Raw Data (JSON)
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={downloadAsPDF}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Health Report (TXT)
      </Button>
      
      {healthCheckData.symptom_photos && Object.keys(healthCheckData.symptom_photos).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={downloadSymptomPhotos}
          className="flex items-center gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          Symptom Photos
        </Button>
      )}
    </div>
  );
};
