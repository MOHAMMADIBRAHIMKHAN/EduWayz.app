import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import { insertParentSchema } from "@shared/schema";
import { sendVerificationEmail } from "../utils/email";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as crypto from 'crypto';
import { 
  createParentViaApi, 
  parentEmailExistsViaApi, 
  getParentByVerificationTokenViaApi,
  verifyParentViaApi,
  getParentByEmailViaApi,
  updateVerificationTokenViaApi
} from '../utils/supabaseApi';

// Register a new parent
export async function register(req: Request, res: Response) {
  console.log('Registration request received:', { 
    headers: req.headers,
    bodyKeys: Object.keys(req.body),
    method: req.method,
    path: req.path
  });
  
  try {
    // Validate request body using zod schema
    // Create a more flexible validation schema that doesn't strictly follow DB constraints
    // for permanent address fields
    const validationSchema = z.object({
      // Account information
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string(),
      
      // Father's information
      fatherName: z.string().min(2, "Father's name is required"),
      fatherOccupation: z.string().min(2, "Father's occupation is required"),
      fatherContact: z.string().min(10, "Valid phone number is required"),
      
      // Mother's information
      motherName: z.string().min(2, "Mother's name is required"),
      motherOccupation: z.string().min(2, "Mother's occupation is required"),
      motherContact: z.string().min(10, "Valid phone number is required"),
      
      // Current address
      currentAddressLine1: z.string().min(5, "Address line 1 is required"),
      currentAddressLine2: z.string().optional(),
      currentCity: z.string().min(2, "City is required"),
      currentProvince: z.string().min(2, "Province is required"),
      currentPostalCode: z.string().min(5, "Postal code is required"),
      currentCountry: z.string().default("Saudi Arabia"),
      
      // Flag for same as current
      sameAsCurrent: z.boolean().optional().default(false),
      
      // Permanent address (completely optional for validation - we'll handle it in code)
      permanentAddressLine1: z.string().optional(),
      permanentAddressLine2: z.string().optional(),
      permanentCity: z.string().optional(),
      permanentProvince: z.string().optional(),
      permanentPostalCode: z.string().optional(),
      permanentCountry: z.string().optional().default("Saudi Arabia"),
      
      // Emergency contact
      emergencyName: z.string().min(2, "Emergency contact name is required"),
      emergencyRelation: z.string().min(2, "Relation is required"),
      emergencyContact: z.string().min(10, "Valid phone number is required"),
      
      // For testing purposes
      captchaCheck: z.boolean().optional().default(true),
      agreeToTerms: z.boolean().optional().default(true),
    })
    // Check if passwords match
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

    // Validate the request body
    console.log('Validating request data');
    const validatedData = validationSchema.parse(req.body);

    // Check if email already exists via direct API
    const emailExists = await parentEmailExistsViaApi(validatedData.email);
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Always handle permanent address fields - either from input or copy from current
    // This ensures we have values for required DB fields
    validatedData.permanentAddressLine1 = validatedData.sameAsCurrent 
      ? validatedData.currentAddressLine1 
      : (validatedData.permanentAddressLine1 || validatedData.currentAddressLine1);
      
    validatedData.permanentAddressLine2 = validatedData.sameAsCurrent 
      ? validatedData.currentAddressLine2 
      : validatedData.permanentAddressLine2;
      
    validatedData.permanentCity = validatedData.sameAsCurrent 
      ? validatedData.currentCity 
      : (validatedData.permanentCity || validatedData.currentCity);
      
    validatedData.permanentProvince = validatedData.sameAsCurrent 
      ? validatedData.currentProvince 
      : (validatedData.permanentProvince || validatedData.currentProvince);
      
    validatedData.permanentPostalCode = validatedData.sameAsCurrent 
      ? validatedData.currentPostalCode 
      : (validatedData.permanentPostalCode || validatedData.currentPostalCode);
      
    validatedData.permanentCountry = validatedData.sameAsCurrent 
      ? validatedData.currentCountry 
      : (validatedData.permanentCountry || validatedData.currentCountry);

    // Prepare parent data for database
    const parentData = {
      email: validatedData.email,
      password: validatedData.password,
      fatherName: validatedData.fatherName,
      fatherOccupation: validatedData.fatherOccupation,
      fatherContact: validatedData.fatherContact,
      motherName: validatedData.motherName,
      motherOccupation: validatedData.motherOccupation,
      motherContact: validatedData.motherContact,
      currentAddressLine1: validatedData.currentAddressLine1,
      currentAddressLine2: validatedData.currentAddressLine2,
      currentCity: validatedData.currentCity,
      currentProvince: validatedData.currentProvince,
      currentPostalCode: validatedData.currentPostalCode,
      currentCountry: validatedData.currentCountry,
      permanentAddressLine1: validatedData.permanentAddressLine1,
      permanentAddressLine2: validatedData.permanentAddressLine2,
      permanentCity: validatedData.permanentCity,
      permanentProvince: validatedData.permanentProvince,
      permanentPostalCode: validatedData.permanentPostalCode,
      permanentCountry: validatedData.permanentCountry,
      emergencyName: validatedData.emergencyName,
      emergencyRelation: validatedData.emergencyRelation,
      emergencyContact: validatedData.emergencyContact,
    };

    try {
      console.log('Creating parent using direct Supabase API');
      
      // Set a reasonable timeout for the entire registration process
      const registrationPromise = new Promise(async (resolve, reject) => {
        try {
          // Check if email already exists via direct API
          const emailExists = await parentEmailExistsViaApi(parentData.email);
          if (emailExists) {
            return reject(new Error("Email already registered"));
          }
          
          // Generate a parent ID in the format PO-YYYY-MMM-NNNNN
          const now = new Date();
          const year = now.getFullYear();
          const month = now.toLocaleString('en-US', { month: 'short' });
          // Use a random number for sequence to avoid conflicts
          const sequenceNumber = Math.floor(1000 + Math.random() * 9000);
          const paddedNumber = String(sequenceNumber).padStart(5, '0');
          const parentId = `PO-${year}-${month}-${paddedNumber}`;
          
          // Generate verification token
          const verificationToken = uuidv4();
          
          // Hash the password exactly as in your working Postman code
          const hashedPassword = crypto.createHash('sha256').update(parentData.password).digest('hex');
          
          // Format the data for Supabase REST API - using camelCase to match actual column names
          const supabaseParentData = {
            parentId: parentId,
            email: parentData.email,
            password: hashedPassword,
            isVerified: false,
            verificationToken: verificationToken,
            fatherName: parentData.fatherName,
            fatherOccupation: parentData.fatherOccupation,
            fatherContact: parentData.fatherContact,
            motherName: parentData.motherName,
            motherOccupation: parentData.motherOccupation,
            motherContact: parentData.motherContact,
            currentAddressLine1: parentData.currentAddressLine1,
            currentAddressLine2: parentData.currentAddressLine2 || null,
            currentCity: parentData.currentCity,
            currentProvince: parentData.currentProvince,
            currentPostalCode: parentData.currentPostalCode,
            currentCountry: parentData.currentCountry,
            permanentAddressLine1: parentData.permanentAddressLine1,
            permanentAddressLine2: parentData.permanentAddressLine2 || null,
            permanentCity: parentData.permanentCity,
            permanentProvince: parentData.permanentProvince,
            permanentPostalCode: parentData.permanentPostalCode,
            permanentCountry: parentData.permanentCountry,
            emergencyName: parentData.emergencyName,
            emergencyRelation: parentData.emergencyRelation,
            emergencyContact: parentData.emergencyContact
            // Not including createdAt and updatedAt as they might be generated by Supabase
          };
          
          // Create the parent using direct Supabase API call
          console.log('Sending direct API request to Supabase');
          const result = await createParentViaApi(supabaseParentData);
          
          console.log('Parent created successfully via direct API, sending verification email');
          
          // Send verification email (don't wait for it to complete)
          sendVerificationEmail(
            parentData.email,
            verificationToken,
            parentId
          ).catch(err => {
            console.error('Failed to send verification email:', err);
            // We don't reject here because the parent was created successfully
          });
          
          // Return success with parent ID
          resolve({
            message: "Parent registered successfully",
            parentId: parentId,
          });
        } catch (error) {
          console.error('Error in registration process:', error);
          reject(error);
        }
      });
      
      // Set a timeout for the entire operation (20 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Registration timed out after 20 seconds'));
        }, 20000);
      });
      
      // Race between the registration process and the timeout
      const result = await Promise.race([registrationPromise, timeoutPromise]);
      return res.status(201).json(result);
      
    } catch (error) {
      console.error('Error in registration process:', error);
      throw error; // Re-throw to be caught by the outer catch block
    }
    
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      console.error('Validation errors detail:', JSON.stringify(error.errors, null, 2));
      
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationError.details,
        fields: Object.keys(error.format()).filter(k => k !== '_errors')
      });
    }
    
    // Handle RLS errors (row-level security violations)
    const errorObj = error as any;
    if (errorObj?.code === '42501' || 
        (errorObj?.message && errorObj.message.includes('row-level security')) ||
        (errorObj?.details && errorObj.details.message && errorObj.details.message.includes('violates row-level security policy'))) {
      console.error('Row Level Security Error:', errorObj);
      return res.status(403).json({
        message: "Permission denied: Your account doesn't have sufficient privileges to perform this action",
        error: "Unable to create parent record due to security policy restrictions",
        help: "For development: You need to disable row-level security for the parents table in Supabase or create appropriate policies"
      });
    }
    
    // Check for database connection errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error details: ${errorMessage}`);
    console.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    
    // Handle database connection issues
    if (errorMessage.includes('ETIMEDOUT') || 
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('connection to server') ||
        errorMessage.includes('CONNECT_TIMEOUT') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('database')) {
      return res.status(503).json({ 
        message: "Registration failed", 
        error: "Database connection error. The system is temporarily unavailable.",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
    
    // For any other type of error, provide more details in development
    return res.status(500).json({ 
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      details: (error as any)?.details || undefined
    });
  }
}

// Login controller
export function login(req: Request, res: Response) {
  // The actual authentication is done by passport middleware
  // If this function is reached, authentication was successful
  const user = req.user as any;
  return res.status(200).json({
    message: "Login successful",
    parentId: user.parentId,
  });
}

// Logout controller
export function logout(req: Request, res: Response) {
  req.logout(function(err) {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    return res.status(200).json({ message: "Logged out successfully" });
  });
}

// Verify email
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  try {
    // Find the parent with this verification token via direct API
    const parent = await getParentByVerificationTokenViaApi(token);

    if (!parent) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Mark the parent as verified via direct API
    const success = await verifyParentViaApi(parent.id);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to verify email. Please try again." });
    }

    // Redirect to the verification success page
    return res.redirect(`/auth/login?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Resend verification email
export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find the parent with this email using direct API
    const parent = await getParentByEmailViaApi(email);

    if (!parent) {
      return res.status(400).json({ message: "Email not registered" });
    }

    if (parent.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate a new verification token
    const verificationToken = uuidv4();
    
    // Update the verification token via direct API
    const updated = await updateVerificationTokenViaApi(parent.id, verificationToken);
    
    if (!updated) {
      return res.status(500).json({ message: "Failed to update verification token" });
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken, parent.parentId);

    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get current user
export function getCurrentUser(req: Request, res: Response) {
  const user = req.user as any;
  
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  return res.status(200).json({
    id: user.id,
    parentId: user.parentId,
    email: user.email,
    isVerified: user.isVerified,
  });
}
