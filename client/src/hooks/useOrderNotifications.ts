import { useEffect, useState } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { useAuth } from "./useAuth";
import { queryClient } from "@/lib/queryClient";
import { useNotificationStore } from "@/store/notificationStore";
import { playNotificationSoundTwoTone } from "@/lib/notificationSound";
import { useToast } from "./use-toast";
import api from "@/lib/apiClient";
import type { Order } from "@/types/order";

// Get notification message based on order status
const getNotificationMessage = (status: string, deliveryPersonName?: string) => {
  switch (status) {
    case "pending":
      return {
        title: "📋 Order Received",
        description: "Your order has been received. Waiting for admin confirmation..."
      };
    case "confirmed":
      return {
        title: "✅ Order Confirmed",
        description: "Payment verified! Your order has been confirmed."
      };
    case "accepted_by_chef":
      return {
        title: "👨‍🍳 Chef Accepted",
        description: "A chef has accepted your order and will start preparing it."
      };
    case "preparing":
      return {
        title: "🔥 Preparing",
        description: "Your food is being prepared. It will be ready soon!"
      };
    case "prepared":
      return {
        title: "✨ Ready for Pickup",
        description: "Your food is ready! Delivery person will arrive soon to pick it up."
      };
    case "accepted_by_delivery":
      return {
        title: "🚗 Delivery Accepted",
        description: deliveryPersonName 
          ? `${deliveryPersonName} has accepted your delivery order`
          : "A delivery person has accepted your order"
      };
    case "out_for_delivery":
      return {
        title: "🚚 On the Way",
        description: deliveryPersonName
          ? `${deliveryPersonName} is on the way with your order`
          : "Your order is on the way to you!"
      };
    case "delivered":
    case "completed":
      return {
        title: "🎉 Order Delivered",
        description: "Your order has been delivered! We hope you enjoyed it. Please rate us!"
      };
    case "cancelled":
      return {
        title: "❌ Order Cancelled",
        description: "Your order has been cancelled."
      };
    default:
      return {
        title: "📦 Order Update",
        description: `Order status updated to ${status}`
      };
  }
};

/**
 * Custom hook to handle order notifications globally
 * Connects WebSocket for active orders and shows toast + sound + bell notifications
 * Works on ANY page, not just MyOrders
 */
export function useOrderNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotificationStore();
  const userToken = localStorage.getItem("userToken");
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!user || !userToken) return;

    // Fetch orders first
    const fetchOrders = async () => {
      try {
        const response = await api.get("/api/orders", {
          headers: { "Content-Type": "application/json" },
        });
        
        const orders: Order[] = response.data;
        
        // Find active orders (not delivered or cancelled)
        const activeOrders = orders.filter(
          (order) => !["delivered", "completed", "cancelled"].includes(order.status)
        );

        if (activeOrders.length === 0) return;

        const wsConnections: WebSocket[] = [];

        activeOrders.forEach((order) => {
          const wsUrl = getWebSocketURL(`/ws?type=customer&orderId=${order.id}`);
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log(`🔌 WebSocket connected for order ${order.id}`);
            setWsConnected(true);
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📨 WebSocket message received:", data);
            
            if (data.type === "order_update") {
              const updatedOrder = data.data;
              const oldData = queryClient.getQueryData<Order[]>(["/api/orders", userToken]);
              const previousOrder = oldData?.find(o => o.id === updatedOrder.id);
              
              console.log(`📊 Order ${updatedOrder.id} - Previous status: ${previousOrder?.status}, New status: ${updatedOrder.status}`);
              
              // Update cache
              queryClient.setQueryData(["/api/orders", userToken], (oldData: Order[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
              });

              // Show notification if status changed (or first time)
              const statusChanged = !previousOrder || previousOrder.status !== updatedOrder.status;
              
              if (statusChanged) {
                const notification = getNotificationMessage(updatedOrder.status, updatedOrder.deliveryPersonName);
                
                console.log(`🎉 Showing notification for order ${updatedOrder.id}:`, notification);
                
                // Show toast on ANY page
                toast({
                  title: notification.title,
                  description: notification.description,
                  duration: 5000,
                  className: (updatedOrder.status === "pending" || updatedOrder.status === "confirmed") 
                    ? "bg-green-600 text-white border-none shadow-xl" 
                    : undefined,
                });

                // Add to notification store (for bell icon)
                addNotification({
                  id: `${updatedOrder.id}-${updatedOrder.status}`,
                  orderId: updatedOrder.id,
                  status: updatedOrder.status,
                  message: notification.description,
                });

                // Play notification sound on ANY page
                playNotificationSoundTwoTone();

                console.log(`📢 Order ${updatedOrder.id} status changed to ${updatedOrder.status}`);
              } else {
                console.log(`⏭️ Skipping notification - status unchanged for order ${updatedOrder.id}`);
              }
            }
          };

          ws.onclose = () => {
            console.log(`WebSocket disconnected for order ${order.id}`);
          };

          ws.onerror = (error) => {
            console.error(`WebSocket error for order ${order.id}:`, error);
          };

          wsConnections.push(ws);
        });

        return () => {
          wsConnections.forEach((ws) => ws.close());
          setWsConnected(false);
        };
      } catch (error) {
        console.error("Error fetching orders for notifications:", error);
      }
    };

    fetchOrders();
  }, [user, userToken]);

  return { wsConnected };
}
