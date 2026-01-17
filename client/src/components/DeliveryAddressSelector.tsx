import { useState } from "react";
import { AlertCircle, MapPin, CheckCircle2, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface DeliveryAddressSelectorProps {
  isOpen: boolean;
  onPincodeSubmitted: (pincode: string) => void;
  onClose?: () => void;
}

export function DeliveryAddressSelector({
  isOpen,
  onPincodeSubmitted,
  onClose,
}: DeliveryAddressSelectorProps) {
  const [pincode, setPincode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setError("");

    // Validate pincode format (5-6 digits)
    if (!pincode || !/^\d{5,6}$/.test(pincode.trim())) {
      setError("Please enter a valid 5-6 digit pincode");
      return;
    }

    setIsValidating(true);
    console.log("[DeliveryAddressSelector] Submitting pincode:", pincode);

    // Simulate validation delay
    setTimeout(() => {
      setIsValidating(false);
      setIsSubmitted(true);
      console.log("[DeliveryAddressSelector] Pincode accepted:", pincode);

      // Auto-proceed after showing success
      setTimeout(() => {
        onPincodeSubmitted(pincode.trim());
      }, 500);
    }, 800);
  };

  const handleClose = () => {
    if (!isValidating && !isSubmitted) {
      setPincode("");
      setError("");
      setIsSubmitted(false);
      onClose?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Enter Your Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Indicator */}
          <div className="rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-200">
            {!isSubmitted && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Enter your pincode
                  </span>
                </div>
                <p className="text-xs text-gray-600 ml-7">
                  We'll show you available restaurants
                </p>
              </div>
            )}

            {isSubmitted && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Location confirmed! ✓
                  </span>
                </div>
                <p className="text-xs text-gray-600 ml-7">
                  Loading available restaurants...
                </p>
              </div>
            )}
          </div>

          {/* Pincode Input */}
          {!isSubmitted && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Pincode
              </label>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 5-6 digit pincode"
                  value={pincode}
                  onChange={(e) => {
                    // Only allow digits
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits.length <= 6) {
                      setPincode(digits);
                      setError(""); // Clear error when user types
                    }
                  }}
                  disabled={isValidating}
                  maxLength={6}
                  className="text-lg font-semibold tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  {pincode.length}/6 digits
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 Enter your delivery pincode to see available restaurants and delivery charges.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {!isSubmitted && (
            <>
              <Button
                onClick={handleSubmit}
                disabled={isValidating || !pincode}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isValidating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isValidating}
                className="flex-1"
              >
                Skip for Now
              </Button>
            </>
          )}

          {isSubmitted && (
            <Button
              disabled
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
