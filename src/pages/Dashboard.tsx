import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight, Phone as PhoneIcon, TrendingUp, Heart, Zap, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, useUserAppointments, useUserHealthChecks } from "@/services/userDataService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { appointments, loading: appointmentsLoading } = useUserAppointments();
  const { healthChecks, loading: healthChecksLoading } = useUserHealthChecks();
  
  const userName = user?.user_metadata?.name || 
                   user?.email?.split('@')[0] || 
                   "User";
  
  const now = new Date();
  
  const upcomingAppointment = !appointmentsLoading && appointments.length > 0
    ? appointments.find(apt => {
        if (apt.status === 'cancelled') return false;
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        return aptDateTime >= now;
      })
    : null;

  const recentAppointment = upcomingAppointment || {
    doctor_name: "Dr. Sarah Johnson",
    doctor_specialty: "General Practitioner",
    date: "2023-10-15",
    time: "10:00:00",
  };

  const latestHealthCheck = !healthChecksLoading && healthChecks.length > 0
    ? healthChecks[0]
    : null;
  
  const determineHealthStatus = () => {
    if (!latestHealthCheck) return { status: "Unknown", color: "text-slate-600" };
    
    if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
      const highestMatch = latestHealthCheck.analysis_results.reduce(
        (highest, current) => current.matchScore > highest.matchScore ? current : highest,
        latestHealthCheck.analysis_results[0]
      );
      
      if (highestMatch.matchScore >= 75) {
        return { 
          status: "Attention Needed", 
          color: "text-red-500",
          condition: highestMatch.name
        };
      } else if (highestMatch.matchScore >= 50) {
        return { 
          status: "Monitor", 
          color: "text-yellow-500",
          condition: highestMatch.name
        };
      }
    }
    
    if (latestHealthCheck.severity) {
      switch (latestHealthCheck.severity.toLowerCase()) {
        case "severe":
          return { status: "Attention Needed", color: "text-red-500" };
        case "moderate":
          return { status: "Monitor", color: "text-yellow-500" };
        case "mild":
          return { status: "Good", color: "text-emerald-500" };
        default:
          return { status: "Good", color: "text-emerald-500" };
      }
    }
    
    return { status: "Good", color: "text-emerald-500" };
  };

  const countAlerts = () => {
    if (healthChecksLoading || !healthChecks.length) return 0;
    
    let alertCount = 0;
    
    if (latestHealthCheck) {
      if (latestHealthCheck.severity === 'severe') {
        alertCount += 1;
      }
      
      if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
        alertCount += latestHealthCheck.analysis_results
          .filter(result => result.matchScore >= 75)
          .length;
      }
    }
    
    return alertCount;
  };

  const healthStatus = determineHealthStatus();
  const alertCount = countAlerts();

  return (
    <div className="space-y-8">
      {/* Modern Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-200" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome back, {userName}
              </h1>
            </div>
            <p className="text-blue-100 text-lg max-w-2xl">
              Track your health journey with intelligent insights and personalized care recommendations
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/emergency')}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <PhoneIcon className="h-5 w-5" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Health Alert */}
      {latestHealthCheck && healthStatus.status === "Attention Needed" && (
        <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold text-lg">Health Alert</AlertTitle>
          <AlertDescription className="text-red-600 text-base">
            Your recent health check indicates attention is needed
            {healthStatus.condition && ` for potential "${healthStatus.condition}"`}.
            Please consider consulting a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/60 backdrop-blur-md border-blue-100/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Health Status</CardTitle>
            <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl group-hover:from-blue-500 group-hover:to-blue-600 transition-all">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color} mb-1`}>{healthStatus.status}</div>
            <p className="text-xs text-gray-500">
              {latestHealthCheck 
                ? `Last check: ${new Date(latestHealthCheck.created_at || '').toLocaleDateString()}` 
                : "No recent checks"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-md border-green-100/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
            <div className="p-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">{statsLoading ? "..." : stats.upcomingAppointments}</div>
            <p className="text-xs text-gray-500">
              {upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-white/60 backdrop-blur-md border-purple-100/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group" 
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Health Checks</CardTitle>
            <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl group-hover:from-purple-500 group-hover:to-purple-600 transition-all">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">{statsLoading ? "..." : stats.healthChecksCount}</div>
            <p className="text-xs text-gray-500">
              {stats.healthChecksCount > 0 ? "View history" : "Start tracking"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-white/60 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
            alertCount > 0 ? 'border-red-200 bg-gradient-to-br from-red-50/50 to-pink-50/50' : 'border-gray-100/50'
          }`}
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alerts</CardTitle>
            <div className={`p-3 rounded-xl transition-all ${
              alertCount > 0 
                ? 'bg-gradient-to-r from-red-400 to-red-500 group-hover:from-red-500 group-hover:to-red-600' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-gray-500 group-hover:to-gray-600'
            }`}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${alertCount > 0 ? 'text-red-500' : 'text-gray-900'}`}>{alertCount}</div>
            <p className="text-xs text-gray-500">
              {alertCount > 0 ? "Need attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/60 backdrop-blur-md border-blue-100/50 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600">Essential health management tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex justify-between items-center rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all" 
              onClick={() => navigate('/health-check')}
            >
              <span>Start Health Check</span>
              <Plus className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl py-6 text-lg hover:border-blue-300 transition-all"
              onClick={() => navigate('/appointments')}
            >
              <span>Book Appointment</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-6 text-lg hover:border-gray-300 transition-all"
              onClick={() => navigate('/health-check-history')}
            >
              <span>View History</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-md border-green-100/50 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              Next Appointment
            </CardTitle>
            <CardDescription className="text-gray-600">Your upcoming medical consultation</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-gray-900">{recentAppointment.doctor_name}</h3>
                      <p className="text-sm text-gray-600">{recentAppointment.doctor_specialty}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold text-gray-900">{recentAppointment.date}</p>
                      <p className="text-sm text-gray-600">{recentAppointment.time}</p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl py-3 hover:border-emerald-300 transition-all"
                  onClick={() => navigate('/appointments')}
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl mb-6 inline-block">
                  <Calendar className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-6 text-lg">No upcoming appointments</p>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate('/appointments')}
                >
                  Book Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
