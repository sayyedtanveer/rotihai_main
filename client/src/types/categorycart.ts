import { CartItem } from "./cartItem";

export interface CategoryCart {
  categoryId: string;
  categoryName: string;
  chefId: string;
  chefName: string;
  chefLatitude?: number;
  chefLongitude?: number;
  items: CartItem[];
  total?: number;
  deliveryFee?: number;
  distance?: number;
  freeDeliveryEligible?: boolean;
  amountForFreeDelivery?: number;
  deliveryRangeName?: string;
  minOrderAmount?: number;
  chefIsActive?: boolean;
  maxDeliveryDistanceKm?: number;
}
