import { Button } from "@/components/ui/button";
import { MapPin, Edit2 } from "lucide-react";

interface CheckoutAddressCardProps {
  building: string;
  street: string;
  area: string;
  pincode: string;
  distance?: number;
  onChangeAddress: () => void;
}

export function CheckoutAddressCard({
  building,
  street,
  area,
  pincode,
  distance,
  onChangeAddress,
}: CheckoutAddressCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">
              {building}
              {street && `, ${street}`}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {area}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Pincode: {pincode}
            </p>
            {distance !== undefined && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Distance: {distance.toFixed(1)} km
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={onChangeAddress}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-200 flex-shrink-0"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Change</span>
        </Button>
      </div>
    </div>
  );
}
