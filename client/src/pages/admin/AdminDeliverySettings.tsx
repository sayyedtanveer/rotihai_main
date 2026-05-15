
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/apiClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeliverySetting, DeliveryPersonnel, DeliveryPartnerPayout } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Truck, Plus, Trash2, MapPin, Users, UserCog, DollarSign, Edit2, Check, X } from "lucide-react";
import { useState } from "react";

export default function AdminDeliverySettings() {
  const { toast } = useToast();
  const [newSetting, setNewSetting] = useState({
    name: "",
    minDistance: "",
    maxDistance: "",
    price: "",
    minOrderAmount: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DeliverySetting> | null>(null);

  const [newDeliveryPerson, setNewDeliveryPerson] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [newPayoutSlab, setNewPayoutSlab] = useState({
    minDistance: "",
    maxDistance: "",
    payoutAmount: "",
    pincode: "",
  });

  // Delivery Settings Queries
  const { data: settings, isLoading: settingsLoading } = useQuery<DeliverySetting[]>({
    queryKey: ["/api/admin", "delivery-settings"],
    queryFn: async () => {
      const response = await api.get("/api/admin/delivery-settings");
      return response.data;
    },
  });

  // Delivery Personnel Queries
  const { data: deliveryPersonnel, isLoading: personnelLoading } = useQuery<DeliveryPersonnel[]>({
    queryKey: ["/api/admin", "delivery-personnel"],
    queryFn: async () => {
      const response = await api.get("/api/admin/delivery-personnel");
      return response.data;
    },
  });

  // Delivery Partner Payouts Queries
  const { data: payoutSlabs, isLoading: payoutsLoading } = useQuery<DeliveryPartnerPayout[]>({
    queryKey: ["/api/admin", "delivery-partner-payouts"],
    queryFn: async () => {
      const response = await api.get("/api/admin/delivery-partner-payouts");
      return response.data;
    },
  });

  // Delivery Settings Mutations
  const createSettingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/admin/delivery-settings", {
        name: data.name,
        minDistance: parseFloat(data.minDistance),
        maxDistance: parseFloat(data.maxDistance),
        price: parseInt(data.price),
        minOrderAmount: parseInt(data.minOrderAmount) || 0,
        isActive: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-settings"] });
      setNewSetting({ name: "", minDistance: "", maxDistance: "", price: "", minOrderAmount: "" });
      toast({
        title: "Setting created",
        description: "Delivery setting has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create delivery setting",
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliverySetting> }) => {
      const response = await api.patch(`/api/admin/delivery-settings/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-settings"] });
      toast({
        title: "Setting updated",
        description: "Delivery setting has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update delivery setting",
        variant: "destructive",
      });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/delivery-settings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-settings"] });
      toast({
        title: "Setting deleted",
        description: "Delivery setting has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete delivery setting",
        variant: "destructive",
      });
    },
  });

  // Delivery Personnel Mutations
  const createPersonnelMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/admin/delivery-personnel", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-personnel"] });
      setNewDeliveryPerson({ name: "", phone: "", email: "", password: "" });
      toast({
        title: "Delivery person created",
        description: "Delivery person has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create delivery person",
        variant: "destructive",
      });
    },
  });

  const updatePersonnelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliveryPersonnel> }) => {
      const response = await api.patch(`/api/admin/delivery-personnel/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-personnel"] });
      toast({
        title: "Delivery person updated",
        description: "Delivery person has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update delivery person",
        variant: "destructive",
      });
    },
  });

  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/delivery-personnel/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-personnel"] });
      toast({
        title: "Delivery person deleted",
        description: "Delivery person has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete delivery person",
        variant: "destructive",
      });
    },
  });

  // Delivery Partner Payout Mutations
  const createPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/admin/delivery-partner-payouts", {
        minDistance: parseFloat(data.minDistance),
        maxDistance: parseFloat(data.maxDistance),
        payoutAmount: parseInt(data.payoutAmount),
        pincode: data.pincode || null,
        isActive: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-partner-payouts"] });
      setNewPayoutSlab({ minDistance: "", maxDistance: "", payoutAmount: "", pincode: "" });
      toast({
        title: "Payout slab created",
        description: "Delivery partner payout slab has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error?.response?.data?.message || "Failed to create payout slab",
        variant: "destructive",
      });
    },
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliveryPartnerPayout> }) => {
      const response = await api.patch(`/api/admin/delivery-partner-payouts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-partner-payouts"] });
      toast({
        title: "Payout slab updated",
        description: "Delivery partner payout slab has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || "Failed to update payout slab",
        variant: "destructive",
      });
    },
  });

  const deletePayoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/delivery-partner-payouts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "delivery-partner-payouts"] });
      toast({
        title: "Payout slab deleted",
        description: "Delivery partner payout slab has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error?.response?.data?.message || "Failed to delete payout slab",
        variant: "destructive",
      });
    },
  });

  const handleCreateSetting = () => {
    if (!newSetting.name || !newSetting.minDistance || !newSetting.maxDistance || !newSetting.price) {
      toast({
        title: "Validation error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(newSetting.minDistance) >= parseFloat(newSetting.maxDistance)) {
      toast({
        title: "Validation error",
        description: "Max distance must be greater than min distance",
        variant: "destructive",
      });
      return;
    }

    createSettingMutation.mutate(newSetting);
  };

  const handleCreatePersonnel = () => {
    if (!newDeliveryPerson.name || !newDeliveryPerson.phone || !newDeliveryPerson.password) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPersonnelMutation.mutate(newDeliveryPerson);
  };

  const handleCreatePayoutSlab = () => {
    if (!newPayoutSlab.minDistance || !newPayoutSlab.maxDistance || !newPayoutSlab.payoutAmount) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(newPayoutSlab.minDistance) >= parseFloat(newPayoutSlab.maxDistance)) {
      toast({
        title: "Validation error",
        description: "Max distance must be greater than min distance",
        variant: "destructive",
      });
      return;
    }

    createPayoutMutation.mutate(newPayoutSlab);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-8 h-8" />
            Delivery Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage delivery partners, personnel, and pricing settings
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="personnel" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Personnel</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Payouts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Partners Tab */}
          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Delivery Partners
                </CardTitle>
                <CardDescription>Manage your delivery partner integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Partner management coming soon</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Integrate with third-party delivery services
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Personnel Tab */}
          <TabsContent value="personnel">
            <div className="space-y-6">
              {/* Add New Delivery Person */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Delivery Person
                  </CardTitle>
                  <CardDescription>Register a new delivery personnel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="person-name">Name *</Label>
                      <Input
                        id="person-name"
                        placeholder="Full Name"
                        value={newDeliveryPerson.name}
                        onChange={(e) => setNewDeliveryPerson({ ...newDeliveryPerson, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="person-phone">Phone *</Label>
                      <Input
                        id="person-phone"
                        placeholder="Phone Number"
                        value={newDeliveryPerson.phone}
                        onChange={(e) => setNewDeliveryPerson({ ...newDeliveryPerson, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="person-email">Email</Label>
                      <Input
                        id="person-email"
                        type="email"
                        placeholder="Email (optional)"
                        value={newDeliveryPerson.email}
                        onChange={(e) => setNewDeliveryPerson({ ...newDeliveryPerson, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="person-password">Password *</Label>
                      <Input
                        id="person-password"
                        type="password"
                        placeholder="Password"
                        value={newDeliveryPerson.password}
                        onChange={(e) => setNewDeliveryPerson({ ...newDeliveryPerson, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreatePersonnel} disabled={createPersonnelMutation.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Delivery Person
                  </Button>
                </CardContent>
              </Card>

              {/* Current Delivery Personnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    Delivery Personnel
                  </CardTitle>
                  <CardDescription>Manage your delivery team</CardDescription>
                </CardHeader>
                <CardContent>
                  {personnelLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                        </div>
                      ))}
                    </div>
                  ) : deliveryPersonnel && deliveryPersonnel.length > 0 ? (
                    <div className="space-y-4">
                      {deliveryPersonnel.map((person) => (
                        <div
                          key={person.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                {person.name}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {person.phone} {person.email && `• ${person.email}`}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-slate-500 capitalize">
                                  Status: {person.status}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Deliveries: {person.totalDeliveries}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Rating: {person.rating}★
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`active-${person.id}`} className="text-sm">
                                  Active
                                </Label>
                                <Switch
                                  id={`active-${person.id}`}
                                  checked={person.isActive}
                                  onCheckedChange={(checked) =>
                                    updatePersonnelMutation.mutate({
                                      id: person.id,
                                      data: { isActive: checked },
                                    })
                                  }
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deletePersonnelMutation.mutate(person.id)}
                                disabled={deletePersonnelMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserCog className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No delivery personnel registered</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Add your first delivery person above
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Partner Payouts Tab */}
          <TabsContent value="payouts">
            <div className="space-y-6">
              {/* Create New Payout Slab */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Delivery Partner Payout Slab
                  </CardTitle>
                  <CardDescription>
                    Define distance ranges and payout amounts for delivery boys.
                    <span className="block mt-2 text-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-2">
                      💡 <strong>How it works:</strong> When a delivery is created, the distance is calculated and the payout is determined by which distance range it falls into. Leave pincode empty for default slab, or specify for pincode-specific rates.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="payout-min-distance">Min Distance (km) *</Label>
                      <Input
                        id="payout-min-distance"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={newPayoutSlab.minDistance}
                        onChange={(e) => setNewPayoutSlab({ ...newPayoutSlab, minDistance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-max-distance">Max Distance (km) *</Label>
                      <Input
                        id="payout-max-distance"
                        type="number"
                        step="0.1"
                        placeholder="1"
                        value={newPayoutSlab.maxDistance}
                        onChange={(e) => setNewPayoutSlab({ ...newPayoutSlab, maxDistance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-amount">Payout Amount (₹) *</Label>
                      <Input
                        id="payout-amount"
                        type="number"
                        placeholder="10"
                        value={newPayoutSlab.payoutAmount}
                        onChange={(e) => setNewPayoutSlab({ ...newPayoutSlab, payoutAmount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-pincode">Pincode (Optional)</Label>
                      <Input
                        id="payout-pincode"
                        type="text"
                        placeholder="400070"
                        value={newPayoutSlab.pincode}
                        onChange={(e) => setNewPayoutSlab({ ...newPayoutSlab, pincode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                      <Button onClick={handleCreatePayoutSlab} disabled={createPayoutMutation.isPending}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slab
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Payout Slabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Current Payout Slabs
                  </CardTitle>
                  <CardDescription>Manage delivery partner payout configurations</CardDescription>
                </CardHeader>
                <CardContent>
                  {payoutsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                        </div>
                      ))}
                    </div>
                  ) : payoutSlabs && payoutSlabs.length > 0 ? (
                    <div className="space-y-4">
                      {payoutSlabs
                        .sort((a, b) => parseFloat(a.minDistance) - parseFloat(b.minDistance))
                        .map((slab) => (
                          <div
                            key={slab.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                  {slab.minDistance} km - {slab.maxDistance} km
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Payout: <span className="font-bold text-green-600 dark:text-green-400">₹{slab.payoutAmount}</span>
                                  {slab.pincode && ` • Pincode: ${slab.pincode}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`payout-active-${slab.id}`} className="text-sm">
                                    Active
                                  </Label>
                                  <Switch
                                    id={`payout-active-${slab.id}`}
                                    checked={slab.isActive}
                                    onCheckedChange={(checked) =>
                                      updatePayoutMutation.mutate({
                                        id: slab.id,
                                        data: { isActive: checked },
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => deletePayoutMutation.mutate(slab.id)}
                                  disabled={deletePayoutMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No payout slabs configured</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Add your first payout slab above
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Create New Setting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Delivery Range
                  </CardTitle>
                  <CardDescription>
                    Define a new distance range and its delivery fee. 
                    <span className="block mt-2 text-sm bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                      💡 <strong>How it works:</strong> When customers checkout, their distance from the restaurant is calculated. 
                      The delivery fee is determined by which range their distance falls into. Set fee to ₹0 for free delivery zones.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Range Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Local Area"
                        value={newSetting.name}
                        onChange={(e) => setNewSetting({ ...newSetting, name: e.target.value })}
                        data-testid="input-new-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minDistance">Min Distance (km)</Label>
                      <Input
                        id="minDistance"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={newSetting.minDistance}
                        onChange={(e) => setNewSetting({ ...newSetting, minDistance: e.target.value })}
                        data-testid="input-new-min"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDistance">Max Distance (km)</Label>
                      <Input
                        id="maxDistance"
                        type="number"
                        step="0.1"
                        placeholder="5"
                        value={newSetting.maxDistance}
                        onChange={(e) => setNewSetting({ ...newSetting, maxDistance: e.target.value })}
                        data-testid="input-new-max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Delivery Fee (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="40"
                        value={newSetting.price}
                        onChange={(e) => setNewSetting({ ...newSetting, price: e.target.value })}
                        data-testid="input-new-price"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrderAmount">Min Order (₹)</Label>
                      <Input
                        id="minOrderAmount"
                        type="number"
                        placeholder="150"
                        value={newSetting.minOrderAmount}
                        onChange={(e) => setNewSetting({ ...newSetting, minOrderAmount: e.target.value })}
                        data-testid="input-new-min-order"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateSetting} disabled={createSettingMutation.isPending} data-testid="button-create-setting">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Delivery Range
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Current Delivery Ranges
                  </CardTitle>
                  <CardDescription>Manage your distance-based delivery pricing</CardDescription>
                </CardHeader>
                <CardContent>
                  {settingsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                        </div>
                      ))}
                    </div>
                  ) : settings && settings.length > 0 ? (
                    <div className="space-y-4">
                      {settings
                        .sort((a, b) => parseFloat(a.minDistance) - parseFloat(b.minDistance))
                        .map((setting) => (
                          <div
                            key={setting.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            data-testid={`card-setting-${setting.id}`}
                          >
                            {editingId === setting.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                  <Input
                                    placeholder="Range Name"
                                    value={editingData?.name || ""}
                                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                  />
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Min km"
                                    value={editingData?.minDistance || ""}
                                    onChange={(e) => setEditingData({ ...editingData, minDistance: e.target.value as any })}
                                  />
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Max km"
                                    value={editingData?.maxDistance || ""}
                                    onChange={(e) => setEditingData({ ...editingData, maxDistance: e.target.value as any })}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Fee (₹)"
                                    value={editingData?.price || ""}
                                    onChange={(e) => setEditingData({ ...editingData, price: parseInt(e.target.value) || 0 })}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Min Order (₹)"
                                    value={editingData?.minOrderAmount || ""}
                                    onChange={(e) => setEditingData({ ...editingData, minOrderAmount: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (editingData) {
                                        updateSettingMutation.mutate({
                                          id: setting.id,
                                          data: editingData,
                                        });
                                        setEditingId(null);
                                        setEditingData(null);
                                      }
                                    }}
                                    disabled={updateSettingMutation.isPending}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingData(null);
                                    }}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                    {setting.name}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {setting.minDistance} km - {setting.maxDistance} km
                                  </p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <p className="text-lg font-bold text-primary">₹{setting.price}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      Min Order: ₹{setting.minOrderAmount || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`active-${setting.id}`} className="text-sm">
                                      Active
                                    </Label>
                                    <Switch
                                      id={`active-${setting.id}`}
                                      checked={setting.isActive}
                                      onCheckedChange={(checked) =>
                                        updateSettingMutation.mutate({
                                          id: setting.id,
                                          data: { isActive: checked },
                                        })
                                      }
                                      data-testid={`switch-active-${setting.id}`}
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingId(setting.id);
                                      setEditingData(setting);
                                    }}
                                    data-testid={`button-edit-${setting.id}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => deleteSettingMutation.mutate(setting.id)}
                                    disabled={deleteSettingMutation.isPending}
                                    data-testid={`button-delete-${setting.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No delivery ranges configured</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Add your first delivery range above
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
