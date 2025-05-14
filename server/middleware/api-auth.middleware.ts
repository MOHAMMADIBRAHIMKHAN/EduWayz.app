import { Request, Response, NextFunction } from "express";

// This is a simple API key for demonstration.
// In a production environment, this should be stored securely.
const VALID_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZmpzZndpZWl2amRrdWd5a2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDk5ODcsImV4cCI6MjA2MjI4NTk4N30.hJm2-3rsS7-66LbBfFQ2PJWUoEFED2UYBARdQxACpoQ';

/**
 * Middleware to validate API key in headers
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  // Log the full headers for debugging
  console.log(`Request headers for ${req.method} ${req.path}:`, JSON.stringify(req.headers, null, 2));
  
  // Always allow registration and login regardless of headers
  if (['/api/auth/register', '/api/auth/login', '/api/auth/verify-email'].includes(req.path)) {
    console.log(`Bypassing API key validation for ${req.path}`);
    return next();
  }
  
  const apiKey = req.headers['apikey'] as string;
  
  if (!apiKey || apiKey !== VALID_API_KEY) {
    console.warn('Invalid or missing API key');
    
    // For non-public routes, return an error
    return res.status(403).json({ 
      message: 'Invalid or missing API key', 
      help: 'Make sure to include apikey header with value: demo-api-key'
    });
  }
  
  next();
}

/**
 * Middleware to validate authorization header
 */
export function validateAuth(req: Request, res: Response, next: NextFunction) {
  // Always allow public routes
  if (['/api/auth/register', '/api/auth/login', '/api/auth/verify-email'].includes(req.path)) {
    console.log(`Bypassing auth validation for ${req.path}`);
    return next();
  }
  
  const authHeader = req.headers['authorization'] as string;
  
  // For development, accept any authorization header if present
  if (authHeader) {
    console.log(`Authorization header present: ${authHeader.substring(0, 15)}...`);
    return next();
  }
  
  // Check session authentication as backup
  if (req.isAuthenticated()) {
    console.log('User authenticated via session');
    return next();
  }
  
  console.warn('Missing authorization header and not authenticated via session');
  return res.status(401).json({ 
    message: 'Unauthorized: Missing authentication', 
    help: 'Include Authorization header with Bearer token or login via session'
  });
}