import { Download, X, Share } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Extend window for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return; // Already installed, don't show

    // Check dismissed state (don't re-show within 7 days)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return;
    }

    // Detect iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    // Listen for Chrome/Android beforeinstallprompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS can't trigger install — just show instructions
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Download className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Install RotiHai App</p>
          {isIOS ? (
            <p className="text-xs opacity-90 flex items-center gap-1">
              Tap <Share className="h-3 w-3 inline" /> Share → Add to Home Screen
            </p>
          ) : (
            <p className="text-xs opacity-90">Get faster ordering & offline access</p>
          )}
        </div>
      </div>

      {!isIOS && deferredPrompt && (
        <Button
          size="sm"
          className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-xs h-8 px-3 flex-shrink-0"
          onClick={handleInstallClick}
        >
          Install
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-orange-700 h-8 w-8 p-0 flex-shrink-0"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
