import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import api from "@/lib/apiClient";

// Centralized 401 error handler for all user types
export function handle401Error(userType: "user" | "admin" | "partner" | "delivery" = "user") {
  console.warn(`🔒 401 Unauthorized - Logging out ${userType}`);

  switch (userType) {
    case "user":
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      window.location.href = "/";
      break;
    case "admin":
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
      break;
    case "partner":
      localStorage.removeItem("partnerToken");
      localStorage.removeItem("partnerChefName");
      window.location.href = "/partner/login";
      break;
    case "delivery":
      localStorage.removeItem("deliveryToken");
      localStorage.removeItem("deliveryPersonName");
      window.location.href = "/delivery/login";
      break;
  }
}

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  walletBalance: number;
  referralCode?: string;
  pendingBonus?: {
    amount: number;
    minOrderAmount: number;
    code?: string;
    referrerName?: string;
  };
}

interface UseAuthReturn {
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  userToken: string | null;
  login: (phone: string, password: string) => Promise<any>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      try {
        const response = await api.get('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          handle401Error("user");
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch user profile');
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!localStorage.getItem('userToken'),
  });

  const isAuthenticated = !!user && !!localStorage.getItem('userToken');

  const login = async (phone: string, password: string) => {
    try {
      const response = await api.post('/api/user/login', { phone, password });
      
      const data = response.data;
      
      // Store the access token (backend returns accessToken, not token)
      localStorage.setItem('userToken', data.accessToken);
      if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify(data.user));
    }

    // Invalidate and refetch the user profile
    await queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });

    return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid phone number or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    setLocation('/');
  };

  return { 
    user, 
    isLoading, 
    error, 
    isAuthenticated,
    userToken: localStorage.getItem('userToken'),
    login,
    logout
  };
}