import { Order, User, Chef, PaymentStatus, Visitor } from "@shared/schema";
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear,
  subDays, subWeeks, subMonths, subYears,
  format, isWithinInterval, parseISO
} from "date-fns";

// ==========================================
// CORE REVENUE RULES (CRITICAL)
// ==========================================
// Revenue calculations must be standardized across the entire application.
// Only include orders where:
// paymentStatus IN ('paid', 'confirmed') AND status IN ('delivered', 'completed')
// Exclude: cancelled, refunded, failed, expired, payment pending orders

export const isValidRevenueOrder = (order: Order): boolean => {
  return (order.paymentStatus === "paid" || order.paymentStatus === "confirmed") && 
         (order.status === "delivered" || order.status === "completed");
};

export const isCancelledOrder = (order: Order): boolean => {
  return order.status === "cancelled";
};

// ==========================================
// TIME PERIOD UTILITIES
// ==========================================
export type TimePeriod = "today" | "week" | "month" | "year" | "lifetime";
export type DateRange = { start: Date; end: Date };

export const getPeriodRange = (period: TimePeriod, date = new Date()): DateRange => {
  switch (period) {
    case "today":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) };
    case "lifetime":
      return { start: new Date(2000, 0, 1), end: endOfDay(date) };
  }
};

export const getPreviousPeriodRange = (period: TimePeriod, date = new Date()): DateRange => {
  switch (period) {
    case "today":
      const yesterday = subDays(date, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "week":
      const lastWeek = subWeeks(date, 1);
      return { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    case "month":
      const lastMonth = subMonths(date, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case "year":
      const lastYear = subYears(date, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    case "lifetime":
      return { start: new Date(2000, 0, 1), end: endOfDay(date) }; // No previous for lifetime
  }
};

export const filterOrdersByDateRange = (orders: Order[], range: DateRange): Order[] => {
  return orders.filter(order => {
    // Determine the relevant date. Delivered orders use deliveredAt if available, else createdAt.
    const orderDate = (order.status === 'delivered' || order.status === 'completed') && order.deliveredAt 
      ? new Date(order.deliveredAt) 
      : new Date(order.createdAt);
      
    return isWithinInterval(orderDate, { start: range.start, end: range.end });
  });
};

export const filterOrdersByCreatedDateRange = (orders: Order[], range: DateRange): Order[] => {
  return orders.filter(order => {
    const createdAt = new Date(order.createdAt);
    return isWithinInterval(createdAt, { start: range.start, end: range.end });
  });
};

export const calculateGrowth = (current: number, previous: number): { growth: number; trend: "up" | "down" | "flat" } => {
  if (previous === 0) {
    return { growth: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "flat" };
  }
  const growth = ((current - previous) / previous) * 100;
  return {
    growth: Number(growth.toFixed(1)),
    trend: growth > 0 ? "up" : growth < 0 ? "down" : "flat"
  };
};

// ==========================================
// REVENUE & FINANCIAL METRICS
// ==========================================
export const calculateRevenueMetrics = (orders: Order[]) => {
  const validOrders = orders.filter(isValidRevenueOrder);
  
  let grossRevenue = 0;
  let netRevenue = 0;
  let totalDeliveryFees = 0;
  let totalPlatformFees = 0;
  let totalDiscounts = 0;
  let totalWalletUsage = 0;

  validOrders.forEach(order => {
    // Gross Revenue = Subtotal + Delivery + Platform Fee
    // Net Revenue = Total paid by customer (already accounts for discounts and wallet)
    grossRevenue += (order.subtotal || 0) + (order.deliveryFee || 0) + (order.platformFee || 0);
    netRevenue += order.total || 0;
    
    totalDeliveryFees += order.deliveryFee || 0;
    totalPlatformFees += order.platformFee || 0;
    totalDiscounts += order.discount || 0;
    totalWalletUsage += order.walletAmountUsed || 0;
  });

  return {
    revenue: netRevenue, // Primary metric for KPI cards
    grossRevenue,
    netRevenue,
    totalDeliveryFees,
    totalPlatformFees,
    totalDiscounts,
    totalWalletUsage,
    averageOrderValue: validOrders.length > 0 ? Math.round(netRevenue / validOrders.length) : 0,
    validOrderCount: validOrders.length
  };
};

export const getPeriodRevenueComparison = (allOrders: Order[], period: TimePeriod) => {
  const now = new Date();
  const currentRange = getPeriodRange(period, now);
  const prevRange = getPreviousPeriodRange(period, now);

  const currentOrders = filterOrdersByDateRange(allOrders, currentRange);
  const prevOrders = filterOrdersByDateRange(allOrders, prevRange);

  const currentMetrics = calculateRevenueMetrics(currentOrders);
  const prevMetrics = calculateRevenueMetrics(prevOrders);

  const growth = calculateGrowth(currentMetrics.revenue, prevMetrics.revenue);

  return {
    current: currentMetrics.revenue,
    previous: prevMetrics.revenue,
    growth: growth.growth,
    trend: growth.trend
  };
};

// ==========================================
// ORDER METRICS
// ==========================================
export const getPeriodOrderComparison = (allOrders: Order[], period: TimePeriod) => {
  const now = new Date();
  const currentRange = getPeriodRange(period, now);
  const prevRange = getPreviousPeriodRange(period, now);

  const currentOrders = filterOrdersByCreatedDateRange(allOrders, currentRange);
  const prevOrders = filterOrdersByCreatedDateRange(allOrders, prevRange);

  const growth = calculateGrowth(currentOrders.length, prevOrders.length);

  return {
    current: currentOrders.length,
    previous: prevOrders.length,
    growth: growth.growth,
    trend: growth.trend
  };
};

export const getOrderStatusBreakdown = (orders: Order[]) => {
  const breakdown = {
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    total: orders.length
  };

  orders.forEach(order => {
    if (order.status === 'pending') breakdown.pending++;
    else if (order.status === 'accepted_by_chef') breakdown.accepted++;
    else if (order.status === 'preparing') breakdown.preparing++;
    else if (order.status === 'prepared') breakdown.ready++;
    else if (order.status === 'out_for_delivery') breakdown.outForDelivery++;
    else if (order.status === 'delivered' || order.status === 'completed') breakdown.delivered++;
    else if (order.status === 'cancelled') breakdown.cancelled++;
  });

  return breakdown;
};

// ==========================================
// CUSTOMER METRICS
// ==========================================
export const getCustomerMetrics = (allOrders: Order[], users: User[], periodRange: DateRange) => {
  // Definition: User who has placed at least one order.
  const allCustomerIds = new Set(allOrders.map(o => o.userId).filter(Boolean));
  
  const periodOrders = filterOrdersByCreatedDateRange(allOrders, periodRange);
  const periodCustomerIds = new Set(periodOrders.map(o => o.userId).filter(Boolean));
  
  // Find new customers in this period (first order was in this period)
  let newCustomersInPeriod = 0;
  let repeatCustomersInPeriod = 0;
  
  periodCustomerIds.forEach(userId => {
    const userOrders = allOrders.filter(o => o.userId === userId).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    if (userOrders.length > 0) {
      const firstOrderDate = new Date(userOrders[0].createdAt);
      if (isWithinInterval(firstOrderDate, periodRange)) {
        newCustomersInPeriod++;
      } else {
        repeatCustomersInPeriod++;
      }
    }
  });

  const totalValidOrders = allOrders.filter(isValidRevenueOrder).length;
  
  return {
    totalCustomers: allCustomerIds.size,
    newCustomersInPeriod,
    repeatCustomersInPeriod,
    returningCustomerPercentage: periodCustomerIds.size > 0 
      ? Number(((repeatCustomersInPeriod / periodCustomerIds.size) * 100).toFixed(1)) 
      : 0,
    averageOrdersPerCustomer: allCustomerIds.size > 0 
      ? Number((allOrders.length / allCustomerIds.size).toFixed(1)) 
      : 0,
    revenuePerCustomer: allCustomerIds.size > 0 
      ? Math.round(calculateRevenueMetrics(allOrders).revenue / allCustomerIds.size)
      : 0
  };
};

// ==========================================
// CHART DATA GENERATORS
// ==========================================
export const generateRevenueTrendChart = (orders: Order[], period: 'today' | '7days' | '30days' | '90days' | '12months') => {
  const validOrders = orders.filter(isValidRevenueOrder);
  const now = new Date();
  let dataMap = new Map<string, number>();
  
  // Initialize map based on period
  if (period === 'today') {
    // 24 hours
    for (let i = 0; i < 24; i++) {
      const h = String(i).padStart(2, '0');
      dataMap.set(`${h}:00`, 0);
    }
  } else if (period === '7days' || period === '30days' || period === '90days') {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(now, i);
      dataMap.set(format(d, 'MMM dd'), 0);
    }
  } else if (period === '12months') {
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      dataMap.set(format(d, 'MMM yyyy'), 0);
    }
  }

  // Populate data
  validOrders.forEach(order => {
    const date = new Date(order.deliveredAt || order.createdAt);
    let key = '';
    
    if (period === 'today') {
      if (isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) })) {
        key = `${String(date.getHours()).padStart(2, '0')}:00`;
      }
    } else if (period === '7days' || period === '30days' || period === '90days') {
      const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      if (isWithinInterval(date, { start: subDays(now, days - 1), end: now })) {
        key = format(date, 'MMM dd');
      }
    } else if (period === '12months') {
      if (isWithinInterval(date, { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) })) {
        key = format(date, 'MMM yyyy');
      }
    }
    
    if (key && dataMap.has(key)) {
      dataMap.set(key, (dataMap.get(key) || 0) + (order.total || 0));
    }
  });

  return Array.from(dataMap.entries()).map(([label, revenue]) => ({ label, revenue }));
};

export const generateTopSellingItems = (orders: Order[], limit = 5) => {
  const validOrders = orders.filter(isValidRevenueOrder);
  const itemStats = new Map<string, { name: string, quantity: number, revenue: number }>();
  
  validOrders.forEach(order => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (!item.name) return;
        const current = itemStats.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += (item.quantity || 1);
        current.revenue += ((item.price || 0) * (item.quantity || 1));
        itemStats.set(item.id, current);
      });
    }
  });
  
  return Array.from(itemStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const generateTopAreas = (orders: Order[], limit = 5) => {
  const validOrders = orders.filter(isValidRevenueOrder);
  const areaStats = new Map<string, { name: string, orders: number, revenue: number }>();
  
  validOrders.forEach(order => {
    if (!order.addressArea) return;
    const current = areaStats.get(order.addressArea) || { name: order.addressArea, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += (order.total || 0);
    areaStats.set(order.addressArea, current);
  });
  
  return Array.from(areaStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

// ==========================================
// VISITOR ANALYTICS METRICS
// ==========================================
// Accurate visitor tracking without double-counting

export const getVisitorMetricsForToday = (visitors: Visitor[]): {
  todaysVisits: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
} => {
  // Handle empty or undefined visitors array
  if (!visitors || visitors.length === 0) {
    return {
      todaysVisits: 0,
      uniqueVisitors: 0,
      newVisitors: 0,
      returningVisitors: 0,
    };
  }

  const todayRange = getPeriodRange("today");
  
  // Filter visitors for today, excluding those with null/empty sessionId
  const todayVisitors = visitors.filter(v => {
    if (!v.sessionId || v.sessionId.trim() === '') {
      return false; // Skip records without valid sessionId
    }
    const visitDate = new Date(v.createdAt);
    return isWithinInterval(visitDate, todayRange);
  });

  // Today's Visits = total number of visits/page views
  const todaysVisits = todayVisitors.length;

  // Unique Visitors = count unique sessionIds (one per browser/device/user session)
  const uniqueSessionIds = new Set(todayVisitors.map(v => v.sessionId).filter(Boolean));
  const uniqueVisitors = uniqueSessionIds.size;

  // New Visitors = unique sessions visiting for the first time ever
  let newVisitors = 0;
  let returningVisitors = 0;

  uniqueSessionIds.forEach(sessionId => {
    // Check if this sessionId has ANY visits before today
    const previousVisits = visitors.filter(v => 
      v.sessionId === sessionId && 
      new Date(v.createdAt) < todayRange.start
    );

    if (previousVisits.length === 0) {
      newVisitors++;
    } else {
      returningVisitors++;
    }
  });

  console.log('[VISITOR METRICS] Today calculations:', {
    totalVisitors: visitors.length,
    todaysVisits,
    uniqueVisitors,
    newVisitors,
    returningVisitors,
    sessionIdsWithoutValue: visitors.filter(v => !v.sessionId || v.sessionId.trim() === '').length,
  });

  return {
    todaysVisits,
    uniqueVisitors,
    newVisitors,
    returningVisitors,
  };
};

// Get visitor metrics for any period
export const getVisitorMetricsForPeriod = (visitors: Visitor[], period: TimePeriod): {
  visits: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
} => {
  const periodRange = getPeriodRange(period);
  
  const periodVisitors = visitors.filter(v => {
    const visitDate = new Date(v.createdAt);
    return isWithinInterval(visitDate, periodRange);
  });

  const uniqueSessionIds = new Set(periodVisitors.map(v => v.sessionId));
  let newVisitors = 0;
  let returningVisitors = 0;

  uniqueSessionIds.forEach(sessionId => {
    const previousVisits = visitors.filter(v => 
      v.sessionId === sessionId && 
      new Date(v.createdAt) < periodRange.start
    );

    if (previousVisits.length === 0) {
      newVisitors++;
    } else {
      returningVisitors++;
    }
  });

  return {
    visits: periodVisitors.length,
    uniqueVisitors: uniqueSessionIds.size,
    newVisitors,
    returningVisitors,
  };
};
