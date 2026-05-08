import { useState, useEffect } from "react";
import { CategoryCart } from "@/types/categorycart";
import { ChefHat, MapPin, Star, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OrderSummaryCardProps {
  cart: CategoryCart | null;
  deliveryTimeLabel?: string;
  selectedDeliveryTime?: string;
  subtotal: number;
  originalItemsTotal?: number;
  deliveryFee: number;
  itemDiscountSavings?: number;
  discount: number;
  platformFee?: number;
  bonusUsed?: number;
  walletUsed?: number;
  total: number;
  defaultExpanded?: boolean;
  deliveryDistance?: number | null;
  isBelowDeliveryMinimum?: boolean;
  deliveryMinOrderAmount?: number;
  platformFeeConfig?: any;
  platformFeeThreshold?: number;
  onEditQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

export default function OrderSummaryCard({
  cart,
  subtotal,
  originalItemsTotal = 0,
  deliveryFee,
  itemDiscountSavings = 0,
  discount,
  platformFee = 0,
  bonusUsed = 0,
  walletUsed = 0,
  total,
  defaultExpanded = false,
  deliveryDistance = null,
  isBelowDeliveryMinimum = false,
  deliveryMinOrderAmount = 0,
  platformFeeConfig = null,
  platformFeeThreshold = 200,
  deliveryTimeLabel,
  onRemoveItem,
}: OrderSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  if (!cart || !cart.items || cart.items.length === 0) return null;

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const resolvedDistance =
    typeof deliveryDistance === "number"
      ? deliveryDistance
      : typeof cart.distance === "number"
        ? cart.distance
        : null;
  const distance = resolvedDistance !== null ? `${resolvedDistance.toFixed(2)} km` : "Distance unavailable";

  return (
    <Card className="w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b p-4">
        <div className="flex justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-sm">{cart.chefName}</h3>
              <div className="text-xs text-slate-600">
                {itemCount} items • ₹{subtotal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>

        {/* <div className="flex gap-3 mt-2 text-xs text-slate-600">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {distance}</span>
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> 4.8</span>
        </div> */}
      </div>

      {/* ITEMS */}
      {isExpanded && (
        <div className="p-4 border-b">
          {cart.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span>{item.name} ×{item.quantity}</span>
              <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}

      {/* PRICE BREAKDOWN */}
      <div className="p-4 space-y-2">

        {/* ORIGINAL ITEMS TOTAL */}
        {originalItemsTotal > subtotal && (
          <div className="flex justify-between text-sm text-slate-500">
            <span>Items Total</span>
            <span className="line-through">
              ₹{originalItemsTotal.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* ITEM OFFER SAVINGS */}
        {itemDiscountSavings > 0 && (
            <div className="flex justify-between text-sm text-green-600">
                <span>Item Offer (You Save):</span>
            <span>-₹{itemDiscountSavings.toFixed(0)}</span>
          </div>
        )}

        {/* FINAL SUBTOTAL */}
        <div className="flex justify-between text-sm font-medium">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {/* DELIVERY */}
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          {isBelowDeliveryMinimum ? (
            <span>₹{deliveryFee.toLocaleString("en-IN")}</span>
          ) : (
            <span className="text-green-600 font-medium">FREE ✓</span>
          )}
        </div>
          {deliveryTimeLabel && (
  <div className="text-xs text-green-600">
    Delivery scheduled for {deliveryTimeLabel}
  </div>
)}
        {/* DELIVERY INCENTIVE */}
        {isBelowDeliveryMinimum && deliveryMinOrderAmount > 0 && (
          <div className="text-xs text-orange-600">
            Add ₹{Math.max(0, deliveryMinOrderAmount - subtotal).toLocaleString("en-IN")} more to get FREE delivery
          </div>
        )}

        {/* PLATFORM FEE */}
        {platformFeeConfig && (
          <>
            <div className="flex justify-between text-sm">
              <span>Platform Fee</span>
              {platformFee > 0 ? (
                <span>₹{platformFee.toLocaleString("en-IN")}</span>
              ) : (
                <span className="text-green-600 font-medium">FREE ✓</span>
              )}
            </div>

            {/* PLATFORM INCENTIVE */}
            {platformFee > 0 && subtotal < platformFeeThreshold && (
              <div className="text-xs text-orange-600">
                Add ₹{Math.max(0, platformFeeThreshold - subtotal).toLocaleString("en-IN")} more to waive platform fee
              </div>
            )}

            {/* PLATFORM SUCCESS */}
            {platformFee === 0 && (
              <div className="text-xs text-green-600">
                🎉 Platform fee waived on this order
              </div>
            )}
          </>
        )}

        {/* DISCOUNT */}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* BONUS */}
        {bonusUsed > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Referral Bonus</span>
            <span>-₹{bonusUsed.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* WALLET */}
        {walletUsed > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Wallet Used</span>
            <span>-₹{walletUsed.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-orange-600">₹{total.toLocaleString("en-IN")}</span>
        </div>

      </div>
    </Card>
  );
}
