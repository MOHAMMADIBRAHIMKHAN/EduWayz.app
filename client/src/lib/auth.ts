import { apiRequest } from "./queryClient";

export interface LoginFormData {
  identifier: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fatherName: string;
  fatherOccupation: string;
  fatherContact: string;
  motherName: string;
  motherOccupation: string;
  motherContact: string;
  currentAddressLine1: string;
  currentAddressLine2?: string;
  currentCity: string;
  currentProvince: string;
  currentPostalCode: string;
  currentCountry: string;
  sameAsCurrent: boolean;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentProvince?: string;
  permanentPostalCode?: string;
  permanentCountry?: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyContact: string;
  agreeToTerms: boolean;
}

export async function login(data: LoginFormData) {
  return apiRequest("POST", "/api/auth/login", data);
}

export async function register(data: RegisterFormData) {
  try {
    const response = await apiRequest("POST", "/api/auth/register", data);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check for specific errors
      if (errorData.error && errorData.error.includes("Database connection")) {
        throw new Error("Unable to connect to database. The server might be temporarily unavailable. Please try again later.");
      }
      
      // Format validation errors nicely
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const formattedErrors = errorData.errors.map((e: any) => e.message).join(', ');
        throw new Error(formattedErrors);
      }
      
      // Throw the original error message or a meaningful default
      throw new Error(errorData.message || errorData.error || "Registration failed");
    }
    
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function logout() {
  return apiRequest("POST", "/api/auth/logout");
}

export async function getUser() {
  // Use the apiRequest helper instead of direct fetch to ensure consistent auth headers
  try {
    const res = await apiRequest("GET", "/api/auth/user");
    return await res.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error instanceof Error && error.message.includes("401")) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
}

export async function resendVerificationEmail(email: string) {
  return apiRequest("POST", "/api/auth/resend-verification", { email });
}
