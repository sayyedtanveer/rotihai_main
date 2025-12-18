import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Users, TrendingUp, Calendar, Globe } from "lucide-react";
import { format } from "date-fns";

interface VisitorReport {
  todayVisitors: number;
  totalVisitors: number;
  uniqueVisitors: number;
  visitorsByPage: Array<{ page: string; count: number }>;
  visitorsLastNDays: Array<{ date: string; count: number }>;
}

export default function AdminVisitorAnalytics() {
  const { data: visitorReport, isLoading } = useQuery<VisitorReport>({
    queryKey: ["/api/admin/reports/visitors"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/reports/visitors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch visitor report");
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Visitor Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track daily user visits and analytics
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Visitor Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track daily user visits and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today Visitors</CardTitle>
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitorReport?.todayVisitors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Daily app visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitorReport?.uniqueVisitors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitorReport?.totalVisitors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily Visitors</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visitorReport?.visitorsLastNDays && visitorReport.visitorsLastNDays.length > 0
                  ? Math.round(
                      visitorReport.visitorsLastNDays.reduce((sum, day) => sum + day.count, 0) /
                        visitorReport.visitorsLastNDays.length
                    )
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Visitor Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visitorReport?.visitorsLastNDays && visitorReport.visitorsLastNDays.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorReport.visitorsLastNDays.map((day, index) => {
                      const maxCount = Math.max(...visitorReport.visitorsLastNDays.map((d) => d.count));
                      const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {format(new Date(day.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{day.count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded h-2">
                                <div
                                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No visitor data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visitors by Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Visitors by Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visitorReport?.visitorsByPage && visitorReport.visitorsByPage.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorReport.visitorsByPage.map((page, index) => {
                      const totalVisits = visitorReport.visitorsByPage.reduce((sum, p) => sum + p.count, 0);
                      const percentage = totalVisits > 0 ? (page.count / totalVisits) * 100 : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{page.page}</TableCell>
                          <TableCell className="text-right font-semibold">{page.count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded h-2">
                                <div
                                  className="bg-green-600 dark:bg-green-400 h-2 rounded"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No page visitor data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
