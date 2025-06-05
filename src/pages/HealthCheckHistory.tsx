
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useUserHealthChecks } from '@/services/userDataService';
import { Loader2, Calendar, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HealthCheckHistory = () => {
  const navigate = useNavigate();
  const { healthChecks, loading, error } = useUserHealthChecks();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading History</h3>
        <p className="text-gray-600 mb-4">Failed to load your health check history</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check History</h1>
        <Button onClick={() => navigate('/health-check')}>
          New Health Check
        </Button>
      </div>

      {healthChecks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Health Checks Yet</h3>
            <p className="text-gray-600 mb-4">Start your first health check to see your history here</p>
            <Button onClick={() => navigate('/health-check')}>
              Start Health Check
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {healthChecks.map((check, index) => (
            <Card key={check.id || index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {check.created_at ? format(new Date(check.created_at), 'PPp') : 'Unknown date'}
                      {check.comprehensive_analysis && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Comprehensive
                        </Badge>
                      )}
                      {check.urgency_level && (
                        <Badge className={`${
                          check.urgency_level === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : check.urgency_level === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {check.urgency_level.toUpperCase()}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {check.symptoms && check.symptoms.length > 0 
                        ? `${check.symptoms.length} symptom${check.symptoms.length > 1 ? 's' : ''} reported`
                        : 'No symptoms recorded'
                      }
                      {check.analysis_results && ` • ${check.analysis_results.length} condition${check.analysis_results.length > 1 ? 's' : ''} analyzed`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Assessment */}
                {check.overall_assessment && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-1">Overall Assessment</h4>
                    <p className="text-sm text-blue-700">{check.overall_assessment}</p>
                  </div>
                )}

                {/* Symptoms */}
                {check.symptoms && check.symptoms.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Reported Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {check.symptoms.map((symptom, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          {symptom}
                          {check.symptom_photos && check.symptom_photos[symptom] && (
                            <Camera className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Context */}
                {(check.previous_conditions?.length || check.medications?.length) && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {check.previous_conditions?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Previous Conditions</h4>
                        <div className="flex flex-wrap gap-1">
                          {check.previous_conditions.map((condition, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {check.medications?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Current Medications</h4>
                        <div className="flex flex-wrap gap-1">
                          {check.medications.map((medication, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {medication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Results */}
                {check.analysis_results && check.analysis_results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Analysis Results</h4>
                    <Accordion type="single" collapsible className="w-full">
                      {check.analysis_results.map((condition, idx) => (
                        <AccordionItem key={idx} value={`condition-${idx}`} className="border rounded-md px-3 mb-2">
                          <AccordionTrigger className="text-left py-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{condition.name}</span>
                              <Badge className={`${condition.matchScore > 80 
                                ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                                : condition.matchScore > 60 
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
                                {condition.matchScore}% match
                              </Badge>
                              {condition.visualDiagnosticFeatures && condition.visualDiagnosticFeatures.length > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Photo-Based
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-3">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">{condition.description}</p>
                              
                              {condition.matchedSymptoms && condition.matchedSymptoms.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Matched symptoms: </span>
                                  <span className="text-xs text-gray-600">{condition.matchedSymptoms.join(', ')}</span>
                                </div>
                              )}

                              {condition.medicalHistoryRelevance && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                  <span className="font-medium text-blue-800">Medical History: </span>
                                  <span className="text-blue-700">{condition.medicalHistoryRelevance}</span>
                                </div>
                              )}

                              {condition.medicationConsiderations && (
                                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                                  <span className="font-medium text-orange-800">Medication Notes: </span>
                                  <span className="text-orange-700">{condition.medicationConsiderations}</span>
                                </div>
                              )}

                              {condition.recommendedActions && condition.recommendedActions.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Recommendations: </span>
                                  <ul className="text-xs text-gray-600 list-disc list-inside">
                                    {condition.recommendedActions.map((action, actionIdx) => (
                                      <li key={actionIdx}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Additional Info */}
                {(check.severity || check.duration || check.notes) && (
                  <div className="border-t pt-3 mt-3">
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      {check.severity && (
                        <div>
                          <span className="font-medium text-gray-500">Severity: </span>
                          <span className="text-gray-700">{check.severity}</span>
                        </div>
                      )}
                      {check.duration && (
                        <div>
                          <span className="font-medium text-gray-500">Duration: </span>
                          <span className="text-gray-700">{check.duration}</span>
                        </div>
                      )}
                    </div>
                    {check.notes && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-500 text-sm">Notes: </span>
                        <p className="text-sm text-gray-700 mt-1">{check.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthCheckHistory;
