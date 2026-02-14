import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MapPin, Package, Plus, Minus } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { getImageUrl, handleImageError } from "@/lib/imageUrl";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartCardProps {
  categoryName: string;
  chefName: string;
  items: CartItem[];
  distance?: number;
  deliveryFee?: number;
  freeDeliveryEligible?: boolean;
  amountForFreeDelivery?: number;
  subtotal: number;
  deliveryRangeName?: string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onCheckout?: () => void;
  disabled?: boolean;
  chefClosed?: boolean;
  productAvailability?: Record<string, { isAvailable: boolean; stock?: number }>;
  isFeeFinal?: boolean; // New prop for fee finalization status
}

export default function CartCard({
  categoryName,
  chefName,
  items,
  distance,
  deliveryFee = 20,
  freeDeliveryEligible = false,
  amountForFreeDelivery,
  subtotal,
  deliveryRangeName,
  onUpdateQuantity,
  onCheckout,
  disabled = false,
  chefClosed = false,
  productAvailability = {},
  isFeeFinal = false,
}: CartCardProps) {
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Check if all items are unavailable
  const allItemsUnavailable = items.length > 0 && items.every(
    item => productAvailability[item.id]?.isAvailable === false
  );

  // Calculate progress for free delivery hint
  const progressValue = amountForFreeDelivery
    ? Math.min((subtotal / (subtotal + amountForFreeDelivery)) * 100, 100)
    : 100;

  return (
    <Card className="overflow-hidden" data-testid={`card-cart-${categoryName}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3 min-w-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3 className="font-semibold text-sm sm:text-base truncate" data-testid="text-cart-category">
            {categoryName}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 overflow-hidden">
            <span data-testid="text-cart-chef" className="truncate">{chefName}</span>
            {distance !== undefined && (
              <>
                <span className="flex-shrink-0">•</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <MapPin className="h-3 w-3" />
                  <span data-testid="text-cart-distance">{distance.toFixed(1)} km</span>
                </div>
              </>
            )}
          </div>
        </div>
        <Badge variant="secondary" data-testid="badge-cart-items" className="flex-shrink-0 text-xs">
          <Package className="h-3 w-3 mr-1" />
          {totalItems}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Chef closed warning */}
        {chefClosed && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              Currently Closed
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              {chefName} is not accepting orders right now.
            </p>
          </div>
        )}

        {/* Warning for missing delivery settings */}
        {(deliveryRangeName === "No delivery settings configured" ||
          deliveryRangeName === "No active delivery settings") && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Delivery settings not configured. Contact admin to set up delivery zones and pricing.
              </p>
            </div>
          )}

        {/* Outside delivery zone warning */}
        {deliveryRangeName === "Outside delivery zone" && distance && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              ⚠️ Your location ({distance.toFixed(1)} km away) is outside our delivery zone.
            </p>
          </div>
        )}

        {/* Unavailable Items Warning */}
        {allItemsUnavailable && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              Items Unavailable
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              All items in this cart are currently unavailable. Please remove them or select other items.
            </p>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {items.map((item) => {
            const isUnavailable = productAvailability[item.id]?.isAvailable === false;
            return (
              <div
                key={item.id}
                className={`flex gap-2 sm:gap-3 overflow-hidden ${isUnavailable ? 'opacity-50' : ''}`}
                data-testid={`item-${item.id}`}
              >
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className={`w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0 ${isUnavailable ? 'grayscale' : ''}`}
                  onError={handleImageError}
                  data-testid={`img-item-${item.id}`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-xs sm:text-sm truncate ${isUnavailable ? 'line-through text-muted-foreground' : ''}`} data-testid={`text-item-name-${item.id}`}>
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <p className={`text-xs font-semibold ${isUnavailable ? 'text-muted-foreground' : 'text-primary'}`} data-testid={`text-item-price-${item.id}`}>
                      ₹{item.price}
                    </p>
                    {isUnavailable && (
                      <span className="text-xs px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-sm font-medium whitespace-nowrap">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
                    disabled={isUnavailable}
                    data-testid={`button-decrease-${item.id}`}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium flex-shrink-0" data-testid={`text-quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    disabled={isUnavailable}
                    data-testid={`button-increase-${item.id}`}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Free Delivery Hint */}
        {freeDeliveryEligible ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2">
            <p className="text-xs font-medium text-green-700 dark:text-green-400" data-testid="text-free-delivery">
              ✓ Free delivery applied!
            </p>
          </div>
        ) : amountForFreeDelivery !== undefined && amountForFreeDelivery > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Free delivery progress</span>
              <span className="font-medium" data-testid="text-free-delivery-hint">
                Add ₹{Math.ceil(amountForFreeDelivery)} more
              </span>
            </div>
            <Progress value={progressValue} className="h-1" data-testid="progress-free-delivery" />
            <p className="text-xs text-muted-foreground">
              Add more items to unlock free delivery
            </p>
          </div>
        ) : null}

        {/* Price Breakdown */}
        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between min-w-0">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium flex-shrink-0 ml-2" data-testid="text-subtotal">₹{subtotal}</span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground">
                {isFeeFinal ? "Delivery Fee" : "Estimated Fee"}
              </span>
              {distance !== undefined ? (
                <span className="text-xs text-muted-foreground/70 truncate">
                  {distance.toFixed(1)} km {deliveryRangeName ? `• ${deliveryRangeName}` : ''}
                </span>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Enable location
                </span>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {deliveryRangeName === "No delivery settings configured" || deliveryRangeName === "No active delivery settings" ? (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                  Contact admin
                </span>
              ) : deliveryRangeName === "Outside delivery zone" ? (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                  Not available
                </span>
              ) : freeDeliveryEligible ? (
                <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                  <span className="line-through text-gray-400 dark:text-gray-500">₹{deliveryFee}</span> FREE
                </span>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="font-medium whitespace-nowrap" data-testid="text-delivery-fee">
                    {/* If fee is NOT final and not free, show appropriate message */}
                    {!isFeeFinal && deliveryFee > 0 ? (
                      <span className="text-muted-foreground text-xs italic">
                        Starting from ₹{deliveryFee}
                      </span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                  {!isFeeFinal && deliveryFee > 0 && (
                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5 max-w-[120px] text-right">
                      (Calculated at checkout)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {freeDeliveryEligible && deliveryFee === 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>You saved</span>
              <span className="font-semibold flex-shrink-0 ml-2">₹{deliveryFee > 0 ? deliveryFee : 20}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <div className="flex flex-col items-end">
              <span className="text-primary flex-shrink-0 ml-2" data-testid="text-total">
                {/* Logic to show range or estimated total if fee is not final */}
                {!isFeeFinal && deliveryFee > 0 ? (
                  <span className="text-muted-foreground text-xs font-normal">
                    Estimate: ₹{total}
                  </span>
                ) : (
                  `₹${total}`
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={disabled || chefClosed || allItemsUnavailable}
          data-testid="button-checkout"
        >
          {chefClosed ? `${chefName} is Closed` : allItemsUnavailable ? 'Items Unavailable' : `Checkout from ${chefName}`}
        </Button>
      </CardFooter>
    </Card>
  );
}