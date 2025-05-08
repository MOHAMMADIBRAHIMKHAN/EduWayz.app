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
    
    // Initialize database connection
    const queryClient = postgres(process.env.DATABASE_URL, { max: 10 });
    this.db = drizzle(queryClient);
    
    console.log('Connected to PostgreSQL database');
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const result = await this.db.select().from(schools).where(eq(schools.id, id));
    return result[0];
  }
  
  async getSchoolBySchoolId(schoolId: string): Promise<School | undefined> {
    const result = await this.db.select().from(schools).where(eq(schools.schoolId, schoolId));
    return result[0];
  }
  
  async getAllSchools(): Promise<School[]> {
    return await this.db.select().from(schools);
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    // Generate a school ID
    const allSchools = await this.getAllSchools();
    const year = new Date().getFullYear().toString().slice(-2);
    const schoolId = `SC-${year}${(allSchools.length + 1).toString().padStart(4, '0')}`;
    
    const result = await this.db.insert(schools).values({
      ...school,
      schoolId,
    }).returning();
    
    return result[0];
  }
  
  async updateSchool(id: number, school: Partial<School>): Promise<School | undefined> {
    const result = await this.db.update(schools)
      .set({
        ...school,
        updatedAt: new Date()
      })
      .where(eq(schools.id, id))
      .returning();
    
    return result[0];
  }
  
  // Parent operations
  async getParent(id: number): Promise<Parent | undefined> {
    const result = await this.db.select().from(parents).where(eq(parents.id, id));
    return result[0];
  }
  
  async getParentByParentId(parentId: string): Promise<Parent | undefined> {
    const result = await this.db.select().from(parents).where(eq(parents.parentId, parentId));
    return result[0];
  }
  
  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const result = await this.db.select().from(parents).where(eq(parents.email, email));
    return result[0];
  }
  
  async getParentByVerificationToken(token: string): Promise<Parent | undefined> {
    const result = await this.db.select().from(parents).where(eq(parents.verificationToken, token));
    return result[0];
  }
  
  async getAllParents(): Promise<Parent[]> {
    return await this.db.select().from(parents);
  }
  
  async createParent(parent: InsertParent): Promise<Parent> {
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
  }
  
  async updateParent(id: number, parent: Partial<Parent>): Promise<Parent | undefined> {
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
  }
  
  async verifyParent(id: number): Promise<Parent | undefined> {
    const result = await this.db.update(parents)
      .set({
        isVerified: true,
        verificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(parents.id, id))
      .returning();
    
    return result[0];
  }
  
  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.id, id));
    return result[0];
  }
  
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.studentId, studentId));
    return result[0];
  }
  
  async getStudentsByParentId(parentId: number): Promise<Student[]> {
    return await this.db.select().from(students).where(eq(students.parentId, parentId));
  }
  
  async getStudentsBySchoolId(schoolId: number): Promise<Student[]> {
    return await this.db.select().from(students).where(eq(students.schoolId, schoolId));
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    // Generate a student ID
    const allStudents = await this.db.select().from(students);
    const year = new Date().getFullYear().toString().slice(-2);
    const studentId = `STU-${year}${(allStudents.length + 1).toString().padStart(4, '0')}`;
    
    const result = await this.db.insert(students).values({
      ...student,
      studentId,
    }).returning();
    
    return result[0];
  }
  
  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await this.db.select().from(notifications).where(eq(notifications.id, id));
    return result[0];
  }
  
  async getNotificationsByParentId(parentId: number): Promise<Notification[]> {
    return await this.db.select()
      .from(notifications)
      .where(eq(notifications.parentId, parentId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(notifications).values({
      ...notification,
      isRead: false,
    }).returning();
    
    return result[0];
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return result[0];
  }
  
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
      ...school,
      id,
      schoolId,
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
      ...parent,
      id,
      parentId,
      password: hashedPassword,
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
      ...student,
      id,
      studentId,
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
      ...notification,
      id,
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

// Determine which storage implementation to use
let storage: IStorage;

try {
  // Try to use PostgreSQL storage
  storage = new PostgresStorage();
  console.log('Using PostgreSQL storage');
} catch (error) {
  // Fall back to memory storage if PostgreSQL fails
  console.error('Failed to connect to PostgreSQL:', error);
  console.log('Falling back to memory storage');
  storage = new MemStorage();
}

export { storage };
