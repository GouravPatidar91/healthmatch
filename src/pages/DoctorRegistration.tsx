
import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UploadCloud, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const doctorFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  specialization: z.string().min(2, {
    message: "Specialization must be at least 2 characters.",
  }),
  hospital: z.string().min(2, {
    message: "Hospital name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  region: z.string().min(2, {
    message: "Region must be at least 2 characters.",
  }),
  degrees: z.string().min(2, {
    message: "Degrees must be at least 2 characters.",
  }),
  experience: z.coerce.number().int().min(1, {
    message: "Experience must be at least 1 year.",
  }),
  registration_number: z.string().min(3, {
    message: "Registration number must be at least 3 characters.",
  }),
  degree_verification_photo: z.instanceof(FileList).refine(
    (files) => files.length > 0, 
    "Degree verification photo is required."
  ).refine(
    (files) => files[0]?.size <= MAX_FILE_SIZE,
    `Max file size is 5MB.`
  ).refine(
    (files) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
    "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported."
  ).transform(files => files[0]),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

const DoctorRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      specialization: "",
      hospital: "",
      address: "",
      region: "",
      degrees: "",
      experience: undefined,
      registration_number: "",
    },
  });

  const onSubmit = async (data: DoctorFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to register as a doctor.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setUploading(true);
      
      // Upload the degree verification photo
      const file = data.degree_verification_photo;
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('degree_verification')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('degree_verification')
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Get user profile data
      const { data: userData, error: userDataError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        console.error("Failed to fetch user profile:", userDataError);
      }

      // Extract email from auth.users via service if available
      const userEmail = user.email || '';
      const firstName = userData?.first_name || user.user_metadata?.first_name || '';
      const lastName = userData?.last_name || user.user_metadata?.last_name || '';
      const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
      
      // Insert doctor information with the file URL and the user's ID
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: user.id, // Use the user's ID as the doctor's ID
          name: data.name,
          email: data.email, // Add email to the insert
          specialization: data.specialization,
          hospital: data.hospital,
          address: data.address,
          region: data.region,
          degrees: data.degrees,
          experience: data.experience,
          registration_number: data.registration_number,
          available: true,
          verified: false, // Initially set to false, pending admin approval
          degree_verification_photo: publicUrl
        });
      
      if (doctorError) {
        // Check if it's a unique constraint error (doctor already exists)
        if (doctorError.code === '23505') {
          // You've already submitted an application
          toast({
            title: "Application already exists",
            description: "You have already submitted a doctor registration application. Please wait for admin approval.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        } else {
          throw doctorError;
        }
      }
      
      toast({
        title: "Registration submitted",
        description: "Your doctor registration has been submitted for review. You will be notified once approved.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error registering doctor:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Preview the selected image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if the file type is PDF
    if (file.type === "application/pdf") {
      setUploadedImage("/placeholder.svg"); // Use a placeholder image for PDFs
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setUploadedImage(null);
    form.setValue("degree_verification_photo", undefined as any);
    form.clearErrors("degree_verification_photo");
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-medical-blue">
            Doctor Registration
          </CardTitle>
          <CardDescription className="text-center">
            Register yourself as a doctor to be available for appointments in HealthMatch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="doctor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degrees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degrees/Qualifications</FormLabel>
                      <FormControl>
                        <Input placeholder="MBBS, MD, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="5" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="degree_verification_photo"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Degree Verification Photo/Document</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center">
                        {uploadedImage ? (
                          <div className="relative w-full mb-4">
                            <img 
                              src={uploadedImage} 
                              alt="Degree Preview" 
                              className="w-full h-48 object-cover rounded-md border" 
                            />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2" 
                              onClick={clearSelectedImage}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-8 w-full flex flex-col items-center justify-center mb-4">
                            <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 text-center mb-2">
                              Upload your degree certificate or license
                            </p>
                            <p className="text-xs text-gray-400 text-center">
                              JPG, PNG, PDF up to 5MB
                            </p>
                          </div>
                        )}
                        <Input 
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          className={uploadedImage ? "hidden" : ""}
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleImageChange(e);
                          }}
                          {...fieldProps}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hospital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital/Clinic</FormLabel>
                    <FormControl>
                      <Input placeholder="City Medical Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Medical Drive" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region/City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : "Register as Doctor"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorRegistration;
