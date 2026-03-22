
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/apiClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { Order } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { CheckCircle, Clock, CreditCard, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { playNotificationSoundTwoTone } from "@/lib/notificationSound";
import { getWebSocketURL } from "@/lib/fetchClient";

export default function AdminPayments() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const itemsPerPage = 100;

  // 📡 WebSocket listener for real-time order updates (cancel, status changes, etc.)
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const wsUrl = getWebSocketURL(`?token=${encodeURIComponent(token)}&type=admin`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ AdminPayments WebSocket connected for real-time updates");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Listen for order updates (payment status changes, cancellations, etc.)
        if (data.type === "order_update" || data.type === "new_order") {
          const order = data.data as Order;
          console.log("📡 AdminPayments received order update:", {
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
          });

          // Refresh payment orders list to show updated status
          queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders", "payments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });
        }
      } catch (error) {
        console.error("❌ WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ AdminPayments WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin", "orders", "payments"],
    queryFn: async () => {
      const response = await api.get("/api/admin/orders");
      const allOrders = response.data;
      // Filter for only pending and paid payments (not yet confirmed)
      const filteredOrders = allOrders.filter((order: Order) =>
        order.paymentStatus === "pending" || order.paymentStatus === "paid"
      );
      // Sort by latest first (descending order by createdAt)
      return filteredOrders.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const response = await api.patch(`/api/admin/orders/${orderId}/payment`, {
        paymentStatus: "paid"
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });

      toast({
        title: "✓ Marked as Paid",
        description: "Payment verified. Click 'Confirm & Send to Chef' to proceed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || error?.message || "Failed to mark as paid",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const response = await api.patch(`/api/admin/orders/${orderId}/payment`, {
        paymentStatus: "confirmed"
      });
      return response.data;
    },
    onSuccess: () => {
      // 🔊 Play notification sound
      playNotificationSoundTwoTone();

      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });

      toast({
        title: "✓ Order Confirmed & Sent to Chef",
        description: "Chef is now preparing the order",
      });

      // 📱 Send push notification to offline users (non-blocking, fire and forget)
      try {
        api.post("/api/push/send", {
          userType: "customer",
          notification: {
            title: "✓ Payment Confirmed",
            body: "Your order has been confirmed. Chef is preparing it now.",
            tag: "payment-confirmation",
          },
        }).catch((e) => {
          console.log("ℹ️ Push notification send failed or not configured", e.message);
        });
      } catch (e) {
        // Ignore synchronous errors in setting up the request
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || error?.message || "Failed to confirm order",
        variant: "destructive",
      });
    },
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

  // Filter and search orders
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPaymentStatus =
      paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesPaymentStatus;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Payment Confirmation
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review and confirm pending UPI payments
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Payment Workflow:</p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>1️⃣ Customer places order → QR code shown automatically</li>
              <li>2️⃣ Customer pays via UPI → Order becomes "Pending"</li>
              <li>3️⃣ <strong>Check UPI app for payment</strong> → Click "✓ Mark as Paid"</li>
              <li>4️⃣ <strong>Then click "Confirm to Chef"</strong> → Order sent to Chef for preparation</li>
              <li>5️⃣ Delivery person picks up → Delivers to customer</li>
            </ol>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by order ID, customer name, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={paymentStatusFilter}
                onValueChange={(value) => {
                  setPaymentStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Showing {paginatedOrders.length} of {filteredOrders.length} orders
            </p>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                Loading payments...
              </div>
            ) : filteredOrders.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-payment-${order.id}`}>
                        <TableCell className="font-medium">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{order.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md text-sm">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-normal break-words line-clamp-2">
                              {order.addressBuilding ? `${order.addressBuilding}, ${order.addressStreet ? order.addressStreet + ', ' : ''}${order.addressArea}` : (order.address || "No address provided")}
                            </p>
                            {order.addressPincode && (
                              <p className="text-xs text-slate-500 mt-0.5">{order.addressCity} - {order.addressPincode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {(order.items as any[]).map((item, idx) => (
                              <p key={idx} className="text-sm">
                                {item.name} x{item.quantity}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div>
                            <p>₹{order.total}</p>
                            <p className="text-xs text-slate-500">
                              Sub: ₹{order.subtotal} + Del: ₹{order.deliveryFee}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(order.createdAt), "MMM d, yyyy")}
                          <br />
                          <span className="text-xs text-slate-500">
                            {format(new Date(order.createdAt), "h:mm a")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {order.paymentStatus === "paid" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {order.paymentStatus === "confirmed" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {order.paymentStatus.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {order.paymentStatus === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsPaidMutation.mutate({ orderId: order.id })}
                                disabled={markAsPaidMutation.isPending}
                                data-testid={`button-mark-paid-${order.id}`}
                              >
                                ✓ Mark as Paid
                              </Button>
                            )}
                            {(order.paymentStatus === "paid" || order.paymentStatus === "pending") && order.paymentStatus !== "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => confirmPaymentMutation.mutate({ orderId: order.id })}
                                disabled={confirmPaymentMutation.isPending}
                                data-testid={`button-confirm-${order.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm to Chef
                              </Button>
                            )}
                            {order.paymentStatus === "confirmed" && (
                              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                ✓ Confirmed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">No pending payments</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  All payments have been confirmed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
