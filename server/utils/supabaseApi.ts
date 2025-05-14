import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Supabase API URL and key
const SUPABASE_URL = 'https://hqfjsfwieivjdkugykhw.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZmpzZndpZWl2amRrdWd5a2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDk5ODcsImV4cCI6MjA2MjI4NTk4N30.hJm2-3rsS7-66LbBfFQ2PJWUoEFED2UYBARdQxACpoQ';

// Direct API call to create a parent in Supabase
export async function createParentViaApi(parentData: any) {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents`;
    
    // Configure axios request exactly as in the working Postman example
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json'
      },
      data: parentData
    };
    
    console.log('Sending direct API request to Supabase');
    const response = await axios.request(config);
    
    console.log('Parent created successfully:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error in direct Supabase API call:', error.message);
    
    // Enhanced error handling
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`Supabase API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received');
      throw new Error('No response received from Supabase API');
    } else {
      throw error;
    }
  }
}

// Check if an email already exists using direct API
export async function parentEmailExistsViaApi(email: string): Promise<boolean> {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents?email=eq.${encodeURIComponent(email)}&select=email`;
    
    const config = {
      method: 'get',
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.request(config);
    return response.data && response.data.length > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    return false; // Assume email doesn't exist if there's an error
  }
}

// Get parent by verification token
export async function getParentByVerificationTokenViaApi(token: string) {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents?verificationToken=eq.${encodeURIComponent(token)}`;
    
    const config = {
      method: 'get',
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.request(config);
    if (response.data && response.data.length > 0) {
      // Direct mapping as column names already in camelCase
      const parent = response.data[0];
      return {
        id: parent.id,
        parentId: parent.parentId,
        email: parent.email,
        isVerified: parent.isVerified,
        verificationToken: parent.verificationToken
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting parent by verification token:', error);
    return null;
  }
}

// Verify a parent by updating is_verified flag
export async function verifyParentViaApi(id: number): Promise<boolean> {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents?id=eq.${id}`;
    
    const config = {
      method: 'patch',
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: {
        isVerified: true,
        verificationToken: null
        // Using camelCase to match the actual database column names
      }
    };
    
    await axios.request(config);
    return true;
  } catch (error) {
    console.error('Error verifying parent:', error);
    return false;
  }
}

// Get parent by email
export async function getParentByEmailViaApi(email: string) {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents?email=eq.${encodeURIComponent(email)}`;
    
    const config = {
      method: 'get',
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.request(config);
    if (response.data && response.data.length > 0) {
      // Direct mapping as column names already in camelCase
      const parent = response.data[0];
      return {
        id: parent.id,
        parentId: parent.parentId,
        email: parent.email,
        isVerified: parent.isVerified,
        verificationToken: parent.verificationToken
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting parent by email:', error);
    return null;
  }
}

// Update verification token
export async function updateVerificationTokenViaApi(id: number, verificationToken: string): Promise<boolean> {
  if (!SUPABASE_API_KEY) {
    throw new Error('SUPABASE_API_KEY not provided in environment variables');
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/parents?id=eq.${id}`;
    
    const config = {
      method: 'patch',
      url: url,
      headers: { 
        'apikey': SUPABASE_API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: {
        verificationToken: verificationToken
        // Using camelCase to match the actual database column names
      }
    };
    
    await axios.request(config);
    return true;
  } catch (error) {
    console.error('Error updating verification token:', error);
    return false;
  }
}