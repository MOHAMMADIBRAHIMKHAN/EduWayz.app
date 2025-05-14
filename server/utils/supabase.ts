import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Define Supabase API URL and key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hqfjsfwieivjdkugykhw.supabase.co';
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

// Make sure API key is available
if (!SUPABASE_API_KEY) {
  console.error('SUPABASE_API_KEY environment variable is not set');
  // Don't throw an error here to allow the application to start,
  // but operations using the API key will fail
}

// Function to convert snake_case to camelCase
function snakeToCamel(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Recursively convert nested objects
      const camelValue = typeof value === 'object' && value !== null
        ? snakeToCamel(value)
        : value;
        
      return [camelKey, camelValue];
    })
  );
}

// Function to convert camelCase to snake_case
function camelToSnake(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      // Recursively convert nested objects
      const snakeValue = typeof value === 'object' && value !== null
        ? camelToSnake(value)
        : value;
        
      return [snakeKey, snakeValue];
    })
  );
}

// Create Supabase client for direct REST API access
export const supabaseClient = {
  // Generic get method with consistent error handling and retries
  async get(path: string, options: any = {}) {
    return this.request('GET', path, null, options);
  },

  // Generic post method with consistent error handling and retries
  async post(path: string, data: any = {}, options: any = {}) {
    return this.request('POST', path, data, options);
  },

  // Generic put method
  async put(path: string, data: any = {}, options: any = {}) {
    return this.request('PUT', path, data, options);
  },

  // Generic patch method
  async patch(path: string, data: any = {}, options: any = {}) {
    return this.request('PATCH', path, data, options);
  },

  // Generic delete method
  async delete(path: string, options: any = {}) {
    return this.request('DELETE', path, null, options);
  },

  // Core request method with retry logic
  async request(method: string, path: string, data: any = null, options: any = {}) {
    const url = `${SUPABASE_URL}${path}`;
    const maxRetries = options.maxRetries || 3;
    const initialDelay = options.initialDelay || 1000;
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_API_KEY,
      'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      'Prefer': 'return=representation',
      ...options.headers,
    };

    // Convert camelCase data to snake_case for Supabase
    const snakeCaseData = data ? camelToSnake(data) : null;
    
    // Set up a timeout for the request
    const timeout = options.timeout || 15000; // 15 seconds default
    
    // Set up retry logic
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Log attempt information in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Supabase API request attempt ${attempt + 1}/${maxRetries}: ${method} ${url}`);
        }
        
        const response = await axios({
          method,
          url,
          data: snakeCaseData,
          headers,
          timeout,
        });
        
        // Convert snake_case response to camelCase
        const camelCaseData = snakeToCamel(response.data);
        
        return {
          data: camelCaseData,
          status: response.status,
          headers: response.headers,
        };
      } catch (error: any) {
        console.error(`Supabase API error (attempt ${attempt + 1}/${maxRetries}):`, error.message);
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = initialDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Shouldn't get here, but just in case
    throw lastError;
  }
};

// Helper functions for specific Supabase tables
export const supabaseParents = {
  // Get all parents
  async getAll() {
    const response = await supabaseClient.get('/rest/v1/parents?select=*');
    return response.data;
  },
  
  // Get parent by ID
  async getById(id: number) {
    const response = await supabaseClient.get(`/rest/v1/parents?id=eq.${id}&select=*`);
    return response.data[0];
  },
  
  // Get parent by parent_id
  async getByParentId(parentId: string) {
    const response = await supabaseClient.get(`/rest/v1/parents?parent_id=eq.${parentId}&select=*`);
    return response.data[0];
  },
  
  // Get parent by email
  async getByEmail(email: string) {
    const response = await supabaseClient.get(`/rest/v1/parents?email=eq.${email}&select=*`);
    return response.data[0];
  },
  
  // Get parent by verification token
  async getByVerificationToken(token: string) {
    const response = await supabaseClient.get(`/rest/v1/parents?verification_token=eq.${token}&select=*`);
    return response.data[0];
  },
  
  // Create a new parent
  async create(parentData: any) {
    const response = await supabaseClient.post('/rest/v1/parents', parentData);
    return response.data[0];
  },
  
  // Update a parent
  async update(id: number, parentData: any) {
    const response = await supabaseClient.patch(`/rest/v1/parents?id=eq.${id}`, parentData);
    return response.data[0];
  },
  
  // Delete a parent
  async delete(id: number) {
    await supabaseClient.delete(`/rest/v1/parents?id=eq.${id}`);
  }
};

// Export other table helpers as needed
// export const supabaseSchools = {...};
// export const supabaseStudents = {...};