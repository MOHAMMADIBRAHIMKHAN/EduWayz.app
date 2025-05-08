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
  return apiRequest("POST", "/api/auth/register", data);
}

export async function logout() {
  return apiRequest("POST", "/api/auth/logout");
}

export async function getUser() {
  const res = await fetch("/api/auth/user", {
    credentials: "include",
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  
  return res.json();
}

export async function resendVerificationEmail(email: string) {
  return apiRequest("POST", "/api/auth/resend-verification", { email });
}
