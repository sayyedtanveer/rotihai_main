import { useState, useEffect } from "react";
import { AlertCircle, MapPin, CheckCircle2, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

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

  const requestLocation = () => {
    setIsRequesting(true);
    setPermissionStatus("requesting");
    setErrorMessage("");
    console.log("[Location Modal] Requesting geolocation...");

    if (navigator.geolocation) {
      console.log("[Location Modal] Geolocation API available");
      
      // Try to get location with timeout
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
          // Auto-proceed immediately when location is granted - no need to click
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Enable Your Location
          </DialogTitle>
        </DialogHeader>

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
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {permissionStatus === "requesting" && (
            <>
              <Button
                disabled
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Requesting Location...
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
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
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isRequesting ? "Requesting..." : "Try Again"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Continue Without Location
              </Button>
            </>
          )}

          {permissionStatus === "granted" && (
            <Button
              onClick={onClose}
              disabled={false}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              Location Enabled ✓ Continue
            </Button>
          )}

          {permissionStatus === "idle" && (
            <>
              <Button
                onClick={requestLocation}
                disabled={isRequesting}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isRequesting ? "Requesting..." : "Enable Location"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Browse Without Location
              </Button>
            </>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-center text-gray-600 pt-2">
          💡 Location is only required at checkout to calculate delivery fees. You can browse the menu without it.
        </p>
      </DialogContent>
    </Dialog>
  );
}
