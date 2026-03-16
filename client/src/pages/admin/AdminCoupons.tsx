import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/apiClient";
import { Loader2, Plus, Edit2, Trash2, Eye, TrendingUp } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

interface CouponStats {
  id: string;
  code: string;
  totalUsed: number;
  uniqueUsers: number;
  totalDiscount: number;
  avgDiscount: number;
  lastUsed: string | null;
}

export default function AdminCoupons() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showStats, setShowStats] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: undefined as number | undefined,
    usageLimit: undefined as number | undefined,
    perUserLimit: 1,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
  });

  // Fetch all coupons
  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["/api/admin/coupons"],
    queryFn: async () => {
      const response = await api.get("/api/admin/coupons");
      return response.data;
    },
  });

  // Fetch coupon statistics
  const { data: couponStats = [] } = useQuery({
    queryKey: ["/api/admin/coupon-stats"],
    queryFn: async () => {
      const response = await api.get("/api/admin/coupon-stats");
      return response.data;
    },
  });

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/admin/coupons", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupon-stats"] });
      toast({
        title: "✓ Coupon Created",
        description: `Coupon ${formData.code} created successfully`,
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Creation Failed",
        description: error.response?.data?.message || "Failed to create coupon",
        variant: "destructive",
      });
    },
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/api/admin/coupons/${editingCoupon?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupon-stats"] });
      toast({
        title: "✓ Coupon Updated",
        description: `Coupon ${formData.code} updated successfully`,
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update Failed",
        description: error.response?.data?.message || "Failed to update coupon",
        variant: "destructive",
      });
    },
  });

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: async (couponId: string) => {
      await api.delete(`/api/admin/coupons/${couponId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupon-stats"] });
      toast({
        title: "✓ Coupon Deleted",
        description: "Coupon deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Deletion Failed",
        description: error.response?.data?.message || "Failed to delete coupon",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: undefined,
      usageLimit: undefined,
      perUserLimit: 1,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
    });
    setEditingCoupon(null);
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
      validUntil: new Date(coupon.validUntil).toISOString().split("T")[0],
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.description) {
      toast({
        title: "⚠️ Missing Fields",
        description: "Code and description are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      discountValue: parseInt(formData.discountValue.toString()),
      minOrderAmount: parseInt(formData.minOrderAmount.toString()),
      maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount.toString()) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit.toString()) : undefined,
      perUserLimit: parseInt(formData.perUserLimit.toString()),
    };

    if (editingCoupon) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getStats = (couponId: string) => {
    return couponStats.find((s: CouponStats) => s.id === couponId);
  };

  const coupon = editingCoupon || { code: "" };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coupons">All Coupons ({coupons.length})</TabsTrigger>
          <TabsTrigger value="active">Active Only</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <CouponTable
            coupons={coupons}
            isLoading={couponsLoading}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onViewStats={(id) => setShowStats(id)}
            getStats={getStats}
          />
        </TabsContent>

        <TabsContent value="active">
          <CouponTable
            coupons={coupons.filter(
              (c: Coupon) =>
                c.isActive &&
                new Date(c.validUntil) > new Date()
            )}
            isLoading={couponsLoading}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onViewStats={(id) => setShowStats(id)}
            getStats={getStats}
          />
        </TabsContent>

        <TabsContent value="expired">
          <CouponTable
            coupons={coupons.filter(
              (c: Coupon) =>
                !c.isActive ||
                new Date(c.validUntil) <= new Date()
            )}
            isLoading={couponsLoading}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onViewStats={(id) => setShowStats(id)}
            getStats={getStats}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? `Edit Coupon: ${coupon.code}` : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Coupon Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="WELCOME50"
                    disabled={!!editingCoupon}
                  />
                </div>

                <div>
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Welcome offer for new users"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: any) =>
                      setFormData({
                        ...formData,
                        discountType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Order Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Max Discount (₹) - Optional</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usage Limit - Optional</Label>
                  <Input
                    type="number"
                    value={formData.usageLimit || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Unlimited if empty"
                  />
                </div>

                <div>
                  <Label>Per-User Limit</Label>
                  <Input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perUserLimit: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validFrom: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validUntil: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  Active
                </Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCoupon ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      {showStats && (
        <StatsDialog
          stats={getStats(showStats)}
          coupon={coupons.find((c: Coupon) => c.id === showStats)}
          onClose={() => setShowStats(null)}
        />
      )}
    </div>
  );
}

function CouponTable({
  coupons,
  isLoading,
  onEdit,
  onDelete,
  onViewStats,
  getStats,
}: {
  coupons: Coupon[];
  isLoading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
  getStats: (id: string) => CouponStats | undefined;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No coupons found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Description</th>
              <th className="text-center p-3">Discount</th>
              <th className="text-center p-3">Min Order</th>
              <th className="text-center p-3">Used</th>
              <th className="text-center p-3">Per-User</th>
              <th className="text-center p-3">Valid Until</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon: Coupon) => {
              const stats = getStats(coupon.id);
              const isExpired = new Date(coupon.validUntil) <= new Date();

              return (
                <tr key={coupon.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-mono font-semibold">{coupon.code}</td>
                  <td className="p-3">{coupon.description}</td>
                  <td className="p-3 text-center">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`}
                    {coupon.maxDiscount && (
                      <div className="text-xs text-muted-foreground">
                        Max ₹{coupon.maxDiscount}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">₹{coupon.minOrderAmount}</td>
                  <td className="p-3 text-center">
                    {coupon.usedCount || 0}
                    {coupon.usageLimit && `/${coupon.usageLimit}`}
                  </td>
                  <td className="p-3 text-center">{coupon.perUserLimit}</td>
                  <td className="p-3 text-center text-sm">
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        coupon.isActive && !isExpired
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {coupon.isActive && !isExpired
                        ? "Active"
                        : isExpired
                          ? "Expired"
                          : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewStats(coupon.id)}
                        title="View statistics"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(coupon)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete coupon ${coupon.code}? This action cannot be undone.`
                            )
                          ) {
                            onDelete(coupon.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function StatsDialog({
  stats,
  coupon,
  onClose,
}: {
  stats?: CouponStats;
  coupon?: Coupon;
  onClose: () => void;
}) {
  const { toast } = useToast();

  if (!stats || !coupon) {
    return null;
  }

  return (
    <Dialog open={!!stats} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coupon Statistics - {coupon.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-muted-foreground">Total Used</div>
              <div className="text-2xl font-bold">{stats.totalUsed}</div>
            </div>

            <div className="p-4 bg-green-50 rounded">
              <div className="text-sm text-muted-foreground">Unique Users</div>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            </div>

            <div className="p-4 bg-orange-50 rounded">
              <div className="text-sm text-muted-foreground">Total Discount</div>
              <div className="text-2xl font-bold">₹{stats.totalDiscount}</div>
            </div>

            <div className="p-4 bg-purple-50 rounded">
              <div className="text-sm text-muted-foreground">Avg Discount</div>
              <div className="text-2xl font-bold">
                ₹{Math.round(stats.avgDiscount)}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded">
            <div className="text-sm text-muted-foreground">Last Used</div>
            <div className="font-semibold">
              {stats.lastUsed
                ? new Date(stats.lastUsed).toLocaleString()
                : "Never used"}
            </div>
          </div>

          <div className="p-4 bg-muted rounded">
            <div className="text-sm text-muted-foreground">Coupon Details</div>
            <div className="space-y-1 text-sm font-mono">
              <div>Discount: {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</div>
              <div>Min Order: ₹{coupon.minOrderAmount}</div>
              <div>Per-User Limit: {coupon.perUserLimit}</div>
              <div>Valid Until: {new Date(coupon.validUntil).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
