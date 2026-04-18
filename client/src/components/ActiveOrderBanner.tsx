import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/apiBase";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Truck, ChefHat, Clock, Package, ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";

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

export default function ActiveOrderBanner() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const userToken = localStorage.getItem("userToken");
    const userData = localStorage.getItem("userData");
    const userId = userData ? JSON.parse(userData)?.id : null;

    if (!userToken || !userId) return;

    const wsUrl = getWebSocketURL(`?token=${encodeURIComponent(userToken)}&type=customer&userId=${encodeURIComponent(userId)}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Banner WebSocket connected");
      setSocketConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "order_update") {
          const updatedOrder = data.data;
          const currentData = queryClient.getQueryData<any>(["active-order"]);

          if (ACTIVE_STATUSES.has(updatedOrder.status)) {
            // Order is active, update the cache
            queryClient.setQueryData(["active-order"], {
              id: updatedOrder.id,
              status: updatedOrder.status,
              total_amount: updatedOrder.total,
              createdAt: updatedOrder.createdAt
            });
          } else if (currentData && currentData.id === updatedOrder.id) {
            // Order is no longer active, clear it from cache so banner hides
             queryClient.setQueryData(["active-order"], null);
          }
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      setSocketConnected(false);
    };

    ws.onerror = (error) => {
      setSocketConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isAuthenticated]);

  const { data: activeOrder = null } = useQuery<any>({
    queryKey: ["active-order"],
    queryFn: async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return null;
      const res = await fetch(getApiUrl("/api/orders/active"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: socketConnected ? false : 30000,
  });

  // Nothing to show
  if (!activeOrder || dismissed) return null;

  const config = getStatusConfig(activeOrder.status);

  const handleTrack = () => {
    navigate(`/track/${activeOrder.id}`);
  };

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        border-t ${config.bg}
        shadow-[0_-4px_24px_rgba(0,0,0,0.10)]
        transition-all duration-300 ease-in-out
        safe-area-pb
      `}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
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

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Active Order
          </p>
          <p className={`text-sm font-medium truncate ${config.accent}`}>
            {config.label}
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
          aria-label="Track your active order"
        >
          Track
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

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
