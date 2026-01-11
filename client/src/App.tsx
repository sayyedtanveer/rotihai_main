import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, Redirect } from "wouter";
import api from "@/lib/apiClient";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";
import { useAuth } from "@/hooks/useAuth";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
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
import AdminWalletLogs from "@/pages/admin/AdminWalletLogs";
import AdminVisitorAnalytics from "@/pages/admin/AdminVisitorAnalytics";
import AdminNotificationSettings from "@/pages/admin/AdminNotificationSettings";
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

  return (
    <Switch>
      {/* ---------- ADMINROUTES ---------- */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
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

// 🔔 Wrapper component for notifications (must be inside QueryClientProvider)
function AppContent() {
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
      <Toaster />
      <NotificationsWrapper />
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