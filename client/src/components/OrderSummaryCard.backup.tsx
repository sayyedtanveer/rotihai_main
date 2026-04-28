  import { useState } from "react";
  import { CategoryCart } from "@/types/categorycart";
  import { ChefHat, MapPin, Star, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card } from "@/components/ui/card";

  interface OrderSummaryCardProps {
    cart: CategoryCart | null;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    bonusUsed?: number;
    walletUsed?: number;
    total: number;
    platformFee?: number;
    platformFeeThreshold?: number;
    onEditQuantity?: (itemId: string, quantity: number) => void;
    onRemoveItem?: (itemId: string) => void;
  }

  export default function OrderSummaryCard({
    cart,
    subtotal,
    deliveryFee,
    discount,
    platformFee = 0, 
    bonusUsed = 0,
    walletUsed = 0,
    total,
    
    onEditQuantity,
    onRemoveItem,
  }: OrderSummaryCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!cart || !cart.items || cart.items.length === 0) {
      return null;
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate distance display
    const distance = cart.distance ? `${(cart.distance / 1000).toFixed(1)} km` : "Distance unavailable";

    return (
      <Card className="w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{cart.chefName}</h3>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Chef Info Row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>4.8 • 1.2K reviews</span>
            </div>
          </div>
        </div>

        {/* Items Section */}
        {isExpanded && (
          <div className="border-b border-slate-200 p-4">
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 truncate">{item.name}</span>
                      <span className="text-slate-500">×{item.quantity}</span>
                    </div>
                    {item.specialInstructions && (
                      <p className="text-xs text-slate-500 mt-1">{item.specialInstructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-slate-800 whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                    {onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Items Count Collapsed View */}
            {!isExpanded && (
              <div className="text-xs font-medium text-slate-600 mt-2">
                {itemCount} {itemCount === 1 ? "item" : "items"} • ₹{subtotal.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}

        {/* Collapsed View - Summary Line */}
        {!isExpanded && (
          <div className="px-4 py-3 text-sm font-medium text-slate-700 border-b border-slate-200">
            {itemCount} {itemCount === 1 ? "item" : "items"} • ₹{subtotal.toLocaleString("en-IN")}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="p-4 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          {deliveryFee > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Delivery Fee</span>
              <span className="text-slate-800">₹{deliveryFee.toLocaleString("en-IN")}</span>
            </div>
            
          )}

          {deliveryFee === 0 && cart.freeDeliveryEligible && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Delivery Fee</span>
              <span className="text-green-600 font-medium">FREE ✓</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Discount</span>
              <span className="text-green-600 font-medium">-₹{discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          {/* ✅ PLATFORM FEE */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Platform Fee (Convenience)</span>
            {platformFee > 0 ? (
              <span className="text-slate-800">₹{platformFee.toLocaleString("en-IN")}</span>
            ) : (
              <span className="text-green-600 font-medium">FREE ✓</span>
            )}
          </div>
          {platformFee > 0 && (
            <div className="text-xs text-orange-600">
              Add ₹{200 - subtotal} more to remove platform fee
            </div>
          )}

          {bonusUsed > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Referral Bonus</span>
              <span className="text-green-600 font-medium">-₹{bonusUsed.toLocaleString("en-IN")}</span>
            </div>
          )}

          {walletUsed > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Wallet Used</span>
              <span className="text-green-600 font-medium">-₹{walletUsed.toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-200 my-2" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-800">Total to Pay</span>
            <span className="text-lg font-bold text-orange-600">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </Card>
    );
  }
