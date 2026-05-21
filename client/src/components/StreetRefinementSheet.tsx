import { useState, useEffect } from "react";
import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const STREET_REFINEMENT_KEY = "streetRefinement";

export interface StreetRefinementData {
  pincode: string;
  area: string;
  street: string;
  skipped: boolean;
  savedAt: string;
}

export function getStoredStreetRefinement(): StreetRefinementData | null {
  try {
    const stored = localStorage.getItem(STREET_REFINEMENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveStreetRefinement(
  data: Omit<StreetRefinementData, "savedAt">
): void {
  localStorage.setItem(
    STREET_REFINEMENT_KEY,
    JSON.stringify({ ...data, savedAt: new Date().toISOString() })
  );
}

export function clearStreetRefinement(): void {
  localStorage.removeItem(STREET_REFINEMENT_KEY);
}

interface StreetRefinementSheetProps {
  isOpen: boolean;
  areaName: string;
  pincode: string;
  onConfirm: (street: string) => void;
  onSkip: () => void;
}

const PLACEHOLDER_EXAMPLES = [
  "e.g. LBS Road",
  "e.g. Near Phoenix Mall",
  "e.g. Andheri Link Road",
  "e.g. Nehru Nagar Main Road",
];

export function StreetRefinementSheet({
  isOpen,
  areaName,
  pincode,
  onConfirm,
  onSkip,
}: StreetRefinementSheetProps) {
  const [street, setStreet] = useState("");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleConfirm = () => {
    onConfirm(street.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Refine your delivery street"
    >
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease",
          backdropFilter: visible ? "blur(2px)" : "none",
          WebkitBackdropFilter: visible ? "blur(2px)" : "none",
        }}
        onClick={onSkip}
        aria-hidden="true"
      />

      <div
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 360ms cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <div className="px-5 pb-10 pt-3">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                  data-testid="text-street-sheet-title"
                >
                  Where should we deliver?
                </h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug pl-[46px]">
                Add your street or a nearby landmark so we can show you the nearest chefs first.
              </p>
            </div>
            <button
              onClick={onSkip}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5 transition-colors"
              data-testid="button-street-sheet-close"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs text-green-800 dark:text-green-300 font-medium"
              data-testid="chip-area-name"
            >
              <MapPin className="h-3 w-3" />
              {areaName || "Your Area"}
            </span>
            {pincode && (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-medium"
                data-testid="chip-pincode"
              >
                {pincode}
              </span>
            )}
          </div>

          <div className="relative mb-6">
            <Input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
              className="h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-700 focus-visible:ring-primary/30 bg-zinc-50 dark:bg-zinc-800"
              autoFocus
              autoComplete="street-address"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              data-testid="input-street-refinement"
            />
          </div>

          <div className="space-y-2">
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold"
              onClick={handleConfirm}
              data-testid="button-street-refinement-continue"
            >
              Continue
            </Button>
            <button
              className="w-full py-2.5 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors rounded-lg"
              onClick={onSkip}
              data-testid="button-street-refinement-skip"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
