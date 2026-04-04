import { useEffect } from "react";
import { getWebSocketURL } from "@/lib/fetchClient";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface UseWalletUpdatesOptions {
  /**
   * Whether the hook should be active. Useful for skipping updates when component is not mounted/visible.
   * Defaults to true.
   */
  enabled?: boolean;
}

/**
 * Hook for real-time wallet updates via WebSocket
 * 
 * ARCHITECTURE:
 * - Only connects to WebSocket if user is authenticated (has userToken and user ID)
 * - For new/guest users (unauthenticated), the hook safely skips
 * - Can be disabled via `enabled` option (useful for conditional rendering)
 * 
 * USAGE:
 * - Profile Page: useWalletUpdates() - Needs real-time updates
 * - CheckoutDialog: useWalletUpdates({ enabled: isDialogOpen }) - Optional, controlled visibility
 * - New User Checkout: Hook won't connect, no impact
 * 
 * SAFETY:
 * - Returns early if not authenticated (no errors for guest users)
 * - Only listens for wallet_updated messages
 * - Properly cleans up WebSocket on unmount
 */
export function useWalletUpdates(options?: UseWalletUpdatesOptions) {
  const { enabled = true } = options || {};
  const queryClient = useQueryClient();
  const { user, isAuthenticated, userToken } = useAuth();

  useEffect(() => {
    // ARCHITECTURE: Skip if:
    // 1. Hook is disabled (component not visible)
    // 2. User not authenticated (guest checkout - this is safe and expected)
    // 3. User ID not available
    if (!enabled || !isAuthenticated || !user?.id) {
      if (!enabled) {
        console.log(`📡 useWalletUpdates: Skipping - enabled=false`);
      } else if (!isAuthenticated) {
        console.log(`📡 useWalletUpdates: Skipping - isAuthenticated=false (guest user, this is expected)`);
      }
      return;
    }

    // Connect to WebSocket for wallet updates (authenticated users only)
    const wsUrl = getWebSocketURL(`/ws?type=customer&userId=${user.id}`);

    console.log(`📡 useWalletUpdates: Connecting to WebSocket for authenticated user`);
    console.log(`   User ID: ${user.id}, URL: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`✅ useWalletUpdates: WebSocket OPEN - connected for user ${user.id}`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`📨 useWalletUpdates: Received message:`, message);

        // Handle wallet update broadcasts from server
        if (message.type === "wallet_updated") {
          console.log(`💳 useWalletUpdates: Wallet updated! New balance: ₹${message.data.newBalance}`);

          const transaction = message.data?.transaction;

          // 🎁 DETECT REFERRAL BONUS - Store for global toast notification
          if (transaction?.type === "referral_bonus") {
            console.log(`🎉 useWalletUpdates: Referral bonus detected! Amount: ₹${transaction.amount}`);
            
            // Store in query cache to trigger toast in global listener
            queryClient.setQueryData(["showReferralBonusToast"], {
              amount: transaction.amount,
              id: transaction.id,
              timestamp: Date.now(),
            });
            
            // Also mark for home page banner
            queryClient.setQueryData(["latestReferralBonus"], {
              amount: transaction.amount,
              id: transaction.id,
              createdAt: new Date().toISOString(),
            });
          }

          // Invalidate queries to refetch latest data
          // This triggers Profile page to show new wallet balance
          queryClient.invalidateQueries({ 
            queryKey: ["/api/user/profile"],
            exact: false
          });
          console.log(`🔄 useWalletUpdates: Invalidated user profile query`);

          // Also invalidate wallet balance query
          queryClient.invalidateQueries({ 
            queryKey: ["/api/user/wallet"],
            exact: false
          });
          console.log(`🔄 useWalletUpdates: Invalidated user wallet query`);

          // Invalidate wallet transactions to refresh any transaction lists
          queryClient.invalidateQueries({ 
            queryKey: ["/api/user/wallet-transactions"],
            exact: false
          });
          console.log(`🔄 useWalletUpdates: Invalidated wallet transactions query`);
        }
      } catch (error) {
        console.error("useWalletUpdates: Error processing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ useWalletUpdates: WebSocket ERROR:", error);
    };

    ws.onclose = () => {
      console.log(`🔌 useWalletUpdates: WebSocket CLOSED`);
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log(`🧹 useWalletUpdates: Cleaning up WebSocket for user ${user.id}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [enabled, isAuthenticated, user?.id, userToken, queryClient]);
}

