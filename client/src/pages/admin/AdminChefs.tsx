
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest } from "@/hooks/useAdminAuth";
import { queryClient } from "@/lib/queryClient";
import type { Chef, Category } from "@shared/schema";
import { Star, Pencil, Trash2, Plus, Store, Loader2, MapPin } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

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
  });
  
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
    });
    setGeocodeError("");
  };

  // Auto-geocode address with debounce - triggered by area field change
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Only trigger geocoding when area field changes
    if (field !== "addressArea") {
      setGeocodeError("");
      return;
    }

    setGeocodeError("");
    
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    if (!value.trim()) {
      return;
    }

    // Build full address from components for geocoding
    const building = formData.addressBuilding?.trim() || "";
    const street = formData.addressStreet?.trim() || "";
    const area = value.trim();
    const city = formData.addressCity?.trim() || "Mumbai";
    const fullAddress = [building, street, area, city]
      .filter(part => part.length > 0)
      .join(", ");

    if (!fullAddress.trim()) {
      return;
    }

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        setIsGeocodingAddress(true);
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: fullAddress }),
        });

        if (!response.ok) {
          const data = await response.json();
          setGeocodeError(data.message || "Failed to geocode address");
          setIsGeocodingAddress(false);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
          }));
          setGeocodeError("");
          toast({
            title: "Location found",
            description: `${fullAddress} - (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`,
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
    });
    setGeocodeError("");
  };

  const handleUpdate = () => {
    if (editingChef) {
      updateChefMutation.mutate({ id: editingChef.id, data: formData });
    }
  };

  const handleCreate = () => {
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
                      src={formData.image}
                      alt="Chef preview"
                      className="w-20 h-20 object-cover rounded-md border"
                      onError={() => {
                        console.warn("Failed to load image preview");
                      }}
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
                <Label htmlFor="addressArea" className="text-xs text-gray-600 font-semibold">
                  Area/Locality * (Required)
                </Label>
                <Input
                  id="addressArea"
                  value={formData.addressArea}
                  onChange={(e) => handleAddressChange("addressArea", e.target.value)}
                  placeholder="e.g., Kurla West"
                  className="text-sm"
                  disabled={isGeocodingAddress}
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Area will be auto-geocoded to find exact location
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
                    onChange={(e) => setFormData({ ...formData, addressPincode: e.target.value })}
                    placeholder="e.g., 400070"
                    className="text-sm"
                  />
                </div>
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    📍 Location Confirmed
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Latitude: {formData.latitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Longitude: {formData.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Delivery zone: 2.5km from this location
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
                    src={formData.image}
                    alt="Chef preview"
                    className="w-20 h-20 object-cover rounded-md border"
                    onError={() => {
                      console.warn("Failed to load image preview");
                    }}
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
            
            {/* Chef Address & Location */}
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Chef Address (Optional)
                </Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="e.g., 18/20, Liguardo, Kurla West, Mumbai"
                  disabled={isGeocodingAddress}
                />
                <p className="text-xs text-muted-foreground">
                  Address will be auto-geocoded to find exact location
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    📍 Location Confirmed
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Latitude: {formData.latitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Longitude: {formData.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Delivery zone: 2.5km from this location
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
