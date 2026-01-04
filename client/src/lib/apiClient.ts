import axios from 'axios';

// Get API URL from environment variable - NO FALLBACK
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.warn('⚠️ VITE_API_URL environment variable is not set!');
}

// Create axios instance with VITE_API_URL
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 30000,
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default api;

