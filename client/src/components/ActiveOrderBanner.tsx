import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/apiBase";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Truck, ChefHat, Clock, Package, ArrowRight, X, CreditCard } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Active statuses — delivered/cancelled/completed are excluded
const ACTIVE_STATUSES = new Set([
  "pending",
  "confirmed",
  "accepted_by_chef",
  "preparing",
  "prepared",
  "accepted_by_delivery",
  "out_for_delivery",
]);

// Per-status icon + label + colour set
function getStatusConfig(status: string): {
  icon: React.ReactNode;
  label: string;
  pulse: boolean;
  accent: string;
  bg: string;
} {
  switch (status) {
    case "pending":
      return {
        icon: <Clock className="h-4 w-4" />,
        label: "Order placed — waiting for confirmation",
        pulse: true,
        accent: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
      };
    case "confirmed":
      return {
        icon: <Package className="h-4 w-4" />,
        label: "Order confirmed",
        pulse: false,
        accent: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      };
    case "accepted_by_chef":
    case "preparing":
      return {
        icon: <ChefHat className="h-4 w-4" />,
        label: "Chef is preparing your food 🍳",
        pulse: true,
        accent: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
      };
    case "prepared":
      return {
        icon: <Package className="h-4 w-4" />,
        label: "Your food is ready! Waiting for pickup",
        pulse: false,
        accent: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800",
      };
    case "accepted_by_delivery":
      return {
        icon: <Truck className="h-4 w-4" />,
        label: "Delivery assigned — heading your way 🛵",
        pulse: true,
        accent: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800",
      };
    case "out_for_delivery":
      return {
        icon: <Truck className="h-4 w-4" />,
        label: "Out for delivery — almost there! 🛵",
        pulse: true,
        accent: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
      };
    default:
      return {
        icon: <Package className="h-4 w-4" />,
        label: "Order in progress",
        pulse: false,
        accent: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700",
      };
  }
}

export default function ActiveOrderBanner({
  isPaymentOpen,
  isCheckoutOpen,
  isReturningToCheckout,
}: {
  isPaymentOpen?: boolean;
  isCheckoutOpen?: boolean;
  isReturningToCheckout?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();
  // 🔥 FIX: Hide banner when QR is open



  // ── TOKEN-FIRST: check localStorage synchronously so dropout users are covered
  // isAuthenticated requires the profile query to resolve (async). On dropout,
  // the token already exists in localStorage before that resolves — we must not
  // gate the banner on isAuthenticated alone.
  const [hasToken, setHasToken] = useState(
    () => !!localStorage.getItem("userToken")
  );

  // Keep hasToken in sync when isAuthenticated changes (login / logout)
  useEffect(() => {
    const tokenNow = !!localStorage.getItem("userToken");
    if (tokenNow !== hasToken) {
      setHasToken(tokenNow);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── STEP 5: Fix dropout — invalidate on auth change ──────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ["active-order"] });
    }
  }, [isAuthenticated, queryClient]);

  // ── Fetch active order ───────────────────────────────────────────────────
  const { data: activeOrder } = useQuery<any | null>({
    // Include both hasToken + isAuthenticated so the cache resets on transitions
    queryKey: ["active-order", hasToken, isAuthenticated],
    queryFn: async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return null;
      try {
        const res = await fetch(getApiUrl("/api/orders/active"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        // 401 = token invalid/expired — treat as no order, don't crash
        if (res.status === 401) {
          console.warn("[ACTIVE-ORDER] Token rejected (401) — clearing");
          localStorage.removeItem("userToken");
          setHasToken(false);
          return null;
        }
        if (!res.ok) return null;
        const json = await res.json();
        return json?.order ?? null;
      } catch (err) {
        console.error("[ACTIVE-ORDER] Fetch failed:", err);
        return null;
      }
    },
    // ✅ CRITICAL: use hasToken (sync) NOT isAuthenticated (async)
    // This makes the query fire immediately on mount for dropout users
    enabled: true,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000, // reduced from 15s — WebSocket handles real-time updates
    staleTime: 30_000,
  });

  // ── STEP 7: Real-time updates via WebSocket (order_update) ───────────────
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    // Use hasToken so WS connects for dropout users too
    if (!hasToken) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === "order_update") {
            console.log("[ACTIVE-ORDER] WS order_update → invalidating");
            queryClient.invalidateQueries({ queryKey: ["active-order"] });
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        // silently swallow — polling covers us
      };
    } catch {
      // WebSocket not available — polling still active
    }

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [isAuthenticated, queryClient]);

  // ✅ IMPORTANT: Hide banner when Payment OR Checkout is open so it doesn't overlap
  if (isPaymentOpen || isCheckoutOpen || isReturningToCheckout) return null;
  // ── STEP 6: Active status guard ──────────────────────────────────────────
  if (!activeOrder) return null;
  const isActiveOrder =
    ACTIVE_STATUSES.has(activeOrder.status) ||
    activeOrder.paymentStatus === "pending" ||
    activeOrder.paymentStatus === "paid";

  if (!isActiveOrder) return null;
  //if (dismissed) return null;

  // ── STEP 1: Config from existing status system ───────────────────────────
  const config = getStatusConfig(activeOrder.status);

  // ── STEP 2: Payment status logic ─────────────────────────────────────────
  const isPaymentPending =
    activeOrder.status === "pending" &&
    activeOrder.paymentStatus === "pending";


  const handleCancel = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;

      await fetch(getApiUrl(`/api/orders/${activeOrder.id}/cancel`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh banner
      queryClient.invalidateQueries({ queryKey: ["active-order"] });

    } catch (err) {
      console.error("[CANCEL ORDER ERROR]", err);
    }
  };
  const isPaymentCompleted =
    activeOrder.paymentStatus === "paid" &&
    activeOrder.status === "pending";

  // ── STEP 3: Override label only ──────────────────────────────────────────
  let displayLabel = config.label;

  if (isPaymentPending) {
    displayLabel = "Waiting for payment...";
  }

  if (isPaymentCompleted) {
    displayLabel = "Your order has been received. Waiting for admin confirmation...";
  }

  const handleTrack = () => {
    navigate(`/track/${activeOrder.id}`);
  };

  // ── STEP 0 / STEP 4: OLD fixed-bottom UI — DO NOT CHANGE ─────────────────
  return (
    <div
      className={`
        fixed bottom-16 left-0 right-0 z-[60]
        border-t ${config.bg}
        shadow-[0_-4px_24px_rgba(0,0,0,0.10)]
        transition-all duration-300 ease-in-out
        safe-area-pb
      `}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-2xl mx-auto px-4 py-3 mb-2 flex items-center gap-3">
        {/* Animated status dot */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${config.accent} bg-white dark:bg-slate-900 shadow-sm border border-current/20`}
          >
            {config.icon}
          </div>
          {config.pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </span>
          )}
        </div>

        {/* Text — STEP 4: use displayLabel */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Active Order
          </p>
          <p className={`text-sm font-medium truncate ${config.accent}`}>
            {displayLabel}
          </p>
        </div>

        {/* Track button */}
        <button
          onClick={handleTrack}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-sm font-semibold border
            ${config.accent} border-current/30
            bg-white dark:bg-slate-900
            hover:bg-current/5 active:scale-95
            transition-all duration-150
          `}
          aria-label={isPaymentPending ? "Complete payment for your order" : "Track your active order"}
        >
          {isPaymentPending ? "Pay Now" : "Track"}
          {isPaymentPending ? (
            <CreditCard className="h-3.5 w-3.5" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
        </button>
        {isPaymentPending && (
          <button
            onClick={handleCancel}
            className="
      flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
      text-sm font-semibold border
      text-red-600 border-red-300
      bg-white dark:bg-slate-900
      hover:bg-red-50 active:scale-95
      transition-all duration-150
    "
          >
            Cancel
          </button>
        )}
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          aria-label="Dismiss order banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
