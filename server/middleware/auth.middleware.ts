import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // For this implementation, we'll consider any user with a role property
  // set to 'admin' as an admin. In a real application, you would have a more
  // robust role-based access control system.
  
  if (req.isAuthenticated() && (req.user as any).role === 'admin') {
    return next();
  }
  
  // For testing/demo purposes, if we're in development mode and there's a query param,
  // allow admin access
  if (process.env.NODE_ENV === 'development' && req.query.admin === 'true') {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Admin access required" });
}
