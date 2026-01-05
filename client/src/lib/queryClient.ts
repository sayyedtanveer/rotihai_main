import { QueryClient, QueryFunction } from "@tanstack/react-query";
import api from "./apiClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 Unauthorized errors - redirect to appropriate login
    if (res.status === 401) {
      const path = window.location.pathname;
      
      // Clear tokens and redirect based on current path
      if (path.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        throw new Error('Session expired. Redirecting to login...');
      } else if (path.startsWith('/partner')) {
        localStorage.removeItem('partnerToken');
        window.location.href = '/partner/login';
        throw new Error('Session expired. Redirecting to login...');
      } else if (path.startsWith('/delivery')) {
        localStorage.removeItem('deliveryToken');
        window.location.href = '/delivery/login';
        throw new Error('Session expired. Redirecting to login...');
      } else {
        // Regular user
        localStorage.removeItem('userToken');
        window.location.href = '/login';
        throw new Error('Session expired. Redirecting to login...');
      }
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const path = window.location.pathname;
  
  // Get appropriate token based on current path
  let token: string | null = null;
  if (path.startsWith('/admin')) {
    token = localStorage.getItem("adminToken");
  } else if (path.startsWith('/partner')) {
    token = localStorage.getItem("partnerToken");
  } else if (path.startsWith('/delivery')) {
    token = localStorage.getItem("deliveryToken");
  } else {
    token = localStorage.getItem("userToken");
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    let response;
    const methodUpper = (method as string).toUpperCase();
    const config = { headers: getAuthHeaders() };

    if (methodUpper === "GET") {
      response = await api.get(url, config);
    } else if (methodUpper === "POST") {
      response = await api.post(url, data, config);
    } else if (methodUpper === "PUT") {
      response = await api.put(url, data, config);
    } else if (methodUpper === "DELETE") {
      response = await api.delete(url, config);
    } else if (methodUpper === "PATCH") {
      response = await api.patch(url, data, config);
    } else {
      response = await api.request({
        method: methodUpper,
        url,
        data,
        headers: getAuthHeaders(),
      });
    }
    
    // Convert axios response to Response-like object for compatibility
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response;
  } catch (error: any) {
    const response = error.response;
    if (!response) throw error;
    
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const response = await api.get(queryKey.join("/") as string, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Development: no cache (staleTime: 0) for fresh data
      // Production: cache for 5 minutes for performance
      staleTime: import.meta.env.DEV ? 0 : 1000 * 60 * 5,
      gcTime: import.meta.env.DEV ? 0 : 1000 * 60 * 10, // Keep in memory 10 min in prod
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
