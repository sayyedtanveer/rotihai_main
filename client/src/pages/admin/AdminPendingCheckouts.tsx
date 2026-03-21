import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/apiClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Search, Trash2, Eye, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PendingCheckout {
  id: string;
  phone: string;
  customerName: string;
  email?: string;
  address?: string;
  items: any[];
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  status: "pending" | "confirmed" | "abandoned";
  createdAt: string;
  updatedAt: string;
  orderId?: string;
}

export default function AdminPendingCheckouts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<PendingCheckout | null>(null);

  const { data: pendingCheckouts, isLoading } = useQuery<PendingCheckout[]>({
    queryKey: ["/api/admin/pending-checkouts"],
    queryFn: async () => {
      const response = await api.get("/api/admin/pending-checkouts");
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (checkoutId: string) => {
      const response = await api.delete(`/api/admin/pending-checkouts/${checkoutId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-checkouts"] });
      setDeleteDialogOpen(false);
      setSelectedCheckout(null);
      toast({
        title: "Deleted successfully",
        description: "Pending checkout has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete pending checkout",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "abandoned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

  const filteredCheckouts = pendingCheckouts?.filter((checkout) => {
    const query = searchQuery.toLowerCase();
    return (
      checkout.phone.includes(query) ||
      checkout.customerName.toLowerCase().includes(query) ||
      checkout.email?.toLowerCase().includes(query)
    );
  }) || [];

  const statusCounts = {
    pending: pendingCheckouts?.filter((c) => c.status === "pending").length || 0,
    confirmed: pendingCheckouts?.filter((c) => c.status === "confirmed").length || 0,
    abandoned: pendingCheckouts?.filter((c) => c.status === "abandoned").length || 0,
  };

  const handleDeleteClick = (checkout: PendingCheckout) => {
    setSelectedCheckout(checkout);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCheckout) {
      deleteMutation.mutate(selectedCheckout.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Checkouts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage user checkout attempts saved before payment confirmation
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.confirmed}</div>
              <p className="text-xs text-slate-500 mt-1">Converted to orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Abandoned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.abandoned}</div>
              <p className="text-xs text-slate-500 mt-1">Payment not completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>All Pending Checkouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by phone, name, or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Loading pending checkouts...</p>
              </div>
            ) : filteredCheckouts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No pending checkouts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCheckouts.map((checkout) => (
                      <TableRow key={checkout.id}>
                        <TableCell className="font-mono text-sm">{checkout.phone}</TableCell>
                        <TableCell>{checkout.customerName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(checkout.status)}>
                            {checkout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{checkout.total}</TableCell>
                        <TableCell className="text-sm">
                          {Array.isArray(checkout.items) ? checkout.items.length : 0} items
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {format(new Date(checkout.createdAt), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {checkout.orderId ? (
                            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                              {checkout.orderId.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Could open a detail view modal here
                                toast({
                                  title: "Details",
                                  description: JSON.stringify(checkout, null, 2),
                                });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(checkout)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pending Checkout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this pending checkout for{" "}
                <span className="font-semibold">{selectedCheckout?.customerName}</span>? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 bg-slate-50 dark:bg-slate-950 rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Phone:</span>{" "}
                <span className="font-mono">{selectedCheckout?.phone}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total:</span>{" "}
                <span className="font-semibold">₹{selectedCheckout?.total}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Status:</span>{" "}
                <Badge className={getStatusColor(selectedCheckout?.status || "pending")}>
                  {selectedCheckout?.status}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
