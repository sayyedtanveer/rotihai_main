import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  X,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface ChefPerformance {
  chefId: string;
  chefName: string;
  metrics: {
    totalDeliveries: number;
    delivered: number;
    missed: number;
    deliveryRate: number;
    scheduled: number;
    preparing: number;
    outForDelivery: number;
    skipped: number;
    averageDeliveriesPerDay: number;
  };
  period: string;
  lastUpdated: string;
}

interface Leaderboard {
  chefId: string;
  chefName: string;
  deliveryRate: number;
  totalDeliveries: number;
  delivered: number;
  missed: number;
}

export default function ChefPerformance() {
  const [selectedChefId, setSelectedChefId] = useState<string | null>(null);

  // Fetch all chefs performance leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useQuery<{
    leaderboard: Leaderboard[];
    period: string;
    lastUpdated: string;
  }>({
    queryKey: ["/api/admin/chef-performance"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/chef-performance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Fetch individual chef performance (if selected)
  const { data: chefStats } = useQuery<ChefPerformance>(
    {
      queryKey: [`/api/admin/chef-performance/${selectedChefId}`, selectedChefId],
      queryFn: async () => {
        if (!selectedChefId) throw new Error("No chef selected");
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/admin/chef-performance/${selectedChefId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch chef performance");
        return response.json();
      },
      enabled: !!selectedChefId,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const leaderboard = leaderboardData?.leaderboard || [];
  const topChef = leaderboard[0];
  const topTenChefs = leaderboard.slice(0, 10);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Chef Performance</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Real-time delivery performance metrics and leaderboard
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLeaderboard()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {topChef && (
              <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Top Performing Chef
                      </CardTitle>
                      <CardDescription>Best delivery rate this month</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-200 text-yellow-900">
                      #{topChef.deliveryRate}% Success
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{topChef.chefName}</h3>
                      <p className="text-sm text-muted-foreground">Chef ID: {topChef.chefId}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delivery Rate</p>
                        <p className="text-2xl font-bold text-green-600">{topChef.deliveryRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delivered</p>
                        <p className="text-2xl font-bold text-blue-600">{topChef.delivered}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Missed</p>
                        <p className="text-2xl font-bold text-red-600">{topChef.missed}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {leaderboardLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading performance metrics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Chefs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{leaderboard.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Delivery Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {leaderboard.length > 0
                        ? Math.round(
                            leaderboard.reduce((sum, c) => sum + c.deliveryRate, 0) /
                              leaderboard.length
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Network wide</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {leaderboard.reduce((sum, c) => sum + c.totalDeliveries, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top 10 Performers
                </CardTitle>
                <CardDescription>Ranked by delivery success rate (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </div>
                ) : topTenChefs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No chef data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topTenChefs.map((chef, index) => (
                      <div
                        key={chef.chefId}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedChefId(chef.chefId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="font-bold text-lg w-8 text-center">#{index + 1}</div>
                            <div>
                              <p className="font-semibold">{chef.chefName}</p>
                              <p className="text-xs text-muted-foreground">ID: {chef.chefId.slice(0, 8)}...</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={chef.deliveryRate >= 90 ? "default" : chef.deliveryRate >= 80 ? "secondary" : "destructive"}
                            >
                              {chef.deliveryRate}% Success
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Progress value={chef.deliveryRate} className="h-2" />
                          <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{chef.delivered} delivered</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <X className="w-4 h-4 text-red-600" />
                              <span>{chef.missed} missed</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>{chef.totalDeliveries} total</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {!selectedChefId ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">
                    Select a chef from the leaderboard to view detailed performance metrics
                  </p>
                </CardContent>
              </Card>
            ) : chefStats ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{chefStats.chefName}</CardTitle>
                    <CardDescription>Detailed performance metrics</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Delivery Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{chefStats.metrics.deliveryRate}%</div>
                      <Progress value={chefStats.metrics.deliveryRate} className="mt-2 h-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        Delivered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{chefStats.metrics.delivered}</div>
                      <p className="text-xs text-muted-foreground mt-1">Out of {chefStats.metrics.totalDeliveries}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <X className="w-4 h-4 text-red-600" />
                        Missed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{chefStats.metrics.missed}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total missed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{chefStats.metrics.totalDeliveries}</div>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">{chefStats.metrics.scheduled}</div>
                      <p className="text-xs text-muted-foreground mt-1">Pending deliveries</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{chefStats.metrics.averageDeliveriesPerDay}</div>
                      <p className="text-xs text-muted-foreground mt-1">Daily average</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "Delivered", value: chefStats.metrics.delivered, color: "bg-green-100 text-green-800" },
                        { label: "Missed", value: chefStats.metrics.missed, color: "bg-red-100 text-red-800" },
                        { label: "Scheduled", value: chefStats.metrics.scheduled, color: "bg-yellow-100 text-yellow-800" },
                        { label: "Preparing", value: chefStats.metrics.preparing, color: "bg-blue-100 text-blue-800" },
                        { label: "Out for Delivery", value: chefStats.metrics.outForDelivery, color: "bg-purple-100 text-purple-800" },
                        { label: "Skipped", value: chefStats.metrics.skipped, color: "bg-gray-100 text-gray-800" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <Badge className={item.color}>{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">Loading chef details...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
