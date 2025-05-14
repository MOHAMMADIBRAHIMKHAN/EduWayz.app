// Authentication configuration settings

// API key for server requests
// For this demo, we're using a placeholder value
// In production, this should come from environment variables
export const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZmpzZndpZWl2amRrdWd5a2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDk5ODcsImV4cCI6MjA2MjI4NTk4N30.hJm2-3rsS7-66LbBfFQ2PJWUoEFED2UYBARdQxACpoQ';

// Authorization token - retrieved from localStorage if available
// If not available, use a default Bearer token for development
export const Authorization = typeof window !== 'undefined' 
  ? localStorage.getItem('authToken') || 'Bearer development-token' 
  : 'Bearer development-token';

// Helper function to get auth headers
export function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (API_KEY) {
    headers['apikey'] = API_KEY;
  }
  
  if (Authorization) {
    headers['Authorization'] = Authorization;
  }
  
  return headers;
}