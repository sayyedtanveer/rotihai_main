
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  Download,
  BarChart3,
  ChefHat,
  Star,
  Search,
  Check,
  Clock,
  Loader,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  revenueChange: number;
  ordersChange: number;
}

interface UserReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  userGrowth: number;
  topCustomers: Array<{ id: string; name: string; email: string; totalSpent: number; orderCount: number }>;
}

interface InventoryReport {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  categories: Array<{ name: string; productCount: number; revenue: number }>;
}

interface SubscriptionReport {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  subscriptionRevenue: number;
  topPlans: Array<{ id: string; name: string; subscriberCount: number; revenue: number }>;
}

interface ChefReport {
  totalChefEarnings: number;
  totalOrders: number;
  chefCount: number;
  averageEarningsPerChef: number;
  chefStats: Array<{
    id: string;
    name: string;
    chefEarnings: number;
    totalOrders: number;
    averageEarning: number;
    topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
    rating: number;
    isVerified: boolean;
  }>;
}

interface RothiaiEarningsReport {
  totalOrders: number;
  grossRothiaiEarnings: number;
  totalRothiaiEarnings: number;  // NET earnings after referral bonuses
  breakdown: {
    platformCommission: number;
    deliveryFeeEarnings: number;
    discountTaken: number;
    walletUsed: number;
    referralBonusesSpent: number;  // Referral bonuses paid out
  };
  categoryBreakdown: Array<{
    name: string;
    orders: number;
    earnings: number;
  }>;
}

interface ChefPayoutReport {
  totalOrders: number;
  totalChefEarnings: number;
  orders: Array<{
    id: string;
    createdAt: string;
    customerName: string;
    phone: string;
    chefId: string;
    chefName: string;
    status: string;
    paymentStatus: string;
    deliveredAt?: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      hotelPrice: number;
      quantity: number;
      chefEarning: number;
    }>;
    subtotal: number;
    totalChefEarning: number;
    orderIncome?: number;  // Total chef earning for this order
    payoutId: string | null;
    paidToChef?: boolean;
    paidAt?: string;
  }>;
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedChefId, setSelectedChefId] = useState<string>("all");
  const [searchChef, setSearchChef] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);


  const { data: salesReport, isLoading: salesLoading } = useQuery<SalesReport>({
    queryKey: ["/api/admin/reports/sales", dateRange],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `/api/admin/reports/sales?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch sales report");
      return response.json();
    },
  });

  const { data: userReport, isLoading: userLoading } = useQuery<UserReport>({
    queryKey: ["/api/admin/reports/users", dateRange],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `/api/admin/reports/users?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch user report");
      return response.json();
    },
  });

  const { data: inventoryReport } = useQuery<InventoryReport>({
    queryKey: ["/api/admin/reports/inventory"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/reports/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch inventory report");
      return response.json();
    },
  });

  const { data: subscriptionReport } = useQuery<SubscriptionReport>({
    queryKey: ["/api/admin/reports/subscriptions", dateRange],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `/api/admin/reports/subscriptions?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch subscription report");
      return response.json();
    },
  });

  const { data: chefReport } = useQuery<ChefReport>({
    queryKey: ["/api/admin/reports/chefs", dateRange, selectedChefId],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      let url = `/api/admin/reports/chefs?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
      if (selectedChefId && selectedChefId !== "all") {
        url += `&chefId=${selectedChefId}`;
      }
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to fetch chef report");
      return response.json();
    },
  });

  const { data: rothiaiReport } = useQuery<RothiaiEarningsReport>({
    queryKey: ["/api/admin/reports/rotihai-earnings", dateRange],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `/api/admin/reports/rotihai-earnings?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch rotihai earnings report");
      return response.json();
    },
  });

  const { data: chefPayoutReport, refetch: refetchPayoutReport, isLoading: isLoadingPayout } = useQuery<ChefPayoutReport>({
    queryKey: ["/api/admin/reports/chef-payout", dateRange, selectedChefId],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      let url = `/api/admin/reports/chef-payout?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
      if (selectedChefId && selectedChefId !== "all") {
        url += `&chefId=${selectedChefId}`;
      }
      console.log("[Payout Report] Fetching:", url);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to fetch chef payout details");
      const data = await response.json();
      console.log("[Payout Report] Data received:", data);
      return data;
    },
  });

  const { data: chefs } = useQuery<any[]>({
    queryKey: ["/api/admin/chefs"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/chefs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch chefs");
      return response.json();
    },
  });

  const handleExportCSV = (reportType: string) => {
    const token = localStorage.getItem("adminToken");
    window.open(
      `/api/admin/reports/export/${reportType}?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&token=${token}`,
      '_blank'
    );
  };

  const handleMarkAsPaid = async (orderIds: string[]) => {
    setPayoutError(null);
    setPayoutSuccess(null);
    setIsMarkingPaid(true);

    try {
      console.log("[Mark as Paid] Starting with payoutIds:", orderIds);
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/payouts/mark-paid-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payoutIds: orderIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[Mark as Paid] Error response:", error);
        throw new Error(error.message || "Failed to mark payouts as paid");
      }

      const result = await response.json();
      console.log("[Mark as Paid] Success:", result);
      
      setPayoutSuccess(`Successfully marked ${orderIds.length} order(s) as paid!`);
      setSelectedOrders(new Set());
      
      // Refetch chef payout report using React Query
      console.log("[Mark as Paid] Refetching payout report...");
      await refetchPayoutReport();

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setPayoutSuccess(null), 5000);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to mark payouts as paid";
      setPayoutError(errorMessage);
      console.error("[Mark as Paid] Error:", errorMessage, error);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                >
                  Last 90 days
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="chefs">Chef Earnings</TabsTrigger>
            <TabsTrigger value="rotihai">Rotihai Earnings</TabsTrigger>
            <TabsTrigger value="chef-payout">Chef Payout Details</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{salesReport?.totalRevenue || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {(salesReport?.revenueChange || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                    )}
                    <span className={cn((salesReport?.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                      {Math.abs(salesReport?.revenueChange || 0)}%
                    </span>
                    <span className="ml-1">from previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesReport?.totalOrders || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {(salesReport?.ordersChange || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                    )}
                    <span className={cn((salesReport?.ordersChange || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                      {Math.abs(salesReport?.ordersChange || 0)}%
                    </span>
                    <span className="ml-1">from previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{salesReport?.averageOrderValue || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performing items in selected period</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('sales')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesReport?.topProducts?.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userReport?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userReport?.newUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userReport?.activeUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userReport?.userGrowth || 0}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Highest spending customers</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('users')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userReport?.topCustomers?.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{customer.totalSpent}</p>
                        <p className="text-sm text-muted-foreground">{customer.orderCount} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryReport?.totalProducts || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{inventoryReport?.lowStock || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{inventoryReport?.outOfStock || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Revenue by category</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('inventory')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryReport?.categories?.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.productCount} products</p>
                      </div>
                      <p className="font-semibold">₹{category.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscriptionReport?.totalSubscriptions || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{subscriptionReport?.activeSubscriptions || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Paused</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{subscriptionReport?.pausedSubscriptions || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{subscriptionReport?.subscriptionRevenue || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Subscription Plans</CardTitle>
                  <CardDescription>Most popular subscription plans</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('subscriptions')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionReport?.topPlans?.map((plan, index) => (
                    <div key={plan.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.subscriberCount} subscribers</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{plan.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chefs" className="space-y-4">
            <div className="space-y-4">
              {/* Chef Selection & Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Filter by Chef
                  </label>
                  <Select value={selectedChefId} onValueChange={setSelectedChefId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Chefs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chefs</SelectItem>
                      {chefReport?.chefStats?.map((chef) => (
                        <SelectItem key={chef.id} value={chef.id}>
                          {chef.name} {chef.isVerified && "✓"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Search Chef
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search chef name..."
                      value={searchChef}
                      onChange={(e) => setSearchChef(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Chef Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{chefReport?.totalChefEarnings || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chefReport?.totalOrders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Chefs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chefReport?.chefCount || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Earnings/Chef</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{chefReport?.averageEarningsPerChef || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chef Performance Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chef Performance</CardTitle>
                  <CardDescription>Sales and order metrics per chef</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('chefs')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {chefReport?.chefStats
                    ?.filter(chef => 
                      searchChef === "" || 
                      chef.name?.toLowerCase().includes(searchChef.toLowerCase())
                    )
                    ?.map((chef, index) => (
                    <div key={chef.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-semibold">{chef.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {chef.isVerified && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900">
                                  ✓ Verified
                                </Badge>
                              )}
                              {(Number(chef.rating) || 0) > 0 && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{Number(chef.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">₹{chef.chefEarnings}</p>
                          <p className="text-sm text-muted-foreground">{chef.totalOrders} orders</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                          <p className="text-muted-foreground">Avg Earning</p>
                          <p className="font-semibold">₹{chef.averageEarning}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                          <p className="text-muted-foreground">Total Orders</p>
                          <p className="font-semibold">{chef.totalOrders}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                          <p className="text-muted-foreground">Total Earnings</p>
                          <p className="font-semibold">₹{chef.chefEarnings}</p>
                        </div>
                      </div>

                      {chef.topProducts?.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Top Products</p>
                          <div className="flex flex-wrap gap-2">
                            {chef.topProducts?.map((product, pidx) => (
                              <Badge key={product.id} variant="secondary" className="text-xs">
                                {product.name} ({product.quantity} × ₹{product.revenue})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotihai" className="space-y-4">
            {/* Rotihai Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">NET Earnings (After Expenses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{rothiaiReport?.totalRothiaiEarnings || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Gross - Referral Spent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gross Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₹{rothiaiReport?.grossRothiaiEarnings || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Before expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Referral Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₹{rothiaiReport?.breakdown?.referralBonusesSpent || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Bonuses paid out</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rothiaiReport?.totalOrders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rothiaiReport?.totalOrders || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 mb-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">INCOME</p>
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Platform Commission (Markup)</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">₹{rothiaiReport?.breakdown?.platformCommission || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Delivery Fee Earnings</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">₹{rothiaiReport?.breakdown?.deliveryFeeEarnings || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Discount Handling</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">₹{rothiaiReport?.breakdown?.discountTaken || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded font-semibold">
                    <span className="text-slate-900 dark:text-slate-100">Gross Earnings</span>
                    <span className="text-lg text-blue-600 dark:text-blue-400">₹{rothiaiReport?.grossRothiaiEarnings || 0}</span>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 my-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">EXPENSES</p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Referral Bonuses Paid</span>
                      <span className="font-semibold text-red-700 dark:text-red-400">-₹{rothiaiReport?.breakdown?.referralBonusesSpent || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded border-t-2 border-b-2 border-slate-300 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-slate-100">NET Earnings (After Expenses)</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">₹{rothiaiReport?.totalRothiaiEarnings || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wallet Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Wallet Amount Used by Customers</p>
                      <p className="text-2xl font-bold">₹{rothiaiReport?.breakdown?.walletUsed || 0}</p>
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      This amount was already in customer wallets and used for orders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category-wise Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Category-wise Earnings</CardTitle>
                <CardDescription>Rotihai earnings breakdown by order category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {rothiaiReport?.categoryBreakdown?.map((category, index) => (
                    <div key={category.name} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-semibold">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{category.orders} orders</p>
                          </div>
                        </div>
                        <p className="font-bold text-lg text-green-600">₹{category.earnings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chef-payout" className="space-y-4">
            {/* Chef Selection Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Filter by Chef
                </label>
                <Select value={selectedChefId} onValueChange={setSelectedChefId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Chefs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chefs</SelectItem>
                    {chefs?.map((chef) => (
                      <SelectItem key={chef.id} value={chef.id}>
                        {chef.name} {chef.isVerified && "✓"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedChefId !== "all" && (
                <div className="flex items-end">
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Selected Chef: {chefs?.find(c => c.id === selectedChefId)?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Payout Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chefPayoutReport?.totalOrders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Chef Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{chefPayoutReport?.totalChefEarnings || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average per Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{chefPayoutReport?.totalOrders && chefPayoutReport?.totalOrders > 0 ? Math.round(chefPayoutReport.totalChefEarnings / chefPayoutReport.totalOrders) : 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Order Details Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order-wise Payout Details</CardTitle>
                    <CardDescription>Complete breakdown for payout processing</CardDescription>
                  </div>
                  {selectedOrders.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600">
                        {selectedOrders.size} selected • ₹{Array.from(selectedOrders).reduce((sum, payoutId) => {
                          const order = chefPayoutReport?.orders?.find(o => o.payoutId === payoutId);
                          return sum + (order?.totalChefEarning || 0);
                        }, 0)} total
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsPaid(Array.from(selectedOrders))}
                        disabled={isMarkingPaid}
                        className="gap-2"
                      >
                        {isMarkingPaid ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Mark as Paid
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedOrders(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {payoutError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {payoutError}
                  </div>
                )}
                {payoutSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 text-sm text-green-700 dark:text-green-400 flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {payoutSuccess}
                  </div>
                )}
                {!chefPayoutReport?.orders || chefPayoutReport.orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {chefPayoutReport ? "No orders found for the selected period" : "Loading payout details..."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 w-10">
                          <input 
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(new Set(chefPayoutReport?.orders?.filter(o => o.payoutId && !o.paidToChef).map(o => o.payoutId!) || []));
                              } else {
                                setSelectedOrders(new Set());
                              }
                            }}
                            checked={selectedOrders.size === (chefPayoutReport?.orders?.filter(o => !o.paidToChef).length || 0) && (chefPayoutReport?.orders?.filter(o => !o.paidToChef).length || 0) > 0}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left py-3 px-4">Order ID</th>
                        <th className="text-left py-3 px-4">Date & Time</th>
                        <th className="text-left py-3 px-4">Chef</th>
                        <th className="text-left py-3 px-4">Customer</th>
                        <th className="text-left py-3 px-4">Items</th>
                        <th className="text-right py-3 px-4">Price/Unit</th>
                        <th className="text-right py-3 px-4">Hotel Cost</th>
                        <th className="text-right py-3 px-4">Qty</th>
                        <th className="text-right py-3 px-4">Chef Earning</th>
                        <th className="text-left py-3 px-4">Payment Status</th>
                        <th className="text-left py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chefPayoutReport?.orders?.map((order) => (
                        <React.Fragment key={order.id}>
                          {/* Order Header Row */}
                          <tr className={`bg-slate-50 dark:bg-slate-900 border-b ${selectedOrders.has(order.payoutId || '') ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <td className="py-2 px-4">
                              <input 
                                type="checkbox"
                                checked={order.payoutId ? selectedOrders.has(order.payoutId) : false}
                                onChange={(e) => {
                                  if (!order.payoutId) return;
                                  const newSelected = new Set(selectedOrders);
                                  if (e.target.checked) {
                                    newSelected.add(order.payoutId);
                                  } else {
                                    newSelected.delete(order.payoutId);
                                  }
                                  setSelectedOrders(newSelected);
                                }}
                                disabled={order.paidToChef || !order.payoutId}
                                className="rounded"
                              />
                            </td>
                            <td className="py-2 px-4 font-semibold text-blue-600">{order.id.slice(0, 8)}</td>
                            <td className="py-2 px-4">{new Date(order.createdAt).toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <Badge variant="outline" className="text-xs">
                                {order.chefName}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
                              <div>
                                <p className="font-medium">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.phone}</p>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-muted-foreground text-xs">{order.items.length} items</td>
                            <td className="text-right py-2 px-4"></td>
                            <td className="text-right py-2 px-4"></td>
                            <td className="text-right py-2 px-4"></td>
                            <td className="text-right py-2 px-4 font-bold text-green-600">₹{order.totalChefEarning}</td>
                            <td className="py-2 px-4">
                              {order.paidToChef ? (
                                <Badge className="bg-green-600 text-white gap-1">
                                  <Check className="h-3 w-3" />
                                  Paid {order.paidAt && `on ${new Date(order.paidAt).toLocaleDateString()}`}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 border-yellow-300 text-yellow-700 dark:text-yellow-400">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-4">
                              {!order.paidToChef && order.payoutId && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid([order.payoutId!])}
                                  disabled={isMarkingPaid}
                                  className="h-8 text-xs"
                                >
                                  {isMarkingPaid ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                </Button>
                              )}
                            </td>
                          </tr>
                          
                          {/* Item Rows */}
                          {order.items.map((item, idx) => (
                            <tr key={`${order.id}-${idx}`} className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 ${order.payoutId && selectedOrders.has(order.payoutId) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                              <td className="text-right py-2 px-4">₹{item.price}</td>
                              <td className="text-right py-2 px-4 font-semibold text-slate-700 dark:text-slate-300">₹{item.hotelPrice}</td>
                              <td className="text-right py-2 px-4">{item.quantity}</td>
                              <td className="text-right py-2 px-4 font-bold text-green-600">₹{item.chefEarning}</td>
                              <td className="py-2 px-4">
                                <Badge variant="outline" className="text-xs">
                                  Markup: ₹{item.price - item.hotelPrice}
                                </Badge>
                              </td>
                              <td></td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
