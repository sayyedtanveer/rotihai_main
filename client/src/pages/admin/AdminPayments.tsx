
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useState } from "react";

export default function AdminPayments() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const itemsPerPage = 100;

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin", "orders", "payments"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const allOrders = await response.json();
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

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: "confirmed" }),
      });
      if (!response.ok) throw new Error("Failed to confirm payment");
      return response.json();
    },
    onSuccess: () => {
      // 🔊 Play notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play pleasant notification sound (two beeps)
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      // Second beep
      oscillator.frequency.value = 1000;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      oscillator.start(audioContext.currentTime + 0.15);
      oscillator.stop(audioContext.currentTime + 0.25);
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/metrics"] });
      
      toast({
        title: "✓ Payment Confirmed",
        description: "Order sent to chef for preparation",
      });
      
      // 📱 Send push notification to offline users (non-blocking, fire and forget)
      const adminToken = localStorage.getItem("adminToken");
      fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
        body: JSON.stringify({
          userType: "customer",
          notification: {
            title: "✓ Payment Confirmed",
            body: "Your order has been confirmed. Chef is preparing it now.",
            tag: "payment-confirmation",
          },
        }),
      }).catch(() => {
        // Silently fail if push not configured or network error
        console.log("ℹ️ Push notification send failed or not configured");
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to confirm payment",
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
              <li>2️⃣ Customer pays via UPI → Waits for confirmation</li>
              <li>3️⃣ <strong>You verify payment</strong> in UPI app → Click "Confirm Payment"</li>
              <li>4️⃣ Order sent to Chef → Chef prepares food</li>
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
                          <div className="max-w-sm text-sm">
                            <p className="text-slate-700 dark:text-slate-300 break-words">
                              {order.address || "No address provided"}
                            </p>
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
                          <Button
                            size="sm"
                            onClick={() => confirmPaymentMutation.mutate({ orderId: order.id })}
                            disabled={
                              confirmPaymentMutation.isPending || order.paymentStatus === "confirmed"
                            }
                            data-testid={`button-confirm-${order.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
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
