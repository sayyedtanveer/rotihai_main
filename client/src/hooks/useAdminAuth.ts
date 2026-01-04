import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import api from "@/lib/apiClient";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("adminToken");
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();

    // Auto-refresh admin token every 10 minutes (before 15min expiry)
    const refreshToken = async () => {
      try {
        const response = await api.post("/api/admin/auth/refresh");
        if (response.status === 200) {
          localStorage.setItem("adminToken", response.data.accessToken);
        }
      } catch (error) {
        console.error("Admin token refresh failed:", error);
      }
    };

    const tokenRefreshInterval = setInterval(refreshToken, 10 * 60 * 1000);

    return () => clearInterval(tokenRefreshInterval);
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setLocation("/admin/login");
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}

export async function adminApiRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("adminToken");
  
  const headers: any = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const method = (options.method as string || "GET").toUpperCase();
    let response;
    
    if (method === "GET") {
      response = await api.get(url, { headers });
    } else if (method === "POST") {
      const data = options.body ? JSON.parse(options.body as string) : undefined;
      response = await api.post(url, data, { headers });
    } else if (method === "PUT") {
      const data = options.body ? JSON.parse(options.body as string) : undefined;
      response = await api.put(url, data, { headers });
    } else if (method === "DELETE") {
      response = await api.delete(url, { headers });
    } else {
      const data = options.body ? JSON.parse(options.body as string) : undefined;
      response = await api.request({
        url,
        method,
        headers,
        data,
      });
    }
    
    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
    } as Response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
      throw new Error("Unauthorized");
    }
    throw error;
  }
}