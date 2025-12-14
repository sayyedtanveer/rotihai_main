# Master Data Details - What Gets Created

## 📊 Categories (3 Total)

| ID | Name | Description | Icon | Items |
|----|------|-------------|------|-------|
| cat-roti | Rotis & Breads | Fresh hand-made rotis and breads delivered daily | UtensilsCrossed | 15+ |
| cat-lunch | Lunch & Dinner | Complete meals prepared by expert chefs | ChefHat | 25+ |
| cat-hotel | Hotel Specials | Restaurant-quality dishes from local hotels | Hotel | 30+ |

---

## 👨‍🍳 Chefs (6 Total - 2 Per Category)

### ROTI & BREADS CATEGORY
| Chef ID | Name | Rating | Reviews | Phone | Specialty |
|---------|------|--------|---------|-------|-----------|
| chef-roti-1 | Roti Wala | 4.8★ | 245 | 9876543210 | Traditional rotis, parathas, breads |
| chef-roti-2 | Bread Master | 4.6★ | 189 | 9876543211 | Multi-grain, specialty breads |

### LUNCH & DINNER CATEGORY
| Chef ID | Name | Rating | Reviews | Phone | Specialty |
|---------|------|--------|---------|-------|-----------|
| chef-lunch-1 | Meal Chef | 4.7★ | 312 | 9876543212 | Authentic Indian meals, perfect portions |
| chef-lunch-2 | Quick Meals Expert | 4.5★ | 167 | 9876543213 | Fast, fresh meal delivery |

### HOTEL SPECIALS CATEGORY
| Chef ID | Name | Rating | Reviews | Phone | Specialty |
|---------|------|--------|---------|-------|-----------|
| chef-hotel-1 | Premium Chef | 4.9★ | 428 | 9876543214 | Restaurant-quality dining |
| chef-hotel-2 | Gourmet Specialist | 4.7★ | 256 | 9876543215 | Fine dining cuisine |

---

## 🍽️ Products (12 Total - 3-4 Per Category)

### ROTI & BREADS PRODUCTS (4 Products)

#### Chef: Roti Wala
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-roti-1 | Plain Roti (5 pieces) | ₹40 | 100 | Fresh hand-made plain wheat rotis |
| prod-roti-2 | Butter Roti (5 pieces) | ₹50 | 100 | Buttered wheat rotis with herbs |

#### Chef: Bread Master
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-roti-3 | Paratha Mix (5 pieces) | ₹60 | 100 | Assorted parathas - aloo, gobi, paneer |
| prod-roti-4 | Bajra Roti (5 pieces) | ₹55 | 80 | Nutritious bajra bread with ghee |

---

### LUNCH & DINNER PRODUCTS (4 Products)

#### Chef: Meal Chef
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-lunch-1 | Chicken Curry with Rice | ₹150 | 100 | Tender chicken in aromatic curry with rice |
| prod-lunch-2 | Paneer Butter Masala with Rice | ₹140 | 100 | Creamy paneer in tomato sauce with rice |

#### Chef: Quick Meals Expert
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-lunch-3 | Dal Makhni with Rice | ₹120 | 90 | Rich lentil curry with rice and vegetables |
| prod-lunch-4 | Mixed Vegetable Curry | ₹100 | 100 | Fresh seasonal vegetables in mild curry |

---

### HOTEL SPECIALS PRODUCTS (4 Products)

#### Chef: Premium Chef
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-hotel-1 | Biryani Special | ₹250 | 100 | Premium Hyderabadi biryani with meat |
| prod-hotel-2 | Tandoori Chicken Plate | ₹220 | 100 | Marinated and grilled tandoori chicken |

#### Chef: Gourmet Specialist
| Product ID | Name | Price | Stock | Description |
|------------|------|-------|-------|-------------|
| prod-hotel-3 | Fish Amritsari | ₹280 | 80 | Crispy fried fish with special spices |
| prod-hotel-4 | Paneer Tikka Masala Deluxe | ₹240 | 90 | Premium paneer in creamy tomato sauce |

---

## 📈 Price Range Summary

| Category | Min Price | Max Price | Avg Price | Items |
|----------|-----------|-----------|-----------|-------|
| Rotis & Breads | ₹40 | ₹60 | ₹51.25 | 4 |
| Lunch & Dinner | ₹100 | ₹150 | ₹127.50 | 4 |
| Hotel Specials | ₹220 | ₹280 | ₹247.50 | 4 |

---

## ⭐ Rating Summary

| Category | Avg Chef Rating | Top Rated Chef | Reviews |
|----------|-----------------|-----------------|---------|
| Rotis & Breads | 4.7★ | Roti Wala (4.8★) | 434 |
| Lunch & Dinner | 4.6★ | Meal Chef (4.7★) | 479 |
| Hotel Specials | 4.8★ | Premium Chef (4.9★) | 684 |

---

## 📊 Database Statistics After Reset

| Entity | Count | Notes |
|--------|-------|-------|
| Categories | 3 | Roti, Lunch, Hotel |
| Chefs | 6 | 2 per category |
| Products | 12 | 3-4 per category |
| Orders | 0 | Empty (for testing) |
| Subscriptions | 0 | Empty (for testing) |
| Users | 0 | Empty (for testing) |
| Admin Users | 0 | Empty (for testing) |
| Partner Users | 0 | Empty (for testing) |
| Total Tables | 11 | All schema tables |

---

## 🔗 Relationships

```
Categories (3)
├─── Chefs (6) - 2 per category
│    └─── Products (12) - 3-4 per chef
│
└─── Subscription Plans (0 - created later by user)
     └─── Subscriptions (0 - created later by user)
          └─── Subscription Delivery Logs (0 - auto-created)
```

---

## 🎯 Ready for Testing

After running the reset, you can immediately:

✅ **Browse Products**
- View all 3 categories
- See all 6 chefs
- Browse all 12 products

✅ **Create Orders**
- Add products to cart
- Test checkout flow

✅ **Create Subscriptions**
- Test subscription creation
- Assign chefs
- Track delivery logs

✅ **Admin Panel**
- Manage products
- Assign chefs
- View orders
- Monitor subscriptions

---

## 📝 Quick Copy-Paste IDs

### Category IDs
```
cat-roti
cat-lunch
cat-hotel
```

### Chef IDs
```
chef-roti-1, chef-roti-2
chef-lunch-1, chef-lunch-2
chef-hotel-1, chef-hotel-2
```

### Product IDs
```
prod-roti-1, prod-roti-2, prod-roti-3, prod-roti-4
prod-lunch-1, prod-lunch-2, prod-lunch-3, prod-lunch-4
prod-hotel-1, prod-hotel-2, prod-hotel-3, prod-hotel-4
```

---

## 🚀 Next Steps

1. Run the SQL reset script
2. Start the app: `npm run dev`
3. Visit http://localhost:5173
4. You'll see all categories, chefs, and products ready!

**Everything is already set up and ready to use!** 🎉
