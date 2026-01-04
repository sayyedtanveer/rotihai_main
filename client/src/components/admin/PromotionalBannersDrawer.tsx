import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Megaphone, Plus, Pencil, Trash2, X } from "lucide-react";
import type { PromotionalBanner } from "@shared/schema";

interface PromotionalBannersDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PromotionalBannersDrawer({ isOpen, onOpenChange }: PromotionalBannersDrawerProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    gradientFrom: "orange-600",
    gradientVia: "amber-600",
    gradientTo: "yellow-600",
    emoji1: "🍽️",
    emoji2: "🥘",
    emoji3: "🍛",
    actionType: "subscription",
    actionValue: "",
    isActive: true,
    displayOrder: 0,
  });

  const { data: banners, isLoading } = useQuery<PromotionalBanner[]>({
    queryKey: ["/api/admin/promotional-banners"],
    queryFn: async () => {
      const response = await api.get("/api/admin/promotional-banners");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/api/admin/promotional-banners", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-banners"] });
      toast({ title: "Banner created successfully" });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await api.patch(`/api/admin/promotional-banners/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-banners"] });
      toast({ title: "Banner updated successfully" });
      setIsFormOpen(false);
      setEditingBanner(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/promotional-banners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-banners"] });
      toast({ title: "Banner deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      buttonText: "",
      gradientFrom: "orange-600",
      gradientVia: "amber-600",
      gradientTo: "yellow-600",
      emoji1: "🍽️",
      emoji2: "🥘",
      emoji3: "🍛",
      actionType: "subscription",
      actionValue: "",
      isActive: true,
      displayOrder: 0,
    });
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      buttonText: banner.buttonText || "",
      gradientFrom: banner.gradientFrom,
      gradientVia: banner.gradientVia,
      gradientTo: banner.gradientTo,
      emoji1: banner.emoji1,
      emoji2: banner.emoji2,
      emoji3: banner.emoji3,
      actionType: banner.actionType,
      actionValue: banner.actionValue || "",
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      deleteMutation.mutate(id);
    }
  };

  const colorGradients = [
    { from: "orange-600", via: "amber-600", to: "yellow-600", label: "Orange to Yellow" },
    { from: "red-600", via: "rose-600", to: "pink-600", label: "Red to Pink" },
    { from: "blue-600", via: "cyan-600", to: "teal-600", label: "Blue to Teal" },
    { from: "purple-600", via: "violet-600", to: "indigo-600", label: "Purple to Indigo" },
    { from: "green-600", via: "emerald-600", to: "teal-600", label: "Green to Teal" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] max-h-screen overflow-y-auto bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Promotional Banners
          </SheetTitle>
          <SheetDescription>
            Manage promotional banners displayed to users
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Add New Banner Button */}
          {!isFormOpen && (
            <Button
              onClick={() => {
                setEditingBanner(null);
                resetForm();
                setIsFormOpen(true);
              }}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Banner
            </Button>
          )}

          {/* Form Section */}
          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingBanner ? "Edit Banner" : "Create New Banner"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner title"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Banner subtitle"
                    rows={2}
                  />
                </div>

                {/* Button Text */}
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="CTA button text"
                  />
                </div>

                {/* Gradient Selection */}
                <div className="space-y-2">
                  <Label>Gradient Color</Label>
                  <Select
                    value={`${formData.gradientFrom}-${formData.gradientVia}-${formData.gradientTo}`}
                    onValueChange={(value) => {
                      const selected = colorGradients.find(
                        (g) => `${g.from}-${g.via}-${g.to}` === value
                      );
                      if (selected) {
                        setFormData({
                          ...formData,
                          gradientFrom: selected.from,
                          gradientVia: selected.via,
                          gradientTo: selected.to,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorGradients.map((gradient) => (
                        <SelectItem
                          key={`${gradient.from}-${gradient.via}-${gradient.to}`}
                          value={`${gradient.from}-${gradient.via}-${gradient.to}`}
                        >
                          {gradient.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Emojis */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="emoji1">Emoji 1</Label>
                    <Input
                      id="emoji1"
                      value={formData.emoji1}
                      onChange={(e) => setFormData({ ...formData, emoji1: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emoji2">Emoji 2</Label>
                    <Input
                      id="emoji2"
                      value={formData.emoji2}
                      onChange={(e) => setFormData({ ...formData, emoji2: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emoji3">Emoji 3</Label>
                    <Input
                      id="emoji3"
                      value={formData.emoji3}
                      onChange={(e) => setFormData({ ...formData, emoji3: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* Action Type */}
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, actionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="url">External URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Value */}
                <div className="space-y-2">
                  <Label htmlFor="actionValue">Action Value</Label>
                  <Input
                    id="actionValue"
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    placeholder="ID or URL"
                  />
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) })
                    }
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : "Save Banner"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingBanner(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banners List */}
          <div className="space-y-3">
            <h3 className="font-semibold">
              Banners ({banners?.length || 0})
            </h3>

            {isLoading ? (
              <div className="text-sm text-slate-500">Loading banners...</div>
            ) : banners && banners.length > 0 ? (
              banners.map((banner) => (
                <Card key={banner.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{banner.title}</div>
                        <div className="text-sm text-slate-500 truncate">
                          {banner.subtitle}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {banner.isActive ? "✅ Active" : "❌ Inactive"}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(banner)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">
                No banners yet
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
