import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";

interface AccountCreatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  password: string;
  orderId: string;
  customerName: string;
  onGoToTrack: () => void;
}

export default function AccountCreatedDialog({
  isOpen,
  onClose,
  phone,
  password,
  orderId,
  customerName,
  onGoToTrack,
}: AccountCreatedDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePreventClose = (e: any) => {
    // Prevent closing by clicking outside
    e.preventDefault();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Only close if user clicks the button
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-full max-w-md mx-auto"
        onPointerDownOutside={handlePreventClose}
        onEscapeKeyDown={handlePreventClose}
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Account Created!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order ID */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-muted-foreground mb-2">Order ID:</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-semibold text-sm">{orderId.slice(0, 8)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(orderId, "orderId")}
                className="h-6 px-2"
              >
                {copiedField === "orderId" ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Login Credentials */}
          <div className="space-y-4">
            <p className="font-semibold text-sm text-foreground">Your Login Credentials:</p>

            {/* Phone */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs text-muted-foreground block">Phone Number</label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-sm">{phone}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(phone, "phone")}
                  className="h-6 px-2"
                >
                  {copiedField === "phone" ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 space-y-2">
              <label className="text-xs text-green-700 dark:text-green-300 font-semibold block">
                Password (Last 6 digits of phone)
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-green-700 dark:text-green-400">
                  {password}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(password, "password")}
                  className="h-6 px-2"
                >
                  {copiedField === "password" ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>💡 Tips:</strong>
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 mt-2 space-y-1 list-disc list-inside">
              <li>Save these credentials safely</li>
              <li>You can login anytime to track orders</li>
              <li>Password is always last 6 digits of your phone</li>
            </ul>
          </div>

          <Separator />

          {/* Action Button */}
          <Button
            onClick={onGoToTrack}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-base"
          >
            <span>Go to Order Tracking</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Secondary info */}
          <p className="text-xs text-center text-muted-foreground">
            Order #<span className="font-semibold">{orderId.slice(0, 8)}</span> is being prepared. You'll receive updates soon!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
