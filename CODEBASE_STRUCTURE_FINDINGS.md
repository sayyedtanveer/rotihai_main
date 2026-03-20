# Roti Hai Codebase Structure - Comprehensive Findings

**Date:** March 20, 2026
**Project:** Replitrotihai (Food Delivery Platform)

---

## Table of Contents
1. [Chef/Partner Model](#1-chefpartner-model)
2. [Category System](#2-category-system)
3. [Menu System](#3-menu-system)
4. [Order Flow](#4-order-flow)
5. [UI Components](#5-ui-components)
6. [Delivery Logic](#6-delivery-logic)
7. [APIs](#7-apis)

---

## 1. Chef/Partner Model

### Database Schema Definition
**File:** [shared/schema.ts](shared/schema.ts#L72-L106)

#### Chef Table Structure
```typescript
export const chefs = pgTable("chefs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  description: text("description").notNull(),
  image: text("image").notNull(),
  rating: text("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  categoryId: text("category_id").notNull(),
  
  // Physical address components
  address: text("address"),
  addressBuilding: text("address_building"),
  addressStreet: text("address_street"),
  addressArea: text("address_area"),  // ← KEY: Area filtering
  addressCity: text("address_city"),
  addressPincode: text("address_pincode"),
  
  // Location coordinates
  latitude: real("latitude").notNull().default(19.0728),
  longitude: real("longitude").notNull().default(72.8826),
  
  // Status & activation
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  
  // Delivery configuration
  defaultDeliveryFee: integer("default_delivery_fee").notNull().default(20),
  deliveryFeePerKm: integer("delivery_fee_per_km").notNull().default(5),
  freeDeliveryThreshold: integer("free_delivery_threshold").notNull().default(200),
  maxDeliveryDistanceKm: integer("max_delivery_distance_km").notNull().default(5),
  
  // Service area pincode list
  servicePincodes: text("service_pincodes").array(),
})
```

#### Key Chef Properties
- **ID:** Text primary key (nanoid format)
- **Category:** Linked to `categories` table via `categoryId`
- **Rating & Reviews:** Text rating + review count
- **Service Area:** Can be defined by:
  - `addressArea` string (e.g., "Kurla West")
  - `servicePincodes` array (e.g., ["400070", "400025"])
  - Coordinates with max delivery radius

#### Partner User Relationship
**File:** [shared/schema.ts](shared/schema.ts#L46-L52)

```typescript
export const partnerUsers = pgTable("partner_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chefId: text("chef_id").notNull().unique(),  // ← One-to-one with chef
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  profilePictureUrl: text("profile_picture_url"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

**Relationship:** One `partnerUser` → One `chef` (authentication layer for chef)

### Storage & Database Queries
**File:** [server/storage.ts](server/storage.ts#L40-L42)

#### Core Chef Methods
```typescript
// Interface definitions (from IStorage)
getChefs(): Promise<Chef[]>                          // Get all chefs
getChefById(id: string): Promise<Chef | null>        // Get single chef
getChefsByCategory(categoryId: string): Promise<Chef[]> // Get chefs in category
createChef(data: Omit<Chef, "id">): Promise<Chef>    // Create new chef
updateChef(id: string, data: Partial<Chef>): Promise<Chef | undefined>  // Update chef
deleteChef(id: string): Promise<boolean>             // Delete chef
```

#### Chef Load Balancing (for Subscriptions)
```typescript
getActiveSubscriptionCountByChef(chefId: string): Promise<number>
findBestChefForCategory(categoryId: string): Promise<Chef | null>
getActiveSubscriptionsByChef(chefId: string): Promise<Subscription[]>
assignChefToSubscription(subscriptionId: string, chefId: string): Promise<Subscription | undefined>
```

### Partner Routes
**File:** [server/partnerRoutes.ts](server/partnerRoutes.ts)

- Login endpoint: `POST /api/partner/login`
- Dashboard metrics: `GET /api/partner/dashboard`
- Orders by chef: Retrieved via `storage.getOrdersByChefId(chefId)`
- Order approval workflow available

---

## 2. Category System

### Database Schema
**File:** [shared/schema.ts](shared/schema.ts#L55-L66)

```typescript
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  iconName: text("icon_name").notNull(),  // Icon identifier like "UtensilsCrossed", "ChefHat"
  itemCount: text("item_count").notNull(),
  requiresDeliverySlot: boolean("requires_delivery_slot").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(999),
})
```

#### Special Category: "Ghar Ka Khana" (Roti)
**File:** [server/routes.ts - line range where roti is handled]

- **Name:** "Ghar Ka Khana" or "Roti"
- **Key Property:** `requiresDeliverySlot: true`
- **Delivery Requirement:** Must select delivery time slot (e.g., 8:00 AM, 9:00 AM, 10:00 AM)
- **Cutoff Logic:** Different cutoff hours based on delivery time:
  - Morning slots (8-11 AM): Must book previous day by 11 PM
  - Other slots: Different cutoff rules

**Example Detection:**
```typescript
const isRotiCategory = sanitized.categoryName?.toLowerCase() === 'roti' ||
  sanitized.categoryName?.toLowerCase().includes('roti');
```

### Category-Chef Relationship
- Chef has `categoryId` field pointing to exactly one category
- Multiple chefs CAN serve the same category
- Categories filter available chefs in UI

### Storage Methods
```typescript
getAllCategories(): Promise<Category[]>              // All categories (sorted by displayOrder)
getCategoryById(id: string): Promise<Category | undefined>
createCategory(category: InsertCategory): Promise<Category>
updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>
deleteCategory(id: string): Promise<boolean>
reorderCategories(items: { id: string; displayOrder: number }[]): Promise<void>
```

---

## 3. Menu System

### Products Table
**File:** [shared/schema.ts](shared/schema.ts#L113-L142)

```typescript
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Pricing
  hotelPrice: integer("hotel_price").notNull().default(0),  // Cost from supplier
  price: integer("price").notNull(),                        // RotiHai selling price
  offerPercentage: integer("offer_percentage").notNull().default(0),
  marginPercent: decimal("margin_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Media
  image: text("image").notNull(),
  
  // Reviews
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
  reviewCount: integer("review_count").notNull().default(0),
  
  // Classification
  isVeg: boolean("is_veg").notNull().default(true),
  isCustomizable: boolean("is_customizable").notNull().default(false),
  
  // Inventory
  stockQuantity: integer("stock_quantity").notNull().default(100),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(20),
  isAvailable: boolean("is_available").notNull().default(true),
  
  // Relationships
  categoryId: varchar("category_id").notNull(),      // Which category (Roti, Lunch, etc)
  chefId: text("chef_id"),                          // Which chef produces this
})
```

#### Menu-Chef-Category Relationship
```
Category → Chef → Products
  ↓        ↓        ↓
Roti    Chef1    Butter Roti
Lunch   Chef2    Dal-Chawal
              Paneer Butter Masala
```

### Product Queries
```typescript
getAllProducts(): Promise<Product[]>
getProductById(id: string): Promise<Product | undefined>
getProductsByCategoryId(categoryId: string): Promise<Product[]>  // Products in category
createProduct(product: InsertProduct): Promise<Product>
updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>
deleteProduct(id: string): Promise<boolean>
```

### Menu Drawer Component
**File:** [client/src/components/CategoryMenuDrawer.tsx](client/src/components/CategoryMenuDrawer.tsx)

**Purpose:** Shows menu (products) for selected chef in a category

**Props:**
```typescript
interface CategoryMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  chef: { id: string; name: string; isActive?: boolean } | null;  // Selected chef
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (categoryId: string, itemId: string, quantity: number) => void;
  cartItems?: { id: string; quantity: number; price: number }[];
  autoCloseOnAdd?: boolean;
  onProceedToCart?: () => void;
}
```

**Features:**
- Filters products by `categoryId === category.id` AND `chefId === chef.id`
- Shows average rating and total reviews for category
- Displays product cards with quantity controls
- Handles real-time chef status via WebSocket
- Shows "Verified by Roti Hai" badge if chef is verified

---

## 4. Order Flow

### Order Creation Workflow

```
Customer selects Category
     ↓
Customer selects Chef from ChefListDrawer
     ↓
Customer browses Menu from CategoryMenuDrawer
     ↓
Customer adds items to Cart (zustand store)
     ↓
Customer opens Checkout (CheckoutDialog)
     ↓
Customer enters Address & confirms delivery location
     ↓
Customer reviews Order with final delivery fee
     ↓
POST /api/orders → Server validates & creates order
     ↓
Server shows Payment QR (UPI/phone payment)
     ↓
Customer pays or confirms
     ↓
Admin approves/rejects → Chef prepares
     ↓
Delivery person assigned & delivers
```

### Orders Table
**File:** [shared/schema.ts](shared/schema.ts#L144-L190)

```typescript
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Customer info
  userId: varchar("user_id"),         // Reference to customer
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  
  // Delivery address (both full string and structured)
  address: text("address").notNull(),
  addressBuilding: text("address_building"),
  addressStreet: text("address_street"),
  addressArea: text("address_area"),
  addressCity: text("address_city"),
  addressPincode: text("address_pincode"),
  
  // Items in order
  items: jsonb("items").notNull(),    // Array of {id, name, price, quantity, chefId, ...}
  
  // Pricing
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  discount: integer("discount").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 50 }),
  walletAmountUsed: integer("wallet_amount_used").notNull().default(0),
  total: integer("total").notNull(),
  
  // Payment
  status: text("status").notNull().default("pending"),           // pending, confirmed, preparing, delivered, etc
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),  // pending, paid, confirmed
  paymentQrShown: boolean("payment_qr_shown").notNull().default(false),
  
  // Chef assignment
  chefId: text("chef_id"),           // Which chef makes the order
  chefName: text("chef_name"),
  
  // Category info (especially for Roti validation)
  categoryId: varchar("category_id"),
  categoryName: text("category_name"),
  
  // Roti-specific: delivery time slot
  deliveryTime: text("delivery_time"),      // HH:mm format (e.g., "08:00")
  deliveryDate: text("delivery_date"),      // YYYY-MM-DD format
  deliverySlotId: varchar("delivery_slot_id"),  // Reference to time slot
  
  // Approval workflow
  approvedBy: text("approved_by"),          // Admin ID who approved
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at"),
  
  // Delivery assignment
  assignedTo: text("assigned_to"),          // Delivery person ID
  deliveryPersonName: text("delivery_person_name"),
  deliveryPersonPhone: text("delivery_person_phone"),
  assignedAt: timestamp("assigned_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
})
```

### Order Creation API
**File:** [server/routes.ts](server/routes.ts#L1483)

#### Endpoint: `POST /api/orders`

**Request Body:**
```typescript
{
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  addressBuilding?: string;
  addressStreet?: string;
  addressArea?: string;
  addressCity?: string;
  addressPincode?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    categoryId?: string;
    chefId?: string;
    specialInstructions?: string;  // Cooking instructions
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  chefId: string;           // ← Selected chef
  categoryId?: string;
  categoryName?: string;
  deliveryTime?: string;    // For Roti orders
  deliverySlotId?: string;
  paymentStatus?: string;
  userId?: string;
  couponCode?: string;
  discount?: number;
  walletAmountUsed?: number;
  
  // CRITICAL: Delivery location coordinates
  customerLatitude: number;
  customerLongitude: number;
}
```

**Validations on Server:**
1. **Delivery Address Validation**
   - Coordinates required (customerLatitude, customerLongitude)
   - Calculated distance from chef to address must be ≤ `chef.maxDeliveryDistanceKm`
   - Address coordinates + pincode checked against chef's servicePincodes

2. **Roti Category Specific:**
   - If `categoryName` includes "roti", deliveryTime and deliverySlotId required
   - Delivery time must be valid slot within operating hours

3. **Delivery Fee Recalculation**
   - Server IGNORES client-supplied deliveryFee
   - Recalculates using `calculateDelivery()` from admin settings
   - Applies free delivery if conditions met

4. **Address Validation:**
   - External API call to validate address
   - Checks if address in serviceable area

### Order Storage Methods
```typescript
createOrder(order: InsertOrder): Promise<Order>
getOrderById(id: string): Promise<Order | undefined>
getOrdersByUserId(userId: string): Promise<Order[]>
getOrdersByChefId(chefId: string): Promise<Order[]>
getAllOrders(): Promise<Order[]>
updateOrderStatus(id: string, status: string): Promise<Order | undefined>
updateOrderPaymentStatus(id: string, paymentStatus: "pending" | "paid" | "confirmed"): Promise<Order | undefined>
approveOrder(orderId: string, approvedBy: string): Promise<Order | undefined>
rejectOrder(orderId: string, rejectedBy: string, reason: string): Promise<Order | undefined>
assignOrderToDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined>
```

### Order Workflow States
```
pending → approved → preparing → out_for_delivery → delivered
   ↓
rejected (can be rejected at pending stage)
```

---

## 5. UI Components

### Home Page
**File:** [client/src/pages/Home.tsx](client/src/pages/Home.tsx#L1)

**Main Features:**
1. Hero banner with location detection
2. Category browsing section
3. Product grid (filtered by selected chef)
4. Cart sidebar (collapsible)
5. Multiple drawer modals

**Key State Management:**
```typescript
const [selectedCategoryForChefList, setSelectedCategoryForChefList] = useState<Category | null>(null);
const [selectedChefForMenu, setSelectedChefForMenu] = useState<Chef | null>(null);
const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState<Category | null>(null);

// Cart management via useCart() hook
const { carts, addToCart, updateQuantity, removeFromCart, clearCart, getTotalItems } = useCart();
```

### Chef Selection Components

#### 1. ChefListDrawer Component
**File:** [client/src/components/ChefListDrawer.tsx](client/src/components/ChefListDrawer.tsx)

**Purpose:** Show list of chefs for selected category

**Props:**
```typescript
interface ChefListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  chefs: FrontendChef[];
  onChefClick: (chef: FrontendChef) => void;
}
```

**Features:**
- Filters `chefs` by `category.id`
- Shows chef image, name, rating, review count
- Shows "Verified by Roti Hai" badge (blue badge)
- Shows "Inactive" state (greyed out)
- Triggers `CategoryMenuDrawer` on chef click

**Rendering:**
```typescript
const categoryChefs = chefs.filter((chef) => chef.categoryId === category.id);

categoryChefs.map((chef) => (
  <div onClick={() => onChefClick(chef)}>
    <img src={chef.image} />
    <h3>{chef.name}</h3>
    {chef.isVerified && <Badge>Verified by Roti Hai</Badge>}
    <div>{chef.rating} ⭐ ({chef.reviewCount} reviews)</div>
  </div>
))
```

#### 2. CategoryMenuDrawer Component
**File:** [client/src/components/CategoryMenuDrawer.tsx](client/src/components/CategoryMenuDrawer.tsx)

**Purpose:** Show menu items from selected chef

**Props:** (see section 3 above)

**Integration:**
```typescript
// In Home.tsx
const categoryProducts = products.filter(p => 
  p.categoryId === selectedCategoryForMenu?.id && 
  p.chefId === selectedChefForMenu?.id
);

<CategoryMenuDrawer
  category={selectedCategoryForMenu}
  chef={selectedChefForMenu}
  products={categoryProducts}
  onAddToCart={handleAddToCart}
  cartItems={cartItems}
/>
```

#### 3. MenuDrawer Component
**File:** [client/src/components/MenuDrawer.tsx](client/src/components/MenuDrawer.tsx)

**Purpose:** Main navigation drawer (hamburger menu)

**Features:**
- Category tabs (All, Subscriptions, etc)
- Subscription management
- Mobile navigation

### Cart Components

#### CartSidebar Component
**File:** [client/src/components/CartSidebar.tsx](client/src/components/CartSidebar.tsx)

**Purpose:** Side panel showing current cart items

**Features:**
- Shows items from selected chef/category
- Quantity controls (+/-)
- Item pricing with margins
- Subtotal display
- "Proceed to Checkout" button
- Handles cart persistence via zustand

#### CheckoutDialog Component
**File:** [client/src/components/CheckoutDialog.tsx](client/src/components/CheckoutDialog.tsx)

**Purpose:** Complete order creation form (modal)

**Sections:**
1. **Customer Information Tab**
   - Name, phone, email

2. **Address Tab**
   - Structured address input (building, street, area, city, pincode)
   - Address validation with map preview
   - Delivery fee calculation based on address

3. **Payment Tab**
   - Coupon code application
   - Referral code validation
   - Wallet balance deduction
   - Final payment amount

4. **Review Tab**
   - Order summary
   - Item list with prices
   - Delivery fee breakdown
   - Payment QR display

**Address Validation:**
```typescript
// When address confirmed:
const response = await api.post('/api/validate-pincode', {
  pincode, latitude, longitude, chefId
});
// Server validates against chef's servicePincodes
```

---

## 6. Delivery Logic

### Delivery Fee Calculation
**File:** [shared/deliveryUtils.ts](shared/deliveryUtils.ts)

**Key Function:** `calculateDelivery()`

```typescript
function calculateDelivery(
  distance: number,              // km from chef to customer
  orderAmount: number,           // Order subtotal in ₹
  deliverySettings: DeliverySetting[]
): {
  deliveryFee: number;
  freeDeliveryEligible: boolean;
  minOrderAmount: number;
  deliveryRangeName: string;
}
```

**Distance-based calculation:**
1. Match distance to delivery settings range
2. Return fee for that range
3. Check if free delivery eligible

### Delivery Settings
**File:** [shared/schema.ts](shared/schema.ts#L191-L201)

```typescript
export const deliverySettings = pgTable("delivery_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),                          // e.g., "0-2 km", "2-5 km"
  minDistance: decimal("min_distance", { precision: 5, scale: 2 }).notNull(),  // 0
  maxDistance: decimal("max_distance", { precision: 5, scale: 2 }).notNull(),  // 2
  price: integer("price").notNull(),                     // Fee in ₹
  minOrderAmount: integer("min_order_amount").default(0), // Free delivery above this
  pincode: varchar("pincode", { length: 6 }),          // Optional: specific pincode
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

**Example Delivery Settings:**
```
0-2 km:   ₹40
2-5 km:   ₹60
5-7 km:   ₹100
Free if order > ₹200
```

### Delivery Zones & Areas
**File:** [shared/schema.ts] - `deliveryAreas` table

Areas include:
- Kurla West
- Kurla East
- Worli
- Bandra
- Andheri
- Dadar

### Distance Calculation
**File:** [shared/deliveryUtils.ts]

**Function:** `calculateDistance(lat1, lon1, lat2, lon2)`

Uses **Haversine formula** to calculate great-circle distance:
```
distance = R × 2 × atan2(√a, √(1-a))
where a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
```

### Delivery Address Validation
**File:** [server/routes.ts](server/routes.ts#L1483) - POST /api/orders

**Validation Steps:**

1. **Coordinate Check:**
   ```typescript
   if (customerLatitude === undefined || customerLongitude === undefined) {
     return res.status(400).json({
       message: "Delivery address coordinates required",
       requiresAddressValidation: true,
     });
   }
   ```

2. **Distance Check:**
   ```typescript
   const addressDistance = calculateDistance(
     chefLat, chefLon,
     customerLatitude, customerLongitude
   );
   
   if (addressDistance > maxDeliveryDistance) {
     return res.status(400).json({
       message: `Delivery not available. This address is ${addressDistance.toFixed(1)}km away.`,
       outsideDeliveryZone: true,
     });
   }
   ```

3. **Pincode Check:**
   ```typescript
   if (chef.servicePincodes?.includes(customerPincode)) {
     // Valid
   } else {
     return res.status(400).json({
       message: `${chef.name} does not deliver to pincode ${customerPincode}`,
       pincodeNotInServiceArea: true,
     });
   }
   ```

---

## 7. APIs

### Public APIs (Customer-facing)

#### Categories API
**Endpoint:** `GET /api/categories`

**Response:**
```json
[
  {
    "id": "cat-roti",
    "name": "Ghar Ka Khana",
    "description": "Home-cooked rotis and curries",
    "image": "https://...",
    "iconName": "UtensilsCrossed",
    "itemCount": "45",
    "requiresDeliverySlot": true,
    "displayOrder": 1
  },
  {
    "id": "cat-lunch",
    "name": "Lunch & Dinner",
    "description": "Ready-to-eat meals",
    "image": "https://...",
    "iconName": "Hotel",
    "itemCount": "120",
    "requiresDeliverySlot": false,
    "displayOrder": 2
  }
]
```

**File:** [server/routes.ts](server/routes.ts#L1439)

#### Chefs API
**Endpoint:** `GET /api/chefs`

**Response:**
```json
[
  {
    "id": "chef-001",
    "name": "Mama's Kitchen",
    "phone": "9876543210",
    "description": "Authentic home-cooked rotis",
    "image": "https://...",
    "rating": "4.8",
    "reviewCount": 245,
    "categoryId": "cat-roti",
    "address": "123 MG Road, Kurla West",
    "addressArea": "Kurla West",
    "addressPincode": "400070",
    "latitude": 19.0728,
    "longitude": 72.8826,
    "isActive": true,
    "isVerified": true,
    "maxDeliveryDistanceKm": 5,
    "servicePincodes": ["400070", "400086", "400025"]
  }
]
```

**File:** [server/routes.ts](server/routes.ts#L2325)

#### Chefs by Area API
**Endpoint:** `GET /api/chefs/by-area/:areaName`

**Parameters:**
- `areaName` (string): e.g., "Kurla West"

**Response:** Array of chefs filtered by `addressArea`

**File:** [server/routes.ts](server/routes.ts#L2335)

**Logic:**
```typescript
const filteredChefs = allChefs.filter(chef => {
  const chefArea = chef.addressArea;
  if (!chefArea) return true;  // No restriction = serves everywhere
  return chefArea.toLowerCase().trim() === areaName.toLowerCase().trim();
});
```

#### Chefs by Location API
**Endpoint:** `GET /api/chefs/by-location`

**Query Parameters:**
- `latitude` (number)
- `longitude` (number)
- `maxDistance` (number, default: 15 km)

**Response:** Array of chefs sorted by distance from user location

**File:** [server/routes.ts](server/routes.ts#L2383)

**Algorithm:**
1. Calculate distance to each chef using Haversine formula
2. Filter chefs within `maxDistance`
3. Filter chefs with `isActive === true`
4. Filter chefs within their `maxDeliveryDistanceKm`
5. Sort by `distanceFromUser` ascending
6. Return with `distanceFromUser` property

#### Chefs by Pincode API
**Endpoint:** `GET /api/chefs/by-pincode/:pincode`

**Parameters:**
- `pincode` (string): 5-6 digit pincode

**Response:** Chefs whose `servicePincodes` includes this pincode

**File:** [server/routes.ts](server/routes.ts#L2455)

#### Specific Chef API
**Endpoint:** `GET /api/chefs/:chefId`

**Response:** Single chef object

**File:** [server/routes.ts](server/routes.ts#L2612)

#### Products API
**Endpoint:** `GET /api/products`

**Query Parameters (optional):**
- `categoryId` (filter by category)
- `chefId` (filter by chef)

**Response:** Array of products

**File:** [server/routes.ts](server/routes.ts#L1450)

#### Specific Product API
**Endpoint:** `GET /api/products/:id`

**Response:** Single product object

**File:** [server/routes.ts](server/routes.ts#L1468)

#### Orders API

##### Create Order
**Endpoint:** `POST /api/orders`

**Request/Response:** (see section 4 above)

**File:** [server/routes.ts](server/routes.ts#L1483)

**Key Validations:**
- Delivery address coordinates required
- Address distance ≤ chef's max delivery distance
- Pincode validation (if configured)
- Delivery fee recalculated server-side
- Roti category requires delivery slot

##### Get Orders
**Endpoint:** `GET /api/orders`

**Response:** Array of orders for authenticated user

**File:** [server/routes.ts](server/routes.ts#L2072)

##### Get Specific Order
**Endpoint:** `GET /api/orders/:id`

**Response:** Single order object

**File:** [server/routes.ts](server/routes.ts#L2124)

##### Payment Confirmation
**Endpoint:** `POST /api/orders/:id/payment-confirmed`

**Purpose:** Mark order as paid after UPI confirmation

**File:** [server/routes.ts](server/routes.ts#L2144)

### Admin APIs

#### Approve Order
**File:** [server/adminRoutes.ts](server/adminRoutes.ts)

**Endpoint:** `POST /api/admin/orders/:orderId/approve`

**Functionality:**
- Admin approves pending order
- Validates Roti orders have delivery slot
- Broadcasts approval to partner (chef)
- Updates order status to "approved"

#### Reject Order
**Endpoint:** `POST /api/admin/orders/:orderId/reject`

**Parameters:**
```json
{
  "reason": "Out of stock",
  "items": []  // Optional: which items to reject
}
```

#### Create Delivery Slots
**Endpoint:** `POST /api/admin/delivery-slots`

**Body:**
```json
{
  "name": "8:00 AM",
  "startTime": "08:00",
  "endTime": "08:30",
  "capacity": 50,
  "isActive": true
}
```

**File:** [server/adminRoutes.ts](server/adminRoutes.ts#L48)

---

## Data Flow Diagram

```
USER HOME PAGE
  ↓
Fetches /api/categories (or GET /api/chefs/by-location)
  ↓
Displays categories + receives chefs list
  ↓
User clicks category → Shows ChefListDrawer
  ↓
Displays filtered chefs (via /api/chefs or /api/chefs/by-area)
  ↓
User clicks chef → Shows CategoryMenuDrawer
  ↓
Displays products (filters local to client)
  ↓
User adds items → Stored in context (useCart hook)
  ↓
User clicks checkout → CheckoutDialog opens
  ↓
User enters address → Validates via /api/validate-pincode
  ↓
Server calculates delivery fee
  ↓
User submits → POST /api/orders
  ↓
Server validates:
  - Coordinates
  - Distance from chef
  - Pincode in servicePincodes
  - Delivery fee
  ↓
Creates order record (status: pending)
  ↓
Returns payment QR code
  ↓
User pays via UPI
  ↓
POST /api/orders/:id/payment-confirmed
  ↓
Admin reviews & approves/rejects
  ↓
Partner (chef) sees in dashboard
  ↓
Delivery person assigned & delivers
```

---

## Key Technologies & Patterns

### Data Fetching
- **TanStack React Query** for server state
- **Zustand** for client state (cart)
- **WebSocket** for real-time updates (chef status, product availability)

### Database
- **PostgreSQL** with Drizzle ORM
- **ISO string timestamps** for date fields
- **JSONB** for nested data (order items, subscription delivery logs)

### Validation
- **Zod schemas** for type-safe validation
- Server-side re-validation of fees & delivery
- Address/pincode validation via API

### Real-time
- WebSocket for:
  - Chef status (online/offline)
  - Product availability
  - Order updates
  - Subscription deliveries
  - Payment confirmations

---

## Important Notes

1. **Chef Selection:** One chef per category per cart. Cannot mix items from different chefs in same category.

2. **Delivery Fee:** Always recalculated on server. Client-supplied values ignored for security.

3. **Address Validation:** Critical for order placement. Must have valid coordinates within service zone.

4. **Roti Category:** Special handling with delivery time slots and cutoff times.

5. **Pincode System:** Optional but recommended for multi-area operation.

6. **Chef Verification:** Badge shown in UI if `isVerified === true`.

---

**Generated:** 2026-03-20  
**Status:** Complete Analysis  
**Scope:** Full codebase structure analysis
