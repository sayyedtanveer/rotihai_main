import axios from 'axios';

// Get API URL from environment variable - NO FALLBACK
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.warn('⚠️ VITE_API_URL environment variable is not set!');
  console.log('Available env vars:', Object.keys(import.meta.env).filter(k => k.includes('VITE')));
}

console.log('🔧 API Configuration:', {
  apiUrl: apiUrl || 'NOT SET',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
});

// Create axios instance with VITE_API_URL
const api = axios.create({
  baseURL: apiUrl || undefined, // If not set, will use relative paths
  withCredentials: true,
  timeout: 60000, // Increased from 30s to 60s for slower operations
});

// Request interceptor to add authorization headers
api.interceptors.request.use((config) => {
  const path = window.location.pathname;
  let token: string | null = null;
  let tokenType = 'none';

  // Get appropriate token based on current path
  if (path.startsWith('/admin')) {
    token = localStorage.getItem('adminToken');
    tokenType = 'adminToken';
  } else if (path.startsWith('/partner')) {
    token = localStorage.getItem('partnerToken');
    tokenType = 'partnerToken';
  } else if (path.startsWith('/delivery')) {
    token = localStorage.getItem('deliveryToken');
    tokenType = 'deliveryToken';
  } else {
    token = localStorage.getItem('userToken');
    tokenType = 'userToken';
  }

  // Log request details for debugging
  if (path.startsWith('/delivery')) {
    console.log(`[API-REQUEST] 📤 ${config.method?.toUpperCase()} ${config.url}`, {
      path,
      hasToken: !!token,
      tokenType,
      tokenLength: token?.length || 0
    });
  }

  // Add authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (path.startsWith('/delivery')) {
    console.warn('[API-REQUEST] ⚠️ No token found for delivery request!', { path, url: config.url });
  }

  return config;
}, (error) => Promise.reject(error));

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("[API-CLIENT] 🔴 401 Unauthorized error detected!");
      console.error("[API-CLIENT] Request URL:", error.config?.url);
      console.error("[API-CLIENT] Error message:", error.response?.data?.message);
      
      // Handle unauthorized - redirect to appropriate login
      const path = window.location.pathname;
      const url = error.config?.url || '';
      console.log("[API-CLIENT] Current path:", path);
      console.log("[API-CLIENT] Request URL:", url);
      
      // ⚠️ IMPORTANT: Don't auto-redirect for non-critical endpoints
      // If it's just notifications, let the component handle it gracefully
      if (url.includes('/api/partner/notifications/pending') || url.includes('/api/partner/notifications/mark-delivered') || url.includes('/api/delivery/notifications/pending') || url.includes('/api/delivery/notifications/mark-delivered')) {
        console.warn("[API-CLIENT] ⚠️ 401 on notifications endpoint - NOT auto-redirecting");
        console.warn("[API-CLIENT] Letting the notifications handler deal with this");
        return Promise.reject(error); // Return error without redirecting
      }
      
      // Don't redirect if already on a login/auth page
      const isOnLoginPage = 
        path.includes('/login') || 
        path.includes('/signup') || 
        path.includes('/auth') ||
        path === '/';
      
      console.log("[API-CLIENT] Is on login page:", isOnLoginPage);
      
      if (!isOnLoginPage) {
        if (path.startsWith('/admin')) {
          console.log("[API-CLIENT] 🚪 Logging out admin - clearing adminToken");
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
        } else if (path.startsWith('/partner')) {
          console.log("[API-CLIENT] 🚪 Logging out partner - clearing partnerToken");
          localStorage.removeItem('partnerToken');
          window.location.href = '/partner/login';
        } else if (path.startsWith('/delivery')) {
          console.log("[API-CLIENT] 🚪 Logging out delivery - clearing deliveryToken");
          console.log("[API-CLIENT] Before removal:", {
            token: !!localStorage.getItem('deliveryToken'),
            personId: !!localStorage.getItem('deliveryPersonId'),
            personName: !!localStorage.getItem('deliveryPersonName')
          });
          localStorage.removeItem('deliveryToken');
          localStorage.removeItem('deliveryPersonId');
          localStorage.removeItem('deliveryPersonName');
          console.log("[API-CLIENT] After removal:", {
            token: !!localStorage.getItem('deliveryToken'),
            personId: !!localStorage.getItem('deliveryPersonId'),
            personName: !!localStorage.getItem('deliveryPersonName')
          });
          console.log("[API-CLIENT] Redirecting to /delivery/login");
          window.location.href = '/delivery/login';
        } else {
          console.log("[API-CLIENT] 🚪 Logging out user - clearing userToken");
          localStorage.removeItem('userToken');
          window.location.href = '/';
        }
      }
      
      console.error('[API-CLIENT] Session expired - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default api;

