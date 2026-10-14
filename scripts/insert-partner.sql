-- ============================================================
-- INSERT NEW PARTNER + PRODUCTS — PRODUCTION SCRIPT
-- ============================================================
-- BEFORE RUNNING:
--   1. Run: SELECT id, name FROM categories;
--      Replace every YOUR_CATEGORY_ID_HERE with a real category id.
--   2. Generate bcrypt hash for the partner password:
--      node -e "require('bcryptjs').hash('YourPassword1', 10).then(h => console.log(h))"
--      Replace $2b$10$REPLACE_WITH_BCRYPT_HASH_HERE with the output.
--   3. Replace chef-spicegarden with your own unique chef slug.
--   4. Run all three blocks in order.
-- ============================================================


-- ─────────────────────────────────
-- 1. INSERT CHEF
-- ─────────────────────────────────
INSERT INTO chefs (
  id,
  name,
  phone,
  description,
  image,
  rating,
  review_count,
  category_id,
  address,
  latitude,
  longitude,
  is_active,
  default_delivery_fee,
  delivery_fee_per_km,
  free_delivery_threshold,
  max_delivery_distance_km,
  is_verified,
  fssai_verified,
  compliance_status,
  auto_schedule_enabled,
  subscription_availability_status,
  fulfillment_mode,
  allow_manual_order_assignment
) VALUES (
  'chef-spicegarden',
  'Spice Garden',
  '9876543210',
  'Authentic home-style food delivered fresh',
  '',                          -- image: empty string, upload via admin later
  '4.5',
  0,
  'YOUR_CATEGORY_ID_HERE',     -- ⚠ replace with real category id
  'Shop 5, Link Road, Andheri West, Mumbai 400053',
  19.1196,
  72.8468,
  true,
  20,                          -- default_delivery_fee (₹)
  5,                           -- delivery_fee_per_km (₹/km)
  200,                         -- free_delivery_threshold (₹)
  5,                           -- max_delivery_distance_km
  false,
  false,
  'pending',
  false,
  'available',
  'instant',                   -- instant | preorder | both
  false
);


-- ─────────────────────────────────
-- 2. INSERT PARTNER LOGIN ACCOUNT
-- ─────────────────────────────────
INSERT INTO partner_users (
  id,
  chef_id,
  username,
  email,
  password_hash,
  profile_picture_url,
  created_at
) VALUES (
  gen_random_uuid(),
  'chef-spicegarden',                      -- must match chef id above
  'spicegarden',                           -- unique login username
  'spicegarden@example.com',              -- unique email
  '$2b$10$REPLACE_WITH_BCRYPT_HASH_HERE', -- ⚠ replace with bcrypt hash
  NULL,
  NOW()
);


-- ─────────────────────────────────
-- 3. INSERT PRODUCTS
-- ─────────────────────────────────
-- image is nullable — NULL is safe, upload via admin later.
-- Add more rows (comma-separated before the semicolon) for more products.

INSERT INTO products (
  id,
  name,
  description,
  hotel_price,
  price,
  image,
  rating,
  review_count,
  is_veg,
  is_customizable,
  stock_quantity,
  low_stock_threshold,
  is_available,
  category_id,
  chef_id,
  offer_percentage,
  section,
  section_order,
  sort_order,
  fulfillment_mode
) VALUES
(
  'prod-spicegarden-001',
  'Butter Chicken',
  'Slow-cooked chicken in creamy tomato gravy',
  80,                          -- hotel_price: your cost (₹)
  160,                         -- price: selling price (₹)
  NULL,                        -- image: upload via admin later
  '4.5',
  0,
  false,                       -- is_veg
  false,
  100,
  20,
  true,
  'YOUR_CATEGORY_ID_HERE',     -- ⚠ replace with real category id
  'chef-spicegarden',
  0,
  'Main Course',               -- section name (set NULL if no sections needed)
  0,
  0,
  'inherit'
),
(
  'prod-spicegarden-002',
  'Dal Makhani',
  'Slow-cooked black lentils in buttery gravy',
  40,
  100,
  NULL,
  '4.5',
  0,
  true,                        -- is_veg
  false,
  100,
  20,
  true,
  'YOUR_CATEGORY_ID_HERE',     -- ⚠ replace with real category id
  'chef-spicegarden',
  0,
  'Main Course',
  0,
  1,
  'inherit'
);


-- ─────────────────────────────────
-- 4. UPDATE PRODUCTS FOR VARIANTS
-- ─────────────────────────────────
-- Enable variant mode for products that have multiple sizes
UPDATE products 
SET has_variants = true 
WHERE id IN ('prod-spicegarden-001', 'prod-spicegarden-002');


-- ─────────────────────────────────
-- 5. INSERT PRODUCT VARIANTS
-- ─────────────────────────────────
-- Example: Butter Chicken with Half/Full/Large servings
-- Example: Dal Makhani with Half/Full/Large servings

INSERT INTO product_variants (
  id,
  product_id,
  name,
  display_name,
  description,
  price,
  hotel_price,
  stock_quantity,
  low_stock_threshold,
  sort_order,
  is_active,
  is_available
) VALUES
-- Butter Chicken variants
(
  gen_random_uuid(),
  'prod-spicegarden-001',
  'Half',
  'Half Serving',
  'Smaller portion, perfect for one',
  100,                         -- price: ₹100
  50,                          -- hotel_price (cost): ₹50
  100,                         -- stock_quantity
  20,
  0,                           -- sort_order (appears first)
  true,
  true
),
(
  gen_random_uuid(),
  'prod-spicegarden-001',
  'Full',
  'Full Serving',
  'Standard portion for 2 people',
  160,                         -- price: ₹160 (default)
  80,
  100,
  20,
  1,                           -- sort_order (appears second)
  true,
  true
),
(
  gen_random_uuid(),
  'prod-spicegarden-001',
  'Large',
  'Large Serving',
  'Premium portion for 3-4 people',
  240,                         -- price: ₹240
  120,
  80,
  15,
  2,                           -- sort_order (appears third)
  true,
  true
),
-- Dal Makhani variants
(
  gen_random_uuid(),
  'prod-spicegarden-002',
  'Half',
  'Half Bowl',
  'Smaller bowl',
  60,                          -- price: ₹60
  30,
  100,
  20,
  0,
  true,
  true
),
(
  gen_random_uuid(),
  'prod-spicegarden-002',
  'Full',
  'Full Bowl',
  'Full serving',
  100,                         -- price: ₹100 (default)
  40,
  100,
  20,
  1,
  true,
  true
),
(
  gen_random_uuid(),
  'prod-spicegarden-002',
  'Large',
  'Large Bowl',
  'Family size',
  150,                         -- price: ₹150
  70,
  80,
  15,
  2,
  true,
  true
);


-- ─────────────────────────────────
-- VERIFY (run after inserting)
-- ─────────────────────────────────
SELECT id, name, is_active, compliance_status FROM chefs WHERE id = 'chef-spicegarden';
SELECT id, chef_id, username, email FROM partner_users WHERE chef_id = 'chef-spicegarden';
SELECT id, name, price, has_variants, is_available FROM products WHERE chef_id = 'chef-spicegarden';

-- View all variants for the products
SELECT pv.id, pv.product_id, p.name as product_name, pv.name as variant_name, pv.price, pv.hotel_price, pv.sort_order
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.chef_id = 'chef-spicegarden'
ORDER BY p.id, pv.sort_order;
