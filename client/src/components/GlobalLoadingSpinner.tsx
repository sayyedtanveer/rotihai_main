/**
 * Global Loading Spinner Component
 * Shows a clean spinner without text when server is loading/cold starting
 */

import { Loader } from "lucide-react";

export function GlobalLoadingSpinner({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Animated spinner */}
          <Loader className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    </div>
  );
}
