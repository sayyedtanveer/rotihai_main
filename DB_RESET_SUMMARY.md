# Database Reset - Quick Reference

## 🚀 Fastest Option - 2 Files Ready to Use

### File 1: `reset-db-fast.sql` (Formatted)
- Full script with comments
- Easier to read
- Same content as File 2

### File 2: `reset-db-compact.sql` (Compact)
- Condensed version
- Faster to execute
- Same result as File 1

---

## ⚡ How to Execute (Choose One)

### Method A: pgAdmin (Easiest - Recommended)
```
1. Open pgAdmin
2. Right-click database → Query Tool
3. Paste content from reset-db-compact.sql
4. Click "Execute" or press F5
5. Done in 2-5 seconds!
```

### Method B: Command Line (psql)
```bash
cd c:\Users\sayye\source\repos\Replitrotihai
psql -U postgres -d your_database_name -f reset-db-compact.sql
```

### Method C: DBeaver / Any SQL Client
```
1. Open SQL editor
2. Copy entire content from reset-db-compact.sql
3. Run/Execute
4. Done!
```

---

## 📊 What Gets Created

```
✅ 3 Categories
   ├─ Rotis & Breads
   ├─ Lunch & Dinner
   └─ Hotel Specials

✅ 6 Chefs (2 per category)
   ├─ Roti Wala & Bread Master (Roti)
   ├─ Meal Chef & Quick Meals Expert (Lunch/Dinner)
   └─ Premium Chef & Gourmet Specialist (Hotel)

✅ 12 Products (3-4 per category)
   ├─ 4 Roti products (₹40-₹60)
   ├─ 4 Lunch products (₹100-₹150)
   └─ 4 Hotel products (₹220-₹280)

✅ All tables with proper relationships
✅ All enums created
✅ All indexes for performance
```

---

## 📋 Complete SQL Query

Here's the compact version you can copy-paste:

```sql
DROP TABLE IF EXISTS subscription_delivery_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS delivery_personnel CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS partner_users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS delivery_personnel_status CASCADE;

CREATE TYPE admin_role AS ENUM ('super_admin', 'manager', 'viewer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'confirmed');
CREATE TYPE delivery_personnel_status AS ENUM ('available', 'busy', 'offline');

CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at BIGINT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE admin_users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role admin_role DEFAULT 'manager', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE partner_users (id TEXT PRIMARY KEY, chef_id TEXT NOT NULL UNIQUE, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, image TEXT, icon_name TEXT, item_count TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE chefs (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, image TEXT, rating DECIMAL(3,1) DEFAULT 4.5, review_count INTEGER DEFAULT 0, category_id TEXT NOT NULL, is_active BOOLEAN DEFAULT TRUE, phone TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE);
CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, image TEXT, is_available BOOLEAN DEFAULT TRUE, stock_quantity INTEGER DEFAULT 100, chef_id TEXT NOT NULL, category_id TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE);
CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT, customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, address TEXT NOT NULL, items JSONB NOT NULL, total DECIMAL(10,2) NOT NULL, payment_status payment_status DEFAULT 'pending', status TEXT DEFAULT 'pending', delivery_time TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL);
CREATE TABLE delivery_personnel (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, status delivery_personnel_status DEFAULT 'offline', is_active BOOLEAN DEFAULT TRUE, current_location JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE subscription_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, category_id TEXT NOT NULL, price DECIMAL(10,2) NOT NULL, items JSONB NOT NULL, frequency TEXT DEFAULT 'daily', delivery_days TEXT, cutoff_hours_before INTEGER DEFAULT 12, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE);
CREATE TABLE subscriptions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, customer_name TEXT NOT NULL, email TEXT, phone TEXT NOT NULL, address TEXT NOT NULL, plan_id TEXT NOT NULL, chef_id TEXT, status TEXT DEFAULT 'pending', is_paid BOOLEAN DEFAULT FALSE, payment_transaction_id TEXT, total_deliveries INTEGER DEFAULT 30, remaining_deliveries INTEGER DEFAULT 30, next_delivery_date DATE, next_delivery_time TEXT DEFAULT '09:00', start_date DATE, end_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE, FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE SET NULL);
CREATE TABLE subscription_delivery_logs (id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL, date DATE NOT NULL, time TEXT, status TEXT DEFAULT 'scheduled', delivery_person_id TEXT, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE, FOREIGN KEY (delivery_person_id) REFERENCES delivery_personnel(id) ON DELETE SET NULL);

CREATE INDEX idx_chefs_category_id ON chefs(category_id);
CREATE INDEX idx_products_chef_id ON products(chef_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_chef_id ON subscriptions(chef_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);

INSERT INTO categories (id, name, description, image, icon_name, item_count) VALUES
('cat-roti', 'Rotis & Breads', 'Fresh hand-made rotis and breads delivered daily', 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=800', 'UtensilsCrossed', '15+'),
('cat-lunch', 'Lunch & Dinner', 'Complete meals prepared by expert chefs', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 'ChefHat', '25+'),
('cat-hotel', 'Hotel Specials', 'Restaurant-quality dishes from local hotels', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'Hotel', '30+');

INSERT INTO chefs (id, name, description, image, rating, review_count, category_id, is_active, phone) VALUES
('chef-roti-1', 'Roti Wala', 'Expert in traditional rotis, parathas and breads', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400', 4.8, 245, 'cat-roti', TRUE, '9876543210'),
('chef-roti-2', 'Bread Master', 'Specializing in multi-grain and specialty breads', 'https://images.unsplash.com/photo-1577003832033-a456bb511a0c?w=400', 4.6, 189, 'cat-roti', TRUE, '9876543211'),
('chef-lunch-1', 'Meal Chef', 'Authentic Indian meals with perfect portions', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 4.7, 312, 'cat-lunch', TRUE, '9876543212'),
('chef-lunch-2', 'Quick Meals Expert', 'Fast and fresh meal delivery specialist', 'https://images.unsplash.com/photo-1589521471361-6ce85b8b91f5?w=400', 4.5, 167, 'cat-lunch', TRUE, '9876543213'),
('chef-hotel-1', 'Premium Chef', 'Restaurant-quality dining at home', 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400', 4.9, 428, 'cat-hotel', TRUE, '9876543214'),
('chef-hotel-2', 'Gourmet Specialist', 'Fine dining cuisine expert', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 4.7, 256, 'cat-hotel', TRUE, '9876543215');

INSERT INTO products (id, name, description, price, image, is_available, stock_quantity, chef_id, category_id) VALUES
('prod-roti-1', 'Plain Roti (5 pieces)', 'Fresh hand-made plain wheat rotis', 40.00, 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=400', TRUE, 100, 'chef-roti-1', 'cat-roti'),
('prod-roti-2', 'Butter Roti (5 pieces)', 'Buttered wheat rotis with herbs', 50.00, 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=400', TRUE, 100, 'chef-roti-1', 'cat-roti'),
('prod-roti-3', 'Paratha Mix (5 pieces)', 'Assorted parathas - aloo, gobi, paneer', 60.00, 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=400', TRUE, 100, 'chef-roti-2', 'cat-roti'),
('prod-roti-4', 'Bajra Roti (5 pieces)', 'Nutritious bajra bread with ghee', 55.00, 'https://images.unsplash.com/photo-1577003832033-a456bb511a0c?w=400', TRUE, 80, 'chef-roti-2', 'cat-roti'),
('prod-lunch-1', 'Chicken Curry with Rice', 'Tender chicken in aromatic curry with rice', 150.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', TRUE, 100, 'chef-lunch-1', 'cat-lunch'),
('prod-lunch-2', 'Paneer Butter Masala with Rice', 'Creamy paneer in tomato sauce with rice', 140.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', TRUE, 100, 'chef-lunch-1', 'cat-lunch'),
('prod-lunch-3', 'Dal Makhni with Rice', 'Rich lentil curry with rice and vegetables', 120.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', TRUE, 90, 'chef-lunch-2', 'cat-lunch'),
('prod-lunch-4', 'Mixed Vegetable Curry', 'Fresh seasonal vegetables in mild curry', 100.00, 'https://images.unsplash.com/photo-1589521471361-6ce85b8b91f5?w=400', TRUE, 100, 'chef-lunch-2', 'cat-lunch'),
('prod-hotel-1', 'Biryani Special', 'Premium Hyderabadi biryani with meat', 250.00, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', TRUE, 100, 'chef-hotel-1', 'cat-hotel'),
('prod-hotel-2', 'Tandoori Chicken Plate', 'Marinated and grilled tandoori chicken', 220.00, 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400', TRUE, 100, 'chef-hotel-1', 'cat-hotel'),
('prod-hotel-3', 'Fish Amritsari', 'Crispy fried fish with special spices', 280.00, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', TRUE, 80, 'chef-hotel-2', 'cat-hotel'),
('prod-hotel-4', 'Paneer Tikka Masala Deluxe', 'Premium paneer in creamy tomato sauce', 240.00, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', TRUE, 90, 'chef-hotel-2', 'cat-hotel');

SELECT '✅ Database Reset Complete!' as status;
SELECT COUNT(*) as categories FROM categories;
SELECT COUNT(*) as chefs FROM chefs;
SELECT COUNT(*) as products FROM products;
```

---

## ✅ After Running - Verify

```sql
-- Check categories
SELECT * FROM categories;
-- Should show 3 rows

-- Check chefs per category
SELECT category_id, COUNT(*) as chef_count FROM chefs GROUP BY category_id;
-- Should show 2 chefs each

-- Check products
SELECT category_id, COUNT(*) as product_count FROM products GROUP BY category_id;
-- Should show 3-4 products each
```

---

## 🎯 Then Start Your App

```bash
npm run dev
```

Visit http://localhost:5173 and you'll see:
- ✅ 3 categories with icons
- ✅ 6 chefs with ratings
- ✅ 12 products with prices
- ✅ Ready to test!

---

## ⏱️ Performance

- **Execution time:** 2-5 seconds
- **Much faster than:** Drizzle migrations
- **No migrations:** Just raw SQL
- **Perfect for:** Development & testing

**That's it! You're done! 🚀**
