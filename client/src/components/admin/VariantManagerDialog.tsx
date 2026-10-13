import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductVariantSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Variant = z.infer<typeof insertProductVariantSchema>;

interface VariantManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  productId?: string;
  onCreateVariant?: (variant: Variant) => Promise<any>;
  onUpdateVariant?: (variantId: string, variant: Partial<Variant>) => Promise<any>;
  onDeleteVariant?: (variantId: string) => Promise<any>;
}

export function VariantManagerDialog({
  isOpen,
  onClose,
  variants,
  onVariantsChange,
  productId,
  onCreateVariant,
  onUpdateVariant,
  onDeleteVariant,
}: VariantManagerDialogProps) {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Omit<Variant, "productId">>({
    resolver: zodResolver(insertProductVariantSchema.omit({ productId: true })),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      price: 0,
      hotelPrice: 0,
      stockQuantity: 100,
      lowStockThreshold: 20,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
    },
  });

  const handleAddVariant = (data: any) => {
    const newVariant = {
      ...data,
      sortOrder: editingIndex !== null ? variants[editingIndex].sortOrder : variants.length * 10,
    };

    if (editingIndex !== null) {
      // Update existing variant
      const updated = [...variants];
      updated[editingIndex] = newVariant;
      onVariantsChange(updated);
      setEditingIndex(null);
    } else {
      // Add new variant
      onVariantsChange([...variants, newVariant]);
    }

    form.reset();
    toast({
      title: "Success",
      description: editingIndex !== null ? "Variant updated" : "Variant added",
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.reset(variants[index]);
  };

  const handleDeleteVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
    toast({
      title: "Variant deleted",
      description: "Variant has been removed",
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...variants];
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    onVariantsChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === variants.length - 1) return;
    const updated = [...variants];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onVariantsChange(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Product Variants</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variant Form */}
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
            <h3 className="font-semibold mb-4">
              {editingIndex !== null ? "Edit Variant" : "Add New Variant"}
            </h3>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddVariant)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Half, Full, Large"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g., Half Plate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g., Smaller portion, perfect for one"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hotelPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Threshold</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingIndex !== null ? "Update Variant" : "Add Variant"}
                  </Button>
                  {editingIndex !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingIndex(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Variants Table */}
          {variants.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{variant.name}</div>
                        {variant.displayName && (
                          <div className="text-xs text-gray-500">
                            {variant.displayName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>₹{variant.hotelPrice || 0}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{variant.price}
                      </TableCell>
                      <TableCell>{variant.stockQuantity}</TableCell>
                      <TableCell>
                        <Badge
                          variant={variant.isAvailable ? "default" : "secondary"}
                        >
                          {variant.isAvailable ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === variants.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(index)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVariant(index)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No variants added yet. Add your first variant to get started.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
