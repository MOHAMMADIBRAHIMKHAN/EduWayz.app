import { Request, Response } from "express";
import { storage } from "../storage";
import { insertSchoolSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Create school
export async function createSchool(req: Request, res: Response) {
  try {
    // Validate request body using zod schema
    const validatedData = insertSchoolSchema.parse(req.body);
    
    // Create the school in the database
    const school = await storage.createSchool(validatedData);
    
    // Return success with school ID
    return res.status(201).json({
      message: "School registered successfully",
      schoolId: school.schoolId,
    });
  } catch (error) {
    console.error("Create school error:", error);
    
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

// Get all schools
export async function getAllSchools(req: Request, res: Response) {
  try {
    const schools = await storage.getAllSchools();
    
    // Transform schools for frontend
    const formattedSchools = schools.map(school => ({
      id: school.id,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      email: school.email,
      phone: school.phone,
      schoolType: school.schoolType,
      capacity: school.capacity,
      city: school.city,
      province: school.province,
    }));
    
    return res.status(200).json(formattedSchools);
  } catch (error) {
    console.error("Get all schools error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get school by ID
export async function getSchoolById(req: Request, res: Response) {
  try {
    const schoolId = parseInt(req.params.id);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ message: "Invalid school ID" });
    }
    
    const school = await storage.getSchool(schoolId);
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    return res.status(200).json(school);
  } catch (error) {
    console.error("Get school error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Update school
export async function updateSchool(req: Request, res: Response) {
  try {
    const schoolId = parseInt(req.params.id);
    
    if (isNaN(schoolId)) {
      return res.status(400).json({ message: "Invalid school ID" });
    }
    
    // Validate request body
    const validationSchema = insertSchoolSchema.partial();
    const validatedData = validationSchema.parse(req.body);
    
    // Check if school exists
    const existingSchool = await storage.getSchool(schoolId);
    
    if (!existingSchool) {
      return res.status(404).json({ message: "School not found" });
    }
    
    // Update the school
    const updatedSchool = await storage.updateSchool(schoolId, validatedData);
    
    return res.status(200).json({
      message: "School updated successfully",
      school: {
        id: updatedSchool?.id,
        schoolId: updatedSchool?.schoolId,
        schoolName: updatedSchool?.schoolName,
      }
    });
  } catch (error) {
    console.error("Update school error:", error);
    
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