import { getPeriodOrderComparison, getPeriodRevenueComparison, getVisitorMetricsForToday } from "../analytics";
import { subDays, startOfDay } from "date-fns";

describe("Analytics tests", () => {
  test("getPeriodOrderComparison excludes cancelled orders for today", () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const yesterday = subDays(now, 1).toISOString();

    const orders: any[] = [
      // valid paid + delivered today
      { id: "o1", paymentStatus: "paid", status: "delivered", createdAt: now.toISOString(), subtotal: 100, total: 100 },
      // cancelled today (should be excluded)
      { id: "o2", paymentStatus: "paid", status: "cancelled", createdAt: now.toISOString(), subtotal: 50, total: 50 },
      // valid order yesterday
      { id: "o3", paymentStatus: "paid", status: "delivered", createdAt: yesterday, subtotal: 80, total: 80 },
    ];

    const result = getPeriodOrderComparison(orders, "today");
    expect(result.current).toBe(1); // only o1 counted
  });

  test("getVisitorMetricsForToday counts unique sessions and new/returning correctly", () => {
    const now = new Date();
    const yesterday = subDays(now, 1);

    const visitors: any[] = [
      // sessionA visited yesterday and today (returning)
      { sessionId: "sessionA", createdAt: yesterday.toISOString() },
      { sessionId: "sessionA", createdAt: now.toISOString() },
      // sessionB first visit today (new)
      { sessionId: "sessionB", createdAt: now.toISOString() },
      // sessionC visited only yesterday (not counted today)
      { sessionId: "sessionC", createdAt: yesterday.toISOString() },
    ];

    const metrics = getVisitorMetricsForToday(visitors as any);
    expect(metrics.uniqueVisitors).toBe(2); // sessionA and sessionB
    expect(metrics.newVisitors).toBe(1); // sessionB is new
    expect(metrics.returningVisitors).toBe(1); // sessionA is returning
  });

  test("getPeriodRevenueComparison excludes cancelled orders from today revenue", () => {
    const now = new Date();
    const yesterday = subDays(now, 1).toISOString();

    const orders: any[] = [
      { id: "o1", paymentStatus: "paid", status: "delivered", createdAt: now.toISOString(), deliveredAt: now.toISOString(), subtotal: 100, total: 100 },
      { id: "o2", paymentStatus: "paid", status: "cancelled", createdAt: now.toISOString(), subtotal: 50, total: 50 },
      { id: "o3", paymentStatus: "paid", status: "delivered", createdAt: yesterday, deliveredAt: yesterday, subtotal: 80, total: 80 },
    ];

    const result = getPeriodRevenueComparison(orders, "today");
    expect(result.current).toBe(100); // only o1 revenue counted
  });
});
