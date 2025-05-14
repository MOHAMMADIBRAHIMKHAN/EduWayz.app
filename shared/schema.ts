import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  schoolId: text("school_id").notNull().unique(),
  schoolName: text("school_name").notNull(),
  establishmentYear: integer("establishment_year").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  website: text("website") || null,
  
  // Address information
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("Saudi Arabia"),
  
  // Administrator information
  adminName: text("admin_name").notNull(),
  adminPosition: text("admin_position").notNull(),
  adminEmail: text("admin_email").notNull(),
  adminPhone: text("admin_phone").notNull(),
  
  // School configuration
  schoolType: text("school_type").notNull(),
  educationLevel: text("education_level").notNull(),
  language: text("language").notNull(),
  capacity: integer("capacity").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  schoolId: true,
  createdAt: true,
  updatedAt: true,
});

// Parents table
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  
  // Father's information
  fatherName: text("father_name").notNull(),
  fatherOccupation: text("father_occupation").notNull(),
  fatherContact: text("father_contact").notNull(),
  
  // Mother's information
  motherName: text("mother_name").notNull(),
  motherOccupation: text("mother_occupation").notNull(),
  motherContact: text("mother_contact").notNull(),
  
  // Current address
  currentAddressLine1: text("current_address_line1").notNull(),
  currentAddressLine2: text("current_address_line2"),
  currentCity: text("current_city").notNull(),
  currentProvince: text("current_province").notNull(),
  currentPostalCode: text("current_postal_code").notNull(),
  currentCountry: text("current_country").notNull().default("Saudi Arabia"),
  
  // Permanent address
  permanentAddressLine1: text("permanent_address_line1").notNull(),
  permanentAddressLine2: text("permanent_address_line2"),
  permanentCity: text("permanent_city").notNull(),
  permanentProvince: text("permanent_province").notNull(),
  permanentPostalCode: text("permanent_postal_code").notNull(),
  permanentCountry: text("permanent_country").notNull().default("Saudi Arabia"),
  
  // Emergency contact
  emergencyName: text("emergency_name").notNull(),
  emergencyRelation: text("emergency_relation").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  parentId: true,
  isVerified: true,
  verificationToken: true,
  createdAt: true,
  updatedAt: true,
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  parentId: integer("parent_id").notNull().references(() => parents.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  grade: text("grade").notNull(),
  section: text("section"),
  enrollmentDate: timestamp("enrollment_date").notNull(),
  status: text("status").notNull().default("active"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  studentId: true,
  createdAt: true,
  updatedAt: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => parents.id),
  schoolId: integer("school_id").references(() => schools.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),  // 'message', 'event', 'payment', etc.
  isRead: boolean("is_read").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sid: text("sid").notNull().unique(),
  data: json("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Types
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

export type InsertParent = z.infer<typeof insertParentSchema>;
export type Parent = typeof parents.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
