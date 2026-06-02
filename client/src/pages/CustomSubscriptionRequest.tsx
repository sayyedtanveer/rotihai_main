import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MenuDrawer from "@/components/MenuDrawer";
import CartSidebar from "@/components/CartSidebar";
import ChefListDrawer from "@/components/ChefListDrawer";
import SubscriptionDrawer from "@/components/SubscriptionDrawer";
import LoginDialog from "@/components/LoginDialog";
import PaymentQRDialog from "@/components/PaymentQRDialog";
import { SubscriptionAddressInput, type SubscriptionAddress } from "@/components/SubscriptionAddressInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import api from "@/lib/apiClient";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Plus,
  Minus,
  Info,
  Loader2,
  CreditCard,
  Home,
  ChevronRight,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ListOrdered,
} from "lucide-react";

const WEEKDAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const statusColors: Record<string, string> = {
  pending_chef_assignment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  awaiting_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  converted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  pending_chef_assignment: "Pending Approval",
  awaiting_payment: "Awaiting Payment",
  paid: "Payment Submitted",
  converted: "Active ✅",
  rejected: "Rejected",
};

/** Statuses that block placing a new request */
const ACTIVE_STATUSES = new Set(["pending_chef_assignment", "awaiting_payment", "paid"]);

export default function CustomSubscriptionRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const userToken = localStorage.getItem("userToken");
  const isAuthenticated = !!(user || userToken);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChefListOpen, setIsChefListOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Form State
  const [rotiPerDay, setRotiPerDay] = useState(10);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [duration, setDuration] = useState<"weekly" | "monthly">("monthly");
  const [selectedDays, setSelectedDays] = useState<string[]>(WEEKDAYS.map((d) => d.value));
  const [deliverySlotId, setDeliverySlotId] = useState("");
  const [address, setAddress] = useState<SubscriptionAddress | null>(null);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment QR Modal State
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    subscriptionId: string;
    amount: number;
    planName: string;
  } | null>(null);

  // Queries
  const { data: priceData } = useQuery({
    queryKey: ["/api/custom-subscription/price-per-roti"],
    queryFn: async () => {
      const res = await api.get("/api/custom-subscription/price-per-roti");
      return res.data;
    },
  });

  const { data: deliverySlots = [] } = useQuery({
    queryKey: ["/api/delivery-slots"],
    queryFn: async () => {
      const res = await api.get("/api/delivery-slots");
      return res.data;
    },
  });

  const { data: requests = [], isLoading: requestsLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/custom-subscription/requests"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await api.get("/api/custom-subscription/requests");
      return res.data;
    },
  });

  // Real-time updates via WebSocket (custom_request_update)
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const userIdParam = user?.id ? `&userId=${user.id}` : "";
    const wsUrl = `${protocol}://${window.location.host}/ws?type=customer${userIdParam}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === "custom_request_update") {
            console.log("[CUSTOM-REQ] WS custom_request_update → refreshing");
            refetch();
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        // silently swallow — polling covers us
      };
    } catch {
      // WebSocket not available
    }

    return () => {
      ws?.close();
    };
  }, [isAuthenticated, user?.id, userToken, refetch]);

  const pricePerRoti = priceData?.pricePerRoti || 8;

  // Determine if there's already an active / in-progress request
  const activeRequest = useMemo(
    () => (requests as any[]).find((r) => ACTIVE_STATUSES.has(r.status)),
    [requests]
  );

  const convertedRequest = useMemo(
    () => (requests as any[]).find((r) => r.status === "converted"),
    [requests]
  );

  // Is form disabled?
  const isFormDisabled = !!activeRequest;

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ subscriptionId, paymentTransactionId }: { subscriptionId: string; paymentTransactionId: string }) => {
      const res = await api.post(`/api/subscriptions/${subscriptionId}/payment-confirmed`, {
        paymentTransactionId: paymentTransactionId.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      setShowPaymentQR(false);
      setPaymentDetails(null);
      toast({
        title: "Payment Submitted",
        description: "Your payment transaction ID has been submitted. Awaiting admin activation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Failed to submit transaction ID",
        variant: "destructive",
      });
    },
  });

  // Calculate delivery count
  const calculateDeliveriesCount = (weekdays: string[], dur: "weekly" | "monthly") => {
    return dur === "weekly" ? 7 : 30;
  };

  const deliveriesCount = calculateDeliveriesCount(selectedDays, duration);
  const calculatedPrice = rotiPerDay * deliveriesCount * pricePerRoti;

  const handleDayToggle = (day: string) => {
    // No-op - days are view-only
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormDisabled) return;

    if (!deliverySlotId) {
      toast({ title: "Selection Required", description: "Please select a delivery slot", variant: "destructive" });
      return;
    }

    if (!isAddressValidated || !address) {
      toast({ title: "Validation Required", description: "Please validate your delivery address", variant: "destructive" });
      return;
    }

    if (selectedDays.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one delivery day", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      if (!guestName.trim()) {
        toast({ title: "Name Required", description: "Please enter your full name", variant: "destructive" });
        return;
      }
      if (!guestPhone.trim() || !/^\d{10}$/.test(guestPhone.trim())) {
        toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number", variant: "destructive" });
        return;
      }
    }

    try {
      setSubmitting(true);
      const fullAddressString = `${address.building}, ${address.street}, ${address.area}, ${address.city} - ${address.pincode}`;

      const payload = {
        rotiPerDay,
        daysPerWeek: selectedDays.length,
        deliveryDays: selectedDays,
        duration,
        deliverySlotId,
        pricePerRoti,
        calculatedPrice,
        address: fullAddressString,
        addressBuilding: address.building,
        addressStreet: address.street,
        addressArea: address.area,
        addressCity: address.city,
        addressPincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
      };

      let response;
      if (isAuthenticated) {
        response = await api.post("/api/custom-subscription/request", payload);
      } else {
        const publicPayload = {
          ...payload,
          customerName: guestName.trim(),
          phone: guestPhone.trim(),
          email: guestEmail.trim() || null,
        };
        response = await api.post("/api/custom-subscription/request/public", publicPayload);

        // Auto-login the user
        const data = response.data;
        if (data.accessToken) {
          localStorage.setItem("userToken", data.accessToken);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
          if (data.user) {
            localStorage.setItem("userData", JSON.stringify(data.user));
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userPhone", data.user.phone);
            if (data.user.email) localStorage.setItem("userEmail", data.user.email);
            if (data.user.address) localStorage.setItem("userAddress", data.user.address);
          }
          queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
        }
      }

      toast({
        title: "Request Submitted! 🎉",
        description: "Your custom subscription request has been submitted. We'll notify you once approved.",
      });

      // Reset form fields only, keep page mounted (user will see request in the list)
      setRotiPerDay(10);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setDeliverySlotId("");
      setIsAddressValidated(false);
      setAddress(null);

      queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/requests"] });
    } catch (error: any) {
      console.error("Error submitting custom subscription request:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = (request: any) => {
    if (!request.subscriptionId) return;
    setPaymentDetails({
      subscriptionId: request.subscriptionId,
      amount: request.calculatedPrice,
      planName: `Custom Roti Subscription (${request.rotiPerDay} Rotis)`,
    });
    setShowPaymentQR(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
        onChefListClick={() => setIsChefListOpen(true)}
        onSubscriptionClick={() => setIsSubscriptionOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onOffersClick={() => {}}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 hover:text-orange-500 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-orange-500 font-medium">Custom Subscription</span>
        </nav>

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            Custom Subscription Requests
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Configure a personalized subscription tailored to your exact roti requirements.
          </p>
        </div>

        {/* Active Subscription Banner */}
        {convertedRequest && convertedRequest.subscriptionId && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                  🎉 Your Custom Subscription is Active!
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                  {convertedRequest.rotiPerDay} rotis/day · {convertedRequest.duration} plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 text-xs"
                onClick={() => setLocation("/")}
              >
                <Home className="w-3.5 h-3.5 mr-1.5" />
                Home
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-green-600 hover:bg-green-700 text-white text-xs"
                onClick={() => setIsSubscriptionOpen(true)}
              >
                <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
                View My Subscription
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Pending Request Alert */}
        {activeRequest && !convertedRequest && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
                  You have an active request
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                  Your previous request is{" "}
                  <span className="font-medium">{statusLabels[activeRequest.status]}</span>.{" "}
                  {activeRequest.status === "awaiting_payment"
                    ? "Please pay now to activate your subscription."
                    : "Please wait for admin approval before placing a new request."}
                </p>
              </div>
              {activeRequest.status === "awaiting_payment" && activeRequest.subscriptionId && (
                <Button
                  size="sm"
                  onClick={() => handlePayNow(activeRequest)}
                  className="rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs flex-shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <Card className={`shadow-lg border-orange-100 dark:border-orange-950 transition-opacity ${isFormDisabled ? "opacity-60 pointer-events-none" : ""}`}>
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-pink-50/30 dark:from-orange-950/10 dark:to-pink-950/10 border-b border-orange-100/50 dark:border-orange-950/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Subscription Configurator</CardTitle>
                    <CardDescription className="mt-1">
                      Adjust the fields below to customize your roti deliveries.
                    </CardDescription>
                  </div>
                  {isFormDisabled && (
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-none text-xs">
                      Request In Progress
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Stepper for Roti Count */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Daily Roti Quantity</Label>
                    <div className="flex items-center gap-4 justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">How many rotis per delivery?</p>
                        <p className="text-sm font-bold text-orange-500">{rotiPerDay} Rotis</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setRotiPerDay(Math.max(1, rotiPerDay - 1))}
                          className="h-9 w-9 rounded-full"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{rotiPerDay}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setRotiPerDay(Math.min(50, rotiPerDay + 1))}
                          className="h-9 w-9 rounded-full"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Subscription Term</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDuration("weekly")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          duration === "weekly"
                            ? "border-orange-500 bg-orange-50/30 dark:bg-orange-950/10 text-orange-900 dark:text-orange-300 font-semibold"
                            : "border-muted hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm">Weekly</p>
                        <p className="text-xs text-muted-foreground mt-1">7 Days Term</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuration("monthly")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          duration === "monthly"
                            ? "border-orange-500 bg-orange-50/30 dark:bg-orange-950/10 text-orange-900 dark:text-orange-300 font-semibold"
                            : "border-muted hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm">Monthly</p>
                        <p className="text-xs text-muted-foreground mt-1">30 Days Term</p>
                      </button>
                    </div>
                  </div>

                  {/* Weekdays Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Delivery Days</Label>
                    <div className="flex flex-wrap gap-2 justify-between">
                      {WEEKDAYS.map((day) => {
                        return (
                          <div
                            key={day.value}
                            className="flex-1 min-w-[50px] py-2.5 rounded-lg border border-orange-200 dark:border-orange-900 text-xs font-semibold text-center bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300 shadow-sm"
                          >
                            {day.label}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Deliveries are made every day of the week. You can pause or stop your subscription later.
                    </p>
                  </div>

                  {/* Delivery Slot */}
                  <div className="space-y-2">
                    <Label htmlFor="delivery-slot" className="text-sm font-semibold">
                      Preferred Delivery Time Window
                    </Label>
                    <Select value={deliverySlotId} onValueChange={setDeliverySlotId}>
                      <SelectTrigger id="delivery-slot" className="rounded-xl">
                        <SelectValue placeholder="Choose a delivery slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliverySlots
                          .filter((slot: any) => slot.isActive)
                          .map((slot: any) => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.label} ({slot.startTime} - {slot.endTime})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address & Contact Details Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">Delivery Address & Contact Details</Label>

                    {/* Guest Contact Details */}
                    {!isAuthenticated && (
                      <div className="space-y-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Contact Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="guest-name" className="text-xs font-semibold">Name *</Label>
                            <Input
                              id="guest-name"
                              placeholder="Enter your full name"
                              value={guestName}
                              onChange={(e: any) => setGuestName(e.target.value)}
                              required
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="guest-phone" className="text-xs font-semibold">Phone Number *</Label>
                            <Input
                              id="guest-phone"
                              placeholder="Enter 10-digit phone number"
                              value={guestPhone}
                              onChange={(e: any) => {
                                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setGuestPhone(cleaned);
                              }}
                              required
                              maxLength={10}
                              className="rounded-xl h-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="guest-email" className="text-xs font-semibold">Email (Optional)</Label>
                          <Input
                            id="guest-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={guestEmail}
                            onChange={(e: any) => setGuestEmail(e.target.value)}
                            className="rounded-xl h-10"
                          />
                        </div>
                      </div>
                    )}

                    <SubscriptionAddressInput
                      onAddressValidated={(addr) => {
                        setAddress(addr);
                        setIsAddressValidated(true);
                      }}
                      onEditModeChange={(editing) => {
                        if (editing) setIsAddressValidated(false);
                      }}
                    />
                  </div>

                  {/* Price Estimator Card */}
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-orange-50/20 dark:from-slate-900 dark:to-orange-950/5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-orange-500" />
                      Price Breakdown & Summary
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roti Quantity:</span>
                        <span className="font-medium">{rotiPerDay} rotis/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Per Week:</span>
                        <span className="font-medium">{selectedDays.length} days/week</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deliveries count:</span>
                        <span className="font-medium">{deliveriesCount} total deliveries</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per Roti:</span>
                        <span className="font-medium">₹{pricePerRoti}</span>
                      </div>
                      <hr className="border-slate-100 dark:border-slate-800" />
                      <div className="flex justify-between text-sm font-bold text-orange-600">
                        <span>Estimated Total:</span>
                        <span>₹{calculatedPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button with disabled state */}
                  {isFormDisabled ? (
                    <div className="space-y-3">
                      <div className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-sm font-semibold border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                        <AlertCircle className="w-4 h-4" />
                        Request already submitted
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        You have an active request. Once it is approved and activated, you can submit a new one.
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full py-6 font-bold text-sm shadow-md"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Submit Custom Request
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* History Queue Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-lg border-orange-100 dark:border-orange-950">
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-pink-50/30 dark:from-orange-950/10 dark:to-pink-950/10 border-b border-orange-100/50 dark:border-orange-950/50">
                <CardTitle className="text-lg">Your Requests</CardTitle>
                <CardDescription>
                  Track approval and payment status of your requests.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {!isAuthenticated ? (
                  <div className="text-center py-12 space-y-4">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">Please log in to view your requests.</p>
                    <Button onClick={() => setIsLoginOpen(true)} className="rounded-full">
                      Log In
                    </Button>
                  </div>
                ) : requestsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-sm">No custom requests yet.</p>
                    <p className="text-xs">Configure your plan on the left and submit your first request!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(requests as any[]).map((req: any) => {
                      const slot = deliverySlots.find((s: any) => s.id === req.deliverySlotId);
                      const isConverted = req.status === "converted";
                      return (
                        <div
                          key={req.id}
                          className={`p-4 border rounded-xl space-y-3 shadow-sm transition-all ${
                            isConverted
                              ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800/50"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                {req.rotiPerDay} Rotis / delivery
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                {req.duration} term · {req.daysPerWeek} days/wk
                              </p>
                            </div>
                            <Badge className={`${statusColors[req.status]} border-none shadow-none text-xs`}>
                              {statusLabels[req.status]}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                            {slot && (
                              <p className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                {slot.label} ({slot.startTime} - {slot.endTime})
                              </p>
                            )}
                            <p className="truncate">📍 {req.address}</p>
                            <p className="font-semibold text-orange-600 dark:text-orange-400 mt-1">
                              Price: ₹{req.calculatedPrice}
                            </p>
                          </div>

                          {req.rejectionReason && (
                            <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-300">
                              <span className="font-semibold">Reason: </span>
                              {req.rejectionReason}
                            </div>
                          )}

                          {req.status === "awaiting_payment" && req.subscriptionId && (
                            <Button
                              onClick={() => handlePayNow(req)}
                              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold text-xs shadow"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay Now (₹{req.calculatedPrice})
                            </Button>
                          )}

                          {/* Active subscription navigation link */}
                          {isConverted && req.subscriptionId && (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-lg text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Your subscription is active and deliveries are scheduled.</span>
                              </div>
                              <Button
                                onClick={() => setIsSubscriptionOpen(true)}
                                size="sm"
                                className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
                                View My Subscription
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Navigation Card */}
            <Card className="shadow border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <button
                  onClick={() => setLocation("/")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    <span className="font-medium">Home</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setIsSubscriptionOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm group"
                >
                  <div className="flex items-center gap-3">
                    <ListOrdered className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    <span className="font-medium">My Subscriptions</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    <span className="font-medium">{isAuthenticated ? "My Account" : "Log In"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={[]}
        onCategoryClick={() => {}}
        onLoginClick={() => {
          setIsMenuOpen(false);
          setIsLoginOpen(true);
        }}
        onSubscriptionClick={() => {
          setIsMenuOpen(false);
          setIsSubscriptionOpen(true);
        }}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setLocation("/");
        }}
      />

      <ChefListDrawer
        isOpen={isChefListOpen}
        onClose={() => setIsChefListOpen(false)}
        category={null}
        chefs={[]}
        onChefClick={() => {}}
      />

      <SubscriptionDrawer
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <PaymentQRDialog
        isOpen={showPaymentQR}
        onClose={() => {
          setShowPaymentQR(false);
          setPaymentDetails(null);
        }}
        orderId={paymentDetails?.subscriptionId}
        amount={paymentDetails?.amount}
        customerName={user?.name || "User"}
        phone={user?.phone || ""}
        email={user?.email || ""}
        address={
          paymentDetails?.subscriptionId
            ? (requests as any[]).find((r: any) => r.subscriptionId === paymentDetails.subscriptionId)?.address || ""
            : ""
        }
        isSubmitting={confirmPaymentMutation.isPending}
        onPaymentConfirmed={(txnId: string) => {
          if (paymentDetails?.subscriptionId) {
            confirmPaymentMutation.mutate({
              subscriptionId: paymentDetails.subscriptionId,
              paymentTransactionId: txnId,
            });
          }
        }}
      />
    </div>
  );
}
