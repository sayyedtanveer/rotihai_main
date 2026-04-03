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
      try {
        console.log('[REFERRAL-VALIDATE] Starting validation...', { referralCode: referralCode.substring(0, 3) + '...', orderAmount });
        
        const response = await api.post("/api/referral/validate", {
          referralCode,
          orderAmount // ✅ NEW: Send current order amount for validation
        });
        
        console.log('[REFERRAL-VALIDATE] ✅ Validation successful', response.data);
        return response.data;
      } catch (error: any) {
        console.error('[REFERRAL-VALIDATE] ❌ Validation failed', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        
        // ✅ Handle network/timeout errors
        if (!error.response) {
          const err = new Error("Network error - unable to validate code") as any;
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
