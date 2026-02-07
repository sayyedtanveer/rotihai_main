/**
 * usePushNotifications Hook
 * Manages push notification registration and subscription lifecycle
 * Optional feature - gracefully handles when push is not available
 */

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  vapidPublicKey: string | null;
}

export function usePushNotifications(userId: string | null, userType: "admin" | "chef" | "delivery" | "customer" | null) {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
    vapidPublicKey: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.log("ℹ️ Push notifications not supported in this browser");
    }
  }, []);

  // Register service worker and set up push
  const registerPush = async () => {
    if (!state.isSupported || !userId || !userType) {
      console.log("⚠️ Push registration not possible - missing requirements");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission
      if (Notification.permission === "denied") {
        throw new Error("Notification permission has been denied");
      }

      let permission: NotificationPermission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error("Notification permission not granted");
      }

      // Register service worker
      let swReg: ServiceWorkerRegistration;
      try {
        swReg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("✅ Service Worker registered for push");
      } catch (error: any) {
        console.log("ℹ️ Service Worker registration:", error.message);
        // Service Worker might already be registered
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) throw error;
        swReg = reg;
      }

      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/push/vapid-public-key");
      if (!vapidResponse.ok) {
        throw new Error("Failed to fetch VAPID public key");
      }

      const { vapidPublicKey } = await vapidResponse.json();
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not available - push not configured on server");
      }

      // Convert base64 key to Uint8Array
      const vapidKey = new Uint8Array(
        atob(vapidPublicKey)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      // Subscribe to push notifications
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      console.log("✅ Push subscription created");

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
          userType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register push subscription on server");
      }

      console.log("✅ Push notification registered successfully");

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        vapidPublicKey,
        isLoading: false,
      }));

      toast({
        title: "Push Notifications Enabled",
        description: "You will receive notifications even when the browser is closed",
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Push registration error:", error);
      const errorMessage = error.message || "Failed to register push notifications";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Only show toast if it's a real error (not just unsupported)
      if (state.isSupported) {
        toast({
          title: "Push Notification Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  // Unsubscribe from push notifications
  const unregisterPush = async () => {
    if (!userId || !userType) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const swReg = await navigator.serviceWorker.getRegistration();
      if (swReg) {
        const subscription = await swReg.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log("✅ Push subscription removed from browser");
        }
      }

      // Notify server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, userType }),
      });

      console.log("✅ Push notification unregistered");

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: "Push Notifications Disabled",
        description: "You will no longer receive background notifications",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Push unsubscription error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  };

  return {
    ...state,
    registerPush,
    unregisterPush,
  };
}
