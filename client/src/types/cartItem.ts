export
  interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  chefId?: string;
  chefName?: string;
  categoryId?: string;
  offerPercentage?: number; // Add offer percentage
  specialInstructions?: string; // Optional cooking instructions
  effectiveMode?: 'instant' | 'preorder' | 'both';
}
