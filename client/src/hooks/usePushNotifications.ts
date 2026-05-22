﻿/**
 * usePushNotifications Hook
 * Manages push notification registration and subscription lifecycle
 * Optional feature - gracefully handles when push is not available
 */
import { getApiUrl } from "@/lib/apiBase";
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
      "Notification" in window &&
      window.isSecureContext; // ✅ CRITICAL: Must be HTTPS (or localhost)

    console.log("[PUSH] Support check:", {
      serviceWorker: "serviceWorker" in navigator,
      PushManager: "PushManager" in window,
      Notification: "Notification" in window,
      isSecureContext: window.isSecureContext,
      isSupported,
    });

    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.warn("⚠️ Push notifications not supported:", {
        reason: window.isSecureContext ? "Browser API missing" : "HTTPS required (or localhost)",
        hostname: window.location.hostname,
        protocol: window.location.protocol,
      });
    }
  }, []);

  // ✅ NEW: Auto-register push on user login (request permission upfront)
  // This is similar to how YouTube, Gmail, and Facebook do it
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    // Only auto-register if userId is present (user is logged in)
    if (!userId || !userType) {
      console.log("[PUSH] ℹ️ Not auto-registering - missing userId or userType");
      return;
    }

    console.log(`[PUSH] 🔄 Auto-registering push notifications for ${userType} ${userId}...`);
    
    // Attempt registration (deduplication handled by checking isSubscribed state)
    if (!state.isSubscribed) {
      registerPushInternal();
    }
  }, [state.isSupported, userId, userType]);

  // Register service worker and set up push
  const registerPushInternal = async () => {
    if (!state.isSupported || !userId || !userType) {
      console.log("⚠️ Push registration not possible - missing requirements");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // ✅ REQUEST PERMISSION FIRST (show to user)
      // Don't check denied status - always ask
      let permission: NotificationPermission = Notification.permission;
      
      console.log("[PUSH] Current permission:", permission);

      if (permission === "default") {
        console.log("[PUSH] Requesting notification permission from user...");
        permission = await Notification.requestPermission();
        console.log("[PUSH] User responded with:", permission);
      }

      if (permission !== "granted") {
        // User denied or dismissed - just log, don't show error toast
        console.log("[PUSH] ℹ️ Notification permission not granted (user choice)");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      console.log("[PUSH] ✅ Permission granted, proceeding with registration...");

      // Register / retrieve the service worker
      let swReg: ServiceWorkerRegistration;
      try {
        console.log("[PUSH] Registering service worker from /sw.js");
        swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("✅ Service Worker registered for push");
      } catch (error: any) {
        console.log("ℹ️ Service Worker registration error:", error.message);
        const reg = await navigator.serviceWorker.getRegistration("/");
        if (!reg) throw error;
        swReg = reg;
      }

      // Wait for the service worker to become active before subscribing.
      // Without this the pushManager may not be ready yet.
      if (swReg.installing || swReg.waiting) {
        await new Promise<void>((resolve) => {
          const sw = swReg.installing || swReg.waiting!;
          sw.addEventListener("statechange", function handler() {
            if (sw.state === "activated") {
              sw.removeEventListener("statechange", handler);
              resolve();
            }
          });
        });
      }

      // Get VAPID public key from server
      console.log("[PUSH] Fetching VAPID public key from server...");
      const vapidResponse = await fetch(getApiUrl("/api/push/vapid-public-key"));
      if (!vapidResponse.ok) {
        throw new Error(`Failed to fetch VAPID key: ${vapidResponse.status}`);
      }

      const { vapidPublicKey } = await vapidResponse.json();
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not available - push not configured on server");
      }

      console.log("[PUSH] ✅ VAPID key fetched");

      // Convert URL-safe base64 key to Uint8Array.
      // VAPID keys use URL-safe base64 (- and _); atob() needs standard (+, /).
      const base64Standard = vapidPublicKey
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(vapidPublicKey.length / 4) * 4, "=");
      const vapidKey = new Uint8Array(
        atob(base64Standard)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      // Get or create push subscription.
      // If an existing subscription was created with a different VAPID key it
      // will throw — in that case unsubscribe it and start fresh.
      let subscription: PushSubscription;
      console.log("[PUSH] Subscribing to push notifications...");
      try {
        subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
      } catch (subError: any) {
        console.warn("[PUSH] subscribe() failed — clearing old subscription and retrying:", subError.message);
        const existing = await swReg.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          console.log("[PUSH] Old subscription unsubscribed");
        }
        subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
      }

      console.log("✅ Push subscription created");

      // Send subscription to server
      const response = await fetch(getApiUrl("/api/push/subscribe"), {
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
        throw new Error(`Failed to register subscription: ${response.status}`);
      }

      console.log("✅ Push notification registered successfully");

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        vapidPublicKey,
        isLoading: false,
      }));

      // Optional: Show subtle toast (not required)
      // toast({
      //   title: "Notifications Enabled",
      //   description: "You'll receive updates in your notification center",
      //   duration: 3000,
      // });
    } catch (error: any) {
      console.error("[PUSH] Registration error:", error);
      const errorMessage = error.message || "Failed to register push notifications";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Only show error toast for real errors (not permission denied)
      if (state.isSupported && !errorMessage.includes("permission")) {
        toast({
          title: "Notification Setup Issue",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  // Manual registration function (for manual button click)
  const registerPush = async () => {
    await registerPushInternal();
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
      await fetch(getApiUrl("/api/push/unsubscribe"), {
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
