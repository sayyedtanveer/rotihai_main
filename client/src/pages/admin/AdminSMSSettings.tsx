import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/hooks/useAdminAuth";
import { MessageSquare, Save, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AdminSMSSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enableSMS: false,
    smsGateway: "twilio",
    fromNumber: "",
    apiKey: "",
  });

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/sms-settings"],
    queryFn: async () => {
      const response = await adminApiRequest("/api/admin/sms-settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      if (data) {
        setSettings({
          enableSMS: data.enableSMS || false,
          smsGateway: data.smsGateway || "twilio",
          fromNumber: data.fromNumber || "",
          apiKey: data.apiKey || "",
        });
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await adminApiRequest("/api/admin/sms-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-settings"] });
      toast({
        title: "Settings updated",
        description: `SMS notifications ${settings.enableSMS ? "enabled" : "disabled"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update SMS settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (settings.enableSMS && (!settings.fromNumber || !settings.apiKey)) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields to enable SMS",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(settings);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            SMS Notification Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Configure SMS notifications for order updates and alerts
          </p>
        </div>

        {isLoading ? (
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS Notifications
                  </span>
                  <Switch
                    checked={settings.enableSMS}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableSMS: checked })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Enable or disable SMS notifications for order updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings.enableSMS ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
                    ✅ SMS notifications are ENABLED
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    SMS notifications are DISABLED
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration */}
            {settings.enableSMS && (
              <Card>
                <CardHeader>
                  <CardTitle>SMS Gateway Configuration</CardTitle>
                  <CardDescription>
                    Configure your SMS service provider details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gateway Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="gateway">SMS Gateway Provider</Label>
                    <select
                      id="gateway"
                      value={settings.smsGateway}
                      onChange={(e) =>
                        setSettings({ ...settings, smsGateway: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="aws">AWS SNS</option>
                      <option value="custom">Custom Gateway</option>
                    </select>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Choose your SMS service provider
                    </p>
                  </div>

                  {/* From Number */}
                  <div className="space-y-2">
                    <Label htmlFor="fromNumber">
                      From Number / Sender ID *
                    </Label>
                    <Input
                      id="fromNumber"
                      type="text"
                      placeholder="Enter your SMS number or sender ID"
                      value={settings.fromNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, fromNumber: e.target.value })
                      }
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      The phone number or ID from which SMS will be sent
                    </p>
                  </div>

                  {/* API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key / Auth Token *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your SMS gateway API key"
                      value={settings.apiKey}
                      onChange={(e) =>
                        setSettings({ ...settings, apiKey: e.target.value })
                      }
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your authentication credentials from SMS provider
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      📱 SMS Notifications Will Be Sent For:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li>When user places an order (to admin)</li>
                      <li>When order is assigned to chef (to chef)</li>
                      <li>When order is ready for delivery (to delivery boys)</li>
                      <li>When order is delivered (to customer)</li>
                    </ul>
                  </div>

                  {/* Cost Info */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                      💰 Cost Information
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      SMS charges apply per message sent. Typical rate: ₹0.20-0.50 per SMS depending on provider.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            {/* Status */}
            {currentSettings && (
              <Card className="bg-slate-50 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-sm">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">SMS Enabled:</span>{" "}
                    {currentSettings.enableSMS ? (
                      <span className="text-green-600 dark:text-green-400">✅ Yes</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">❌ No</span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Provider:</span>{" "}
                    {currentSettings.smsGateway || "Not configured"}
                  </p>
                  <p>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {currentSettings.updatedAt
                      ? new Date(currentSettings.updatedAt).toLocaleString()
                      : "Never"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
