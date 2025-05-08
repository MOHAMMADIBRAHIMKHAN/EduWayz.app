import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import { insertParentSchema } from "@shared/schema";
import { sendVerificationEmail } from "../utils/email";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Register a new parent
export async function register(req: Request, res: Response) {
  try {
    // Validate request body using zod schema
    const validationSchema = insertParentSchema.extend({
      confirmPassword: z.string(),
      sameAsCurrent: z.boolean().optional().default(false),
      captchaCheck: z.boolean().optional(),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to the terms",
      }),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

    // Validate the request body
    const validatedData = validationSchema.parse(req.body);

    // Check if email already exists
    const existingParent = await storage.getParentByEmail(validatedData.email);
    if (existingParent) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // If same as current address is checked, copy current address to permanent
    if (validatedData.sameAsCurrent) {
      validatedData.permanentAddressLine1 = validatedData.currentAddressLine1;
      validatedData.permanentAddressLine2 = validatedData.currentAddressLine2;
      validatedData.permanentCity = validatedData.currentCity;
      validatedData.permanentProvince = validatedData.currentProvince;
      validatedData.permanentPostalCode = validatedData.currentPostalCode;
      validatedData.permanentCountry = validatedData.currentCountry;
    }

    // Remove non-schema fields before creating parent
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

    // Create the parent in the database
    const parent = await storage.createParent(parentData);

    // Send verification email
    await sendVerificationEmail(
      parent.email,
      parent.verificationToken as string,
      parent.parentId
    );

    // Return success with parent ID
    return res.status(201).json({
      message: "Parent registered successfully",
      parentId: parent.parentId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationError.details 
      });
    }
    
    return res.status(500).json({ message: "Internal server error" });
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
    // Find the parent with this verification token
    const parent = await storage.getParentByVerificationToken(token);

    if (!parent) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Mark the parent as verified
    await storage.verifyParent(parent.id);

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
    // Find the parent with this email
    const parent = await storage.getParentByEmail(email);

    if (!parent) {
      return res.status(400).json({ message: "Email not registered" });
    }

    if (parent.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate a new verification token
    const verificationToken = uuidv4();
    await storage.updateParent(parent.id, { verificationToken });

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
