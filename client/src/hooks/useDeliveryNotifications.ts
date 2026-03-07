import { useEffect, useState, useRef, useCallback } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export function useDeliveryNotifications() {
  const [wsConnected, setWsConnected] = useState(false);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const processedOrderIds = useRef<Set<string>>(new Set());

  const fetchPendingBroadcasts = useCallback(async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      if (!token) return;

      const { default: api } = await import("@/lib/apiClient");
      const { data: pending } = await api.get("/api/notifications/pending");

      if (Array.isArray(pending) && pending.length > 0) {
        console.log(`📥 Recovered ${pending.length} pending broadcasts`);

        let newOrdersCountLocal = 0;
        const processedIds: string[] = [];

        pending.forEach((broadcast: any) => {
          if (["order_assigned", "order_confirmed", "new_prepared_order"].includes(broadcast.eventType)) {
            const order = broadcast.payload?.data || broadcast.payload?.order;
            if (order && !processedOrderIds.current.has(order.id)) {
              processedOrderIds.current.add(order.id);
              newOrdersCountLocal++;

              const notificationTitle =
                broadcast.eventType === "order_confirmed" ? "Order Ready for Pickup!" :
                  broadcast.eventType === "new_prepared_order" ? "New Order Available!" :
                    "New Delivery Assignment!";

              toast({
                title: `Recovered: ${notificationTitle}`,
                description: broadcast.payload?.message || `Order #${order.id.slice(0, 8)}`,
                duration: 10000,
              });

              if (Notification.permission === "granted") {
                new Notification(notificationTitle, {
                  body: broadcast.payload?.message || `Order #${order.id.slice(0, 8)}`,
                  icon: "/favicon.png",
                  tag: order.id,
                });
              }
            }
          }

          if (["order_assigned", "order_confirmed", "order_update", "new_prepared_order"].includes(broadcast.eventType)) {
            queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/delivery/available-orders"] });
          }

          processedIds.push(broadcast.id);
        });

        if (newOrdersCountLocal > 0) {
          setNewAssignmentsCount(prev => prev + newOrdersCountLocal);
          try {
            const alertAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            alertAudio.play().catch(() => { });
          } catch (_) { }
        }

        if (processedIds.length > 0) {
          await api.post("/api/notifications/mark-delivered", { ids: processedIds });
        }
      }
    } catch (error) {
      console.error("Failed to fetch pending delivery broadcasts:", error);
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    const token = localStorage.getItem("deliveryToken");
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    const wsUrl = getWebSocketURL(`/ws?type=delivery&token=${encodeURIComponent(token)}`);
    console.log("🚚 Delivery WebSocket connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmountedRef.current) return;
      console.log("✅ Delivery WebSocket connected");
      setWsConnected(true);
      fetchPendingBroadcasts();

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      const data = JSON.parse(event.data);
      console.log("📨 Delivery WS message:", data.type);

      if (["order_assigned", "order_confirmed", "order_update", "new_prepared_order"].includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/delivery/available-orders"] });

        if (["order_assigned", "order_confirmed", "new_prepared_order"].includes(data.type)) {
          const order = data.data || data.order;
          if (order && !processedOrderIds.current.has(order.id)) {
            processedOrderIds.current.add(order.id);
            setNewAssignmentsCount((prev) => prev + 1);

            const notificationTitle =
              data.type === "order_confirmed" ? "Order Ready for Pickup!" :
                data.type === "new_prepared_order" ? "New Order Available!" :
                  "New Delivery Assignment!";

            toast({
              title: notificationTitle,
              description: data.message || `Order #${order.id.slice(0, 8)}`,
              duration: 10000,
            });

            if (Notification.permission === "granted") {
              new Notification(notificationTitle, {
                body: data.message || `Order #${order.id.slice(0, 8)}`,
                icon: "/favicon.png",
                tag: order.id,
              });
            }

            try {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
              audio.play().catch(() => { });
            } catch (_) { }
          }
        }
      }
    };

    const scheduleReconnect = () => {
      if (isUnmountedRef.current) return;
      setWsConnected(false);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        console.log("🔄 Delivery WebSocket reconnecting...");
        connect();
      }, 3000);
    };

    ws.onclose = () => {
      console.log("❌ Delivery WebSocket disconnected");
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error("⚠️ Delivery WebSocket error:", error);
    };
  }, [fetchPendingBroadcasts]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("📱 App returned to foreground (Delivery)");
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connect();
          fetchPendingBroadcasts();
          queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/delivery/available-orders"] });
        }
      }
    };

    const handleOnline = () => {
      console.log("📶 Network back ONLINE (Delivery) — triggering recovery...");
      connect();
      fetchPendingBroadcasts();
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/available-orders"] });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [connect, fetchPendingBroadcasts]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const clearNewAssignmentsCount = () => {
    setNewAssignmentsCount(0);
  };

  return {
    wsConnected,
    newAssignmentsCount,
    requestNotificationPermission,
    clearNewAssignmentsCount,
  };
}