import { X, Star, Plus, Minus, Leaf, BadgeCheck, ChevronDown, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Category, Product } from "@shared/schema";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { getImageUrl, handleImageError } from "@/lib/imageUrl";
import { groupProductsBySection } from "@/utils/productGrouping";
import { useState, useRef } from "react";

interface CategoryMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  chef: { id: string; name: string; isActive?: boolean } | null; // Added isActive for chef status
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (categoryId: string, itemId: string, quantity: number) => void;
  cartItems?: { id: string; quantity: number; price: number }[];
  autoCloseOnAdd?: boolean;
  onProceedToCart?: () => void;
}

export default function CategoryMenuDrawer({
  isOpen,
  onClose,
  category,
  chef,
  products,
  onAddToCart,
  onUpdateQuantity,
  cartItems = [],
  autoCloseOnAdd = false,
  onProceedToCart,
}: CategoryMenuDrawerProps) {
  const { productAvailability, chefStatuses } = useCustomerNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showSectionNav, setShowSectionNav] = useState(false);
  const sectionRefsMap = useRef<Record<string, HTMLDivElement | null>>({});

  if (!isOpen || !category || !chef) return null;

  // Use realtime chef status from WebSocket, fallback to chef prop
  const realtimeChefStatus = chefStatuses[chef.id];
  const isChefClosed = realtimeChefStatus !== undefined ? !realtimeChefStatus : (chef.isActive === false);

  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id && p.chefId === chef.id
  );

  const avgRating = categoryProducts.length > 0
    ? (categoryProducts.reduce((sum, p) => sum + parseFloat(p.rating), 0) / categoryProducts.length).toFixed(1)
    : "0.0";
  const totalReviews = categoryProducts.reduce((sum, p) => sum + p.reviewCount, 0);

  const getProductQuantity = (productId: string) => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem?.quantity || 0;
  };

  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const filteredProducts = categoryProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSections = groupProductsBySection(filteredProducts);

  // Auto-expand first section on first render
  if (Object.keys(openSections).length === 0 && groupedSections.length > 0) {
    setOpenSections({ [groupedSections[0].section]: true });
  }

  // Calculate total items and total price for the "Proceed to Cart" button
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Helper: Scroll to section smoothly
  const scrollToSection = (sectionName: string) => {
    const sectionRef = sectionRefsMap.current[sectionName];
    if (sectionRef) {
      sectionRef.scrollIntoView({ behavior: "smooth", block: "start" });
      // Expand the section if collapsed
      setOpenSections(prev => ({ ...prev, [sectionName]: true }));
      // Close the navigation modal
      setShowSectionNav(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        data-testid="category-menu-backdrop"
      />

      <div
        className="fixed top-0 left-0 h-full w-full sm:w-[500px] bg-background z-50 shadow-lg transform transition-transform duration-300 ease-in-out"
        data-testid="category-menu-drawer"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-semibold text-lg">{chef.name}</h3>
                {(chef as any).isVerified && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0 shrink-0">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified by Roti Hai
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-category-menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{category.name}</p>
          </div>

          {isChefClosed && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 mx-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                ⚠️ Currently Closed
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                {chef.name} is not accepting orders right now. You can browse the menu but cannot place orders.
              </p>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-4 border-b bg-muted/30" data-testid={`header-${category.id}`}>
              <div className="flex items-start gap-3">
                <img
                  src={getImageUrl(category.image)}
                  alt={category.name}
                  className="w-16 h-16 rounded-lg object-cover"
                  data-testid={`img-category-${category.id}`}
                  onError={handleImageError}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" data-testid={`text-category-name-${category.id}`}>
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2" data-testid={`text-category-description-${category.id}`}>
                    {category.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold" data-testid={`text-category-rating-${category.id}`}>
                        {avgRating}
                      </span>
                      <span className="text-muted-foreground" data-testid={`text-category-reviews-${category.id}`}>
                        ({totalReviews} reviews)
                      </span>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-item-count-${category.id}`}>
                      {category.itemCount}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div className="sticky top-0 bg-background z-10 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    data-testid="search-products-input"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8" data-testid="text-no-products">
    {searchQuery ? "No items match your search" : "No items available in this category"}
                 </p>
              ) : (
                   groupedSections.map((group) => {
                      return (
                        <div
                          key={group.section}
                          className="space-y-2"
                          ref={(el) => {
                            if (el) sectionRefsMap.current[group.section] = el;
                          }}
                        >
                          <button
                            onClick={() => toggleSection(group.section)}
                            className="sticky top-16 w-full flex items-center justify-between px-1 py-2 bg-background z-20"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={`h-5 w-5 ${
                                  openSections[group.section] ? "rotate-180" : ""
                                }`}
                              />
                              <h4 className="font-bold">{group.section}</h4>
                              <Badge variant="secondary">{group.products.length}</Badge>
                            </div>
                          </button>

                          {openSections[group.section] && (
                            <div className="space-y-3 pl-2">
                              {group.products.map((product) => (
                                <div key={product.id} className="border rounded-lg p-4">
                                  <h3 className="font-semibold">{product.name}</h3>
                                  <p>₹{product.price}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
            </div>
          </ScrollArea>

          {/* Proceed to Cart Button */}
          <div className="p-4 border-t">
            {totalItems > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
                  </span>
                  <span className="font-semibold text-primary">
                    ₹{totalPrice}
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    onClose();
                    onProceedToCart?.(); // <-- optional chaining
                  }}
                  disabled={isChefClosed}
                  data-testid="button-proceed-to-cart"
                >
                  {isChefClosed ? "Chef is Currently Closed" : "Proceed to Cart"}
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Add items to cart to proceed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Section Navigation Button */}
      {categoryProducts.length > 0 && (
        <>
          <Button
            size="icon"
            className="fixed bottom-24 right-6 rounded-full shadow-lg z-40 h-12 w-12"
            onClick={() => setShowSectionNav(true)}
            data-testid="button-section-nav"
            title="Jump to section"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Section Navigation Modal */}
          {showSectionNav && (
            <div className="fixed inset-0 bg-black/50 z-50 sm:hidden flex items-end">
              <div className="bg-background w-full rounded-t-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Jump to Section</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSectionNav(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4 space-y-2">
                  {groupedSections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No sections available</p>
                  ) : (
                    groupedSections.map((section) => (
                      <button
                        key={section.section}
                        onClick={() => scrollToSection(section.section)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-medium text-foreground">{section.section}</p>
                          <p className="text-sm text-muted-foreground">{section.products.length} items</p>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}