import { Download, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS and Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    // Check if already installed (iOS standalone mode)
    const isStandalone = (window.navigator as any).standalone === true;
    
    if (isIOSDevice && isSafari && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt || !isIOS) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Download className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Install RotiHai App</p>
          <p className="text-xs opacity-90">Tap Share → Add to Home Screen</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-orange-700 h-8 w-8 p-0 flex-shrink-0"
        onClick={() => setShowPrompt(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
