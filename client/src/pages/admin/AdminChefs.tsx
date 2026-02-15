
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl, handleImageError } from "@/lib/imageUrl";
import { adminApiRequest } from "@/hooks/useAdminAuth";
import { queryClient } from "@/lib/queryClient";
import type { Chef, Category } from "@shared/schema";
import { Star, Pencil, Trash2, Plus, Store, Loader2, MapPin } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { getDeliveryAreas } from "@/lib/deliveryAreas";

export default function AdminChefs() {
  const { toast } = useToast();
  const [editingChef, setEditingChef] = useState<Chef | null>(null);
  const [deletingChef, setDeletingChef] = useState<Chef | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    rating: "4.5",
    reviewCount: 0,
    categoryId: "",
    address: "",
    // Structured address fields
    addressBuilding: "",
    addressStreet: "",
    addressArea: "",
    addressCity: "Mumbai",
    addressPincode: "",
    latitude: 19.0728,
    longitude: 72.8826,
    maxDeliveryDistanceKm: 5, // Default 5km delivery radius
    servicePincodes: null as string[] | null, // NEW: Service pincodes
  });

  // Separate state for servicePincodes input display (allows partial typing)
  const [servicePincodesInput, setServicePincodesInput] = useState("");

  // Geocoding states
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const geocodeTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: chefs, isLoading } = useQuery<Chef[]>({
    queryKey: ["/api/admin", "chefs"],
    queryFn: async () => {
      const response = await adminApiRequest("/api/admin/chefs");
      if (!response.ok) throw new Error("Failed to fetch chefs");
      return response.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/admin", "categories"],
    queryFn: async () => {
      const response = await adminApiRequest("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Load delivery areas for admin area select to avoid mismatched free-text areas
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const areas = await getDeliveryAreas();
        if (mounted && Array.isArray(areas)) setDeliveryAreas(areas);
      } catch (e) {
        console.warn("Failed to load delivery areas for admin select", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When editing a chef, sync the form data when the dialog opens
  useEffect(() => {
    if (editingChef) {
      handleEdit(editingChef);
    }
  }, [editingChef?.id]); // Re-sync only when chef ID changes

  const createChefMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await adminApiRequest("/api/admin/chefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create chef");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Chef created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create chef", variant: "destructive" });
    },
  });

  const updateChefMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Chef> }) => {
      const response = await adminApiRequest(`/api/admin/chefs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update chef");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
      setEditingChef(null);
      toast({ title: "Success", description: "Chef updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update chef", variant: "destructive" });
    },
  });

  const deleteChefMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApiRequest(`/api/admin/chefs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete chef");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
      setDeletingChef(null);
      toast({ title: "Success", description: "Chef deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete chef", variant: "destructive" });
    },
  });

  const toggleChefStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await adminApiRequest(`/api/admin/chefs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update chef status");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "chefs"] });
      toast({
        title: data.isActive ? "Chef is now OPEN" : "Chef is now CLOSED",
        description: data.isActive
          ? `${data.name} is now accepting orders`
          : `${data.name} will appear as unavailable to customers`
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update chef status", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      rating: "4.5",
      reviewCount: 0,
      categoryId: "",
      address: "",
      // Structured address fields
      addressBuilding: "",
      addressStreet: "",
      addressArea: "",
      addressCity: "Mumbai",
      addressPincode: "",
      latitude: 19.0728,
      longitude: 72.8826,
      maxDeliveryDistanceKm: 5,
      servicePincodes: null, // NEW: Initialize service pincodes
    });
    setServicePincodesInput(""); // Reset display input
    setGeocodeError("");
  };

  // Auto-geocode address with debounce - triggered by area OR pincode field change
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Trigger geocoding when area OR pincode changes
    if (field !== "addressArea" && field !== "addressPincode") {
      setGeocodeError("");
      return;
    }

    setGeocodeError("");

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Need both area and pincode for accurate geocoding
    const area = field === "addressArea" ? value.trim() : formData.addressArea?.trim();
    const pincode = field === "addressPincode" ? value.trim() : formData.addressPincode?.trim();

    if (!area || !pincode) {
      // Don't geocode until we have both area and pincode
      return;
    }

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        setIsGeocodingAddress(true);

        // Use the NEW accurate geocoding endpoint with structured fields
        const response = await api.post("/api/geocode-full-address", {
          building: formData.addressBuilding?.trim() || "",
          street: formData.addressStreet?.trim() || "",
          area: area,
          pincode: pincode,
        });

        const data = response.data;
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
          }));
          setGeocodeError("");

          // Show accuracy level to admin
          const accuracy = data.accuracy as 'exact' | 'street' | 'area' | 'pincode';
          const accuracyLabel = {
            'exact': '🎯 Exact location',
            'street': '📍 Street-level',
            'area': '🗺️ Area-level',
            'pincode': '📮 Pincode center'
          }[accuracy] || 'Location found';

          toast({
            title: accuracyLabel,
            description: `${area}, ${pincode} - (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`,
          });
        } else {
          setGeocodeError(data.message || "Could not find location");
        }
      } catch (error) {
        setGeocodeError("Error geocoding address");
        console.error("Geocoding error:", error);
      } finally {
        setIsGeocodingAddress(false);
      }
    }, 1000); // 1 second debounce
  };

  const handleEdit = (chef: Chef) => {
    setEditingChef(chef);

    // Parse old address format if structured fields are empty
    let addressBuilding = (chef as any).addressBuilding || "";
    let addressStreet = (chef as any).addressStreet || "";
    let addressArea = (chef as any).addressArea || "";
    let addressCity = (chef as any).addressCity || "Mumbai";
    let addressPincode = (chef as any).addressPincode || "";

    // If old address exists but new structured fields are empty, parse the old format
    const oldAddress = (chef as any).address || "";
    if (oldAddress && !addressBuilding && !addressStreet && !addressArea) {
      const parts = oldAddress.split(",").map((p: string) => p.trim());
      if (parts.length >= 2) {
        // Format: "Building, Street, Area, City, Pincode"
        addressBuilding = parts[0] || "";
        addressStreet = parts[1] || "";
        addressArea = parts[2] || "";
        addressCity = parts[3] || "Mumbai";
        addressPincode = parts[4] || "";
      }
    }

    setFormData({
      name: chef.name,
      description: chef.description,
      image: chef.image,
      rating: chef.rating,
      reviewCount: chef.reviewCount,
      categoryId: chef.categoryId,
      address: oldAddress,
      // Structured address fields
      addressBuilding,
      addressStreet,
      addressArea,
      addressCity,
      addressPincode,
      latitude: (chef as any).latitude || 19.0728,
      longitude: (chef as any).longitude || 72.8826,
      maxDeliveryDistanceKm: (chef as any).maxDeliveryDistanceKm || 5,
      servicePincodes: (chef as any).servicePincodes || null, // NEW: Load service pincodes
    });
    // Initialize servicePincodes input field with comma-separated values
    const servicePincodes = (chef as any).servicePincodes;
    setServicePincodesInput(Array.isArray(servicePincodes) ? servicePincodes.join(", ") : "");
    setGeocodeError("");
  };

  const handleUpdate = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Chef name is required", variant: "destructive" });
      return;
    }
    if (!formData.categoryId.trim()) {
      toast({ title: "Error", description: "Category is required", variant: "destructive" });
      return;
    }
    if (!formData.addressArea.trim()) {
      toast({ title: "Error", description: "Delivery area (address area) is required", variant: "destructive" });
      return;
    }

    if (editingChef) {
      console.log("🔥 Updating chef with data:", { id: editingChef.id, data: formData, maxDeliveryDistanceKm: formData.maxDeliveryDistanceKm });
      updateChefMutation.mutate({ id: editingChef.id, data: formData });
    }
  };

  const handleCreate = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Chef name is required", variant: "destructive" });
      return;
    }
    if (!formData.categoryId.trim()) {
      toast({ title: "Error", description: "Category is required", variant: "destructive" });
      return;
    }
    if (!formData.addressArea.trim()) {
      toast({ title: "Error", description: "Delivery area (address area) is required", variant: "destructive" });
      return;
    }
    if (!formData.image.trim()) {
      toast({ title: "Error", description: "Chef image is required", variant: "destructive" });
      return;
    }

    createChefMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deletingChef) {
      deleteChefMutation.mutate(deletingChef.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Chefs & Restaurants</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage partner chefs and restaurants</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-chef">
            <Plus className="w-4 h-4 mr-2" />
            Add Chef
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chefs && chefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chefs.map((chef) => (
              <Card
                key={chef.id}
                data-testid={`card-chef-${chef.id}`}
                className={chef.isActive === false ? "opacity-60" : ""}
              >
                <div className="relative">
                  <img
                    src={chef.image}
                    alt={chef.name}
                    className={`w-full aspect-video object-cover rounded-t-lg ${chef.isActive === false ? "grayscale" : ""}`}
                  />
                  {chef.isActive === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-lg">
                      <Badge variant="destructive" className="text-sm">
                        CLOSED
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className={`font-semibold text-lg text-slate-900 dark:text-slate-100 ${chef.isActive === false ? "text-muted-foreground" : ""}`}>
                      {chef.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Store className={`h-4 w-4 ${chef.isActive !== false ? "text-green-600" : "text-red-600"}`} />
                      <Switch
                        checked={chef.isActive !== false}
                        onCheckedChange={(checked) =>
                          toggleChefStatusMutation.mutate({ id: chef.id, isActive: checked })
                        }
                        disabled={toggleChefStatusMutation.isPending}
                        data-testid={`switch-chef-status-${chef.id}`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{chef.description}</p>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{chef.rating}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400">({chef.reviewCount} reviews)</span>
                    <Badge
                      variant={chef.isActive !== false ? "default" : "destructive"}
                      className="ml-auto"
                    >
                      {chef.isActive !== false ? "OPEN" : "CLOSED"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(chef)}
                      data-testid={`button-edit-${chef.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingChef(chef)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${chef.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Partner portal access can be created from Admin Management
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No chefs found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Chef Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Chef</DialogTitle>
            <DialogDescription>Create a new chef or restaurant profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-chef-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-chef-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Chef Image</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or /uploads/..."
                    data-testid="input-chef-image"
                    className="flex-1"
                  />
                  <ImageUploader
                    onImageUpload={(url) => setFormData({ ...formData, image: url })}
                  />
                </div>
                {formData.image && (
                  <div className="flex gap-2">
                    <img
                      src={getImageUrl(formData.image)}
                      alt="Chef preview"
                      className="w-20 h-20 object-cover rounded-md border"
                      onError={handleImageError}
                    />
                    <div className="flex-1 text-xs text-gray-500 break-all pt-1">
                      {formData.image}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger data-testid="select-chef-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  data-testid="input-chef-rating"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewCount">Review Count</Label>
                <Input
                  id="reviewCount"
                  type="number"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) || 0 })}
                  data-testid="input-chef-reviews"
                />
              </div>
            </div>

            {/* Chef Address & Location - Structured */}
            <div className="space-y-3 border-t pt-4">
              <Label className="flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4" />
                Chef Restaurant Address
              </Label>

              {/* Row 1: Building/House Number and Street */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="addressBuilding" className="text-xs text-gray-600">
                    Building/House No
                  </Label>
                  <Input
                    id="addressBuilding"
                    value={formData.addressBuilding}
                    onChange={(e) => setFormData({ ...formData, addressBuilding: e.target.value })}
                    placeholder="e.g., 18/20"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="addressStreet" className="text-xs text-gray-600">
                    Street/Colony
                  </Label>
                  <Input
                    id="addressStreet"
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    placeholder="e.g., Liguardo"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Area (Critical for validation) */}
              <div>
                <Label htmlFor="addressArea" className="text-xs font-semibold text-red-600 dark:text-red-400">
                  🔴 Area/Locality * (REQUIRED - Filters chefs for users)
                </Label>
                {deliveryAreas.length > 0 ? (
                  <Select value={formData.addressArea} onValueChange={(value) => setFormData({ ...formData, addressArea: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="addressArea"
                    value={formData.addressArea}
                    onChange={(e) => handleAddressChange("addressArea", e.target.value)}
                    placeholder="e.g., Kurla West, Mahim, Andheri East"
                    className={`text-sm ${!formData.addressArea.trim() ? 'border-red-300 dark:border-red-700' : ''}`}
                    disabled={isGeocodingAddress}
                  />
                )}
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
                  ⚠️ This area will be used to show chefs only to customers in this zone
                </p>
              </div>

              {/* Row 3: City and Pincode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="addressCity" className="text-xs text-gray-600">
                    City
                  </Label>
                  <Input
                    id="addressCity"
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    placeholder="Mumbai"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="addressPincode" className="text-xs text-gray-600">
                    Pincode
                  </Label>
                  <Input
                    id="addressPincode"
                    value={formData.addressPincode}
                    onChange={(e) => handleAddressChange("addressPincode", e.target.value)}
                    placeholder="e.g., 400070"
                    className="text-sm"
                    disabled={isGeocodingAddress}
                  />
                </div>
              </div>

              {/* Max Delivery Distance */}
              <div>
                <Label htmlFor="maxDeliveryDistanceKm" className="text-xs text-gray-600">
                  Max Delivery Distance (km)
                </Label>
                <Input
                  id="maxDeliveryDistanceKm"
                  type="number"
                  min="1"
                  max="20"
                  value={(formData as any).maxDeliveryDistanceKm || 5}
                  onChange={(e) => setFormData({ ...formData, maxDeliveryDistanceKm: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                  className="text-sm"
                />
              </div>

              {/* Service Pincodes - NEW FIELD */}
              <div>
                <Label htmlFor="servicePincodes" className="text-xs text-gray-600">
                  Service Pincodes <span className="text-gray-500">(comma-separated, optional)</span>
                </Label>
                <Input
                  id="servicePincodes"
                  value={servicePincodesInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setServicePincodesInput(inputValue);

                    // Parse and validate only complete pincodes
                    const pincodes = inputValue
                      .split(",")
                      .map(p => p.trim())
                      .filter(p => /^\d{5,6}$/.test(p));

                    // Update formData only with validated pincodes
                    setFormData({ ...formData, servicePincodes: pincodes.length > 0 ? pincodes : null });
                  }}
                  placeholder="e.g., 400070, 400086, 400025"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chef will only accept orders from these pincodes. Leave empty to serve all pincodes.
                </p>
              </div>

              {/* Geocoding status/error */}
              {isGeocodingAddress && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding location...
                </div>
              )}

              {geocodeError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {geocodeError}
                </div>
              )}

              {/* Location preview */}
              {(formData.latitude || formData.longitude) && !isGeocodingAddress && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    📍 Location Confirmed
                  </p>

                  {/* Manual Coordinate Input Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="latitude" className="text-xs text-blue-800 dark:text-blue-200">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                        className="text-xs h-8"
                        placeholder="e.g., 19.0728"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-xs text-blue-800 dark:text-blue-200">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                        className="text-xs h-8"
                        placeholder="e.g., 72.8826"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Coordinates auto-fill when you enter Area + Pincode. You can manually adjust if needed.
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Delivery zone: {(formData as any).maxDeliveryDistanceKm || 5}km from this location
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createChefMutation.isPending}
              data-testid="button-save-chef"
            >
              {createChefMutation.isPending ? "Creating..." : "Create Chef"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Chef Dialog */}
      <Dialog open={!!editingChef} onOpenChange={() => setEditingChef(null)}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Chef</DialogTitle>
            <DialogDescription>Update chef information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-edit-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  data-testid="input-edit-image"
                  className="flex-1"
                />
                <ImageUploader
                  onImageUpload={(url) => setFormData({ ...formData, image: url })}
                />
              </div>
              {formData.image && (
                <div className="flex gap-2">
                  <img
                    src={getImageUrl(formData.image)}
                    alt="Chef preview"
                    className="w-20 h-20 object-cover rounded-md border"
                    onError={handleImageError}
                  />
                  <div className="flex-1 text-xs text-gray-500 break-all pt-1">
                    {formData.image}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rating">Rating</Label>
                <Input
                  id="edit-rating"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  data-testid="input-edit-rating"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reviewCount">Review Count</Label>
                <Input
                  id="edit-reviewCount"
                  type="number"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-reviews"
                />
              </div>
            </div>

            {/* Chef Address & Location - Structured */}
            <div className="space-y-3 border-t pt-4">
              <Label className="flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4" />
                Chef Restaurant Address
              </Label>

              {/* Row 1: Building/House Number and Street */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-addressBuilding" className="text-xs text-gray-600">
                    Building/House No
                  </Label>
                  <Input
                    id="edit-addressBuilding"
                    value={formData.addressBuilding}
                    onChange={(e) => setFormData({ ...formData, addressBuilding: e.target.value })}
                    placeholder="e.g., 18/20"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-addressStreet" className="text-xs text-gray-600">
                    Street/Colony
                  </Label>
                  <Input
                    id="edit-addressStreet"
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    placeholder="e.g., Liguardo"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Area (Critical for validation) */}
              <div>
                <Label htmlFor="edit-addressArea" className="text-xs font-semibold text-red-600 dark:text-red-400">
                  🔴 Area/Locality * (REQUIRED - Filters chefs for users)
                </Label>
                {deliveryAreas.length > 0 ? (
                  <Select value={formData.addressArea} onValueChange={(value) => setFormData({ ...formData, addressArea: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="edit-addressArea"
                    value={formData.addressArea}
                    onChange={(e) => handleAddressChange("addressArea", e.target.value)}
                    placeholder="e.g., Kurla West, Mahim, Andheri East"
                    className={`text-sm ${!formData.addressArea.trim() ? 'border-red-300 dark:border-red-700' : ''}`}
                    disabled={isGeocodingAddress}
                  />
                )}
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
                  ⚠️ This area will be used to show chefs only to customers in this zone
                </p>
              </div>

              {/* Row 3: City and Pincode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-addressCity" className="text-xs text-gray-600">
                    City
                  </Label>
                  <Input
                    id="edit-addressCity"
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    placeholder="Mumbai"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-addressPincode" className="text-xs text-gray-600">
                    Pincode
                  </Label>
                  <Input
                    id="edit-addressPincode"
                    value={formData.addressPincode}
                    onChange={(e) => setFormData({ ...formData, addressPincode: e.target.value })}
                    placeholder="e.g., 400070"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Max Delivery Distance */}
              <div>
                <Label htmlFor="edit-maxDeliveryDistanceKm" className="text-xs text-gray-600">
                  Max Delivery Distance (km)
                </Label>
                <Input
                  id="edit-maxDeliveryDistanceKm"
                  type="number"
                  min="1"
                  max="20"
                  value={(formData as any).maxDeliveryDistanceKm || 5}
                  onChange={(e) => setFormData({ ...formData, maxDeliveryDistanceKm: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                  className="text-sm"
                />
              </div>

              {/* Service Pincodes - NEW FIELD */}
              <div>
                <Label htmlFor="edit-servicePincodes" className="text-xs text-gray-600">
                  Service Pincodes <span className="text-gray-500">(comma-separated, optional)</span>
                </Label>
                <Input
                  id="edit-servicePincodes"
                  value={servicePincodesInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setServicePincodesInput(inputValue);

                    // Parse and validate only complete pincodes
                    const pincodes = inputValue
                      .split(",")
                      .map(p => p.trim())
                      .filter(p => /^\d{5,6}$/.test(p));

                    // Update formData only with validated pincodes
                    setFormData({ ...formData, servicePincodes: pincodes.length > 0 ? pincodes : null });
                  }}
                  placeholder="e.g., 400070, 400086, 400025"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chef will only accept orders from these pincodes. Leave empty to serve all pincodes.
                </p>
              </div>

              {/* Geocoding status/error */}
              {isGeocodingAddress && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding location...
                </div>
              )}

              {geocodeError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {geocodeError}
                </div>
              )}

              {/* Location preview */}
              {(formData.latitude || formData.longitude) && !isGeocodingAddress && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    📍 Location Confirmed
                  </p>

                  {/* Manual Coordinate Input Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit-latitude" className="text-xs text-blue-800 dark:text-blue-200">
                        Latitude
                      </Label>
                      <Input
                        id="edit-latitude"
                        type="number"
                        step="0.000001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                        className="text-xs h-8"
                        placeholder="e.g., 19.0728"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-longitude" className="text-xs text-blue-800 dark:text-blue-200">
                        Longitude
                      </Label>
                      <Input
                        id="edit-longitude"
                        type="number"
                        step="0.000001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                        className="text-xs h-8"
                        placeholder="e.g., 72.8826"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Coordinates auto-fill when you enter Area + Pincode. You can manually adjust if needed.
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Delivery zone: {(formData as any).maxDeliveryDistanceKm || 5}km from this location
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChef(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateChefMutation.isPending}
              data-testid="button-update-chef"
            >
              {updateChefMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chef Confirmation Dialog */}
      <Dialog open={!!deletingChef} onOpenChange={() => setDeletingChef(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chef</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingChef?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingChef(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteChefMutation.isPending}
              data-testid="button-confirm-delete-chef"
            >
              {deleteChefMutation.isPending ? "Deleting..." : "Delete Chef"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
