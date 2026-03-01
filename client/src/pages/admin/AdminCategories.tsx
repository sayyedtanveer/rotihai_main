
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "@/lib/apiClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Category, InsertCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { getImageUrl, handleImageError } from "@/lib/imageUrl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { ImageUploader } from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Row ───────────────────────────────────────────────────────────────
function SortableCategoryRow({
  category,
  isSaving,
  onEdit,
  onDelete,
}: {
  category: Category;
  isSaving: boolean;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : undefined,
    scale: isDragging ? "1.02" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-slate-800 border rounded-xl p-3 shadow-sm"
      data-testid={`card-category-${category.id}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        disabled={isSaving}
        className="touch-none cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed p-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Category image */}
      <img
        src={getImageUrl(category.image)}
        alt={category.name}
        onError={handleImageError}
        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{category.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{category.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">Order: {category.displayOrder}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(category)}
          disabled={isSaving}
          data-testid={`button-edit-${category.id}`}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(category.id)}
          disabled={isSaving}
          data-testid={`button-delete-${category.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // Local optimistic order state for the list
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: serverCategories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin", "categories"],
    queryFn: async () => {
      const response = await api.get("/api/admin/categories");
      return response.data;
    },
  });

  // Sync local state when server data arrives
  useEffect(() => {
    if (serverCategories) {
      setLocalCategories(serverCategories);
    }
  }, [serverCategories]);

  // Display local (optimistic) order while saving, else server order
  const categories = localCategories ?? serverCategories ?? [];

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      iconName: "UtensilsCrossed",
      itemCount: "0 items",
      requiresDeliverySlot: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await api.post("/api/admin/categories", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "categories"] });
      toast({ title: "Category created", description: "Category has been created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Creation failed", description: "Failed to create category", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCategory }) => {
      const response = await api.patch(`/api/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "categories"] });
      toast({ title: "Category updated", description: "Category has been updated successfully" });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "categories"] });
      toast({ title: "Category deleted", description: "Category has been deleted successfully" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; displayOrder: number }[]) => {
      const response = await api.patch("/api/admin/categories/reorder", items);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "categories"] });
      // Also invalidate the public categories query so Home page refreshes
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Order saved", description: "Category order updated successfully" });
    },
    onError: () => {
      // Revert to server state on failure
      setLocalCategories(serverCategories ?? null);
      toast({ title: "Save failed", description: "Failed to save category order", variant: "destructive" });
    },
  });

  const isSaving = reorderMutation.isPending;

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description,
      image: category.image,
      iconName: category.iconName,
      itemCount: category.itemCount,
      requiresDeliverySlot: category.requiresDeliverySlot ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertCategory) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    // Assign sequential displayOrder values (1-based)
    const updated = reordered.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    setLocalCategories(updated);

    // Send batch update to backend
    reorderMutation.mutate(updated.map((c) => ({ id: c.id, displayOrder: c.displayOrder })));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Categories</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Drag to reorder · changes save automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            )}
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) { setEditingCategory(null); form.reset(); }
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter category name" data-testid="input-category-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter category description" data-testid="input-category-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} placeholder="https://..." data-testid="input-category-image" className="flex-1" />
                            <ImageUploader onImageUpload={(url) => field.onChange(url)} disabled={field.disabled} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="iconName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="UtensilsCrossed, ChefHat, Hotel" data-testid="input-category-icon" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="itemCount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Count</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="20+ items" data-testid="input-category-count" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="requiresDeliverySlot" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Require Delivery Slot</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Users will be asked to choose a specific delivery time interval during checkout
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-category"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Saving..."
                          : editingCategory ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 border rounded-xl p-3 animate-pulse">
                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    isSaving={isSaving}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No categories found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
