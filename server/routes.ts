import type { Express, Router } from "express";
import express from "express";
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
import { validateApiKey, validateAuth } from "./middleware/api-auth.middleware";

// Create separate routers for public and protected routes
const createAuthRoutes = (): Router => {
  const router = express.Router();
  
  // Public auth routes (no API key or auth required)
  router.post("/register", authController.register);
  router.post("/login", passport.authenticate("local"), authController.login);
  router.get("/verify-email", authController.verifyEmail);
  router.post("/resend-verification", authController.resendVerification);
  
  // Protected auth routes (require authentication)
  router.post("/logout", isAuthenticated, authController.logout);
  router.get("/user", isAuthenticated, authController.getCurrentUser);
  
  return router;
};

// Create parent routes (all protected)
const createParentRoutes = (): Router => {
  const router = express.Router();
  
  // All parent routes require authentication
  router.use(isAuthenticated);
  
  router.get("/profile", parentController.getProfile);
  router.get("/children", parentController.getChildren);
  router.get("/notifications", parentController.getNotifications);
  router.put("/notifications/:id/read", parentController.markNotificationAsRead);
  
  return router;
};

// Create admin routes (all protected and require admin role)
const createAdminRoutes = (): Router => {
  const router = express.Router();
  
  // All admin routes require admin role
  router.use(isAdmin);
  
  router.post("/schools", adminController.createSchool);
  router.get("/schools", adminController.getAllSchools);
  router.get("/schools/:id", adminController.getSchoolById);
  router.put("/schools/:id", adminController.updateSchool);
  
  return router;
};

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
          const isValid = storage.verifyPassword(
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

  // Register public auth routes - NO API KEY OR AUTH REQUIRED 
  // These routes need to be registered BEFORE the protected routes
  app.use("/api/auth", createAuthRoutes());
  
  // Register protected API routes - REQUIRE API KEY AND AUTH
  // Apply middleware to all '/api' routes EXCEPT '/api/auth'
  const apiRouter = express.Router();
  apiRouter.use(validateApiKey);
  apiRouter.use(validateAuth);
  
  // Register sub-routers for different protected areas
  apiRouter.use("/parent", createParentRoutes());
  apiRouter.use("/admin", createAdminRoutes());
  
  // Mount the protected API router
  app.use("/api", apiRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
