import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import api from "@/lib/apiClient";
import { getApiUrl } from "@/lib/apiBase";
import { Loader2, CheckCircle2, XCircle, Clock, Info, ShieldAlert, Award, Search, Coins, Landmark } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending_chef_assignment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  awaiting_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  converted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  pending_chef_assignment: "Pending Assignment",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  converted: "Active",
  rejected: "Rejected",
};

export default function AdminCustomSubscriptions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Settings pricing state
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState("");

  // Modal states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const [assignedChefId, setAssignedChefId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Queries
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/admin/custom-subscription-requests"],
    queryFn: async () => {
      const res = await api.get("/api/admin/custom-subscription-requests");
      return res.data;
    },
  });

  const { data: chefs = [] } = useQuery<Array<{ id: string; name: string; isActive: boolean; servicePincodes?: string[] }>>({
    queryKey: ["/api/admin/chefs"],
    queryFn: async () => {
      const res = await api.get("/api/admin/chefs");
      return res.data;
    },
  });

  const { data: priceData } = useQuery({
    queryKey: ["/api/custom-subscription/price-per-roti"],
    queryFn: async () => {
      const res = await api.get("/api/custom-subscription/price-per-roti");
      return res.data;
    },
  });

  const { data: deliverySlots = [] } = useQuery({
    queryKey: ["/api/delivery-slots"],
    queryFn: async () => {
      const res = await api.get("/api/delivery-slots");
      return res.data;
    },
  });

  const pricePerRoti = priceData?.pricePerRoti || 8;

  // Mutations
  const updatePriceMutation = useMutation({
    mutationFn: async (price: number) => {
      const res = await api.patch("/api/admin/settings/price-per-roti", { pricePerRoti: price });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-subscription/price-per-roti"] });
      setEditingPrice(false);
      toast({
        title: "Settings Updated",
        description: "Price per roti has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update price per roti.",
        variant: "destructive",
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, chefId }: { requestId: string; chefId: string }) => {
      const res = await api.patch(`/api/admin/custom-subscription-requests/${requestId}/approve`, { chefId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-subscription-requests"] });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setAssignedChefId("");
      toast({
        title: "Request Approved",
        description: "The custom subscription request has been approved and pending subscription created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const res = await api.patch(`/api/admin/custom-subscription-requests/${requestId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-subscription-requests"] });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      toast({
        title: "Request Rejected",
        description: "The custom subscription request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.response?.data?.message || "Failed to reject request",
        variant: "destructive",
      });
    }
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await api.post(`/api/admin/subscriptions/${subscriptionId}/confirm-payment`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-subscription-requests"] });
      toast({
        title: "Payment Confirmed",
        description: "The custom subscription has been activated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.response?.data?.message || "Failed to confirm payment.",
        variant: "destructive",
      });
    }
  });

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(tempPrice, 10);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }
    updatePriceMutation.mutate(price);
  };

  const handleOpenApprove = (req: any) => {
    setSelectedRequest(req);
    // Find a chef recommendation if possible
    const recommendedChef = chefs.find(c => 
      c.isActive && 
      req.addressPincode && 
      c.servicePincodes?.includes(req.addressPincode)
    );
    setAssignedChefId(recommendedChef?.id || "");
    setApproveDialogOpen(true);
  };

  const handleOpenReject = (req: any) => {
    setSelectedRequest(req);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Filter requests
  const filteredRequests = requests.filter((req: any) => {
    const matchesSearch = 
      req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone.includes(searchTerm) ||
      (req.email && req.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card className="border-orange-100 dark:border-orange-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-orange-500" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>
            Configure the rate used to auto-calculate the estimated cost for custom subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold">Active Price Per Roti</span>
              <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                ₹{pricePerRoti}
              </span>
            </div>

            {editingPrice ? (
              <form onSubmit={handleUpdatePrice} className="flex items-center gap-3">
                <div className="space-y-1">
                  <Label htmlFor="price-per-roti" className="text-xs font-semibold">
                    New Rate (₹)
                  </Label>
                  <Input
                    id="price-per-roti"
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    className="w-32 h-10 rounded-lg text-sm"
                    placeholder="e.g. 8"
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-5">
                  <Button
                    type="submit"
                    disabled={updatePriceMutation.isPending}
                    size="sm"
                    className="h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4"
                  >
                    {updatePriceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingPrice(false)}
                    size="sm"
                    className="h-10 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setTempPrice(String(pricePerRoti));
                  setEditingPrice(true);
                }}
                className="rounded-full font-semibold border-orange-200 dark:border-orange-950 hover:bg-orange-50/50"
              >
                Change Pricing Rate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests Queue */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Custom Subscription Queue</CardTitle>
            <CardDescription>
              Review custom requested plans, assign eligible partner chefs, and approve or reject submissions.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-full text-xs"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-full text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending_chef_assignment">Pending Assignment</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="converted">Active (Converted)</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No custom subscription requests found.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden border-slate-100 dark:border-slate-800">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Customer Details</TableHead>
                    <TableHead className="font-semibold text-xs">Roti / Delivery</TableHead>
                    <TableHead className="font-semibold text-xs">Schedule Details</TableHead>
                    <TableHead className="font-semibold text-xs">Pricing Details</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req: any) => {
                    const slot = deliverySlots.find((s: any) => s.id === req.deliverySlotId);
                    const formattedDays = Array.isArray(req.deliveryDays)
                      ? req.deliveryDays.map((d: string) => d.substring(0, 3)).join(", ")
                      : "";

                    return (
                      <TableRow key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                              {req.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground">{req.phone}</p>
                            {req.email && <p className="text-xs text-muted-foreground">{req.email}</p>}
                            <p className="text-xs text-muted-foreground max-w-xs truncate" title={req.address}>
                              📍 {req.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                            {req.rotiPerDay} Rotis
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                              {req.duration} Term
                            </p>
                            <p className="text-muted-foreground">Days ({req.daysPerWeek}): {formattedDays}</p>
                            {slot && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {slot.label}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              Total: ₹{req.calculatedPrice}
                            </p>
                            <p className="text-muted-foreground">Rate: ₹{req.pricePerRoti}/roti</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`${statusColors[req.status]} border-none shadow-none text-[11px] font-semibold px-2.5 py-0.5 rounded-full`}>
                              {statusLabels[req.status]}
                            </Badge>
                            {req.status === "rejected" && req.rejectionReason && (
                              <p className="text-[11px] text-red-600 dark:text-red-400 max-w-xs line-clamp-2" title={req.rejectionReason}>
                                <span className="font-semibold">Reason:</span> {req.rejectionReason}
                              </p>
                            )}
                            {req.paymentTransactionId && (
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Txn ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{req.paymentTransactionId}</code>
                              </p>
                            )}
                            {req.assignedChefId && (
                              <p className="text-[11px] text-muted-foreground">
                                Chef: {chefs.find(c => c.id === req.assignedChefId)?.name || "Unknown"}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "pending_chef_assignment" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenApprove(req)}
                                className="h-8 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReject(req)}
                                className="h-8 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : req.status === "awaiting_payment" ? (
                            <div className="space-y-1 text-right">
                              <span className="text-xs text-orange-600 font-semibold block">Awaiting customer payment</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenApprove(req)}
                                className="h-7 text-[11px] rounded-lg"
                              >
                                Reassign Chef
                              </Button>
                            </div>
                          ) : req.status === "paid" ? (
                            <div className="space-y-1.5 text-right flex flex-col items-end">
                              <span className="text-xs text-green-600 font-bold block">Paid (Awaiting Verification)</span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={confirmPaymentMutation.isPending}
                                  onClick={() => req.subscriptionId && confirmPaymentMutation.mutate(req.subscriptionId)}
                                  className="h-8 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white border-none shadow-sm flex items-center gap-1"
                                >
                                  {confirmPaymentMutation.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Confirm Payment
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenApprove(req)}
                                  className="h-8 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border-orange-200"
                                >
                                  Reassign Chef
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No actions</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve / Chef Assignment Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approve Custom Subscription
            </DialogTitle>
            <DialogDescription>
              Assign an active partner chef to service this custom subscription request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs space-y-1.5">
                <p><span className="font-semibold">Customer:</span> {selectedRequest.customerName} ({selectedRequest.phone})</p>
                <p><span className="font-semibold">Quantity:</span> {selectedRequest.rotiPerDay} Rotis / delivery</p>
                <p><span className="font-semibold">Pincode:</span> {selectedRequest.addressPincode || "Not provided"}</p>
                <p className="truncate"><span className="font-semibold">Address:</span> {selectedRequest.address}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chef-select" className="text-xs font-bold">
                  Select Partner Chef
                </Label>
                <Select value={assignedChefId} onValueChange={setAssignedChefId}>
                  <SelectTrigger id="chef-select" className="rounded-lg h-10">
                    <SelectValue placeholder="Choose a chef" />
                  </SelectTrigger>
                  <SelectContent>
                    {chefs
                      .filter(c => c.isActive)
                      .map(chef => {
                        const servesPincode = selectedRequest.addressPincode && chef.servicePincodes?.includes(selectedRequest.addressPincode);
                        return (
                          <SelectItem key={chef.id} value={chef.id}>
                            {chef.name} {servesPincode ? "⭐ (Serves this pincode)" : ""}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {chefs.length > 0 && assignedChefId && (() => {
                  const currentChef = chefs.find(c => c.id === assignedChefId);
                  const servesPincode = selectedRequest.addressPincode && currentChef?.servicePincodes?.includes(selectedRequest.addressPincode);
                  if (selectedRequest.addressPincode && !servesPincode) {
                    return (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1 font-semibold mt-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Warning: This chef does not list pincode {selectedRequest.addressPincode} in their service area.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => approveMutation.mutate({ requestId: selectedRequest.id, chefId: assignedChefId })}
              disabled={approveMutation.isPending || !assignedChefId}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2 h-10 text-xs font-bold flex items-center gap-1.5"
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm & Approve"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setSelectedRequest(null);
                setAssignedChefId("");
              }}
              className="rounded-full h-10 text-xs font-semibold"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Custom Subscription Request
            </DialogTitle>
            <DialogDescription>
              Provide a clear reason why this custom request is being rejected. This will be visible to the customer.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs">
                <p><span className="font-semibold">Customer:</span> {selectedRequest.customerName}</p>
                <p><span className="font-semibold">Requirement:</span> {selectedRequest.rotiPerDay} Rotis / delivery</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rejection-reason" className="text-xs font-bold">
                  Rejection Reason
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g., We do not service this pincode, or Roti quantity exceeds single-delivery capacity."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] rounded-lg text-xs"
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason })}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2 h-10 text-xs font-bold flex items-center gap-1.5"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm & Reject"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason("");
              }}
              className="rounded-full h-10 text-xs font-semibold"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
