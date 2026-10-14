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
  variantId?: string; // 🆕 Variant ID for multi-variant products
  variantName?: string; // 🆕 Variant name (e.g., "Half", "Full")
  offerPercentage?: number; // Add offer percentage
  specialInstructions?: string; // Optional cooking instructions
  effectiveMode?: 'instant' | 'preorder' | 'both';
}
