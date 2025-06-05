import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, BarChart, Settings, LogOut, Menu, X, PhoneCall, UserPlus, LayoutDashboard, Shield, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Footer from "./Footer";

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPendingDoctorApplication, setHasPendingDoctorApplication] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Check if footer should be shown (only on homepage for signed-in users)
  const shouldShowFooter = location.pathname === "/" && user;
  
  // Check user roles
  useEffect(() => {
    if (user) {
      // Check user roles
      const checkUserRoles = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_doctor, is_admin')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user roles:", error);
            setIsDoctor(false);
            setIsAdmin(false);
            return;
          }
          
          setIsDoctor(!!data?.is_doctor);
          setIsAdmin(!!data?.is_admin);
          
          // Check if user has a pending doctor application
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('verified')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!doctorError && doctorData && doctorData.verified === false) {
            setHasPendingDoctorApplication(true);
          } else {
            setHasPendingDoctorApplication(false);
          }
        } catch (error) {
          console.error("Error checking user roles:", error);
          setIsDoctor(false);
          setIsAdmin(false);
        }
      };
      
      checkUserRoles();
    }
  }, [user]);
  
  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
    { name: "Health Check", path: "/health-check", icon: Heart },
    { name: "Medical Reports", path: "/medical-reports", icon: FileText },
    { name: "Appointments", path: "/appointments", icon: Calendar },
    { name: "Emergency", path: "/emergency", icon: PhoneCall },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];
  
  // Add role-specific navigation items
  if (isDoctor) {
    navigationItems.push({ name: "Doctor Dashboard", path: "/doctor-dashboard", icon: LayoutDashboard });
  } else if (hasPendingDoctorApplication) {
    // Show a disabled version or an indicator that application is pending
    navigationItems.push({ name: "Doctor Application Pending", path: "/dashboard", icon: UserPlus });
  } else {
    navigationItems.push({ name: "Doctor Registration", path: "/doctor-registration", icon: UserPlus });
  }
  
  // Add admin dashboard for admins
  if (isAdmin) {
    navigationItems.push({ name: "Admin Dashboard", path: "/admin-dashboard", icon: Shield });
  }
  
  const handleLogout = async () => {
    await signOut();
    // The navigation will happen automatically due to the auth state change
  };
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Modern Floating Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200 shadow-lg">
              <Heart className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              HealthMatch
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <div className="text-sm text-gray-600 font-medium px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-100">
                  {user.user_metadata.name || user.email}
                </div>
              )}
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-full px-4"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50">
                  {isMobileMenuOpen ? <X /> : <Menu />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-white/95 backdrop-blur-md z-[100]">
                <div className="py-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <Heart className="text-white h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">
                      HealthMatch
                    </span>
                  </div>
                  
                  {user && (
                    <div className="px-4 py-3 mb-6 text-sm text-gray-600 bg-blue-50/50 rounded-xl border border-blue-100">
                      {user.user_metadata.name || user.email}
                    </div>
                  )}
                  
                  <nav className="flex flex-col gap-2">
                    {navigationItems.map((item) => (
                      <Link 
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive(item.path) 
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                            : item.name === "Doctor Application Pending" 
                              ? "opacity-60 cursor-not-allowed text-gray-400"
                              : "hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                        }`}
                        onClick={e => {
                          if (item.name === "Doctor Application Pending") {
                            e.preventDefault();
                          }
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <Button 
                    variant="ghost" 
                    className="mt-auto text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      {/* Modern Layout with Floating Sidebar */}
      <div className="flex flex-1">
        {/* Floating Sidebar for desktop */}
        <aside className="hidden md:block w-72 p-4">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-blue-100/50 shadow-lg p-4 sticky top-24">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive(item.path) 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                      : item.name === "Doctor Application Pending" 
                        ? "opacity-60 cursor-not-allowed text-gray-400"
                        : "hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                  }`}
                  onClick={e => {
                    if (item.name === "Doctor Application Pending") {
                      e.preventDefault();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main content with modern styling */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
          {shouldShowFooter && <Footer />}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
