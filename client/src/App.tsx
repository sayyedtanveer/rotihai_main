import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { Route, Switch, Redirect } from "wouter";
import api from "@/lib/apiClient";
import { preloadBuildVersion } from "@/lib/buildVersion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";
import { GlobalLoadingSpinner } from "@/components/GlobalLoadingSpinner";
import { startKeepAlive } from "@/lib/keepAlive";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Home from "@/pages/Home";
import MyOrders from "@/pages/MyOrders";
import MySubscriptions from "@/pages/MySubscriptions";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminReports from "./pages/admin/AdminReports";
import AdminChefs from "@/pages/admin/AdminChefs";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminManagement from "@/pages/admin/AdminManagement";
import AdminDeliverySettings from "@/pages/admin/AdminDeliverySettings";
import AdminDeliveryAreas from "@/pages/admin/AdminDeliveryAreas";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPartners from "./pages/admin/AdminPartners";
import PartnerLogin from "@/pages/partner/PartnerLogin";
import PartnerDashboard from "@/pages/partner/PartnerDashboard";
import PartnerProfile from "@/pages/partner/PartnerProfile";
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import OrderTracking from "@/pages/OrderTracking";
import AdminWalletSettings from "./pages/admin/AdminWalletSettings";
import AdminDeliveryTimeSlots from "@/pages/admin/AdminDeliveryTimeSlots";
import InviteEarn from "@/pages/InviteEarn";
import AdminReferrals from "@/pages/admin/AdminReferrals";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminWalletLogs from "@/pages/admin/AdminWalletLogs";
import AdminVisitorAnalytics from "@/pages/admin/AdminVisitorAnalytics";
import AdminNotificationSettings from "@/pages/admin/AdminNotificationSettings";
import AdminChefPerformance from "@/pages/admin/ChefPerformance";
import AdminPendingCheckouts from "@/pages/admin/AdminPendingCheckouts";
import AdminPaymentSettings from "@/pages/admin/AdminPaymentSettings";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
// Add AdminCartSettings import here
const AdminCartSettings = lazy(() => import("@/pages/admin/AdminCartSettings"));

// Add AdminRotiSettings import
const AdminRotiSettings = lazy(() => import("@/pages/admin/AdminRotiSettings"));

// Import AdminPromotionalBanners component
const AdminPromotionalBanners = lazy(() => import("@/pages/admin/AdminPromotionalBanners"));

// ✅ Simple Auth Guard for customer routes
function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  const hasJwtToken = !!localStorage.getItem("userToken");

  // Wait for auth state to load before redirecting
  // Render content AFTER hook call, not before
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication - use Redirect component instead of setLocation
  if (!user && !hasJwtToken) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const hasJwtToken = !!localStorage.getItem("userToken");
  const { admin } = useAdminAuth();

  return (
    <Switch>
      {/* ---------- ADMINROUTES ---------- */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/payment-settings" component={AdminPaymentSettings} />
      <Route path="/admin/pending-checkouts" component={AdminPendingCheckouts} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/chef-performance" component={AdminChefPerformance} />
      <Route path="/admin/promotional-banners" component={AdminPromotionalBanners} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/chefs" component={AdminChefs} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/admins" component={AdminManagement} />
      <Route path="/admin/delivery-settings" component={AdminDeliverySettings} />
      <Route path="/admin/delivery-areas" component={AdminDeliveryAreas} />
      <Route path="/admin/wallet-settings" component={AdminWalletSettings} />
      <Route path="/admin/delivery-time-slots" component={AdminDeliveryTimeSlots} />
      <Route path="/admin/referrals" component={AdminReferrals} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/wallet-logs" component={AdminWalletLogs} />
      <Route path="/admin/visitor-analytics" component={AdminVisitorAnalytics} />
      <Route path="/admin/notification-settings" component={AdminNotificationSettings} />
      {/* Add cart settings admin route */}
      <Route path="/admin/cart-settings" component={AdminCartSettings} />
      <Route path="/admin/roti-settings" component={AdminRotiSettings} />


      {/* ---------- PARTNER / DELIVERY ROUTES ---------- */}
      <Route path="/partner/login" component={PartnerLogin} />
      <Route path="/partner/dashboard" component={PartnerDashboard} />
      <Route path="/partner/profile" component={PartnerProfile} />
      <Route path="/delivery/login" component={DeliveryLogin} />
      <Route path="/delivery/dashboard" component={DeliveryDashboard} />

      {/* ---------- USERROUTES ---------- */}
      <Route path="/" component={Home} />
      <Route path="/landing" component={Landing} />

      {/* Protected (requires JWT or replit user) */}
      <Route
        path="/my-orders"
        component={() => <ProtectedRoute component={MyOrders} />}
      />
      <Route
        path="/profile"
        component={() => <ProtectedRoute component={Profile} />}
      />
      <Route
        path="/my-subscriptions"
        component={() => <ProtectedRoute component={MySubscriptions} />}
      />

      {/* Alias for /orders → same as /my-orders */}
      <Route
        path="/orders"
        component={() => <ProtectedRoute component={MyOrders} />}
      />
      <Route
        path="/invite"
        component={() => <ProtectedRoute component={InviteEarn} />}
      />

      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/track/:orderId" component={OrderTracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Separate component for notifications to avoid hook conflicts
function NotificationsWrapper() {
  useOrderNotifications();
  return null; // This component just sets up notifications, doesn't render anything
}

// 🔔 Push Notifications Wrapper - registers push for all user types (customer, admin, chef, delivery)
function PushNotificationsWrapper() {
  const { user } = useAuth();
  const { admin } = useAdminAuth();
  const { registerPush } = usePushNotifications(
    user?.id || admin?.id || null,
    user ? "customer" : admin ? "admin" : null
  );

  useEffect(() => {
    if (!user?.id && !admin?.id) return;
    
    // Check if already registered in this session
    const regKey = user?.id ? `push_reg_customer_${user.id}` : `push_reg_admin_${admin?.id}`;
    if (sessionStorage.getItem(regKey)) return;
    
    // Auto-register on first load
    const timer = setTimeout(async () => {
      try {
        await registerPush();
        sessionStorage.setItem(regKey, "1");
        console.log("[PUSH] Global push registration completed for", user ? "customer" : "admin");
      } catch (err) {
        console.error("[PUSH] Global push registration failed:", err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user?.id, admin?.id, registerPush]);

  return null;
}

// 🎁 Referral Bonus Toast Listener - listens for referral bonuses and shows toast
function ReferralBonusToastListener() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const shownIdsRef = useRef(new Set<string>());

  // Listen for referral bonus events in query cache
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated") {
        const queryData = event.query.state?.data as any;
        
        // Check if this is the referral bonus toast query
        if (
          event.query.queryKey[0] === "showReferralBonusToast" &&
          queryData?.id &&
          !shownIdsRef.current.has(queryData.id)
        ) {
          // Mark as shown to prevent duplicate toasts
          shownIdsRef.current.add(queryData.id);

          // Show toast notification
          toast({
            title: "🎉 Referral Bonus Earned!",
            description: `You earned ₹${queryData.amount} from your referral network`,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
            duration: 4000,
          });

          console.log(`🎁 ReferralBonusToastListener: Toast shown for bonus ₹${queryData.amount}`);
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient, toast]);  // ← Stable dependencies, no shownIds

  return null;
}

// 🔔 Wrapper component for notifications (must be inside QueryClientProvider)
function AppContent() {
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
   // ✅ Check for new app versions and prompt refresh
  useVersionCheck();

  // 🚀 Cache-busting: Preload build version on app startup
  useEffect(() => {
    preloadBuildVersion();
  }, []);

  // 🔄 Start keep-alive to prevent server spindown on Render free tier
  useEffect(() => {
    startKeepAlive(10); // Ping every 10 minutes
  }, []);

  // 🌐 Show loading spinner when making initial API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingSpinner(false);
    }, 3000); // Hide spinner after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Fetch admin payment settings on app start so UI uses same multiplier as server
  useEffect(() => {
    // Fire-and-forget; store will cache the value
    try {
      useCart.getState().fetchPaymentSettings();
    } catch (e) {
      console.warn("Failed to init payment settings:", e);
    }
  }, []);

  useEffect(() => {
    // Track visitor on app load - exclude admin, partner, and delivery routes
    const trackVisitor = async () => {
      try {
        const currentPath = window.location.pathname;
        
        // Skip tracking for admin, partner, and delivery routes
        if (currentPath.startsWith("/admin") || 
            currentPath.startsWith("/partner") || 
            currentPath.startsWith("/delivery")) {
          return;
        }

        const userId = localStorage.getItem("userId") || null;
        const sessionId = sessionStorage.getItem("sessionId") || generateSessionId();
        if (!sessionStorage.getItem("sessionId")) {
          sessionStorage.setItem("sessionId", sessionId);
        }

        await api.post("/api/track-visitor", {
          userId,
          sessionId,
          page: currentPath,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        });
      } catch (error) {
        console.log("Visitor tracking error (non-critical):", error);
      }
    };

    trackVisitor();
  }, []);

  return (
    <TooltipProvider>
      <GlobalLoadingSpinner isVisible={showLoadingSpinner} />
      <Toaster />
      <NotificationsWrapper />
      <ReferralBonusToastListener />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeliveryLocationProvider>
        <AppContent />
      </DeliveryLocationProvider>
    </QueryClientProvider>
  );
}

// Helper to generate unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default App;