
import { useEffect, useState, useRef } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

export function usePartnerNotifications() {
  const [wsConnected, setWsConnected] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const processedOrderIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("partnerToken");
    if (!token) return;

    const wsUrl = getWebSocketURL(`/ws?type=chef&token=${encodeURIComponent(token)}`);

    console.log("Partner WebSocket connecting to:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Partner WebSocket connected for notifications");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Partner received WebSocket message:", data.type, data);

        if (data.type === "chef_status_update") {
          console.log("🔄 Chef status updated:", data.data);
          // Invalidate chef query to refresh status immediately
          queryClient.invalidateQueries({ queryKey: ["/api/partner/chef"] });
          queryClient.invalidateQueries({ queryKey: ["/api/chefs"] });
        }

        if (data.type === "new_order" || data.type === "order_update") {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/income-report"] });

          // Show notification
          if (data.type === "new_order") {
            const order = data.data as Order;

            // Only increment once per order - prevent duplicate counts
            if (!processedOrderIds.current.has(order.id)) {
              processedOrderIds.current.add(order.id);
              setNewOrdersCount((prev) => prev + 1);
              console.log(`✅ New order notification counted for ${order.id.slice(0, 8)}`);
            }

            // Always show in-app toast so chef sees the alert even if browser notifications blocked
            toast({
              title: "🍽️ New Order Received!",
              description: `Order #${order.id.slice(0, 8)} - ₹${order.total} from ${order.customerName}`,
              duration: 8000,
            });

            // Browser notification (if permission granted)
            if (Notification.permission === "granted") {
              new Notification("New Order Received!", {
                body: `Order #${order.id.slice(0, 8)} - ₹${order.total} from ${order.customerName}`,
                icon: "/favicon.png",
                tag: order.id,
              });

              // Play sound
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
              audio.play().catch(() => { });
            }
          } else if (data.type === "order_update") {
            const order = data.data as Order;
            console.log("🔔 Partner received order update:", {
              orderId: order.id.slice(0, 8),
              status: order.status,
              paymentStatus: order.paymentStatus
            });

            // Show in-app toast for admin-confirmed orders too
            toast({
              title: "✅ Order Confirmed - Action Required!",
              description: `Order #${order.id.slice(0, 8)} - ₹${order.total} is ready to accept.`,
              duration: 8000,
            });

            if (order.status === "confirmed" && order.paymentStatus === "confirmed" && Notification.permission === "granted") {
              // Only increment once per order - prevent duplicate counts
              if (!processedOrderIds.current.has(order.id)) {
                processedOrderIds.current.add(order.id);
                setNewOrdersCount((prev) => prev + 1);
                console.log(`✅ Admin confirmed order notification counted for ${order.id.slice(0, 8)}`);
              }

              new Notification("New Order Confirmed!", {
                body: `Order #${order.id.slice(0, 8)} - ₹${order.total} is ready for you to accept!`,
                icon: "/favicon.png",
                tag: order.id,
              });

              // Play sound for admin-confirmed orders
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
              audio.play().catch(() => { });

              // Refetch orders to show the new order
              queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
            } else if (order.status === "prepared" && Notification.permission === "granted") {
              new Notification("Order Prepared!", {
                body: `Order #${order.id.slice(0, 8)} is now prepared and ready for pickup.`,
                icon: "/favicon.png",
                tag: order.id,
              });

              // Play a different sound for prepared orders
              const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV9vT19/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v78=");
              audio.play().catch(() => { });
            }
          }
        }

        if (data.type === "subscription_update") {
          console.log("📅 Subscription update received");
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscriptions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscription-deliveries"] });

          // Show toast notification for subscription updates
          toast({
            title: "Subscription Updated",
            description: `${data.data?.customerName || 'Customer'} - ${data.data?.planName || 'Subscription'}`,
          });
        }

        if (data.type === "subscription_assigned") {
          console.log("✅ NEW SUBSCRIPTION ASSIGNED:", data.data);

          const subscriptionData = data.data;

          // Invalidate queries to refresh subscription data
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscriptions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/subscription-deliveries"] });
          queryClient.invalidateQueries({ queryKey: ["/api/partner/dashboard/metrics"] });

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Subscription Assigned! 🎉", {
              body: `${subscriptionData.customerName} - ${subscriptionData.planName}\nDelivery: ${subscriptionData.nextDeliveryDate}`,
              icon: "/favicon.png",
              tag: subscriptionData.subscriptionId,
            });

            // Play notification sound
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            audio.play().catch(() => { });
          }

          // Show toast notification
          toast({
            title: "New Subscription Assigned! 🎉",
            description: `${subscriptionData.customerName} - ${subscriptionData.planName}\nNext Delivery: ${new Date(subscriptionData.nextDeliveryDate).toLocaleDateString()}`,
          });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Partner WebSocket disconnected");
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("Partner WebSocket error:", error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
    processedOrderIds.current.clear();
  };

  return {
    wsConnected,
    newOrdersCount,
    requestNotificationPermission,
    clearNewOrdersCount,
  };
}
