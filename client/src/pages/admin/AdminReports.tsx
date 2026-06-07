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
  CalendarIcon, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package, Download, BarChart3, ChefHat, Star, Search, Check, Clock, Loader, AlertCircle, XCircle
} from "lucide-react";
import api from "@/lib/apiClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

export default function AdminReports() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("revenue");

  // Fetch functions
  const fetchReport = async (endpoint: string) => {
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString()
    });
    const { data } = await api.get(`/api/admin/reports/${endpoint}?${params}`);
    return data;
  };

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-report-revenue', dateRange],
    queryFn: () => fetchReport('revenue'),
    enabled: activeTab === 'revenue'
  });

  const { data: completedOrdersData, isLoading: completedOrdersLoading } = useQuery({
    queryKey: ['admin-report-completed-orders', dateRange],
    queryFn: () => fetchReport('completed-orders'),
    enabled: activeTab === 'completed-orders'
  });

  const { data: cancelledOrdersData, isLoading: cancelledOrdersLoading } = useQuery({
    queryKey: ['admin-report-cancelled-orders', dateRange],
    queryFn: () => fetchReport('cancelled-orders'),
    enabled: activeTab === 'cancelled-orders'
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-report-customers', dateRange],
    queryFn: () => fetchReport('customers'),
    enabled: activeTab === 'customers'
  });

  const { data: chefsData, isLoading: chefsLoading } = useQuery({
    queryKey: ['admin-report-chefs', dateRange],
    queryFn: () => fetchReport('chefs'),
    enabled: activeTab === 'chefs'
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-1 sm:p-4">
        {/* Header and Date Picker */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Reports & Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Detailed breakdown of business performance.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-[260px]", !dateRange && "text-muted-foreground")}>
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
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                      setIsCalendarOpen(false);
                    } else if (range?.from) {
                      setDateRange({ from: range.from, to: range.from });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => {
              // Basic export of currently visible table data based on active tab
              if (activeTab === 'completed-orders' && completedOrdersData?.orders) exportToCSV(completedOrdersData.orders, 'completed_orders');
              if (activeTab === 'cancelled-orders' && cancelledOrdersData?.orders) exportToCSV(cancelledOrdersData.orders, 'cancelled_orders');
              if (activeTab === 'customers' && customersData?.topCustomers) exportToCSV(customersData.topCustomers, 'customers');
              if (activeTab === 'chefs' && chefsData?.chefStats) exportToCSV(chefsData.chefStats, 'chefs');
            }}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-max min-w-full justify-start md:justify-center">
              <TabsTrigger value="revenue" className="flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Revenue</TabsTrigger>
              <TabsTrigger value="completed-orders" className="flex items-center"><Check className="w-4 h-4 mr-2"/> Completed Orders</TabsTrigger>
              <TabsTrigger value="cancelled-orders" className="flex items-center"><XCircle className="w-4 h-4 mr-2"/> Cancelled Orders</TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center"><Users className="w-4 h-4 mr-2"/> Customers</TabsTrigger>
              <TabsTrigger value="chefs" className="flex items-center"><ChefHat className="w-4 h-4 mr-2"/> Chefs</TabsTrigger>
            </TabsList>
          </div>

          {/* REVENUE TAB */}
          <TabsContent value="revenue" className="space-y-4">
            {revenueLoading ? <Skeleton className="h-96 w-full" /> : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData?.revenue || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gross Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData?.grossRevenue || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Delivery Fees Collected</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData?.totalDeliveryFees || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Platform Fees</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData?.totalPlatformFees || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Discounts Given</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-500">-{formatCurrency(revenueData?.totalDiscounts || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Wallet Usage</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-orange-500">-{formatCurrency(revenueData?.totalWalletUsage || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Average Order Value</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData?.averageOrderValue || 0)}</div></CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader><CardTitle>Daily Revenue</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData?.revenueByDay || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'MMM dd')} />
                          <YAxis />
                          <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* COMPLETED ORDERS TAB */}
          <TabsContent value="completed-orders" className="space-y-4">
            {completedOrdersLoading ? <Skeleton className="h-96 w-full" /> : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Delivered</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{completedOrdersData?.totalCompleted || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue from Delivered</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(completedOrdersData?.revenue || 0)}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Average Order Value</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(completedOrdersData?.averageOrderValue || 0)}</div></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Completed Orders List</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Chef</TableHead>
                          <TableHead>Delivery Partner</TableHead>
                          <TableHead>Delivered At</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedOrdersData?.orders?.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.chefName || '-'}</TableCell>
                            <TableCell>{order.deliveryPersonName || '-'}</TableCell>
                            <TableCell>{order.deliveredAt ? format(new Date(order.deliveredAt), 'PP p') : '-'}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                          </TableRow>
                        ))}
                        {(!completedOrdersData?.orders || completedOrdersData.orders.length === 0) && (
                          <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No completed orders in this period.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CANCELLED ORDERS TAB */}
          <TabsContent value="cancelled-orders" className="space-y-4">
            {cancelledOrdersLoading ? <Skeleton className="h-96 w-full" /> : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-500">Total Cancelled</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{cancelledOrdersData?.totalCancelled || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{cancelledOrdersData?.cancellationRate || 0}%</div></CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="md:col-span-1">
                    <CardHeader><CardTitle>Cancellation Reasons</CardTitle></CardHeader>
                    <CardContent>
                       <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cancelledOrdersData?.reasonsBreakdown || []}
                              cx="50%" cy="50%" innerRadius={40} outerRadius={80}
                              dataKey="count" nameKey="reason"
                            >
                              {(cancelledOrdersData?.reasonsBreakdown || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Cancelled Orders Log</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Rejected By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Lost Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancelledOrdersData?.orders?.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell><Badge variant="outline">{order.rejectedBy || 'System'}</Badge></TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{order.rejectionReason || '-'}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(order.total)}</TableCell>
                            </TableRow>
                          ))}
                          {(!cancelledOrdersData?.orders || cancelledOrdersData.orders.length === 0) && (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No cancelled orders in this period.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* CUSTOMERS TAB */}
          <TabsContent value="customers" className="space-y-4">
            {customersLoading ? <Skeleton className="h-96 w-full" /> : (
              <>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Customers (Ever)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{customersData?.totalCustomers || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">New in Period</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{customersData?.newCustomersInPeriod || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Retention Rate</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{customersData?.returningCustomerPercentage || 0}%</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue Per Customer</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(customersData?.revenuePerCustomer || 0)}</div></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Top Customers (CLV)</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Email / Phone</TableHead>
                          <TableHead className="text-center">Total Orders</TableHead>
                          <TableHead>Last Order Date</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customersData?.topCustomers?.map((customer: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="text-xs">{customer.phone}<br/>{customer.email}</TableCell>
                            <TableCell className="text-center">{customer.orderCount}</TableCell>
                            <TableCell>{format(new Date(customer.lastOrderDate), 'PP')}</TableCell>
                            <TableCell className="text-right font-bold text-green-600">{formatCurrency(customer.totalSpent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CHEFS TAB */}
          <TabsContent value="chefs" className="space-y-4">
             {chefsLoading ? <Skeleton className="h-96 w-full" /> : (
              <>
                 <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Chefs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{chefsData?.totalChefs || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Chefs in Period</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{chefsData?.activeChefs || 0}</div></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Chef Performance Ranking</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Chef Name</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead className="text-center">Assigned</TableHead>
                          <TableHead className="text-center text-green-600">Completed</TableHead>
                          <TableHead className="text-center text-red-500">Cancelled</TableHead>
                          <TableHead className="text-center">Acceptance Rate</TableHead>
                          <TableHead className="text-right">Est. Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chefsData?.chefStats?.map((chef: any, idx: number) => (
                          <TableRow key={chef.id}>
                            <TableCell className="font-bold">#{idx + 1}</TableCell>
                            <TableCell className="font-medium">{chef.name}</TableCell>
                            <TableCell><div className="flex items-center"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1"/> {chef.rating}</div></TableCell>
                            <TableCell className="text-center">{chef.totalOrdersAssigned}</TableCell>
                            <TableCell className="text-center font-medium text-green-600">{chef.completedOrders}</TableCell>
                            <TableCell className="text-center text-red-500">{chef.cancelledOrders}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={chef.acceptanceRate > 90 ? "default" : chef.acceptanceRate > 75 ? "secondary" : "destructive"}>
                                {chef.acceptanceRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(chef.estimatedEarnings)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
             )}
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}
