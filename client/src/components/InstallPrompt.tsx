import { X, Share, Bell, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallPromptProps {
  streetRefinementDone?: boolean;
}

export function InstallPrompt({ streetRefinementDone = false }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasPromptAvailable, setHasPromptAvailable] = useState(false);

  // PHASE 1: Detect device type and register event listeners
  // Do NOT schedule Install Prompt display here — only detect and store events
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const DISMISS_KEY = "pwa-install-dismissed-v2";
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return;
    }

    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAnyBrowserOnIOS = isIOSDevice;

    if (isAnyBrowserOnIOS) {
      setIsIOS(true);
      setHasPromptAvailable(true); // Mark that iOS is ready for Install Prompt
      return;
    }

    // Android: Listen for beforeinstallprompt event
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setHasPromptAvailable(true); // Mark that Android prompt is available
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // PHASE 2: Show Install Prompt ONLY AFTER Street Refinement completes
  // 🔒 This ensures Install Prompt can NEVER appear before Street Refinement finishes
  useEffect(() => {
    if (!streetRefinementDone || !hasPromptAvailable) {
      return; // Block: Street Refinement not done, or prompt not available yet
    }

    // Only schedule timeout AFTER refinement is complete
    const t = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(t);
  }, [streetRefinementDone, hasPromptAvailable]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed-v2", Date.now().toString());
  };

  if (!showPrompt) return null;

  if (isIOS) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-[200]"
          onClick={handleDismiss}
        />
        <div className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-10" style={{animation: 'slideUp 0.3s ease-out'}}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">Enable Order Notifications</p>
                <p className="text-sm text-gray-500 mt-0.5">Install the app to get alerts</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            iPhone requires the app to be installed on your Home Screen to receive notifications about your orders, deliveries, and special offers — even when the browser is closed.
          </p>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Tap the Share button</p>
                <p className="text-xs text-gray-500">The <span className="font-semibold">⬆ Share</span> icon at the bottom of Safari</p>
              </div>
              <Share className="h-5 w-5 text-orange-500 flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Tap "Add to Home Screen"</p>
                <p className="text-xs text-gray-500">Scroll down in the share sheet to find it</p>
              </div>
              <Plus className="h-5 w-5 text-orange-500 flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Open RotiHai from your Home Screen</p>
                <p className="text-xs text-gray-500">Tap Allow when asked for notifications</p>
              </div>
              <Bell className="h-5 w-5 text-orange-500 flex-shrink-0" />
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
          >
            Got it — I'll add to Home Screen now
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            ⬆ Share button is at the <span className="font-medium">bottom</span> of your Safari browser
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Bell className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Install RotiHai for Notifications</p>
          <p className="text-xs opacity-90">Get order updates even when browser is closed</p>
        </div>
      </div>

      {deferredPrompt && (
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
