import { useEffect, useState, useCallback } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import { playNotificationSoundTwoTone } from "@/lib/notificationSound";
import { useAuth } from "@/hooks/useAuth";

interface ChefStatusUpdate {
  id: string;
  name: string;
  isActive: boolean;
  isCurrentlyOpen?: boolean; // computed status — preferred over isActive for customer-facing logic
}

interface ProductAvailabilityUpdate {
  id: string;
  name: string;
  isAvailable: boolean;
  stock?: number;
}

// Global singleton to ensure only one instance across all module imports
let globalManager: CustomerNotificationsManager | null = null;

// Singleton WebSocket manager to avoid duplicate connections
class CustomerNotificationsManager {
  private ws: WebSocket | null = null;
  private connecting = false;
  private listeners: Set<() => void> = new Set();
  private isFirstLoad = true;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // Start with 1 second
  private currentUserId: string | null = null;

  public wsConnected = false;
  public chefStatuses: Record<string, boolean> = {};
  public productAvailability: Record<string, { isAvailable: boolean; stock?: number }> = {};

  static getInstance(): CustomerNotificationsManager {
    if (!globalManager) {
      globalManager = new CustomerNotificationsManager();
    }
    return globalManager;
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    // Connect on first subscription
    if (!this.ws && !this.connecting) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  private connect() {
    if (this.ws || this.connecting) return;
    this.connecting = true;

    // Retrieve userId from local storage if not already set
    let userId = this.currentUserId;
    if (!userId) {
      try {
        const userDataStr = localStorage.getItem("userData");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData.id) {
            userId = userData.id;
            this.currentUserId = userId;
          }
        }
      } catch (e) {
        console.warn("Failed to parse userData in CustomerNotificationsManager:", e);
      }
    }

    const wsUrl = getWebSocketURL(userId ? `/ws?type=browser&userId=${userId}` : '/ws?type=browser');

    console.log("Customer WebSocket connecting to:", wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("Customer WebSocket connected for real-time updates");
      this.wsConnected = true;
      this.connecting = false;
      this.resetReconnectState(); // Reset reconnect attempts on successful connection
      this.notify();
      // Mark as not first load after connection established
      setTimeout(() => {
        this.isFirstLoad = false;
      }, 2000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Customer received WebSocket message:", data.type, data);

        if (data.type === "chef_status_update") {
          const chef = data.data as ChefStatusUpdate;
          // Use isCurrentlyOpen (computed: schedule + manual override) when available,
          // fall back to isActive (DB field) for backwards compatibility.
          const isNowOpen = chef.isCurrentlyOpen !== undefined ? chef.isCurrentlyOpen : chef.isActive;
          console.log(`Chef status updated: ${chef.name} isCurrentlyOpen=${isNowOpen}`);

          const wasOpen = this.chefStatuses[chef.id];
          // Show toast only if status actually changed and not first load
          if (!this.isFirstLoad && wasOpen !== undefined && wasOpen !== isNowOpen) {
            toast({
              title: isNowOpen ? "Kitchen Now Open" : "Kitchen Now Closed",
              description: `${chef.name} is ${isNowOpen ? "now accepting orders" : "currently closed"}`,
              variant: isNowOpen ? "default" : "destructive",
            });
          }

          // Store isCurrentlyOpen (computed) — not isActive (DB). This ensures
          // manual close + auto-schedule both correctly gate ordering on the client.
          this.chefStatuses = {
            ...this.chefStatuses,
            [chef.id]: isNowOpen
          };

          // Invalidate chef-related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/chefs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          this.notify();
        }

        if (data.type === "product_availability_update") {
          const product = data.data as ProductAvailabilityUpdate;
          console.log(`Product availability updated: ${product.name} is now ${product.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}`);

          const wasAvailable = this.productAvailability[product.id]?.isAvailable;
          // Show toast only if availability actually changed and not first load
          if (!this.isFirstLoad && wasAvailable !== undefined && wasAvailable !== product.isAvailable) {
            toast({
              title: product.isAvailable ? "Item Available" : "Item Unavailable",
              description: `${product.name} is ${product.isAvailable ? "now available" : "currently out of stock"}`,
              variant: product.isAvailable ? "default" : "destructive",
            });
          }

          this.productAvailability = {
            ...this.productAvailability,
            [product.id]: { isAvailable: product.isAvailable, stock: product.stock }
          };

          // Invalidate product queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          this.notify();
        }

        // Handle subscription_update messages
        if (data.type === "subscription_update") {
          const subscription = data.data;
          console.log("Subscription updated:", subscription.id, subscription.status);
          queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });

          // Show notification to user
          if (subscription.isPaid && subscription.status === "active") {
            toast({
              title: "Subscription Activated! 🎉",
              description: `Your subscription has been confirmed and is now active.`,
              duration: 5000,
            });
          }
        }

        // Handle custom_request_update messages (isolated updates)
        if (data.type === "custom_request_update") {
          const request = data.data;
          console.log("Custom request updated:", request.id, request.status);
          queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/requests"] });

          let title = "Custom Request Update";
          let message = "";

          if (request.status === "awaiting_payment") {
            title = "Custom Request Approved! 🎉";
            message = `Your custom request for ${request.rotiPerDay} rotis has been approved. Please complete payment.`;
          } else if (request.status === "paid") {
            title = "Payment Submitted! 💳";
            message = `Your payment for custom subscription has been submitted. Awaiting verification.`;
          } else if (request.status === "converted") {
            title = "Custom Subscription Active! 🚀";
            message = `Your custom subscription is now active! First delivery scheduled.`;
            queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
          } else if (request.status === "rejected") {
            title = "Custom Request Rejected ❌";
            message = `Your custom request was rejected: ${request.rejectionReason || "Reason not provided"}`;
          }

          if (message) {
            toast({
              title,
              description: message,
              duration: 6000,
            });

            // Add notification to bell store
            useNotificationStore.getState().addNotification({
              id: `custom_request_${request.id}-${request.status}`,
              orderId: `custom_${request.id}`,
              status: request.status,
              message,
            });

            try {
              playNotificationSoundTwoTone();
            } catch (err) {
              console.warn("Could not play notification sound:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("Customer WebSocket disconnected");
      this.wsConnected = false;
      this.ws = null;
      this.connecting = false;
      this.notify();
      // Auto-reconnect if there are listeners
      if (this.listeners.size > 0) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("Customer WebSocket error:", error);
      this.wsConnected = false;
      this.connecting = false;
      this.notify();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max WebSocket reconnection attempts reached");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s... capped at 30s
    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.ws && !this.connecting && this.listeners.size > 0) {
        console.log("Attempting WebSocket reconnection...");
        this.connect();
      }
    }, delay);
  }

  private resetReconnectState() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  getSnapshot() {
    return {
      wsConnected: this.wsConnected,
      chefStatuses: this.chefStatuses,
      productAvailability: this.productAvailability,
    };
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected = false;
    this.connecting = false;
    this.notify();
  }

  public updateUserId(userId: string | null) {
    if (this.currentUserId !== userId) {
      console.log(`👤 User ID changed in CustomerNotificationsManager from ${this.currentUserId} to ${userId}. Reconnecting WebSocket...`);
      this.currentUserId = userId;
      this.disconnect();
      this.connect();
    }
  }
}

const manager = CustomerNotificationsManager.getInstance();

export function useCustomerNotifications() {
  const [, forceUpdate] = useState({});
  const { user } = useAuth();
  const userId = user?.id || null;

  useEffect(() => {
    manager.updateUserId(userId);
  }, [userId]);

  useEffect(() => {
    return manager.subscribe(() => forceUpdate({}));
  }, []);

  const { wsConnected, chefStatuses, productAvailability } = manager.getSnapshot();

  const isChefOpen = useCallback((chefId: string): boolean | undefined => {
    return chefStatuses[chefId];
  }, [chefStatuses]);

  const isProductAvailable = useCallback((productId: string): { isAvailable: boolean; stock?: number } | undefined => {
    return productAvailability[productId];
  }, [productAvailability]);

  return {
    wsConnected,
    chefStatuses,
    productAvailability,
    isChefOpen,
    isProductAvailable,
  };
}