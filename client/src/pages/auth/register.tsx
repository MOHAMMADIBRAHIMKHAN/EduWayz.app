import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AuthHeader from "@/components/layout/auth-header";
import { register as registerUser, RegisterFormData } from "@/lib/auth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include lowercase letters")
    .regex(/[A-Z]/, "Password must include uppercase letters")
    .regex(/[0-9]/, "Password must include numbers"),
  confirmPassword: z.string(),
  fatherName: z.string().min(2, "Father's name is required"),
  fatherOccupation: z.string().min(2, "Father's occupation is required"),
  fatherContact: z.string().min(10, "Valid phone number is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  motherOccupation: z.string().min(2, "Mother's occupation is required"),
  motherContact: z.string().min(10, "Valid phone number is required"),
  currentAddressLine1: z.string().min(5, "Address line 1 is required"),
  currentAddressLine2: z.string().optional(),
  currentCity: z.string().min(2, "City is required"),
  currentProvince: z.string().min(2, "Province is required"),
  currentPostalCode: z.string().min(5, "Postal code is required"),
  currentCountry: z.string().default("Saudi Arabia"),
  sameAsCurrent: z.boolean().default(false),
  permanentAddressLine1: z.string().optional(),
  permanentAddressLine2: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentProvince: z.string().optional(),
  permanentPostalCode: z.string().optional(),
  permanentCountry: z.string().default("Saudi Arabia"),
  emergencyName: z.string().min(2, "Emergency contact name is required"),
  emergencyRelation: z.string().min(2, "Relation is required"),
  emergencyContact: z.string().min(10, "Valid phone number is required"),
  captchaCheck: z.boolean().refine(val => val === true, {
    message: "Please verify you're not a robot",
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and privacy policy",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  data => {
    if (!data.sameAsCurrent) {
      return !!data.permanentAddressLine1 && 
             !!data.permanentCity && 
             !!data.permanentProvince && 
             !!data.permanentPostalCode;
    }
    return true;
  },
  {
    message: "Permanent address is required when not same as current",
    path: ["permanentAddressLine1"],
  }
);

const provinces = [
  { value: "riyadh", label: "Riyadh" },
  { value: "makkah", label: "Makkah" },
  { value: "eastern", label: "Eastern Province" },
  { value: "asir", label: "Asir" },
  { value: "jizan", label: "Jizan" },
  { value: "medina", label: "Medina" },
  { value: "qassim", label: "Qassim" },
  { value: "tabuk", label: "Tabuk" },
  { value: "hail", label: "Hail" },
  { value: "najran", label: "Najran" },
  { value: "jawf", label: "Al Jawf" },
  { value: "bahah", label: "Al Bahah" },
  { value: "northern", label: "Northern Borders" },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fatherName: "",
      fatherOccupation: "",
      fatherContact: "",
      motherName: "",
      motherOccupation: "",
      motherContact: "",
      currentAddressLine1: "",
      currentAddressLine2: "",
      currentCity: "",
      currentProvince: "",
      currentPostalCode: "",
      currentCountry: "Saudi Arabia",
      sameAsCurrent: false,
      permanentAddressLine1: "",
      permanentAddressLine2: "",
      permanentCity: "",
      permanentProvince: "",
      permanentPostalCode: "",
      permanentCountry: "Saudi Arabia",
      emergencyName: "",
      emergencyRelation: "",
      emergencyContact: "",
      captchaCheck: false,
      agreeToTerms: false,
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: (data: RegisterFormData) => registerUser(data),
    onSuccess: (response) => {
      response.json().then(data => {
        navigate(`/auth/verify-email?email=${encodeURIComponent(form.getValues().email)}&parentId=${encodeURIComponent(data.parentId)}`);
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // If same as current is checked, copy current address to permanent
    let formData: RegisterFormData = {
      ...data,
      permanentAddressLine1: data.sameAsCurrent ? data.currentAddressLine1 : data.permanentAddressLine1,
      permanentAddressLine2: data.sameAsCurrent ? data.currentAddressLine2 : data.permanentAddressLine2,
      permanentCity: data.sameAsCurrent ? data.currentCity : data.permanentCity,
      permanentProvince: data.sameAsCurrent ? data.currentProvince : data.permanentProvince,
      permanentPostalCode: data.sameAsCurrent ? data.currentPostalCode : data.permanentPostalCode,
      permanentCountry: data.sameAsCurrent ? data.currentCountry : data.permanentCountry,
    };
    
    mutate(formData);
  };

  const watchSameAsCurrent = form.watch("sameAsCurrent");

  return (
    <div className="flex flex-col min-h-screen">
      <AuthHeader showLoginButton />
      
      <main className="flex-grow bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Parent Registration</CardTitle>
              <CardDescription>Register as a parent to access the school management system</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address*</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password*</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormDescription>
                                Must be at least 8 characters with lowercase, uppercase, number
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password*</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Father's Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fatherOccupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation*</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fatherContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number*</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Mother's Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="motherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="motherOccupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation*</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="motherContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number*</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Current Address</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentAddressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currentAddressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currentCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City*</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currentProvince"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province/Region*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Province" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {provinces.map((province) => (
                                    <SelectItem key={province.value} value={province.value}>
                                      {province.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currentPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code*</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currentCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country*</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Permanent Address</h3>
                    
                    <FormField
                      control={form.control}
                      name="sameAsCurrent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Same as current address</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className={`space-y-4 ${watchSameAsCurrent ? "opacity-50" : ""}`}>
                      <FormField
                        control={form.control}
                        name="permanentAddressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1*</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={watchSameAsCurrent} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="permanentAddressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={watchSameAsCurrent} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="permanentCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City*</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={watchSameAsCurrent} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permanentProvince"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province/Region*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={watchSameAsCurrent}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Province" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {provinces.map((province) => (
                                    <SelectItem key={province.value} value={province.value}>
                                      {province.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="permanentPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code*</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={watchSameAsCurrent} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permanentCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country*</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly disabled={watchSameAsCurrent} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Emergency Contact</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="emergencyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergencyRelation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relation*</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="emergencyContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number*</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="captchaCheck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I'm not a robot</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the <a href="#" className="text-primary-600 hover:text-primary-500">Privacy Policy</a> and <a href="#" className="text-primary-600 hover:text-primary-500">Terms of Service</a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/auth/login")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? "Registering..." : "Register"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
