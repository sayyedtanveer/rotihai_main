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

  // Get appropriate token based on current path
  if (path.startsWith('/admin')) {
    token = localStorage.getItem('adminToken');
  } else if (path.startsWith('/partner')) {
    token = localStorage.getItem('partnerToken');
  } else if (path.startsWith('/delivery')) {
    token = localStorage.getItem('deliveryToken');
  } else {
    token = localStorage.getItem('userToken');
  }

  // Add authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to appropriate login
      const path = window.location.pathname;
      
      // Don't redirect if already on a login/auth page
      const isOnLoginPage = 
        path.includes('/login') || 
        path.includes('/signup') || 
        path.includes('/auth') ||
        path === '/';
      
      if (!isOnLoginPage) {
        if (path.startsWith('/admin')) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
        } else if (path.startsWith('/partner')) {
          localStorage.removeItem('partnerToken');
          window.location.href = '/partner/login';
        } else if (path.startsWith('/delivery')) {
          localStorage.removeItem('deliveryToken');
          window.location.href = '/delivery/login';
        } else {
          localStorage.removeItem('userToken');
          window.location.href = '/';
        }
      }
      
      console.error('Session expired - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default api;

