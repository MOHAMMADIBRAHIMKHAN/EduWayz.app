import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios from 'axios';
import { API_KEY, Authorization } from "./auth-config";

// Helper function to throw errors for non-2xx responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Convert Axios response to Fetch Response for compatibility with existing code
function createResponseFromAxios(axiosResponse: any): Response {
  return new Response(JSON.stringify(axiosResponse.data), {
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: new Headers(axiosResponse.headers as any)
  });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Make sure we're using the correct server URL
  // Get the current host but ensure port is 5000 since that's where the server runs
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const baseUrl = `${protocol}//${hostname}:5000`;
  console.log('Using API base URL:', baseUrl);
  
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
  
  console.log(`Making ${method} request to ${fullUrl}`, data);
  
  // Configure axios headers and request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Only add auth headers for non-auth endpoints or auth endpoints that require authentication
  // Public auth endpoints like register, login shouldn't have authentication headers
  if (!url.startsWith('/api/auth') || 
      url === '/api/auth/logout' || 
      url === '/api/auth/user') {
    headers['apikey'] = API_KEY;
    headers['Authorization'] = Authorization;
  }
  
  const config = {
    method: method.toLowerCase(),
    url: fullUrl,
    maxBodyLength: Infinity,
    headers,
    data: method !== 'GET' ? data : undefined,
    params: method === 'GET' && data ? data : undefined,
    withCredentials: true
  };
  
  console.log('Request config:', {
    method: config.method,
    url: config.url,
    headers: config.headers
  });
  
  try {
    const axiosResponse = await axios.request(config);
    console.log(`Response status: ${axiosResponse.status}`);
    
    // Convert axios response to fetch Response format for compatibility
    return createResponseFromAxios(axiosResponse);
  } catch (error) {
    console.error('API request error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error response:', error.response.data);
      
      // Convert error response to fetch Response format
      return createResponseFromAxios(error.response);
    }
    
    // For network errors or other issues
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use our apiRequest function for consistent behavior
    const url = queryKey[0] as string;
    const res = await apiRequest('GET', url);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Check if the response is ok (status in the range 200-299)
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Request failed with status ${res.status}: ${errorText}`);
      throw new Error(`${res.status}: ${errorText}`);
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
