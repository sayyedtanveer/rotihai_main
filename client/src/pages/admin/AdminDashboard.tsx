import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Clock, TrendingUp, TrendingDown, Package, UserCog, Truck, ShoppingBag, CheckCircle, Eye, ChefHat, Activity } from "lucide-react";
import React, { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Properly typed interfaces for type safety
interface PeriodData {
  current: number;
  previous: number;
  growth: number;
  trend: "up" | "down" | "flat";
}

interface VisitorMetricsData {
  todaysVisits: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
}

interface StatusBreakdownData {
  pending: number;
  accepted: number;
  preparing: number;
  ready: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
}

interface DashboardMetrics {
  userCount: number;
  orderCount: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  revenueGrowth: number;
  revenueTrend: "up" | "down" | "flat";
  ordersGrowth: number;
  ordersTrend: "up" | "down" | "flat";
  customersGrowth: number;
  customersTrend: "up" | "down" | "flat";
  statusBreakdown: StatusBreakdownData;
  revenuePeriods: {
    today: PeriodData;
    month: PeriodData;
    lifetime: PeriodData;
  };
  orderPeriods: {
    today: PeriodData;
    week: PeriodData;
    month: PeriodData;
  };
  visitorMetrics: VisitorMetricsData;
  activeChefsToday: number;
  activeDeliveryPartnersToday: number;
  cancelledOrdersToday: number;
  averageOrderValueToday: number;
  newCustomersToday: number;
  monthlyEarlyRevenue: number;
}

interface ChartDataPoint {
  label: string;
  revenue: number;
}

interface TopItemData {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopAreaData {
  name: string;
  orders: number;
  revenue: number;
}

interface DashboardCharts {
  revenueTrend: {
    today: ChartDataPoint[];
    "7days": ChartDataPoint[];
    "30days": ChartDataPoint[];
    "90days": ChartDataPoint[];
    "12months": ChartDataPoint[];
  };
  topItems: TopItemData[];
  topAreas: TopAreaData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "7days" | "30days" | "90days" | "12months">("30days");
  
  const { registerPush: registerAdminPush } = usePushNotifications(admin?.id || null, "admin");

  useEffect(() => {
    if (!admin?.id) return;
    if (sessionStorage.getItem("push_registered_admin")) return;
    
    const timer = setTimeout(async () => {
      try {
        await registerAdminPush();
        sessionStorage.setItem("push_registered_admin", "1");
      } catch (err) {
        console.error("[PUSH] Admin push registration failed:", err);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [admin?.id, registerAdminPush]);

  useEffect(() => {
    const handleOnline = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/charts"] });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard/metrics"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/admin/dashboard/metrics");
        if (!validateMetrics(response.data)) {
          throw new Error("Metrics validation failed");
        }
        return response.data;
      } catch (error) {
        console.error('[METRICS] Failed to fetch metrics:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: charts, isLoading: chartsLoading, error: chartsError } = useQuery<DashboardCharts>({
    queryKey: ["/api/admin/dashboard/charts"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/admin/dashboard/charts");
        if (!validateCharts(response.data)) {
          throw new Error("Charts validation failed");
        }
        return response.data;
      } catch (error) {
        console.error('[CHARTS] Failed to fetch charts:', error);
        throw error;
      }
    },
    refetchInterval: 60000,
    retry: 2,
    retryDelay: 1000,
  });

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  // Validation helpers for type safety
  const validateMetrics = (metrics: DashboardMetrics | undefined): boolean => {
    if (!metrics) {
      console.error('[DASHBOARD] Metrics data is undefined');
      return false;
    }
    
    const hasRequiredFields = metrics.revenuePeriods?.today && 
                              metrics.orderPeriods?.today && 
                              metrics.visitorMetrics &&
                              metrics.statusBreakdown;
    
    if (!hasRequiredFields) {
      console.error('[DASHBOARD] Missing critical metrics fields:', {
        revenuePeriods: !!metrics.revenuePeriods,
        orderPeriods: !!metrics.orderPeriods,
        visitorMetrics: !!metrics.visitorMetrics,
        statusBreakdown: !!metrics.statusBreakdown
      });
      return false;
    }
    
    return true;
  };

  const validateCharts = (charts: DashboardCharts | undefined): boolean => {
    if (!charts) {
      console.error('[DASHBOARD] Charts data is undefined');
      return false;
    }
    
    const hasChartData = charts.revenueTrend && 
                         Array.isArray(charts.topItems) && 
                         Array.isArray(charts.topAreas);
    
    if (!hasChartData) {
      console.error('[DASHBOARD] Invalid chart structure:', {
        revenueTrend: !!charts.revenueTrend,
        topItems: Array.isArray(charts.topItems),
        topAreas: Array.isArray(charts.topAreas)
      });
      return false;
    }
    
    return true;
  };

  const renderTrend = (growth: number, trend: "up" | "down" | "flat") => {
    if (trend === "up") return <span className="text-green-500 flex items-center text-xs"><TrendingUp className="w-3 h-3 mr-1"/>+{growth}%</span>;
    if (trend === "down") return <span className="text-red-500 flex items-center text-xs"><TrendingDown className="w-3 h-3 mr-1"/>{growth}%</span>;
    return <span className="text-slate-500 flex items-center text-xs">0%</span>;
  };

  const renderKPICard = (title: string, value: string | number, growth: number, trend: "up" | "down" | "flat", icon: React.ElementType, subtitle: string) => (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-1.5 bg-primary/10 rounded-full">
            {React.createElement(icon, { className: "h-3.5 w-3.5 text-primary" })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {renderTrend(growth, trend)}
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-4 p-1 sm:p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100" data-testid="text-dashboard-title">
              Operations Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time business metrics and analytics.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border shadow-sm">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            Live Data
          </div>
        </div>

        {/* ROW 1: Revenue Today, Orders Today, New Customers, Pending Orders */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </>
          ) : (
            <>
              {renderKPICard("Revenue Today", formatCurrency(metrics?.revenuePeriods?.today?.current || 0), metrics?.revenuePeriods?.today?.growth || 0, metrics?.revenuePeriods?.today?.trend || 'flat', DollarSign, "vs Yesterday")}
              {renderKPICard("Orders Today", metrics?.orderPeriods?.today?.current || 0, metrics?.orderPeriods?.today?.growth || 0, metrics?.orderPeriods?.today?.trend || 'flat', ShoppingBag, "vs Yesterday")}
              {renderKPICard("New Customers", metrics?.newCustomersToday || 0, metrics?.customersGrowth || 0, metrics?.customersTrend || 'flat', Users, "Today")}
              {renderKPICard("Pending Orders", metrics?.pendingOrders || 0, 0, 'flat', Clock, "Awaiting Action")}
            </>
          )}
        </div>

        {/* ROW 1.5: Weekly Orders, Monthly Orders, Monthly Early Revenue, Monthly Revenue */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </>
          ) : (
            <>
              {renderKPICard("Weekly Orders", metrics?.orderPeriods?.week?.current || 0, metrics?.orderPeriods?.week?.growth || 0, metrics?.orderPeriods?.week?.trend || 'flat', ShoppingBag, "Last 7 Days")}
              {renderKPICard("Monthly Orders", metrics?.orderPeriods?.month?.current || 0, metrics?.orderPeriods?.month?.growth || 0, metrics?.orderPeriods?.month?.trend || 'flat', ShoppingBag, "This Month")}
              {renderKPICard("Early Revenue", formatCurrency(metrics?.monthlyEarlyRevenue || 0), 0, 'flat', TrendingUp, "Advance Orders")}
              {renderKPICard("Monthly Revenue", formatCurrency(metrics?.revenuePeriods?.month?.current || 0), metrics?.revenuePeriods?.month?.growth || 0, metrics?.revenuePeriods?.month?.trend || 'flat', DollarSign, "vs Last Month")}
            </>
          )}
        </div>

        {/* ROW 2: Today's Visits, Unique Visitors, New Visitors, Returning Visitors */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </>
          ) : (
            <>
              {renderKPICard("Today's Visits", metrics?.visitorMetrics?.todaysVisits || 0, 0, 'flat', Eye, "Total Sessions")}
              {renderKPICard("Unique Visitors", metrics?.visitorMetrics?.uniqueVisitors || 0, 0, 'flat', Users, "Unique Users")}
              {renderKPICard("New Visitors", metrics?.visitorMetrics?.newVisitors || 0, 0, 'flat', UserCog, "First-time")}
              {renderKPICard("Returning Visitors", metrics?.visitorMetrics?.returningVisitors || 0, 0, 'flat', Activity, "Repeat Users")}
            </>
          )}
        </div>

        {/* ROW 3: Active Chefs, Active Delivery Partners, Cancelled Orders, Avg Order Value */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </>
          ) : (
            <>
              {renderKPICard("Active Chefs", metrics?.activeChefsToday || 0, 0, 'flat', ChefHat, "Today")}
              {renderKPICard("Active Delivery", metrics?.activeDeliveryPartnersToday || 0, 0, 'flat', Truck, "Delivering")}
              {renderKPICard("Cancelled Orders", metrics?.cancelledOrdersToday || 0, 0, 'flat', Package, "Today")}
              {renderKPICard("Avg Order Value", formatCurrency(metrics?.averageOrderValueToday || 0), 0, 'flat', TrendingUp, "Today")}
            </>
          )}
        </div>

        {/* ROW 4: Revenue Trend Chart (Full Width) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <div>
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <CardDescription className="text-xs">Net revenue over time</CardDescription>
            </div>
            <Select value={revenuePeriod} onValueChange={(v: any) => setRevenuePeriod(v)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {chartsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.revenueTrend?.[revenuePeriod] || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                    <RechartsTooltip 
                      formatter={(value: number) => [`₹${value}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROW 5: Order Status Distribution + Top Selling Items */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-lg">Order Status</CardTitle>
              <CardDescription className="text-xs">Current distribution</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {metricsLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[250px] w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: metrics?.statusBreakdown?.pending || 0 },
                          { name: 'Preparing', value: (metrics?.statusBreakdown?.accepted || 0) + (metrics?.statusBreakdown?.preparing || 0) },
                          { name: 'Ready', value: metrics?.statusBreakdown?.ready || 0 },
                          { name: 'Delivering', value: metrics?.statusBreakdown?.outForDelivery || 0 },
                          { name: 'Delivered', value: metrics?.statusBreakdown?.delivered || 0 },
                          { name: 'Cancelled', value: metrics?.statusBreakdown?.cancelled || 0 },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#f59e0b" /> {/* Pending */}
                        <Cell key="cell-1" fill="#3b82f6" /> {/* Preparing */}
                        <Cell key="cell-2" fill="#8b5cf6" /> {/* Ready */}
                        <Cell key="cell-3" fill="#06b6d4" /> {/* Delivering */}
                        <Cell key="cell-4" fill="#10b981" /> {/* Delivered */}
                        <Cell key="cell-5" fill="#ef4444" /> {/* Cancelled */}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-lg">Top Selling Items</CardTitle>
              <CardDescription className="text-xs">Highest revenue products</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {chartsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {charts?.topItems?.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          #{i+1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">{item.quantity} sold</p>
                        </div>
                      </div>
                      <div className="font-semibold text-xs">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  ))}
                  {(!charts?.topItems || charts.topItems.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground text-xs">No sales data</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ROW 6: Top Delivery Areas + Top Performing Chefs */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Areas */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-lg">Top Delivery Areas</CardTitle>
              <CardDescription className="text-xs">Highest revenue locations</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {chartsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {charts?.topAreas?.slice(0, 5).map((area, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          #{i+1}
                        </div>
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-muted-foreground">{area.orders} orders</p>
                        </div>
                      </div>
                      <div className="font-semibold text-xs">
                        {formatCurrency(area.revenue)}
                      </div>
                    </div>
                  ))}
                  {(!charts?.topAreas || charts.topAreas.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground text-xs">No area data</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Chefs (Placeholder) */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-lg">Top Performing Chefs</CardTitle>
              <CardDescription className="text-xs">Highest order volume chefs</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Chef performance data coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}