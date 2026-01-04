import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/apiClient";

interface ApplyReferralParams {
  referralCode: string;
  userToken: string;
}

export function useApplyReferral() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ referralCode, userToken }: ApplyReferralParams) => {
      try {
        const response = await api.post("/api/user/apply-referral", { referralCode }, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to apply referral code";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/referral-eligibility"] });
      
      toast({
        title: "✓ Success!",
        description: `Referral bonus of ₹${data.bonus || 50} added to your wallet!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply referral",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
