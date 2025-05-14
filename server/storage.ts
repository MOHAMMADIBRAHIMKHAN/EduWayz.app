// Import dotenv at the top to ensure environment variables are loaded
import * as dotenv from 'dotenv';
dotenv.config(); // This loads the .env file into process.env

import { v4 as uuidv4 } from 'uuid';
import { 
  School, 
  InsertSchool, 
  Parent, 
  InsertParent,
  Student,
  InsertStudent,
  Notification,
  InsertNotification,
  schools,
  parents,
  students,
  notifications
} from "@shared/schema";
import { generateParentId } from './utils/parentId';
import * as crypto from 'crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq, desc, asc } from 'drizzle-orm';

// Interface for storage operations
export interface IStorage {
  // School operations
  getSchool(id: number): Promise<School | undefined>;
  getSchoolBySchoolId(schoolId: string): Promise<School | undefined>;
  getAllSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<School>): Promise<School | undefined>;
  
  // Parent operations
  getParent(id: number): Promise<Parent | undefined>;
  getParentByParentId(parentId: string): Promise<Parent | undefined>;
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentByVerificationToken(token: string): Promise<Parent | undefined>;
  getAllParents(): Promise<Parent[]>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, parent: Partial<Parent>): Promise<Parent | undefined>;
  verifyParent(id: number): Promise<Parent | undefined>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getStudentsByParentId(parentId: number): Promise<Student[]>;
  getStudentsBySchoolId(schoolId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByParentId(parentId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Note: User operations are not implemented in the current schema
  
  // Utility operations
  verifyPassword(password: string, hashedPassword: string): boolean;
}

// PostgreSQL storage implementation
export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Initialize database connection with improved configuration for Supabase
    const queryClient = postgres(process.env.DATABASE_URL, { 
      max: 5,                    // Reduce max connections to prevent overloading 
      idle_timeout: 20,          // Shorter idle timeout (seconds)
      connect_timeout: 10,       // Longer connect timeout (seconds)
      max_lifetime: 60 * 30,     // Maximum connection lifetime (30 minutes)
      debug: process.env.NODE_ENV === 'development', // Log queries in development
      ssl: { rejectUnauthorized: false }, // Handle SSL connections
      onnotice: () => {},        // Suppress notice messages
      onparameter: () => {},     // Suppress parameter messages
      connection: {
        application_name: 'school-management-system' // Identify app in Supabase logs
      }
    });
    this.db = drizzle(queryClient);
    
    console.log('Connected to PostgreSQL database');
  }
  
  // Helper function for retrying database operations
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, 
          error instanceof Error ? error.message : String(error));
        
        // Don't wait on the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const jitter = Math.random() * 0.3 * delay;
          const waitTime = delay * Math.pow(2, attempt - 1) + jitter;
          console.log(`Retrying in ${Math.round(waitTime / 1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we reach here, all retries failed
    console.error('All database operation retry attempts failed');
    throw lastError;
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(schools).where(eq(schools.id, id));
      return result[0];
    });
  }
  
  async getSchoolBySchoolId(schoolId: string): Promise<School | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(schools).where(eq(schools.schoolId, schoolId));
      return result[0];
    });
  }
  
  async getAllSchools(): Promise<School[]> {
    return this.retryOperation(async () => {
      return await this.db.select().from(schools);
    });
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    return this.retryOperation(async () => {
      // Generate a school ID
      const allSchools = await this.getAllSchools();
      const year = new Date().getFullYear().toString().slice(-2);
      const schoolId = `SC-${year}${(allSchools.length + 1).toString().padStart(4, '0')}`;
      
      const result = await this.db.insert(schools).values({
        ...school,
        schoolId,
      }).returning();
      
      return result[0];
    });
  }
  
  async updateSchool(id: number, school: Partial<School>): Promise<School | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.update(schools)
        .set({
          ...school,
          updatedAt: new Date()
        })
        .where(eq(schools.id, id))
        .returning();
      
      return result[0];
    });
  }
  
  // Parent operations
  async getParent(id: number): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(parents).where(eq(parents.id, id));
      return result[0];
    });
  }
  
  async getParentByParentId(parentId: string): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(parents).where(eq(parents.parentId, parentId));
      return result[0];
    });
  }
  
  async getParentByEmail(email: string): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(parents).where(eq(parents.email, email));
      return result[0];
    });
  }
  
  async getParentByVerificationToken(token: string): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(parents).where(eq(parents.verificationToken, token));
      return result[0];
    });
  }
  
  async getAllParents(): Promise<Parent[]> {
    return this.retryOperation(async () => {
      return await this.db.select().from(parents);
    });
  }
  
  async createParent(parent: InsertParent): Promise<Parent> {
    return this.retryOperation(async () => {
      // Generate a parent ID
      const allParents = await this.getAllParents();
      const lastParentId = allParents.length > 0 
        ? allParents.sort((a, b) => b.id - a.id)[0].parentId 
        : undefined;
      
      const parentId = generateParentId(lastParentId);
      const verificationToken = uuidv4();
      
      // Hash the password
      const hashedPassword = this.hashPassword(parent.password);
      
      const result = await this.db.insert(parents).values({
        ...parent,
        parentId,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
      }).returning();
      
      return result[0];
    });
  }
  
  async updateParent(id: number, parent: Partial<Parent>): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      // Hash the password if it's being updated
      if (parent.password) {
        parent.password = this.hashPassword(parent.password);
      }
      
      const result = await this.db.update(parents)
        .set({
          ...parent,
          updatedAt: new Date()
        })
        .where(eq(parents.id, id))
        .returning();
      
      return result[0];
    });
  }
  
  async verifyParent(id: number): Promise<Parent | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.update(parents)
        .set({
          isVerified: true,
          verificationToken: null,
          updatedAt: new Date()
        })
        .where(eq(parents.id, id))
        .returning();
      
      return result[0];
    });
  }
  
  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(students).where(eq(students.id, id));
      return result[0];
    });
  }
  
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(students).where(eq(students.studentId, studentId));
      return result[0];
    });
  }
  
  async getStudentsByParentId(parentId: number): Promise<Student[]> {
    return this.retryOperation(async () => {
      return await this.db.select().from(students).where(eq(students.parentId, parentId));
    });
  }
  
  async getStudentsBySchoolId(schoolId: number): Promise<Student[]> {
    return this.retryOperation(async () => {
      return await this.db.select().from(students).where(eq(students.schoolId, schoolId));
    });
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    return this.retryOperation(async () => {
      // Generate a student ID
      const allStudents = await this.db.select().from(students);
      const year = new Date().getFullYear().toString().slice(-2);
      const studentId = `STU-${year}${(allStudents.length + 1).toString().padStart(4, '0')}`;
      
      const result = await this.db.insert(students).values({
        ...student,
        studentId,
        // Ensure required fields have values
        section: student.section || null,
        status: student.status || 'Active',
      }).returning();
      
      return result[0];
    });
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.select().from(notifications).where(eq(notifications.id, id));
      return result[0];
    });
  }
  
  async getNotificationsByParentId(parentId: number): Promise<Notification[]> {
    return this.retryOperation(async () => {
      return await this.db.select()
        .from(notifications)
        .where(eq(notifications.parentId, parentId))
        .orderBy(desc(notifications.createdAt));
    });
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.retryOperation(async () => {
      const result = await this.db.insert(notifications).values({
        ...notification,
        isRead: false,
        // Ensure required fields have values
        schoolId: notification.schoolId || null,
        parentId: notification.parentId || null,
      }).returning();
      
      return result[0];
    });
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    return this.retryOperation(async () => {
      const result = await this.db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return result[0];
    });
  }
  
  // Note: User operations would be implemented here if schema supported them
  
  // Helper methods
  private hashPassword(password: string): string {
    // In a real application, use a proper password hashing library
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  public verifyPassword(password: string, hashedPassword: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === hashedPassword;
  }
}

// Memory storage implementation (for fallback)
export class MemStorage implements IStorage {
  private schoolsData: Map<number, School>;
  private parentsData: Map<number, Parent>;
  private studentsData: Map<number, Student>;
  private notificationsData: Map<number, Notification>;
  
  private schoolIdCounter: number;
  private parentIdCounter: number;
  private studentIdCounter: number;
  private notificationIdCounter: number;
  
  constructor() {
    this.schoolsData = new Map();
    this.parentsData = new Map();
    this.studentsData = new Map();
    this.notificationsData = new Map();
    
    this.schoolIdCounter = 1;
    this.parentIdCounter = 1;
    this.studentIdCounter = 1;
    this.notificationIdCounter = 1;
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return this.schoolsData.get(id);
  }
  
  async getSchoolBySchoolId(schoolId: string): Promise<School | undefined> {
    return Array.from(this.schoolsData.values()).find(
      (school) => school.schoolId === schoolId
    );
  }
  
  async getAllSchools(): Promise<School[]> {
    return Array.from(this.schoolsData.values());
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    const id = this.schoolIdCounter++;
    const now = new Date();
    const year = new Date().getFullYear().toString().slice(-2);
    const schoolId = `SC-${year}${id.toString().padStart(4, '0')}`;
    
    const newSchool: School = {
      id,
      schoolId,
      schoolName: school.schoolName,
      establishmentYear: school.establishmentYear,
      email: school.email,
      phone: school.phone,
      website: school.website || null,
      addressLine1: school.addressLine1,
      addressLine2: school.addressLine2 || null,
      city: school.city,
      province: school.province,
      postalCode: school.postalCode,
      country: school.country || "Saudi Arabia",
      // Use appropriate fields from the schema
      adminName: school.adminName,
      adminPosition: school.adminPosition,
      adminEmail: school.adminEmail,
      adminPhone: school.adminPhone,
      schoolType: school.schoolType,
      educationLevel: school.educationLevel,
      language: school.language,
      capacity: school.capacity,
      createdAt: now,
      updatedAt: now
    };
    
    this.schoolsData.set(id, newSchool);
    return newSchool;
  }
  
  async updateSchool(id: number, school: Partial<School>): Promise<School | undefined> {
    const existingSchool = this.schoolsData.get(id);
    
    if (!existingSchool) {
      return undefined;
    }
    
    const updatedSchool: School = {
      ...existingSchool,
      ...school,
      updatedAt: new Date()
    };
    
    this.schoolsData.set(id, updatedSchool);
    return updatedSchool;
  }
  
  // Parent operations
  async getParent(id: number): Promise<Parent | undefined> {
    return this.parentsData.get(id);
  }
  
  async getParentByParentId(parentId: string): Promise<Parent | undefined> {
    return Array.from(this.parentsData.values()).find(
      (parent) => parent.parentId === parentId
    );
  }
  
  async getParentByEmail(email: string): Promise<Parent | undefined> {
    return Array.from(this.parentsData.values()).find(
      (parent) => parent.email === email
    );
  }
  
  async getParentByVerificationToken(token: string): Promise<Parent | undefined> {
    return Array.from(this.parentsData.values()).find(
      (parent) => parent.verificationToken === token
    );
  }
  
  async getAllParents(): Promise<Parent[]> {
    return Array.from(this.parentsData.values());
  }
  
  async createParent(parent: InsertParent): Promise<Parent> {
    const id = this.parentIdCounter++;
    const now = new Date();
    
    // Get the last parent ID or create a new one
    const lastParent = Array.from(this.parentsData.values())
      .sort((a, b) => b.id - a.id)[0];
    
    const parentId = generateParentId(lastParent?.parentId);
    const verificationToken = uuidv4();
    
    // Hash the password
    const hashedPassword = this.hashPassword(parent.password);
    
    const newParent: Parent = {
      id,
      email: parent.email,
      parentId,
      password: hashedPassword,
      fatherName: parent.fatherName,
      fatherOccupation: parent.fatherOccupation,
      fatherContact: parent.fatherContact,
      motherName: parent.motherName,
      motherOccupation: parent.motherOccupation,
      motherContact: parent.motherContact,
      currentAddressLine1: parent.currentAddressLine1,
      currentAddressLine2: parent.currentAddressLine2 || null,
      currentCity: parent.currentCity,
      currentProvince: parent.currentProvince,
      currentPostalCode: parent.currentPostalCode,
      currentCountry: parent.currentCountry || "Saudi Arabia",
      permanentAddressLine1: parent.permanentAddressLine1 || parent.currentAddressLine1,
      permanentAddressLine2: parent.permanentAddressLine2 || null,
      permanentCity: parent.permanentCity || parent.currentCity,
      permanentProvince: parent.permanentProvince || parent.currentProvince,
      permanentPostalCode: parent.permanentPostalCode || parent.currentPostalCode,
      permanentCountry: parent.permanentCountry || parent.currentCountry || "Saudi Arabia",
      emergencyName: parent.emergencyName,
      emergencyRelation: parent.emergencyRelation,
      emergencyContact: parent.emergencyContact,
      isVerified: false,
      verificationToken,
      createdAt: now,
      updatedAt: now
    };
    
    this.parentsData.set(id, newParent);
    return newParent;
  }
  
  async updateParent(id: number, parent: Partial<Parent>): Promise<Parent | undefined> {
    const existingParent = this.parentsData.get(id);
    
    if (!existingParent) {
      return undefined;
    }
    
    // Hash the password if it's being updated
    if (parent.password) {
      parent.password = this.hashPassword(parent.password);
    }
    
    const updatedParent: Parent = {
      ...existingParent,
      ...parent,
      updatedAt: new Date()
    };
    
    this.parentsData.set(id, updatedParent);
    return updatedParent;
  }
  
  async verifyParent(id: number): Promise<Parent | undefined> {
    const existingParent = this.parentsData.get(id);
    
    if (!existingParent) {
      return undefined;
    }
    
    const updatedParent: Parent = {
      ...existingParent,
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date()
    };
    
    this.parentsData.set(id, updatedParent);
    return updatedParent;
  }
  
  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsData.get(id);
  }
  
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.studentsData.values()).find(
      (student) => student.studentId === studentId
    );
  }
  
  async getStudentsByParentId(parentId: number): Promise<Student[]> {
    return Array.from(this.studentsData.values()).filter(
      (student) => student.parentId === parentId
    );
  }
  
  async getStudentsBySchoolId(schoolId: number): Promise<Student[]> {
    return Array.from(this.studentsData.values()).filter(
      (student) => student.schoolId === schoolId
    );
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const now = new Date();
    const year = new Date().getFullYear().toString().slice(-2);
    const studentId = `STU-${year}${id.toString().padStart(4, '0')}`;
    
    const newStudent: Student = {
      id,
      studentId,
      schoolId: student.schoolId,
      parentId: student.parentId,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      grade: student.grade,
      section: student.section || null,
      enrollmentDate: student.enrollmentDate,
      status: student.status || 'Active',
      createdAt: now,
      updatedAt: now
    };
    
    this.studentsData.set(id, newStudent);
    return newStudent;
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsData.get(id);
  }
  
  async getNotificationsByParentId(parentId: number): Promise<Notification[]> {
    return Array.from(this.notificationsData.values())
      .filter((notification) => notification.parentId === parentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const newNotification: Notification = {
      id,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      schoolId: notification.schoolId || null,
      parentId: notification.parentId || null,
      isRead: false,
      createdAt: now
    };
    
    this.notificationsData.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const existingNotification = this.notificationsData.get(id);
    
    if (!existingNotification) {
      return undefined;
    }
    
    const updatedNotification: Notification = {
      ...existingNotification,
      isRead: true
    };
    
    this.notificationsData.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Note: User operations would be implemented here if schema supported them
  
  private hashPassword(password: string): string {
    // In a real application, use a proper password hashing library
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  public verifyPassword(password: string, hashedPassword: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === hashedPassword;
  }
}

// Initialize the storage implementation 
// Use PostgreSQL if a connection string is provided, otherwise fallback to in-memory storage
let storage: IStorage;

try {
  if (process.env.DATABASE_URL) {
    storage = new PostgresStorage();
    console.log('Using PostgreSQL storage');
  } else {
    storage = new MemStorage();
    console.log('Using in-memory storage (no DATABASE_URL provided)');
  }
} catch (error) {
  console.error('Error initializing PostgreSQL storage, falling back to in-memory:', error);
  storage = new MemStorage();
  console.log('Using in-memory storage (fallback)');
}

export { storage };