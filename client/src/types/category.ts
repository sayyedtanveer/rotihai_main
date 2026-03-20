
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  iconName: string;
  itemCount: string;
  isAutoAssign?: boolean;  // Hybrid chef model: auto-assign instead of user selection
  requiresDeliverySlot: boolean;
  displayOrder: number;
}
