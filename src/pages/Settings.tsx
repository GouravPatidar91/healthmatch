import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, Layout, MonitorSmartphone, Moon } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  
  // Fixed the typing issue in this section
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    appearance: {
      darkMode: false,
      reducedMotion: false,
    },
    privacy: {
      showHealthData: true,
      shareAnonymousData: true,
    },
    devices: {
      thisDevice: true,
      allDevices: false,
    }
  });
  
  const handleSettingChange = (
    category: keyof typeof settings, 
    setting: string, 
    value: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  const handleSaveSettings = () => {
    // In a real app, this would save to a backend
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully."
    });
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates and important information via email.
              </p>
            </div>
            <Switch 
              id="email-notifications"
              checked={settings.notifications.email}
              onCheckedChange={value => handleSettingChange("notifications", "email", value)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get real-time alerts on your mobile device.
              </p>
            </div>
            <Switch 
              id="push-notifications"
              checked={settings.notifications.push}
              onCheckedChange={value => handleSettingChange("notifications", "push", value)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive critical alerts via SMS.
              </p>
            </div>
            <Switch 
              id="sms-notifications"
              checked={settings.notifications.sms}
              onCheckedChange={value => handleSettingChange("notifications", "sms", value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark themes.
              </p>
            </div>
            <Switch 
              id="dark-mode"
              checked={settings.appearance.darkMode}
              onCheckedChange={value => handleSettingChange("appearance", "darkMode", value)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions for users with motion sensitivity.
              </p>
            </div>
            <Switch 
              id="reduced-motion"
              checked={settings.appearance.reducedMotion}
              onCheckedChange={value => handleSettingChange("appearance", "reducedMotion", value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="show-health-data">Show Health Data</Label>
              <p className="text-sm text-muted-foreground">
                Control whether your health data is visible to others.
              </p>
            </div>
            <Switch 
              id="show-health-data"
              checked={settings.privacy.showHealthData}
              onCheckedChange={value => handleSettingChange("privacy", "showHealthData", value)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="share-anonymous-data">Share Anonymous Data</Label>
              <p className="text-sm text-muted-foreground">
                Contribute to research by sharing anonymized data.
              </p>
            </div>
            <Switch 
              id="share-anonymous-data"
              checked={settings.privacy.shareAnonymousData}
              onCheckedChange={value => handleSettingChange("privacy", "shareAnonymousData", value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="this-device">This Device</Label>
              <p className="text-sm text-muted-foreground">
                Authorize the current device for secure access.
              </p>
            </div>
            <Switch 
              id="this-device"
              checked={settings.devices.thisDevice}
              onCheckedChange={value => handleSettingChange("devices", "thisDevice", value)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="all-devices">All Devices</Label>
              <p className="text-sm text-muted-foreground">
                Grant access to all devices associated with your account.
              </p>
            </div>
            <Switch 
              id="all-devices"
              checked={settings.devices.allDevices}
              onCheckedChange={value => handleSettingChange("devices", "allDevices", value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Button className="mt-8" onClick={handleSaveSettings}>Save Settings</Button>
    </div>
  );
};

export default Settings;
