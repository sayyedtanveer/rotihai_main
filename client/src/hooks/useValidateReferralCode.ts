import { useMutation } from "@tanstack/react-query";
import api from "@/lib/apiClient";

interface ValidateReferralParams {
  referralCode: string;
}

interface ValidateReferralResponse {
  valid: boolean;
  message: string;
  bonus?: number;
  referrerName?: string;
}

export function useValidateReferralCode() {
  return useMutation({
    mutationFn: async ({ referralCode }: ValidateReferralParams): Promise<ValidateReferralResponse> => {
      try {
        const response = await api.post("/api/referral/validate", { referralCode });
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Invalid referral code";
        throw new Error(errorMessage);
      }
    },
  });
}
