import { useMutation } from "@tanstack/react-query";
import api from "@/lib/apiClient";

interface ValidateReferralParams {
  referralCode: string;
  orderAmount?: number; // ✅ NEW: Pass order total for minimum validation
}

interface ValidateReferralResponse {
  valid: boolean;
  message: string;
  bonus?: number;
  minOrderAmount?: number; // ✅ NEW: Server returns minimum required
  bonusNote?: string; // ✅ When bonus is credited
  currentOrder?: number; // ✅ NEW: Echo back what we sent
  referrerName?: string;
}

export function useValidateReferralCode() {
  return useMutation({
    mutationFn: async ({ referralCode, orderAmount }: ValidateReferralParams): Promise<ValidateReferralResponse> => {
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`[REFERRAL-VALIDATE] 🚀 REQUEST STARTED at ${timestamp}`, { 
          referralCode: referralCode.substring(0, 3) + '...', 
          orderAmount,
          apiUrl: api.defaults.baseURL || 'relative'
        });
        
        // Log full request before sending
        console.log('[REFERRAL-VALIDATE] 📤 Sending POST to:', {
          url: '/api/referral/validate',
          baseURL: api.defaults.baseURL,
          fullUrl: `${api.defaults.baseURL || 'relative'}/api/referral/validate`,
          body: { referralCode, orderAmount },
          timeout: api.defaults.timeout
        });
        
        const response = await api.post("/api/referral/validate", {
          referralCode,
          orderAmount // ✅ NEW: Send current order amount for validation
        });
        
        const duration = Date.now() - startTime;
        console.log(`[REFERRAL-VALIDATE] ✅ SUCCESS (${duration}ms)`, response.data);
        return response.data;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[REFERRAL-VALIDATE] ❌ FAILED (${duration}ms)`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          request: error.request ? 'Request was sent' : 'Request was NOT sent',
          data: error.response?.data,
          isNetworkError: !error.response,
          isTimeoutError: error.code === 'ECONNABORTED'
        });
        
        // ✅ Handle network/timeout errors
        if (!error.response) {
          const err = new Error(`Network/Timeout error (${duration}ms): ${error.message}`) as any;
          err.minOrderAmount = undefined;
          err.currentOrder = undefined;
          throw err;
        }
        
        // ✅ Throw error object containing both message and minOrderAmount
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || "Invalid referral code";
        const err = new Error(errorMessage) as any;
        err.minOrderAmount = errorData.minOrderAmount;
        err.currentOrder = errorData.currentOrder;
        throw err;
      }
    },
    retry: 0, // ✅ Don't retry validation - fail fast
  });
}
