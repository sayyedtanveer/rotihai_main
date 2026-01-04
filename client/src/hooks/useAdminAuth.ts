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
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  return response;
}