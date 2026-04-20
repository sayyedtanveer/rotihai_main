import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateDistance, calculateDelivery, type DeliverySetting } from "@shared/deliveryUtils";
import apiClient from "@/lib/apiClient";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  chefId?: string;
  chefName?: string;
  categoryId?: string;
  offerPercentage?: number; // Add offer percentage
  specialInstructions?: string; // Optional cooking instructions
}

interface CategoryCart {
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
  isFeeFinal?: boolean; // New flag to indicate if fee is final
}

interface ChefStatus {
  chefId: string;
  isActive: boolean;
}

interface CartStore {
  carts: CategoryCart[];
  userLatitude: number | null;
  userLongitude: number | null;
  isLocationExact: boolean; // New flag for location precision
  deliverySettings: DeliverySetting[];
  chefStatuses: Record<string, boolean>;
  setUserLocation: (lat: number | null, lon: number | null, isExact?: boolean) => void;
  setDeliverySettings: (settings: DeliverySetting[]) => void;
  fetchDeliverySettings: () => Promise<void>;
  updateChefStatus: (chefId: string, isActive: boolean) => void;
  setChefStatuses: (statuses: ChefStatus[]) => void;
  fetchChefStatuses: () => Promise<void>;
  addToCart: (
    item: Omit<CartItem, "quantity">,
    categoryName: string,
    chefLatitude?: number,
    chefLongitude?: number
  ) => boolean;
  removeFromCart: (categoryId: string, itemId: string, chefId?: string) => void;
  updateQuantity: (categoryId: string, itemId: string, quantity: number, chefId?: string) => void;
  clearCart: (categoryId: string, chefId?: string) => void;
  clearAllCarts: () => void;
  getTotalItems: (categoryId?: string, chefId?: string) => number;
  getTotalPrice: (categoryId: string, chefId?: string) => number;
  getCart: (categoryId: string, chefId?: string) => CategoryCart | undefined;
  getAllCarts: () => CategoryCart[];
  getAllCartsWithDelivery: () => CategoryCart[];
  canAddItem: (
    chefId?: string,
    categoryId?: string
  ) => { canAdd: boolean; conflictChef?: string };
  // New helper: return all carts for a given category
  getCartsByCategory: (categoryId: string) => CategoryCart[];
  updateSpecialInstructions: (categoryId: string, itemId: string, instructions: string, chefId?: string) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: [],
      userLatitude: null,
      userLongitude: null,
      isLocationExact: false, // Default to false (approximate)
      deliverySettings: [],
      chefStatuses: {},

      setUserLocation: (lat: number | null, lon: number | null, isExact = false) => {
        set({ userLatitude: lat, userLongitude: lon, isLocationExact: isExact });
      },

      setDeliverySettings: (settings: DeliverySetting[]) => {
        set({ deliverySettings: settings });
      },

      fetchDeliverySettings: async () => {
        try {
          const response = await apiClient.get("/api/delivery-settings");
          if (response.status === 200) {
            set({ deliverySettings: response.data });
          }
        } catch (error) {
          console.error("Failed to fetch delivery settings:", error);
        }
      },

      updateChefStatus: (chefId: string, isActive: boolean) => {
        set((state) => {
          const newStatuses = { ...state.chefStatuses, [chefId]: isActive };
          // Force a re-render by creating a new object reference
          return { chefStatuses: newStatuses };
        });
      },

      setChefStatuses: (statuses: ChefStatus[]) => {
        const newStatuses: Record<string, boolean> = {};
        statuses.forEach(s => newStatuses[s.chefId] = s.isActive);
        set({ chefStatuses: newStatuses });
      },

      fetchChefStatuses: async () => {
        try {
          const response = await apiClient.get("/api/chefs");
          if (response.status === 200) {
            const chefs = response.data;
            const statuses: ChefStatus[] = chefs.map((chef: { id: string; isActive: boolean }) => ({
              chefId: chef.id,
              isActive: chef.isActive ?? true,
            }));
            get().setChefStatuses(statuses);
          }
        } catch (error) {
          console.error("Failed to fetch chef statuses:", error);
        }
      },

      // ✅ Check if item can be added. Previously this prevented creating multiple
      // carts for the same category across different chefs. We now allow multi-chef
      // carts (one per chef+category) so always permit adding — cart selection
      // / separation is handled by indexing carts by chefId as well.
      canAddItem: (chefId?: string, categoryId?: string) => {
        return { canAdd: true };
      },

      // Return all carts for a given category (useful for UI to show multiple carts)
      getCartsByCategory: (categoryId: string) => {
        const { carts } = get();
        return carts.filter((c) => c.categoryId === categoryId);
      },

      // ✅ Add item to specific category cart
      addToCart: (item, categoryName, chefLatitude, chefLongitude) => {
        const { carts, canAddItem } = get();

        // Safety check
        if (!item.categoryId) {
          console.warn("Attempted to add item without categoryId:", item);
          return false;
        }

        const checkResult = canAddItem(item.chefId, item.categoryId);
        if (!checkResult.canAdd) {
          console.warn(
            `Cannot add item — existing chef in ${item.categoryId} is ${checkResult.conflictChef}`
          );
          return false;
        }

        // Find cart matching both categoryId and chefId. If not found create a new
        // cart scoped to this (categoryId, chefId) pair so users can have multiple
        // carts for the same category from different chefs.
        const chefKey = item.chefId || "";
        const categoryCartIndex = carts.findIndex(
          (cart) => cart.categoryId === item.categoryId && cart.chefId === chefKey
        );

        // ✅ No cart yet → create new category cart
        if (categoryCartIndex === -1) {
          const newCart: CategoryCart = {
            categoryId: item.categoryId,
            categoryName,
            chefId: item.chefId || "",
            chefName: item.chefName || "",
            chefLatitude,
            chefLongitude,
            items: [{ ...item, quantity: 1 }],
          };
          set({ carts: [...carts, newCart] });
          return true;
        }

        // ✅ Existing cart → update or add item
        const categoryCart = carts[categoryCartIndex];
        const existingItemIndex = categoryCart.items.findIndex(
          (i) => i.id === item.id
        );

        const updatedCarts = [...carts];
        if (existingItemIndex !== -1) {
          // Increment quantity
          const updatedItems = [...categoryCart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + 1,
          };
          updatedCarts[categoryCartIndex] = {
            ...categoryCart,
            items: updatedItems,
          };
        } else {
          // Add new item
          updatedCarts[categoryCartIndex] = {
            ...categoryCart,
            items: [...categoryCart.items, { ...item, quantity: 1 }],
          };
        }

        set({ carts: updatedCarts });
        return true;
      },

      // ✅ Remove item from cart. If multiple carts exist for the same category,
      // this will remove from the first matching cart unless `chefId` is provided
      // (backwards-compatible).
      removeFromCart: (categoryId, itemId, chefId?: string) => {
        const { carts } = get();
        const updatedCarts = carts
          .map((cart) => {
            if (cart.categoryId === categoryId && (chefId ? cart.chefId === chefId : true)) {
              const updatedItems = cart.items.filter(
                (item) => item.id !== itemId
              );
              return { ...cart, items: updatedItems };
            }
            return cart;
          })
          .filter((cart) => cart.items.length > 0); // Remove empty carts

        set({ carts: updatedCarts });
      },

      // ✅ Update quantity (auto-removes if quantity <= 0)
      updateQuantity: (categoryId, itemId, quantity, chefId?: string) => {
        if (quantity <= 0) {
          get().removeFromCart(categoryId, itemId, chefId);
          return;
        }

        const { carts } = get();
        const updatedCarts = carts.map((cart) => {
          if (cart.categoryId === categoryId && (chefId ? cart.chefId === chefId : true)) {
            const updatedItems = cart.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            );
            return { ...cart, items: updatedItems };
          }
          return cart;
        });

        set({ carts: updatedCarts });
      },

      // ✅ Clear carts by category and optional chefId. If chefId omitted, clears
      // all carts for the category (legacy behavior).
      clearCart: (categoryId: string, chefId?: string) => {
        const { carts } = get();
        const updatedCarts = carts.filter(
          (cart) => !(cart.categoryId === categoryId && (chefId ? cart.chefId === chefId : true))
        );
        set({ carts: updatedCarts });
      },

      // ✅ Clear all carts (for logout or full reset)
      clearAllCarts: () => {
        set({ carts: [] });
      },

      // ✅ Update special cooking instructions for a specific cart item
      updateSpecialInstructions: (categoryId: string, itemId: string, instructions: string, chefId?: string) => {
        const { carts } = get();
        const updatedCarts = carts.map((cart) => {
          if (cart.categoryId === categoryId && (chefId ? cart.chefId === chefId : true)) {
            const updatedItems = cart.items.map((item) =>
              item.id === itemId ? { ...item, specialInstructions: instructions || undefined } : item
            );
            return { ...cart, items: updatedItems };
          }
          return cart;
        });
        set({ carts: updatedCarts });
      },

      // ✅ Get total number of items
      getTotalItems: (categoryId?: string, chefId?: string) => {
        const { carts } = get();
        if (categoryId) {
          const cart = carts.find((c) => c.categoryId === categoryId && (chefId ? c.chefId === chefId : true));
          return cart
            ? cart.items.reduce((total, item) => total + item.quantity, 0)
            : 0;
        }

        return carts.reduce(
          (total, cart) =>
            total +
            cart.items.reduce((sum, item) => sum + item.quantity, 0),
          0
        );
      },

      // ✅ Get total price for one category (optionally scoped to a chef)
      getTotalPrice: (categoryId: string, chefId?: string) => {
        const { carts } = get();
        const cart = carts.find((c) => c.categoryId === categoryId && (chefId ? c.chefId === chefId : true));
        return cart
          ? cart.items.reduce((total, item) => total + item.price * item.quantity, 0)
          : 0;
      },

      // ✅ Get cart by categoryId and optional chefId (returns first match)
      getCart: (categoryId: string, chefId?: string) => {
        return get().carts.find((cart) => cart.categoryId === categoryId && (chefId ? cart.chefId === chefId : true));
      },

      // ✅ Helper to get all carts (useful for debugging or analytics)
      getAllCarts: () => {
        return get().carts;
      },

      // ✅ Get all carts with delivery fee calculation
      getAllCartsWithDelivery: () => {
        const { carts, userLatitude, userLongitude, isLocationExact, deliverySettings, chefStatuses } = get();

        return carts.map((cart) => {
          const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

          // Calculate distance and delivery fee (all dynamic from admin settings)
          let distance: number | undefined;
          let deliveryFee = 0; // Will be calculated from admin settings
          let freeDeliveryEligible = false;
          let amountForFreeDelivery: number | undefined;
          let deliveryRangeName: string | undefined;
          let minOrderAmount: number | undefined;

          if (userLatitude && userLongitude && cart.chefLatitude && cart.chefLongitude) {
            // Calculate distance using shared utility
            distance = calculateDistance(
              userLatitude,
              userLongitude,
              cart.chefLatitude,
              cart.chefLongitude
            );

            // Calculate delivery fee using shared utility with admin settings
            const deliveryCalc = calculateDelivery(distance, subtotal, deliverySettings);
            deliveryFee = deliveryCalc.deliveryFee;
            freeDeliveryEligible = deliveryCalc.freeDeliveryEligible;
            amountForFreeDelivery = deliveryCalc.amountForFreeDelivery;
            deliveryRangeName = deliveryCalc.deliveryRangeName;
            minOrderAmount = deliveryCalc.minOrderAmount;
          } else {
            // No location data available
            deliveryRangeName = "Location required for delivery fee";
          }

          // Get chef active status from Record (default to true if not found)
          const chefIsActive = cart.chefId in chefStatuses ? chefStatuses[cart.chefId] : true;

          return {
            ...cart,
            total: subtotal,
            deliveryFee,
            distance,
            freeDeliveryEligible,
            amountForFreeDelivery,
            deliveryRangeName,
            minOrderAmount,
            chefIsActive,
            isFeeFinal: isLocationExact && !!distance, // Fee is final only if location is exact and distance is calculated
          };
        });
      },
    }),
    {
      name: "cart-storage", // persistent cart in localStorage
    }
  )
);