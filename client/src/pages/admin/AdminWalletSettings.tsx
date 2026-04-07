
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/hooks/useAdminAuth";
import { Wallet, Gift, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminWalletSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maxUsagePerOrder: 10,
    referrerBonus: 100,
    referredBonus: 50,
    minOrderAmount: 0,
    maxReferralsPerMonth: 10,
    maxEarningsPerMonth: 500,
    expiryDays: 30,
    isActive: true,
  });

  const { data: currentSettings, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/wallet-settings"],
    queryFn: async () => {
      const response = await adminApiRequest("/api/admin/wallet-settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      if (data) {
        setSettings({
          maxUsagePerOrder: data.maxUsagePerOrder || 10,
          referrerBonus: data.referrerBonus || 100,
          referredBonus: data.referredBonus || 50,
          minOrderAmount: data.minOrderAmount || 0,
          maxReferralsPerMonth: data.maxReferralsPerMonth || 10,
          maxEarningsPerMonth: data.maxEarningsPerMonth || 500,
          expiryDays: data.expiryDays || 30,
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      }
      return data;
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache (formerly cacheTime in React Query v4)
  });

  // Refetch data when page becomes visible (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  // Refetch data on component mount to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await adminApiRequest("/api/admin/wallet-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-settings"] });
      toast({ title: "Success", description: "Wallet settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet & Referral Settings</h1>
          <p className="text-muted-foreground mt-1">Configure wallet usage limits and referral rewards</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Usage Settings
              </CardTitle>
              <CardDescription>
                Control how much wallet balance users can use per order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Maximum Usage Per Order (₹)</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={settings.maxUsagePerOrder}
                    onChange={(e) => setSettings({ ...settings, maxUsagePerOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Users can use up to this amount from their wallet per order
                  </p>
                </div>
                
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Referral Rewards
              </CardTitle>
              <CardDescription>
                Set bonus amounts and conditions for referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referrerBonus">Referrer Bonus (₹)</Label>
                  <Input
                    id="referrerBonus"
                    type="number"
                    value={settings.referrerBonus}
                    onChange={(e) => setSettings({ ...settings, referrerBonus: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount given to users who refer others
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referredBonus">Referred User Bonus (₹)</Label>
                  <Input
                    id="referredBonus"
                    type="number"
                    value={settings.referredBonus}
                    onChange={(e) => setSettings({ ...settings, referredBonus: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonus credited to new user who was referred
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount to Claim Bonus (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    value={settings.minOrderAmount}
                    onChange={(e) => setSettings({ ...settings, minOrderAmount: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Referred user's order must be at least this amount to claim the referral bonus
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxReferralsPerMonth">Max Referrals Per Month</Label>
                  <Input
                    id="maxReferralsPerMonth"
                    type="number"
                    value={settings.maxReferralsPerMonth}
                    onChange={(e) => setSettings({ ...settings, maxReferralsPerMonth: parseInt(e.target.value) || 10 })}
                    min="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of successful referrals per user per month
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxEarningsPerMonth">Max Earnings Per Month (₹)</Label>
                  <Input
                    id="maxEarningsPerMonth"
                    type="number"
                    value={settings.maxEarningsPerMonth}
                    onChange={(e) => setSettings({ ...settings, maxEarningsPerMonth: parseInt(e.target.value) || 500 })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum total referral bonus earnings per user per month
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDays">Referral Expiry Days</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    value={settings.expiryDays}
                    onChange={(e) => setSettings({ ...settings, expiryDays: parseInt(e.target.value) || 30 })}
                    min="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Days within which referred user must complete first order to earn bonus
                  </p>
                </div>

                <div className="flex items-center space-x-2 py-4 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Checkbox
                    id="isActive"
                    checked={settings.isActive}
                    onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked as boolean })}
                  />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer mb-0">
                      Enable Referral System
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When disabled, users won't see referral features in their profile or checkout
                    </p>
                  </div>
                </div>
                
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Max Wallet Usage Per Order:</span>
                <span>₹{settings.maxUsagePerOrder}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Referrer Bonus:</span>
                <span>₹{settings.referrerBonus}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Referred User Bonus:</span>
                <span>₹{settings.referredBonus}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Min Order Amount for Bonus:</span>
                <span>₹{settings.minOrderAmount}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Max Referrals Per Month:</span>
                <span>{settings.maxReferralsPerMonth}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Max Earnings Per Month:</span>
                <span>₹{settings.maxEarningsPerMonth}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Referral Expiry Days:</span>
                <span>{settings.expiryDays}</span>
              </div>
              <div className="flex justify-between py-2 border-t pt-2">
                <span className="font-medium">Referral System Status:</span>
                <span className={`font-semibold ${settings.isActive ? "text-green-600" : "text-red-600"}`}>
                  {settings.isActive ? "🟢 Enabled" : "🔴 Disabled"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
