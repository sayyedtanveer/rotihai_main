import { useEffect, useState, useRef, useCallback } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useDeliveryNotificationStore } from "@/store/deliveryNotificationStore";

export function useDeliveryNotifications() {
  const [wsConnected, setWsConnected] = useState(false);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);
  const addNotification = useDeliveryNotificationStore((s) => s.addNotification);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const processedOrderIds = useRef<Set<string>>(new Set());

  const fetchPendingBroadcasts = useCallback(async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      console.log("[NOTIFICATIONS] Step 1️⃣ Token check:", !!token, `Length: ${token?.length || 0}`);
      
      if (!token) {
        console.log("[NOTIFICATIONS] ⏸️ No token, skipping fetch");
        return;
      }

      // Step 2: Log token structure
      console.log("[NOTIFICATIONS] Step 2️⃣ Token structure valid:", {
        startsWithEyJ: token.startsWith('eyJ'),
        hasDots: token.includes('.'),
        length: token.length
      });

      const { default: api } = await import("@/lib/apiClient");
      console.log("[NOTIFICATIONS] Step 3️⃣ API/axios imported successfully");
      
      // Step 4: Make the request - interceptor will add Authorization header
      console.log("[NOTIFICATIONS] Step 4️⃣ Making request to /api/notifications/pending");
      const { data: pending } = await api.get("/api/notifications/pending");
      
      console.log("[NOTIFICATIONS] Step 5️⃣ ✅ SUCCESS! Received pending:", pending?.length || 0, 'items');

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

              const notificationMessage = broadcast.payload?.message || `Order #${order.id.slice(0, 8)}`;

              // Add to notification store for bell dropdown
              addNotification({
                id: `recovered_${order.id}`,
                orderId: order.id,
                status: broadcast.eventType === "order_confirmed" ? "ready" : "assigned",
                message: notificationMessage,
              });

              toast({
                title: `Recovered: ${notificationTitle}`,
                description: notificationMessage,
                duration: 10000,
              });

              if (Notification.permission === "granted") {
                new Notification(notificationTitle, {
                  body: notificationMessage,
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
    } catch (error: any) {
      // Log all error details
      console.error("[NOTIFICATIONS] ❌ ERROR at some step:");
      console.error("[NOTIFICATIONS] Error type:", error?.name);
      console.error("[NOTIFICATIONS] Error message:", error?.message);
      console.error("[NOTIFICATIONS] Status code:", error?.response?.status);
      console.error("[NOTIFICATIONS] Response data:", error?.response?.data);
      console.error("[NOTIFICATIONS] URL:", error?.config?.url);
      console.error("[NOTIFICATIONS] Request headers:", {
        hasAuth: !!error?.config?.headers?.Authorization,
        authStartsWith: error?.config?.headers?.Authorization?.substring(0, 20)
      });
      
      // Silently catch - notifications are non-critical
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    const token = localStorage.getItem("deliveryToken");
    if (!token) {
      console.log("[WS-DELIVERY] No token found, skipping connection");
      setWsConnected(false);
      return;
    }

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
      // ✅ Only fetch pending broadcasts if we're still mounted
      if (!isUnmountedRef.current) {
        fetchPendingBroadcasts();
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Delivery WS message:", data.type);

        if (["order_assigned", "order_confirmed", "order_update", "new_prepared_order"].includes(data.type)) {
          queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/delivery/available-orders"] });
        }

        if (["order_assigned", "order_confirmed", "new_prepared_order"].includes(data.type)) {
          const order = data.data || data.order;
          if (order && !processedOrderIds.current.has(order.id)) {
            processedOrderIds.current.add(order.id);
            setNewAssignmentsCount((prev) => prev + 1);

            const notificationTitle =
              data.type === "order_confirmed" ? "Order Ready for Pickup!" :
                data.type === "new_prepared_order" ? "New Order Available!" :
                  "New Delivery Assignment!";

            const notificationMessage = data.message || `Order #${order.id.slice(0, 8)}`;

            // Add to notification store for bell dropdown
            addNotification({
              id: `${data.type}_${order.id}`,
              orderId: order.id,
              status: data.type === "order_confirmed" ? "ready" : "assigned",
              message: notificationMessage,
            });

            toast({
              title: notificationTitle,
              description: notificationMessage,
              duration: 10000,
            });

            if (Notification.permission === "granted") {
              new Notification(notificationTitle, {
                body: notificationMessage,
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
      } catch (error) {
        console.error("[WS-MESSAGE] Error processing WebSocket message:", error);
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
      console.log("❌ [WS-DELIVERY] WebSocket disconnected");
      console.log("[WS-DELIVERY] Checking if token still exists:", !!localStorage.getItem("deliveryToken"));
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error("⚠️ [WS-DELIVERY] WebSocket error:", error);
      console.error("[WS-DELIVERY] Token state:", !!localStorage.getItem("deliveryToken"));
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
        // ✅ Check token still exists before attempting operations
        const token = localStorage.getItem("deliveryToken");
        if (!token) {
          console.log("[DELIVERY-VISIBILITY] Token missing, not reconnecting");
          return;
        }
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
      // ✅ Check token still exists before attempting operations
      const token = localStorage.getItem("deliveryToken");
      if (!token) {
        console.log("[DELIVERY-ONLINE] Token missing, not recovering");
        return;
      }
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

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const clearNewAssignmentsCount = useCallback(() => {
    setNewAssignmentsCount(0);
  }, []);

  return {
    wsConnected,
    newAssignmentsCount,
    requestNotificationPermission,
    clearNewAssignmentsCount,
  };
}