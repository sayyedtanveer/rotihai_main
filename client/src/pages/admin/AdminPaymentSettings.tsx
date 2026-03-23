import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Phone, Copy } from "lucide-react";
import api from "@/lib/apiClient";

export default function AdminPaymentSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [paymentConfig, setPaymentConfig] = useState({
    merchantPhone: "9773765103",
    upiId: "sayyedtanveer1410-1@oksbi",
    merchantName: "RotiHai",
    supportPhone: "918169020290",
  });

  // Load payment settings from API
  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/admin/payment-settings");
      if (response.data) {
        setPaymentConfig(response.data);
      }
    } catch (error) {
      console.error("Failed to load payment settings:", error);
      toast({
        title: "Info",
        description: "Using default payment settings",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.post("/api/admin/payment-settings", paymentConfig);
      toast({
        title: "✓ Settings saved",
        description: "Payment settings have been updated successfully",
      });
    } catch (error) {
      console.error("Failed to save payment settings:", error);
      toast({
        title: "Error",
        description: "Failed to save payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Payment Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Configure UPI, phone numbers, and payment details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Google Pay / UPI Configuration</CardTitle>
            <CardDescription>
              These details are used when customers pay via Google Pay or scanning QR codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Merchant Phone */}
            <div className="space-y-2">
              <Label htmlFor="merchantPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Merchant Phone Number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="merchantPhone"
                  value={paymentConfig.merchantPhone}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      merchantPhone: e.target.value,
                    })
                  }
                  placeholder="e.g., 9773765103"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentConfig.merchantPhone)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Customers will send money to this phone number via Google Pay
              </p>
            </div>

            {/* UPI ID */}
            <div className="space-y-2">
              <Label htmlFor="upiId" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                UPI ID
              </Label>
              <div className="flex gap-2">
                <Input
                  id="upiId"
                  value={paymentConfig.upiId}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      upiId: e.target.value,
                    })
                  }
                  placeholder="e.g., name@bank"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentConfig.upiId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Shown in payment QR code (optional, phone number is primary)
              </p>
            </div>

            {/* Merchant Name */}
            <div className="space-y-2">
              <Label htmlFor="merchantName">Merchant Display Name</Label>
              <Input
                id="merchantName"
                value={paymentConfig.merchantName}
                onChange={(e) =>
                  setPaymentConfig({
                    ...paymentConfig,
                    merchantName: e.target.value,
                  })
                }
                placeholder="e.g., RotiHai"
              />
              <p className="text-xs text-slate-500">
                Shows as recipient name in payment apps
              </p>
            </div>

            {/* Support Phone */}
            <div className="space-y-2">
              <Label htmlFor="supportPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Support Phone Number
              </Label>
              <Input
                id="supportPhone"
                value={paymentConfig.supportPhone}
                onChange={(e) =>
                  setPaymentConfig({
                    ...paymentConfig,
                    supportPhone: e.target.value,
                  })
                }
                placeholder="e.g., 918169020290"
              />
              <p className="text-xs text-slate-500">
                Shown to customers for payment issues
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">How Payment Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              ✓ When customers checkout, they see a Google Pay button with these settings
            </p>
            <p>
              ✓ Clicking the button opens Google Pay with your merchant phone pre-filled
            </p>
            <p>
              ✓ Customer enters amount and verifies in Google Pay
            </p>
            <p>
              ✓ After payment, they return and confirm in the app
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : "Save Payment Settings"}
          </Button>
          <Button
            onClick={loadPaymentSettings}
            disabled={isSaving || isLoading}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
