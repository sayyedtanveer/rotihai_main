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
        const response = await api.post("/api/referral/validate", {
          referralCode,
          orderAmount // ✅ NEW: Send current order amount for validation
        });
        return response.data;
      } catch (error: any) {
        // ✅ Throw error object containing both message and minOrderAmount
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || "Invalid referral code";
        const err = new Error(errorMessage) as any;
        err.minOrderAmount = errorData.minOrderAmount;
        err.currentOrder = errorData.currentOrder;
        throw err;
      }
    },
  });
}
