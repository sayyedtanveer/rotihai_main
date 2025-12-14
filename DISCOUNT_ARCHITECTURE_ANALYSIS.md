# Product Discount Display Architecture

## Problem
Admin can set product discounts (offer percentage) in `AdminProducts.tsx`, but these discounts are **not visible** to users on the frontend.

## Where Discount IS Stored
- **Database**: `products.offer_percentage` field (in `shared/schema.ts`)
- **Admin Panel**: `AdminProducts.tsx` - field name: `offerPercentage`
- **Backend**: Data retrieved in API responses as `offerPercentage`

## Current User-Facing Discount Display (INCOMPLETE)

### 1. ✅ Home Page - Chef Card Level (WORKING)
**Location**: `client/src/pages/Home.tsx` (Line 728-733)
- Shows best offer badge on chef cards
- Displays like: "10% OFF" in blue badge on top-left of chef image
- Data source: Calculated from `chef.bestOfferPercentage` (max offer among all products)
- **Status**: ✅ WORKING - Users can see store-level discounts

### 2. ❌ Menu Drawer - Product Level (NOT WORKING)
**Location**: `client/src/components/CategoryMenuDrawer.tsx`
- Shows product details when user clicks a chef
- Currently displays: Product name, rating, price, description
- **Missing**: Discount badge and discounted price calculation
- **Status**: ❌ NOT SHOWING - No discount visibility at product level

### 3. ❌ Product Cards - Product Level (NOT WORKING)
**Location**: `client/src/components/ProductCard.tsx` (Line 95-120)
- Shows individual product with offer badge and discounted price
- **Currently Implemented**: Shows "X% OFF" badge and strikethrough price
- **Problem**: Not used in user menu drawer (see CategoryMenuDrawer)
- **Status**: ✅ CODE EXISTS but not used in user flow

---

## User Flow Issue

### What Currently Happens:
1. User opens app → sees home page with chefs
2. User sees best offer on chef card (e.g., "10% OFF") ✅
3. User clicks chef → opens CategoryMenuDrawer ❌
4. **BUG**: Menu shows products WITHOUT discount badges or discounted prices
5. User adds to cart with FULL price (not discounted price)

### What Should Happen:
1. User opens app → sees home page with chefs
2. User sees best offer on chef card ✅
3. User clicks chef → opens CategoryMenuDrawer
4. **SHOULD**: Menu shows each product with discount badge and discounted price ✅
5. User adds to cart with correct discounted price

---

## Architecture Diagram

```
Product Data Flow:
├─ Database (products table)
│  └─ offer_percentage: integer (default 0)
│
├─ API Response: /api/products
│  └─ product.offerPercentage
│
├─ Frontend Components:
│  ├─ Home.tsx
│  │  ├─ Reads product.offerPercentage ✅
│  │  └─ Shows on chef card (best offer) ✅
│  │
│  ├─ ProductCard.tsx
│  │  ├─ Receives offerPercentage prop ✅
│  │  ├─ Shows discount badge ✅
│  │  └─ Shows discounted price ✅
│  │
│  └─ CategoryMenuDrawer.tsx
│      ├─ Receives products array ✅
│      ├─ Has product.offerPercentage data ✅
│      ├─ Displays: Name, rating, price ✅
│      ├─ Missing: Discount badge ❌
│      └─ Missing: Discounted price ❌
│
└─ Checkout
   ├─ Should show discount applied
   └─ Should calculate final price with discount
```

---

## Code Locations & Required Fixes

### FIX #1: CategoryMenuDrawer.tsx - Add Discount Display

**File**: `client/src/components/CategoryMenuDrawer.tsx`

**What to Add** (around line 185):
```tsx
// In the product display section (after price display)
{product.offerPercentage > 0 && (
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
      {product.offerPercentage}% OFF
    </span>
    <span className="text-sm text-muted-foreground line-through">
      ₹{product.price}
    </span>
    <span className="text-lg font-bold text-green-600">
      ₹{Math.round(product.price * (1 - product.offerPercentage / 100))}
    </span>
  </div>
)}

{product.offerPercentage === 0 && (
  <span className="text-lg font-bold">₹{product.price}</span>
)}
```

**Location**: Replace the single price display line (around line 185 in the product details)

---

### FIX #2: CategoryMenuDrawer.tsx - Update Add to Cart Price

**File**: `client/src/components/CategoryMenuDrawer.tsx`

**Current Issue**:
- When user adds product to cart, it uses `product.price` (full price)
- Should use discounted price if offer exists

**Code Change Needed**:
In `handleQuantityChange` function, calculate discounted price:
```tsx
const calculateProductPrice = (product: Product) => {
  if (product.offerPercentage && product.offerPercentage > 0) {
    return Math.round(product.price * (1 - product.offerPercentage / 100));
  }
  return product.price;
};
```

---

### FIX #3: Home.tsx - Ensure Products Pass offerPercentage

**File**: `client/src/pages/Home.tsx`

**Check**: Line 127 where cartItem is created
```tsx
const cartItem = {
  id: product.id,
  name: product.name,
  price: product.price, // Should this be discounted price?
  image: product.image,
  chefId: product.chefId || undefined,
  chefName: selectedChefForMenu?.name || chef?.name || undefined,
  categoryId: product.categoryId,
  // Missing: offerPercentage for checkout calculation
};
```

**Should Include**:
```tsx
const discountedPrice = product.offerPercentage && product.offerPercentage > 0
  ? Math.round(product.price * (1 - product.offerPercentage / 100))
  : product.price;

const cartItem = {
  id: product.id,
  name: product.name,
  price: discountedPrice, // Use discounted price
  originalPrice: product.price, // Keep original for reference
  offerPercentage: product.offerPercentage || 0, // Include for display
  image: product.image,
  chefId: product.chefId || undefined,
  chefName: selectedChefForMenu?.name || chef?.name || undefined,
  categoryId: product.categoryId,
};
```

---

### FIX #4: CheckoutDialog.tsx - Show Discount in Summary

**File**: `client/src/components/CheckoutDialog.tsx`

**Current**: Shows items with their prices
**Should Add**: Discount breakdown showing:
- Original price per item
- Discount amount per item
- Final discounted price

**Example Display**:
```
Item: Plain Roti
- Original: ₹40
- Discount: -₹4 (10%)
- Final: ₹36
```

---

## Affected User Flows

### 1. Home Page (PARTIAL - Chef level only)
- ✅ Shows best offer on chef card
- ❌ Doesn't link to individual product discounts

### 2. Menu Drawer (BROKEN)
- ❌ No discount display
- ❌ No discounted price calculation
- ❌ Adds items at full price to cart

### 3. Checkout (INCOMPLETE)
- ⚠️ May not properly reflect discounted prices
- ⚠️ Discount summary may be missing

### 4. Cart Sidebar (UNKNOWN)
- Needs verification if discounts are shown

### 5. Order Confirmation (UNKNOWN)
- Needs verification if original + discounted prices shown

---

## Summary of Required Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| CategoryMenuDrawer | No discount display | Add discount badge + discounted price |
| CategoryMenuDrawer | Wrong price to cart | Use discounted price when adding |
| Home.tsx | Missing offerPercentage in cart item | Include offerPercentage in cartItem object |
| CheckoutDialog | No discount summary | Add discount breakdown in order summary |
| ProductCard | Exists but unused | Ensure consistency with MenuDrawer |

---

## Data Flow for Corrected System

```
Admin Sets Discount:
AdminProducts.tsx → API → products.offer_percentage = 10

User Sees Discount:
Product Card (Home) → Shows "10% OFF" badge ✅
Product in Menu → Shows "10% OFF" + discounted price ❌ (FIX NEEDED)

User Adds to Cart:
Cart Item Price = Original Price × (1 - discount% / 100) ❌ (FIX NEEDED)

User Sees in Checkout:
Discount Line Item = Original Price - Discounted Price ❌ (FIX NEEDED)

Order Created:
- Original price stored
- Applied discount amount stored
- Final price stored
```

---

## Implementation Priority

1. **HIGH**: CategoryMenuDrawer - Add discount display & use discounted price
2. **MEDIUM**: Home.tsx - Include offerPercentage in cart item
3. **MEDIUM**: CheckoutDialog - Show discount breakdown
4. **LOW**: Cart Sidebar - Verify discount display consistency

---

## Testing Checklist

After fixes applied, verify:
- [ ] Admin sets 10% discount on a product
- [ ] User sees "10% OFF" badge in menu drawer
- [ ] User sees strikethrough original price in menu drawer
- [ ] User sees discounted price in menu drawer
- [ ] User adds item to cart
- [ ] Cart shows discounted price
- [ ] Checkout shows discount line item
- [ ] Final total is correctly calculated with discount
- [ ] Order confirmation shows both original and discounted prices
