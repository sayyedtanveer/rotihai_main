import { Order, User, Chef } from "@shared/schema";
import { isValidRevenueOrder, filterOrdersByDateRange, calculateRevenueMetrics, getCustomerMetrics, DateRange, isCancelledOrder } from "./analytics";
import { startOfDay, endOfDay, format } from "date-fns";

export const generateRevenueReport = (orders: Order[], range: DateRange) => {
  const periodOrders = filterOrdersByDateRange(orders, range);
  const metrics = calculateRevenueMetrics(periodOrders);
  
  // Group by day for charts
  const revenueByDay = new Map<string, { revenue: number, orders: number }>();
  periodOrders.filter(isValidRevenueOrder).forEach(order => {
    const dateStr = format(new Date(order.deliveredAt || order.createdAt), 'yyyy-MM-dd');
    const current = revenueByDay.get(dateStr) || { revenue: 0, orders: 0 };
    current.revenue += order.total || 0;
    current.orders += 1;
    revenueByDay.set(dateStr, current);
  });

  return {
    ...metrics,
    revenueByDay: Array.from(revenueByDay.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
};

export const generateCompletedOrdersReport = (orders: Order[], range: DateRange) => {
  const periodOrders = filterOrdersByDateRange(orders, range);
  const completedOrders = periodOrders.filter(isValidRevenueOrder);
  
  return {
    totalCompleted: completedOrders.length,
    revenue: completedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    averageOrderValue: completedOrders.length > 0 ? Math.round(completedOrders.reduce((sum, o) => sum + (o.total || 0), 0) / completedOrders.length) : 0,
    orders: completedOrders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total,
      deliveredAt: o.deliveredAt,
      chefName: o.chefName,
      deliveryPersonName: o.deliveryPersonName
    })).sort((a, b) => new Date(b.deliveredAt || 0).getTime() - new Date(a.deliveredAt || 0).getTime())
  };
};

export const generateCancelledOrdersReport = (orders: Order[], range: DateRange) => {
  const periodOrders = filterOrdersByDateRange(orders, range);
  const cancelledOrders = periodOrders.filter(isCancelledOrder);
  
  const reasons = new Map<string, number>();
  cancelledOrders.forEach(o => {
    const reason = o.rejectionReason || "Unknown";
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  });

  return {
    totalCancelled: cancelledOrders.length,
    cancellationRate: periodOrders.length > 0 ? Number(((cancelledOrders.length / periodOrders.length) * 100).toFixed(1)) : 0,
    reasonsBreakdown: Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count })),
    orders: cancelledOrders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total,
      createdAt: o.createdAt,
      rejectedAt: o.rejectedAt,
      rejectedBy: o.rejectedBy,
      rejectionReason: o.rejectionReason
    })).sort((a, b) => new Date(b.rejectedAt || 0).getTime() - new Date(a.rejectedAt || 0).getTime())
  };
};

export const generateCustomerReport = (orders: Order[], users: User[], range: DateRange) => {
  const metrics = getCustomerMetrics(orders, users, range);
  
  const customerStats = new Map<string, { name: string, email: string, phone: string, totalSpent: number, orderCount: number, lastOrderDate: string }>();
  
  orders.filter(isValidRevenueOrder).forEach(order => {
    if (!order.userId) return;
    const current = customerStats.get(order.userId) || { 
      name: order.customerName, 
      email: order.email || "", 
      phone: order.phone, 
      totalSpent: 0, 
      orderCount: 0,
      lastOrderDate: ""
    };
    current.totalSpent += (order.total || 0);
    current.orderCount += 1;
    
    const orderDate = new Date(order.createdAt).toISOString();
    if (!current.lastOrderDate || orderDate > current.lastOrderDate) {
      current.lastOrderDate = orderDate;
    }
    
    customerStats.set(order.userId, current);
  });

  return {
    ...metrics,
    topCustomers: Array.from(customerStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 50)
  };
};

export const generateChefReport = (orders: Order[], chefs: Chef[], range: DateRange) => {
  const periodOrders = filterOrdersByDateRange(orders, range);
  
  const chefStats = chefs.map(chef => {
    const chefOrders = periodOrders.filter(o => o.chefId === chef.id);
    const completedOrders = chefOrders.filter(isValidRevenueOrder);
    const cancelledOrders = chefOrders.filter(o => o.status === 'cancelled' && (o.rejectedBy === 'chef' || o.rejectionReason?.toLowerCase().includes('chef')));
    
    const revenue = completedOrders.reduce((sum, o) => sum + ((o.subtotal || 0) * 0.8), 0); // Approx chef earning rule

    return {
      id: chef.id,
      name: chef.name,
      rating: chef.rating,
      totalOrdersAssigned: chefOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      acceptanceRate: chefOrders.length > 0 ? Number(((completedOrders.length / chefOrders.length) * 100).toFixed(1)) : 0,
      revenueGenerated: completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0),
      estimatedEarnings: revenue
    };
  }).sort((a, b) => b.completedOrders - a.completedOrders);

  return {
    totalChefs: chefs.length,
    activeChefs: chefStats.filter(c => c.completedOrders > 0).length,
    chefStats
  };
};
