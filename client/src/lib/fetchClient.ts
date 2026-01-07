/**
 * Universal fetch client that works for all API calls
 * Uses environment variables for API URL, falls back to relative paths
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Fetch wrapper that ensures proper URL construction
 * - In development: Uses relative paths (localhost proxy)
 * - In production: Uses full URLs (VITE_API_URL from .env.production)
 */
export async function fetchAPI(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construct full URL
  const url = API_BASE_URL ? `${API_BASE_URL}${normalizedEndpoint}` : normalizedEndpoint;
  
  // Merge headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization token if available
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    if (currentPath.startsWith('/admin')) {
      token = localStorage.getItem('adminToken');
    } else if (currentPath.startsWith('/partner')) {
      token = localStorage.getItem('partnerToken');
    } else if (currentPath.startsWith('/delivery')) {
      token = localStorage.getItem('deliveryToken');
    } else {
      token = localStorage.getItem('userToken');
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for same-origin requests
  });
  
  // Handle 401 - redirect to appropriate login (but don't redirect if already on a login page)
  if (response.status === 401 && typeof window !== 'undefined') {
    const isOnLoginPage = 
      currentPath.includes('/login') || 
      currentPath.includes('/signup') || 
      currentPath.includes('/auth') ||
      currentPath === '/';
    
    // Only redirect if not already on a login/auth page
    if (!isOnLoginPage) {
      if (currentPath.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/partner')) {
        localStorage.removeItem('partnerToken');
        window.location.href = '/partner/login';
      } else if (currentPath.startsWith('/delivery')) {
        localStorage.removeItem('deliveryToken');
        window.location.href = '/delivery/login';
      } else {
        localStorage.removeItem('userToken');
        window.location.href = '/';
      }
    }
  }
  
  return response;
}

/**
 * Convenience methods
 */
export async function fetchGet(endpoint: string, options?: FetchOptions) {
  return fetchAPI(endpoint, { ...options, method: 'GET' });
}

export async function fetchPost(endpoint: string, body?: any, options?: FetchOptions) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function fetchPut(endpoint: string, body?: any, options?: FetchOptions) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function fetchDelete(endpoint: string, options?: FetchOptions) {
  return fetchAPI(endpoint, { ...options, method: 'DELETE' });
}

export async function fetchPatch(endpoint: string, body?: any, options?: FetchOptions) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Get WebSocket URL with proper protocol
 */
export function getWebSocketURL(path: string = ''): string {
  const WS_BASE = import.meta.env.VITE_WS_URL || 
    (typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      : '');
  
  return `${WS_BASE}${path}`;
}
