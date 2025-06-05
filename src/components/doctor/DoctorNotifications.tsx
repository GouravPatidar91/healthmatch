import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, AlertCircle, CheckCircle, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HealthDataDownloader } from "./HealthDataDownloader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DoctorNotification {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id: string;
  health_check_id: string;
  symptoms_data: any;
  created_at: string;
  status: 'sent' | 'read' | 'acknowledged';
  patient_name?: string;
  appointment_date?: string;
  appointment_time?: string;
}

const DoctorNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<DoctorNotification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch notifications with appointment details
      const { data, error } = await supabase
        .from('doctor_notifications')
        .select(`
          *,
          appointments(date, time)
        `)
        .eq('doctor_id', 'placeholder-doctor')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to include patient names and appointment details
      const transformedNotifications = (data || []).map(notification => ({
        ...notification,
        patient_name: 'Patient', // Default name since we can't get profile data directly
        appointment_date: notification.appointments?.date,
        appointment_time: notification.appointments?.time,
        status: notification.status as 'sent' | 'read' | 'acknowledged'
      }));

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient health check notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' as const }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsAcknowledged = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ status: 'acknowledged' })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'acknowledged' as const }
            : notification
        )
      );

      toast({
        title: "Acknowledged",
        description: "Health check notification has been acknowledged",
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (notification: DoctorNotification) => {
    setSelectedNotification(notification);
    setShowDetailDialog(true);
    
    if (notification.status === 'sent') {
      markAsRead(notification.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Notifications...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Patient Health Check Notifications</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {notifications.filter(n => n.status === 'sent').length} new
        </Badge>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No health check notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`${notification.status === 'sent' ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.patient_name}</CardTitle>
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status}
                      </Badge>
                      {notification.symptoms_data?.urgency_level && (
                        <Badge className={getUrgencyColor(notification.symptoms_data.urgency_level)}>
                          {notification.symptoms_data.urgency_level.toUpperCase()} URGENCY
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {notification.appointment_date || 'No date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {notification.appointment_time || 'No time'}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(notification)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {notification.status !== 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => markAsAcknowledged(notification.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Symptoms:</span>
                    <p className="text-sm text-gray-600">
                      {notification.symptoms_data?.symptoms?.join(', ') || 'No symptoms listed'}
                    </p>
                  </div>
                  
                  {notification.symptoms_data?.overall_assessment && (
                    <div>
                      <span className="font-medium text-sm">Assessment:</span>
                      <p className="text-sm text-gray-600">
                        {notification.symptoms_data.overall_assessment}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">
                      Received: {new Date(notification.created_at).toLocaleString()}
                    </span>
                    
                    <HealthDataDownloader
                      healthCheckData={notification.symptoms_data}
                      patientName={notification.patient_name}
                      appointmentDate={notification.appointment_date}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Health Check Details - {selectedNotification?.patient_name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive health check data shared by the patient
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Summary</CardTitle>
                    <div className="flex gap-2">
                      {selectedNotification.symptoms_data?.urgency_level && (
                        <Badge className={getUrgencyColor(selectedNotification.symptoms_data.urgency_level)}>
                          {selectedNotification.symptoms_data.urgency_level.toUpperCase()} URGENCY
                        </Badge>
                      )}
                      <HealthDataDownloader
                        healthCheckData={selectedNotification.symptoms_data}
                        patientName={selectedNotification.patient_name}
                        appointmentDate={selectedNotification.appointment_date}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Patient Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {selectedNotification.patient_name}</p>
                        <p><span className="font-medium">Appointment:</span> {selectedNotification.appointment_date} at {selectedNotification.appointment_time}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Health Check Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Symptoms:</span> {selectedNotification.symptoms_data?.symptoms?.join(', ')}</p>
                        {selectedNotification.symptoms_data?.severity && (
                          <p><span className="font-medium">Severity:</span> {selectedNotification.symptoms_data.severity}</p>
                        )}
                        {selectedNotification.symptoms_data?.duration && (
                          <p><span className="font-medium">Duration:</span> {selectedNotification.symptoms_data.duration}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              {selectedNotification.symptoms_data?.analysis_results?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {selectedNotification.symptoms_data.analysis_results.map((result: any, index: number) => (
                        <AccordionItem key={index} value={`result-${index}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <span>{result.name}</span>
                              <Badge>{result.matchScore}% match</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              <p>{result.description}</p>
                              
                              <div>
                                <h5 className="font-medium mb-1">Matched Symptoms:</h5>
                                <p className="text-sm text-gray-600">{result.matchedSymptoms?.join(', ')}</p>
                              </div>
                              
                              {result.recommendedActions?.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-1">Recommendations:</h5>
                                  <ul className="list-disc pl-5 text-sm text-gray-600">
                                    {result.recommendedActions.map((action: string, actionIndex: number) => (
                                      <li key={actionIndex}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              {(selectedNotification.symptoms_data?.previous_conditions?.length > 0 || 
                selectedNotification.symptoms_data?.medications?.length > 0 || 
                selectedNotification.symptoms_data?.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedNotification.symptoms_data.previous_conditions?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Previous Conditions:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedNotification.symptoms_data.previous_conditions.map((condition: string, index: number) => (
                            <Badge key={index} variant="outline">{condition}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedNotification.symptoms_data.medications?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Current Medications:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedNotification.symptoms_data.medications.map((medication: string, index: number) => (
                            <Badge key={index} variant="outline">{medication}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedNotification.symptoms_data.notes && (
                      <div>
                        <h5 className="font-medium mb-2">Additional Notes:</h5>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                          {selectedNotification.symptoms_data.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorNotifications;
