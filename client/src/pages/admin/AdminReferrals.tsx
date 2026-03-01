import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Gift, Clock, CheckCircle, XCircle, Search, RefreshCw, Ban, Award, AlertTriangle, Flag } from "lucide-react";
import { format } from "date-fns";

interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: string;
  referrerBonus: number;
  referredBonus: number;
  referredOrderCompleted: boolean;
  adminNote?: string | null;
  fraudFlag?: boolean;
  createdAt: string;
  completedAt: string | null;
  referrerName?: string | null;
  referrerPhone?: string | null;
  referredName?: string | null;
  referredPhone?: string | null;
  referredAddress?: string | null;
  referredLatitude?: number | null;
  referredLongitude?: number | null;
  firstOrderId?: string | null;
  firstOrderPaymentStatus?: string | null;
}

export default function AdminReferrals() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "cancel" | "";
    referral: Referral | null;
  }>({ open: false, action: "", referral: null });
  const [adminNote, setAdminNote] = useState("");

  const { data: referrals = [], isLoading, refetch } = useQuery<Referral[]>({
    queryKey: ["/api/admin/referrals"],
  });

  const { data: stats } = useQuery<{
    totalReferrals: number;
    pendingReferrals: number;
    approvedReferrals: number;
    cancelledReferrals: number;
    completedReferrals: number;
    totalBonusPaid: number;
  }>({
    queryKey: ["/api/admin/referral-stats"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      return apiRequest("PATCH", `/api/admin/referrals/${id}/status`, { status, adminNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referral-stats"] });
      toast({ title: "Referral updated successfully" });
      setActionDialog({ open: false, action: "", referral: null });
      setAdminNote("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update referral", description: error.message, variant: "destructive" });
    },
  });

  const fraudFlagMutation = useMutation({
    mutationFn: async ({ id, fraudFlag }: { id: string; fraudFlag: boolean }) => {
      return apiRequest("PATCH", `/api/admin/referrals/${id}/fraud-flag`, { fraudFlag });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      toast({ title: "Fraud flag updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update fraud flag", description: error.message, variant: "destructive" });
    },
  });

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referrerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referredName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referrerPhone?.includes(searchTerm) ||
      referral.referredPhone?.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600"><Award className="w-3 h-3 mr-1" />Approved</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case "expired":
        return <Badge className="bg-orange-500 text-white"><Ban className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openApprove = (referral: Referral) => {
    setAdminNote("");
    setActionDialog({ open: true, action: "approve", referral });
  };

  const openCancel = (referral: Referral) => {
    setAdminNote("");
    setActionDialog({ open: true, action: "cancel", referral });
  };

  const confirmAction = () => {
    if (!actionDialog.referral || !actionDialog.action) return;
    if (actionDialog.action === "cancel" && !adminNote.trim()) {
      toast({ title: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }
    const status = actionDialog.action === "approve" ? "approved" : "cancelled";
    updateStatusMutation.mutate({ id: actionDialog.referral.id, status, note: adminNote.trim() || undefined });
  };

  const flaggedCount = referrals.filter((r) => r.fraudFlag).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Referral Management</h1>
            <p className="text-muted-foreground">View and manage all referral records</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-referrals">{stats?.totalReferrals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-referrals">{stats?.pendingReferrals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-approved-referrals">{stats?.approvedReferrals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-cancelled-referrals">{stats?.cancelledReferrals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Bonus Paid</CardTitle>
              <Gift className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-bonus">₹{stats?.totalBonusPaid || 0}</div>
            </CardContent>
          </Card>
          <Card className={flaggedCount > 0 ? "border-orange-400" : ""}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${flaggedCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${flaggedCount > 0 ? "text-orange-600" : ""}`} data-testid="text-flagged-referrals">{flaggedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Records</CardTitle>
            <CardDescription>All referral transactions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No referrals found</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Address / Coords</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Admin Note</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow
                        key={referral.id}
                        data-testid={`row-referral-${referral.id}`}
                        className={referral.fraudFlag ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {referral.fraudFlag && (
                              <span title="Fraud flagged"><AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" /></span>
                            )}
                            <span className="font-mono font-medium text-sm">{referral.referralCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{referral.referrerName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{referral.referrerPhone || "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{referral.referredName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{referral.referredPhone || "-"}</div>
                        </TableCell>
                        <TableCell className="max-w-[160px]">
                          <div className="text-xs truncate" title={referral.referredAddress || ""}>{referral.referredAddress || "-"}</div>
                          {referral.referredLatitude && referral.referredLongitude ? (
                            <div className="text-xs text-muted-foreground">
                              {referral.referredLatitude.toFixed(4)}, {referral.referredLongitude.toFixed(4)}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No coords</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {referral.firstOrderId
                            ? <span title={referral.firstOrderId}>{referral.firstOrderId.slice(0, 8)}…</span>
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs">{referral.firstOrderPaymentStatus || "-"}</TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>Referrer: ₹{referral.referrerBonus}</div>
                            <div>Referred: ₹{referral.referredBonus}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(referral.createdAt), "dd MMM yy")}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px]">
                          <span className="truncate block" title={referral.adminNote || ""}>{referral.adminNote || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* Approve button — only for pending */}
                            {referral.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Approve referral"
                                  onClick={() => openApprove(referral)}
                                  data-testid={`button-approve-${referral.id}`}
                                >
                                  <Award className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Cancel referral"
                                  onClick={() => openCancel(referral)}
                                  data-testid={`button-cancel-${referral.id}`}
                                >
                                  <XCircle className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {/* Cancel button for approved/completed */}
                            {(referral.status === "approved" || referral.status === "completed") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Cancel & reverse bonus"
                                onClick={() => openCancel(referral)}
                                data-testid={`button-cancel-${referral.id}`}
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                            {/* Fraud flag toggle */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title={referral.fraudFlag ? "Remove fraud flag" : "Mark as suspected fraud"}
                              onClick={() =>
                                fraudFlagMutation.mutate({ id: referral.id, fraudFlag: !referral.fraudFlag })
                              }
                              data-testid={`button-fraud-flag-${referral.id}`}
                            >
                              <Flag className={`w-4 h-4 ${referral.fraudFlag ? "text-orange-500 fill-orange-200" : "text-muted-foreground"}`} />
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

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => {
          if (!open) { setActionDialog({ open: false, action: "", referral: null }); setAdminNote(""); }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === "approve" ? "✅ Approve Referral" : "❌ Cancel Referral"}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === "approve"
                  ? "This will approve the referral and credit the referrer bonus to their wallet."
                  : "This will cancel the referral. If the referrer bonus was already credited, it will be reversed."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-3">
              <p className="text-sm text-muted-foreground">
                Referral Code:{" "}
                <span className="font-mono font-medium">{actionDialog.referral?.referralCode}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Referrer: <span className="font-medium">{actionDialog.referral?.referrerName || "Unknown"}</span>
                {" "}({actionDialog.referral?.referrerPhone || "-"})
              </p>
              <p className="text-sm text-muted-foreground">
                Referred: <span className="font-medium">{actionDialog.referral?.referredName || "Unknown"}</span>
                {" "}({actionDialog.referral?.referredPhone || "-"})
              </p>
              <div>
                <label className="text-sm font-medium">
                  Admin Note {actionDialog.action === "cancel" ? "(required)" : "(optional)"}
                </label>
                <Textarea
                  placeholder={actionDialog.action === "cancel" ? "Provide reason for cancellation..." : "Optional note..."}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="mt-1"
                  rows={3}
                  data-testid="input-admin-note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setActionDialog({ open: false, action: "", referral: null }); setAdminNote(""); }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updateStatusMutation.isPending}
                variant={actionDialog.action === "cancel" ? "destructive" : "default"}
                data-testid="button-confirm-action"
              >
                {updateStatusMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
