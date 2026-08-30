import { useEffect, useState } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/apiClient";
import type { Order } from "@shared/schema";

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastNotificationType, setLastNotificationType] = useState<"order" | "subscription">("order");

  const { data: pendingPayments = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin", "orders", "pending-payments"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await api.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allOrders = response.data;
        return allOrders.filter(
          (order: Order) =>
            order.paymentStatus === "pending" || order.paymentStatus === "paid"
        );
      } catch (error) {
        throw new Error("Failed to fetch orders");
      }
    },
    refetchInterval: false,
  });

  const { data: pendingSubscriptions = [] } = useQuery({
    queryKey: ["/api/admin/custom-subscription-requests", "pending"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await api.get("/api/admin/custom-subscription-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allRequests = response.data;
        // Include pending assignments and pending payments as pending subscriptions
        return allRequests.filter(
          (req: any) => req.status === "pending_chef_assignment" || req.status === "paid"
        );
      } catch (error) {
        console.error("Failed to fetch pending custom subscriptions", error);
        return [];
      }
    },
    refetchInterval: false,
  });

  useEffect(() => {
    setUnreadCount(pendingPayments.length + pendingSubscriptions.length);
  }, [pendingPayments, pendingSubscriptions]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const wsUrl = getWebSocketURL(`/ws?type=admin&token=${encodeURIComponent(token)}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Admin WebSocket connected for notifications");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_order" || data.type === "order_update") {
        const order = data.data as Order;

        // Invalidate all order queries for real-time updates
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        if (data.type === "new_order" && order.paymentStatus === "pending") {
          // New order created (waiting for payment)
          setLastNotificationType("order");
          setUnreadCount((prev) => prev + 1);
          if (Notification.permission === "granted") {
            new Notification("New Order Placed", {
              body: `Order #${order.id.slice(0, 8)} - ₹${order.total} from ${order.customerName}. Waiting for payment.`,
              icon: "/favicon.ico",
            });
          }
        } else if (data.type === "order_update" && order.paymentStatus === "paid") {
          // User checked the box and submitted their payment
          setLastNotificationType("order");
          setUnreadCount((prev) => prev + 1);
          if (Notification.permission === "granted") {
            new Notification("Payment Submitted", {
              body: `Customer ${order.customerName} has confirmed payment for Order #${order.id.slice(0, 8)}. Please verify.`,
              icon: "/favicon.ico",
            });
          }
        }
      }

      // Handle new custom subscription request
      if (data.type === "new_custom_subscription_request") {
        const request = data.data;

        // Invalidate custom subscription queries
        queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-subscription-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        setLastNotificationType("subscription");
        setUnreadCount((prev) => prev + 1);

        toast({
          title: "New Custom Request 🍽️",
          description: `${request.customerName} requested ${request.rotiPerDay} rotis/day.`,
          duration: 7000,
        });

        if (Notification.permission === "granted") {
          new Notification("New Custom Subscription Request", {
            body: `${request.customerName} requested ${request.rotiPerDay} rotis/day`,
            icon: "/favicon.ico",
          });

          // Play notification sound
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
          audio.play().catch(() => { });
        }
      }

      // Handle custom request status updates (e.g. user submitted payment)
      if (data.type === "custom_request_update") {
        const request = data.data;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-subscription-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        if (request.status === "paid") {
          setLastNotificationType("subscription");
          setUnreadCount((prev) => prev + 1);

          toast({
            title: "Custom Request Payment 💳",
            description: `${request.customerName} submitted payment (TxnID: ${request.paymentTransactionId || 'N/A'})`,
            duration: 8000,
          });

          if (Notification.permission === "granted") {
            new Notification("Custom Request Payment Received", {
              body: `${request.customerName} submitted payment. Verify to activate subscription.`,
              icon: "/favicon.ico",
            });

            // Play notification sound
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            audio.play().catch(() => { });
          }
        }
      }

      // Handle new subscription created notification
      if (data.type === "new_subscription_created") {
        const subscriptionData = data.data;

        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        setLastNotificationType("subscription");
        setUnreadCount((prev) => prev + 1);

        toast({
          title: "New Subscription",
          description: `${subscriptionData.customerName} (${subscriptionData.phone}) subscribed to ${subscriptionData.planName}`,
          duration: 5000,
        });

        if (Notification.permission === "granted") {
          new Notification("New Subscription Created", {
            body: `${subscriptionData.customerName} subscribed to ${subscriptionData.planName}`,
            icon: "/favicon.ico",
          });

          // Play notification sound
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
          audio.play().catch(() => { });
        }
      }

      // Handle subscription payment verification
      if (data.type === "subscription_update") {
        const subscription = data.data;

        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        // Show notification if payment transaction ID was just added (user confirmed payment)
        if (subscription.paymentTransactionId && !subscription.isPaid) {
          setLastNotificationType("subscription");
          setUnreadCount((prev) => prev + 1);

          toast({
            title: "Subscription Payment",
            description: `${subscription.customerName} submitted payment (TxnID: ${subscription.paymentTransactionId.slice(0, 12)}...)`,
            duration: 5000,
          });

          if (Notification.permission === "granted") {
            new Notification("Subscription Payment Pending", {
              body: `${subscription.customerName} - Verify payment to activate subscription`,
              icon: "/favicon.ico",
            });

            // Play notification sound
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
            audio.play().catch(() => { });
          }
        }
      }

      // Handle subscription payment pending notification (specific event)
      if (data.type === "subscription_payment_pending") {
        const subscriptionData = data.data;

        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

        setLastNotificationType("subscription");
        setUnreadCount((prev) => prev + 1);

        toast({
          title: "New Subscription Payment",
          description: `${subscriptionData.customerName} - ${subscriptionData.planName} (₹${subscriptionData.amount})`,
          duration: 7000,
        });

        if (Notification.permission === "granted") {
          new Notification("Subscription Payment Pending Verification", {
            body: `${subscriptionData.customerName} - ${subscriptionData.planName} - TxnID: ${subscriptionData.paymentTransactionId.slice(0, 12)}...`,
            icon: "/favicon.ico",
          });

          // Play notification sound
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=");
          audio.play().catch(() => { });
        }
      }

      if (data.type === "chef_status_update") {
        console.log("🔄 Chef status updated:", data.data);
        // Invalidate chefs query to refresh the list immediately
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/chefs"] });
      } else if (data.type === "manual_assignment_required") {
        toast({
          title: "⚠️ Manual Assignment Required",
          description: data.message,
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });
      } else if (data.type === "overdue_chef_preparation") {
        toast({
          title: "⚠️ Chef Not Preparing",
          description: data.message,
          variant: "destructive",
          duration: 10000,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/overdue-preparations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/today-deliveries"] });
      } else if (data.type === "chef_unavailable_with_subscriptions") {
        toast({
          title: "🔴 Chef Unavailable - Reassignment Needed",
          description: data.message,
          variant: "destructive",
          duration: 15000,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
      }
    };

    ws.onclose = () => {
      console.log("Admin WebSocket disconnected");
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("Admin WebSocket error:", error);
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

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return {
    unreadCount,
    wsConnected,
    pendingPayments,
    lastNotificationType,
    requestNotificationPermission,
    clearUnreadCount,
  };
}