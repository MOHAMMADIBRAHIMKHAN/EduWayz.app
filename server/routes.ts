import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as authController from "./controllers/auth.controller";
import * as parentController from "./controllers/parent.controller";
import * as adminController from "./controllers/admin.controller";
import { isAuthenticated, isAdmin } from "./middleware/auth.middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "school-management-system-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Set up passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "identifier",
        passwordField: "password",
      },
      async (identifier, password, done) => {
        try {
          // Check if identifier is email, parentId, or phone
          let parent;
          
          // Check if identifier looks like an email
          if (identifier.includes("@")) {
            parent = await storage.getParentByEmail(identifier);
          } 
          // Check if identifier looks like a parentId (PO-YYNNNNN)
          else if (identifier.startsWith("PO-")) {
            parent = await storage.getParentByParentId(identifier);
          } 
          // Otherwise assume it's a phone number
          else {
            // Find parent by either father or mother contact
            const allParents = await storage.getAllParents();
            parent = allParents.find(
              (p) => p.fatherContact === identifier || p.motherContact === identifier
            );
          }

          // If no parent found or password doesn't match
          if (!parent) {
            return done(null, false, { message: "Invalid credentials" });
          }

          // Verify password
          const isValid = (storage as MemStorage).verifyPassword(
            password,
            parent.password
          );

          if (!isValid) {
            return done(null, false, { message: "Invalid credentials" });
          }

          // Check if email is verified
          if (!parent.isVerified) {
            return done(null, false, { message: "Email not verified" });
          }

          return done(null, parent);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as any).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const parent = await storage.getParent(id);
      done(null, parent);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", passport.authenticate("local"), authController.login);
  app.post("/api/auth/logout", authController.logout);
  app.get("/api/auth/verify-email", authController.verifyEmail);
  app.post("/api/auth/resend-verification", authController.resendVerification);
  app.get("/api/auth/user", isAuthenticated, authController.getCurrentUser);

  // Parent routes
  app.get("/api/parent/profile", isAuthenticated, parentController.getProfile);
  app.get("/api/parent/children", isAuthenticated, parentController.getChildren);
  app.get("/api/parent/notifications", isAuthenticated, parentController.getNotifications);
  app.put("/api/parent/notifications/:id/read", isAuthenticated, parentController.markNotificationAsRead);

  // Admin routes - for super admin
  app.post("/api/admin/schools", isAdmin, adminController.createSchool);
  app.get("/api/admin/schools", isAdmin, adminController.getAllSchools);
  app.get("/api/admin/schools/:id", isAdmin, adminController.getSchoolById);
  app.put("/api/admin/schools/:id", isAdmin, adminController.updateSchool);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
