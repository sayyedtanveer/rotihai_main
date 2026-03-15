
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Package, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { Subscription, SubscriptionPlan } from "@shared/schema";

interface SubscriptionScheduleProps {
  subscriptionId: string;
}

interface ScheduleItem {
  date: Date;
  time: string;
  items: any[];
  status: "delivered" | "pending";
}

interface ScheduleData {
  subscription: Subscription;
  plan: SubscriptionPlan;
  schedule: ScheduleItem[];
  remainingDeliveries: number;
  totalDeliveries: number;
  deliveryHistory: any[];
}

export function SubscriptionSchedule({ subscriptionId }: SubscriptionScheduleProps) {
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("userToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const { data, isLoading } = useQuery<ScheduleData>({
    queryKey: ["/api/subscriptions", subscriptionId, "schedule"],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/schedule`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No schedule available yet. Please ensure your subscription is active.</p>
        </CardContent>
      </Card>
    );
  }

  const { subscription, plan, schedule, remainingDeliveries, totalDeliveries } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delivery Schedule</span>
            <Badge variant="outline">
              {remainingDeliveries} / {totalDeliveries} remaining
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {(plan.items as any[]).map((item: any, idx: number) => (
                  <span key={idx}>
                    {item.quantity}x {item.productId}
                    {idx < (plan.items as any[]).length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Daily at {subscription.nextDeliveryTime}</span>
            </div>
          </div>

          {schedule && schedule.length > 0 ? (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {schedule.slice(0, 10).map((item, idx) => {
                  // Parse date string to Date object
                  const itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
                  
                  // Determine styling based on status
                  let bgClass = "bg-background";
                  let statusIcon = null;
                  let statusText = "";
                  
                  if (item.status === "delivered") {
                    bgClass = "bg-green-50 border-green-200";
                    statusIcon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                  } else if (item.status === "skipped") {
                    bgClass = "bg-gray-50 border-gray-200 opacity-75";
                    statusText = "Skipped";
                  } else if (item.status === "scheduled") {
                    bgClass = "bg-blue-50 border-blue-200";
                  }
                  
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${bgClass}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${item.status === "skipped" ? "line-through text-muted-foreground" : ""}`}>
                            {format(itemDate, "EEE MMM dd yyyy")} — {item.time}
                          </p>
                          {statusText && <p className="text-xs text-muted-foreground mt-1">{statusText}</p>}
                        </div>
                      </div>
                      {statusIcon}
                    </div>
                  );
                })}
              </div>

              {schedule.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Showing next 10 deliveries
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No upcoming deliveries scheduled</p>
              <p className="text-xs text-muted-foreground mt-1">Your delivery schedule will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
