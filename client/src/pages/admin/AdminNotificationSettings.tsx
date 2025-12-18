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
import { MessageSquare, Save, AlertCircle, Bell } from "lucide-react";
import { useState } from "react";

interface NotificationSettings {
  enableWhatsApp: boolean;
  whatsappPhoneNumberId?: string;
  enableSMS: boolean;
  smsGateway?: string;
  fromNumber?: string;
  apiKey?: string;
  updatedAt?: Date;
}

export default function AdminNotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    enableWhatsApp: true,
    whatsappPhoneNumberId: "",
    enableSMS: false,
    smsGateway: "twilio",
    fromNumber: "",
    apiKey: "",
  });

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/notification-settings"],
    queryFn: async () => {
      const response = await adminApiRequest("/api/admin/notification-settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      if (data) {
        setSettings({
          enableWhatsApp: data.enableWhatsApp !== false,
          whatsappPhoneNumberId: data.whatsappPhoneNumberId || "",
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
    mutationFn: async (data: NotificationSettings) => {
      const response = await adminApiRequest("/api/admin/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-settings"] });
      toast({
        title: "Settings updated",
        description: "Notification settings saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!settings.enableWhatsApp && !settings.enableSMS) {
      toast({
        title: "Validation error",
        description: "At least one notification method must be enabled",
        variant: "destructive",
      });
      return;
    }

    if (settings.enableSMS && (!settings.fromNumber || !settings.apiKey)) {
      toast({
        title: "Validation error",
        description: "Please fill in SMS credentials to enable SMS",
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
            <Bell className="w-8 h-8" />
            Notification Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Configure how order notifications are sent to admins, chefs, delivery staff, and customers
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
            {/* WhatsApp Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    WhatsApp Notifications
                  </span>
                  <Switch
                    checked={settings.enableWhatsApp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableWhatsApp: checked })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Send order updates via WhatsApp (premium service)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.enableWhatsApp ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
                    ✅ WhatsApp notifications are ENABLED
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    WhatsApp notifications are DISABLED
                  </div>
                )}

                {/* WhatsApp Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                    📱 WhatsApp Notifications Sent At:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>When user places an order (to admin)</li>
                    <li>When order is assigned to chef (to chef)</li>
                    <li>When order is ready for delivery (to delivery boys)</li>
                    <li>When order is delivered (to customer)</li>
                  </ul>
                </div>

                {/* WhatsApp Cost */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                    💰 Cost per Message
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ₹0.50 - 1.50 per WhatsApp message (varies by country)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SMS Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS Notifications (Alternative)
                  </span>
                  <Switch
                    checked={settings.enableSMS}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableSMS: checked })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Send order updates via SMS (cheaper alternative)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {settings.enableSMS && (
                  <>
                    {/* Gateway Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="gateway">SMS Gateway Provider</Label>
                      <select
                        id="gateway"
                        value={settings.smsGateway || "twilio"}
                        onChange={(e) =>
                          setSettings({ ...settings, smsGateway: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="twilio">Twilio</option>
                        <option value="aws">AWS SNS</option>
                        <option value="custom">Custom Gateway</option>
                      </select>
                    </div>

                    {/* From Number */}
                    <div className="space-y-2">
                      <Label htmlFor="fromNumber">From Number / Sender ID *</Label>
                      <Input
                        id="fromNumber"
                        type="text"
                        placeholder="Enter your SMS number or sender ID"
                        value={settings.fromNumber || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, fromNumber: e.target.value })
                        }
                      />
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key / Auth Token *</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your SMS gateway API key"
                        value={settings.apiKey || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, apiKey: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {/* SMS Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                    📱 SMS Notifications Sent At:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>When user places an order (to admin)</li>
                    <li>When order is assigned to chef (to chef)</li>
                    <li>When order is ready for delivery (to delivery boys)</li>
                    <li>When order is delivered (to customer)</li>
                  </ul>
                </div>

                {/* SMS Cost */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                    💰 Cost per Message
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ₹0.20 - 0.50 per SMS (cheaper than WhatsApp)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Method Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left py-2 px-2">Feature</th>
                        <th className="text-center py-2 px-2">WhatsApp</th>
                        <th className="text-center py-2 px-2">SMS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="py-2 px-2">Cost per message</td>
                        <td className="text-center py-2 px-2">₹0.50-1.50</td>
                        <td className="text-center py-2 px-2">₹0.20-0.50</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">Delivery speed</td>
                        <td className="text-center py-2 px-2">⚡ Instant</td>
                        <td className="text-center py-2 px-2">⚡ Instant</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">Rich media support</td>
                        <td className="text-center py-2 px-2">✅ Yes</td>
                        <td className="text-center py-2 px-2">❌ Text only</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">Works globally</td>
                        <td className="text-center py-2 px-2">✅ Yes</td>
                        <td className="text-center py-2 px-2">✅ Yes</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">Best for</td>
                        <td className="text-center py-2 px-2">Premium</td>
                        <td className="text-center py-2 px-2">Budget</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  ⚠️ Important Note
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-orange-800 dark:text-orange-200">
                <p>
                  At least one notification method (WhatsApp or SMS) must be enabled. If you disable
                  WhatsApp, make sure SMS is configured and enabled. Orders will not send notifications
                  if both methods are disabled.
                </p>
              </CardContent>
            </Card>

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

            {/* Current Status */}
            {currentSettings && (
              <Card className="bg-slate-50 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-sm">Current Configuration</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    <span className="font-medium">WhatsApp:</span>{" "}
                    {currentSettings.enableWhatsApp ? (
                      <span className="text-green-600 dark:text-green-400">✅ Enabled</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">❌ Disabled</span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">SMS:</span>{" "}
                    {currentSettings.enableSMS ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✅ Enabled ({currentSettings.smsGateway})
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">❌ Disabled</span>
                    )}
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
