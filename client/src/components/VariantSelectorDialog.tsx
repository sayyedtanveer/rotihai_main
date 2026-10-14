import { useState, useEffect } from "react";
import type { Product, ProductVariant } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, X } from "lucide-react";
import { getImageUrl, handleImageError } from "@/lib/imageUrl";

interface VariantSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product & { variants?: ProductVariant[] };
  onConfirm: (variantId: string | undefined, quantity: number) => void;
  defaultQuantity?: number;
  initialVariantId?: string;  // 🆕 Pre-select existing variant when increasing quantity
}

export function VariantSelectorDialog({
  isOpen,
  onClose,
  product,
  onConfirm,
  defaultQuantity = 1,
  initialVariantId,  // 🆕 NEW
}: VariantSelectorDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    initialVariantId || product.variants?.[0]?.id  // 🆕 Use initialVariantId if provided
  );
  const [quantity, setQuantity] = useState(defaultQuantity);

  const variants = product.variants || [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  // 🆕 Update selectedVariantId when initialVariantId changes (pre-select existing variant)
  useEffect(() => {
    if (initialVariantId) {
      setSelectedVariantId(initialVariantId);
    }
  }, [initialVariantId]);

  const handleAddToCart = () => {
    if (!selectedVariantId && product.hasVariants) {
      return; // Variant is required for multi-variant products
    }
    onConfirm(selectedVariantId, quantity);
    onClose();
  };

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const totalPrice = displayPrice * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-t-2xl sm:rounded-lg">
        {/* Header with close button */}
        <DialogHeader className="sticky top-0 bg-background border-b px-4 py-3 flex flex-row items-center justify-between gap-2">
          <DialogTitle className="text-lg font-bold text-left">{product.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          {/* Product Image */}
          {product.image && (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-40 object-cover rounded-lg"
              onError={handleImageError}
              data-hide-on-error="true"
            />
          )}

          {/* Product Description */}
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>

          {/* Variant Selection - Zomato Style */}
          {product.hasVariants && variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Select a size
              </label>
              <div className="space-y-2">
                {variants.map((variant) => {
                  const isDisabled = !variant.isAvailable || !variant.isActive;
                  const isSelected = selectedVariantId === variant.id;
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => !isDisabled && setSelectedVariantId(variant.id)}
                      disabled={isDisabled}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {variant.displayName || variant.name}
                          </p>
                          {variant.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {variant.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3">
                          <p className="font-bold text-green-600">
                            ₹{variant.price}
                          </p>
                          {isDisabled && (
                            <Badge variant="secondary" className="text-xs">
                              {!variant.isActive ? "Unavailable" : "Out of Stock"}
                            </Badge>
                          )}
                          {isSelected && !isDisabled && (
                            <div className="h-4 w-4 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-semibold text-foreground">
              Quantity
            </label>
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-900 rounded-lg p-2 w-fit">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold min-w-8 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                ₹{displayPrice} × {quantity}
              </span>
              <span className="text-2xl font-bold text-green-600">
                ₹{totalPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Sticky Button */}
        <DialogFooter className="sticky bottom-0 bg-background border-t px-4 py-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={
              product.hasVariants &&
              (!selectedVariantId || !selectedVariant?.isAvailable)
            }
          >
            Add to Cart · ₹{totalPrice}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
