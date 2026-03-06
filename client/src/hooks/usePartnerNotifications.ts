
import { useEffect, useState, useRef, useCallback } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { usePartnerNotificationStore } from "@/store/partnerNotificationStore";

export function usePartnerNotifications() {
  const [wsConnected, setWsConnected] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const processedOrderIds = useRef<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const addNotification = usePartnerNotificationStore((s) => s.addNotification);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    const token = localStorage.getItem("partnerToken");
    if (!token) return;

    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    const wsUrl = getWebSocketURL(`/ws?type=chef&token=${encodeURIComponent(token)}`);
    console.log("🔌 Partner WebSocket connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmountedRef.current) return;
      console.log("✅ Partner WebSocket connected");
      setWsConnected(true);
      // Clear any pending reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      // Start heartbeat ping
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 20000); // 20 second heartbeat to keep connection alive
    };

    ws.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Partner WS message:", data.type);

        if (data.type === "chef_status_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/partner/chef"] });
          queryClient.invalidateQueries({ queryKey: ["/api/chefs"] });
        }

        if (data.type === "new_order" || data.type === "order_update") {
          // Always immediately refresh the orders list
          queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/income-report"] });

          if (data.type === "new_order") {
            const order = data.data as Order;

            if (!processedOrderIds.current.has(order.id)) {
              processedOrderIds.current.add(order.id);
              setNewOrdersCount((prev) => prev + 1);
              // Add to persistent notification store (shows in bell dropdown)
              addNotification({
                id: `new_${order.id}`,
                orderId: order.id,
                status: "pending",
                message: `🍴 New order from ${order.customerName} — ₹${order.total}`,
                total: order.total,
                customerName: order.customerName,
              });
            }

            // Always show in-app toast (never gated on browser permission)
            toast({
              title: "🍽️ New Order Received!",
              description: `Order #${order.id.slice(0, 8)} — ₹${order.total} from ${order.customerName}`,
              duration: 10000,
            });

            // Always play alert sound — no browser permission needed for audio
            try {
              const alertAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
              alertAudio.play().catch(() => { });
            } catch (_) { }
            // Browser notification popup (only if permission granted)
            if (Notification.permission === "granted") {
              new Notification("New Order Received!", {
                body: `Order #${order.id.slice(0, 8)} — ₹${order.total} from ${order.customerName}`,
                icon: "/favicon.png",
                tag: order.id,
              });
            }
          } else if (data.type === "order_update") {
            const order = data.data as Order;
            console.log("🔔 Partner order update:", order.id.slice(0, 8), "status:", order.status);

            if (order.status === "confirmed" && order.paymentStatus === "confirmed") {
              if (!processedOrderIds.current.has(order.id)) {
                processedOrderIds.current.add(order.id);
                setNewOrdersCount((prev) => prev + 1);
                // Add to persistent notification store (shows in bell dropdown)
                addNotification({
                  id: `confirmed_${order.id}`,
                  orderId: order.id,
                  status: "confirmed",
                  message: `✅ Order #${order.id.slice(0, 8)} confirmed — ₹${order.total} from ${order.customerName}. Ready to accept!`,
                  total: order.total,
                  customerName: order.customerName,
                });
              }

              // Always show in-app toast
              toast({
                title: "✅ Order Confirmed — Action Required!",
                description: `Order #${order.id.slice(0, 8)} — ₹${order.total} is ready to accept.`,
                duration: 10000,
              });

              // Always play alert sound
              try {
                const confirmAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
                confirmAudio.play().catch(() => { });
              } catch (_) { }
              // Browser notification popup (only if permission granted)
              if (Notification.permission === "granted") {
                new Notification("New Order Confirmed!", {
                  body: `Order #${order.id.slice(0, 8)} — ₹${order.total} ready to accept!`,
                  icon: "/favicon.png",
                  tag: order.id,
                });
              }
            }
          }
        }

        if (data.type === "subscription_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscriptions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscription-deliveries"] });
          toast({
            title: "Subscription Updated",
            description: `${data.data?.customerName || "Customer"} — ${data.data?.planName || "Subscription"}`,
          });
        }

        if (data.type === "subscription_assigned") {
          const subscriptionData = data.data;
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscriptions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscription-deliveries"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });

          toast({
            title: "New Subscription Assigned! 🎉",
            description: `${subscriptionData.customerName} — ${subscriptionData.planName}`,
          });

          if (Notification.permission === "granted") {
            new Notification("New Subscription Assigned! 🎉", {
              body: `${subscriptionData.customerName} — ${subscriptionData.planName}`,
              icon: "/favicon.png",
              tag: subscriptionData.subscriptionId,
            });
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            audio.play().catch(() => { });
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    const scheduleReconnect = () => {
      if (isUnmountedRef.current) return;
      setWsConnected(false);
      // Reconnect after 3 seconds
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        console.log("🔄 Partner WebSocket reconnecting...");
        connect();
      }, 3000);
    };

    ws.onclose = (event) => {
      console.log("❌ Partner WebSocket closed:", event.code, event.reason);
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error("⚠️ Partner WebSocket error:", error);
      // onclose will fire after onerror, triggering the reconnect
    };
  }, []);

  // Set up visibility change listener for instant reconnect when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("📱 App returned to foreground");
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          console.log("🔄 Instant foreground reconnect triggered");
          connect();
          // Force a full refetch of orders to catch anything missed while backgrounded
          queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [connect]);

  // ✅ CRITICAL FIX: Detect when network reconnects after coming back online
  // This handles the case where chef was offline (WiFi off / away from phone)
  // When network restores, we must:
  //   1. Reconnect the WebSocket immediately
  //   2. Refetch all data to get orders missed while offline
  //   3. Synthesize notifications for any missed orders so nothing is silent
  useEffect(() => {
    let offlineAt: number | null = null; // Track when we went offline

    const handleOffline = () => {
      offlineAt = Date.now();
      console.log("📴 Network went OFFLINE at:", new Date(offlineAt).toISOString());
      setWsConnected(false);
      // Clear reconnect timers — no point retrying while network is down
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const handleOnline = async () => {
      console.log("📶 Network back ONLINE — triggering full recovery...");

      // Step 1: Immediately reconnect WebSocket
      connect();

      // Step 2: Invalidate all cached partner queries to force fresh fetch
      queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/income-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/subscription-deliveries"] });

      // Step 3: Fetch orders placed while offline and generate missed notifications
      try {
        const token = localStorage.getItem("partnerToken");
        if (!token) return;

        // Use a short since window (last 2 hours) to catch any missed orders
        const sinceMs = offlineAt || Date.now() - 2 * 60 * 60 * 1000;
        const sinceISO = new Date(sinceMs - 5000).toISOString(); // 5 second buffer

        const { default: api } = await import("@/lib/apiClient");
        const response = await api.get("/api/partner/orders");
        const allOrders: Order[] = response.data || [];

        // Find orders created AFTER we went offline (missed while network was down)
        const missedOrders = allOrders.filter((order: Order) => {
          const rawDate = order.createdAt as unknown as string | Date;
          const orderTime = new Date(rawDate).getTime();
          return orderTime >= sinceMs && !processedOrderIds.current.has(order.id);
        });

        if (missedOrders.length > 0) {
          console.log(`📬 Found ${missedOrders.length} missed order(s) while offline — generating notifications...`);

          // Show a summary toast first
          toast({
            title: `📶 Back Online — ${missedOrders.length} Order${missedOrders.length > 1 ? "s" : ""} Received While Offline!`,
            description: `You missed ${missedOrders.length} order(s). Check your order list.`,
            duration: 10000,
          });

          // Generate individual notifications for each missed order
          missedOrders.forEach((order: Order) => {
            processedOrderIds.current.add(order.id);
            setNewOrdersCount((prev) => prev + 1);

            addNotification({
              id: `missed_${order.id}`,
              orderId: order.id,
              status: order.status,
              message: `📲 Missed order from ${order.customerName} — ₹${order.total} (placed while offline)`,
              total: order.total,
              customerName: order.customerName,
            });

            // Browser push notification for each missed order
            if (Notification.permission === "granted") {
              new Notification("Missed Order While Offline!", {
                body: `Order #${order.id.slice(0, 8)} — ₹${order.total} from ${order.customerName}`,
                icon: "/favicon.png",
                tag: `missed_${order.id}`,
              });
            }
          });

          // Play alert sound once for the batch
          try {
            const alertAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            alertAudio.play().catch(() => { });
          } catch (_) { }
        } else {
          console.log("✅ No missed orders while offline.");
          toast({
            title: "📶 Back Online",
            description: "Connection restored. Orders are up to date.",
            duration: 4000,
          });
        }
      } catch (err) {
        console.warn("⚠️ Could not fetch missed orders after reconnect:", err);
        // Non-fatal: the 30s polling will catch orders soon anyway
      }

      offlineAt = null; // Reset offline timestamp
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [connect, addNotification]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
    processedOrderIds.current.clear();
  };

  const disconnect = useCallback(() => {
    console.log("🔌 Manual logout - disconnecting WebSocket");
    isUnmountedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  return {
    wsConnected,
    newOrdersCount,
    requestNotificationPermission,
    clearNewOrdersCount,
    disconnect,
  };
}
