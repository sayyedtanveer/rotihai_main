import { useState, useEffect } from "react";
import { AlertCircle, MapPin, CheckCircle2, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { calculateDistance } from "@/lib/locationUtils";
import { toast } from "@/hooks/use-toast";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onLocationGranted: (lat: number, lng: number) => void;
  onClose?: () => void;
}

export function LocationPermissionModal({
  isOpen,
  onLocationGranted,
  onClose,
}: LocationPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "requesting" | "granted" | "denied" | "idle"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [autoAttempted, setAutoAttempted] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);

  const requestLocation = () => {
    setIsRequesting(true);
    setPermissionStatus("requesting");
    setErrorMessage("");
    console.log("[Location Modal] Requesting geolocation...");

    if (navigator.geolocation) {
      console.log("[Location Modal] Geolocation API available");
      
      const timeout = setTimeout(() => {
        console.log("[Location Modal] ⚠️ Geolocation timeout - no response in 5 seconds");
        setIsRequesting(false);
        setPermissionStatus("idle");
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          const { latitude, longitude } = position.coords;
          console.log("[Location Modal] ✓ Location granted:", latitude, longitude);
          setPermissionStatus("granted");
          setIsRequesting(false);
          onLocationGranted(latitude, longitude);
        },
        (error) => {
          clearTimeout(timeout);
          console.log("[Location Modal] ✗ Location error code:", error.code, "message:", error.message);
          setIsRequesting(false);
          setPermissionStatus("denied");

          let message = "Unable to access your location.";
          if (error.code === 1) {
            message =
              "Location permission denied. Check Settings → Safari → Location to enable it.";
          } else if (error.code === 2) {
            message =
              "Location is unavailable. Please check your device settings and try again.";
          } else if (error.code === 3) {
            message = "Location request timed out. Please try again.";
          }
          setErrorMessage(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.log("[Location Modal] ✗ Geolocation API NOT available");
      setIsRequesting(false);
      setPermissionStatus("denied");
      setErrorMessage(
        "Your browser does not support location services. Please use a modern browser."
      );
    }
  };

  // Auto-request location when modal opens (once)
  useEffect(() => {
    if (isOpen && permissionStatus === "idle" && !autoAttempted) {
      console.log("[Location Modal] Modal opened, auto-requesting location...");
      setAutoAttempted(true);
      requestLocation();
    }
  }, [isOpen]);

  const handleCheckAddress = async () => {
    if (!manualAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingAddress(true);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: manualAddress }),
      });

      if (!response.ok) {
        throw new Error("Could not find location");
      }

      const { latitude, longitude } = await response.json();
      
      const CHEF_LAT = 19.068604;
      const CHEF_LNG = 72.87658;
      const MAX_DELIVERY_DISTANCE = 2.5;
      
      const distance = calculateDistance(latitude, longitude, CHEF_LAT, CHEF_LNG);

      if (distance <= MAX_DELIVERY_DISTANCE) {
        toast({
          title: "✅ Great!",
          description: "We deliver to your area!",
        });
        onLocationGranted(latitude, longitude);
        onClose?.();
      } else {
        toast({
          title: "❌ Out of Zone",
          description: `Sorry, your area is ${distance.toFixed(1)} km away. We deliver within 2.5 km of Kurla West.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[ADDRESS-CHECK] Error:", error);
      toast({
        title: "Error",
        description: "Could not find your address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAddress(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[90vw] max-h-[95vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 sticky top-0 bg-white dark:bg-slate-950 z-10 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Enable Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 py-4">
            {/* Permission Status Indicator */}
            <div className="rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-200">
              {permissionStatus === "requesting" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin">
                      <MapPin className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Requesting your location...
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">
                    Please allow location access in the browser dialog
                  </p>
                </div>
              )}

              {permissionStatus === "granted" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Location enabled! ✓
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-7">
                    We'll show you restaurants nearby
                  </p>
                </div>
              )}

              {permissionStatus === "denied" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Permission Denied
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Why We Need Location */}
            {permissionStatus !== "granted" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Why we need your location:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Find nearby restaurants and chefs</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Calculate accurate delivery fees</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Track your delivery in real-time</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Steps to Enable Location */}
            {permissionStatus === "denied" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  How to enable location:
                </h4>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Check the browser address bar for permission requests</li>
                  <li>Click "Allow" or "Share" to enable location access</li>
                  <li>Try requesting location again</li>
                </ol>
              </div>
            )}

            {/* OR DIVIDER */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm font-semibold text-gray-600">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* MANUAL ADDRESS ENTRY */}
            <div className="space-y-3 pb-2">
              <h4 className="text-sm font-semibold text-gray-700">Enter Manually</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Enter your full address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="h-10 text-sm"
                  disabled={isCheckingAddress}
                />
                <p className="text-xs text-gray-500">
                  e.g., 18/20 M.I.G, Kurla West, Mumbai, 400070
                </p>
              </div>
              <Button
                onClick={handleCheckAddress}
                disabled={isCheckingAddress || !manualAddress.trim()}
                variant="outline"
                className="w-full"
              >
                {isCheckingAddress ? "Checking..." : "Check Delivery"}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-4 pt-3 border-t bg-white dark:bg-slate-950 flex flex-col gap-2">
          {permissionStatus === "requesting" && (
            <>
              <Button
                disabled
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Requesting Location...
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Browse Anyway
              </Button>
            </>
          )}

          {permissionStatus === "denied" && (
            <>
              <Button
                onClick={requestLocation}
                disabled={isRequesting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isRequesting ? "Requesting..." : "Try Again"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Continue Without Location
              </Button>
            </>
          )}

          {permissionStatus === "granted" && (
            <Button
              onClick={onClose}
              disabled={false}
              className="bg-green-500 hover:bg-green-600"
            >
              Location Enabled ✓ Continue
            </Button>
          )}

          {permissionStatus === "idle" && (
            <>
              <Button
                onClick={requestLocation}
                disabled={isRequesting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isRequesting ? "Requesting..." : "Detect My Location"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Browse Without Location
              </Button>
            </>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-center text-gray-600 pb-4 px-6 border-t bg-gray-50 dark:bg-slate-900">
          💡 Location is only required at checkout to calculate delivery fees. You can browse the menu without it.
        </p>
      </DialogContent>
    </Dialog>
  );
}
