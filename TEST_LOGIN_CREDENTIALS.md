# Test Login Credentials - After DB Reset

## 👨‍💼 ADMIN LOGIN

### Super Admin Account
```
URL: http://localhost:5173/admin/login
Username: admin
Password: Admin@123
```

### Manager Account
```
URL: http://localhost:5173/admin/login
Username: manager
Password: Admin@123
```

---

## 👨‍🍳 PARTNER/CHEF LOGIN

### Roti Wala (Roti Chef)
```
URL: http://localhost:5173/partner/login
Username: rotiwala
Password: Chef@123
```

### Meal Chef (Lunch & Dinner)
```
URL: http://localhost:5173/partner/login
Username: mealchef
Password: Chef@123
```

### Premium Chef (Hotel Specials)
```
URL: http://localhost:5173/partner/login
Username: premiumchef
Password: Chef@123
```

---

## 👤 CUSTOMER LOGIN

Create a test account on the customer side:
1. Go to http://localhost:5173
2. Click on user profile/login
3. Sign up with test details:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543200
   - Password: Test@123

---

## 🔐 Password Details

All passwords are bcrypt hashed with cost factor 10.

**Admin Password:** `Admin@123`
**Chef/Partner Password:** `Chef@123`

---

## 📊 What Each Account Can Do

### Admin/Manager
- ✅ View all orders
- ✅ View all subscriptions
- ✅ Assign chefs to subscriptions
- ✅ Confirm payments
- ✅ Manage products
- ✅ View delivery stats
- ✅ Manage categories
- ✅ Create admins/managers

### Partner/Chef
- ✅ View assigned subscriptions
- ✅ View today's deliveries
- ✅ Update delivery status
- ✅ View income/stats
- ✅ Manage availability
- ✅ Track delivery logs

### Customer
- ✅ Browse products
- ✅ Create orders
- ✅ View order history
- ✅ Create subscriptions
- ✅ View subscription details
- ✅ Manage profile

---

## 🚀 Quick Testing Flow

1. **Reset Database:**
   - Run the SQL script
   - Verify with SELECT queries

2. **Start App:**
   ```bash
   npm run dev
   ```

3. **Login as Admin:**
   - Go to `/admin/login`
   - Username: `admin`
   - Password: `Admin@123`

4. **View Dashboard:**
   - See categories, chefs, products
   - All master data is ready

5. **Create Test Data:**
   - Create orders as customer
   - Assign chefs as admin
   - View subscriptions as chef

---

## 📱 Account Details Table

| Role | Username | Email | Password | URL |
|------|----------|-------|----------|-----|
| Super Admin | admin | admin@rotihai.com | Admin@123 | /admin/login |
| Manager | manager | manager@rotihai.com | Admin@123 | /admin/login |
| Roti Chef | rotiwala | roti.wala@rotihai.com | Chef@123 | /partner/login |
| Meal Chef | mealchef | meal.chef@rotihai.com | Chef@123 | /partner/login |
| Premium Chef | premiumchef | premium.chef@rotihai.com | Chef@123 | /partner/login |

---

## ⚠️ Important

- All test accounts are created with the SQL script
- You can modify passwords in database if needed
- These are hashed bcrypt passwords - same hash validates multiple passwords
- Use these only for development/testing
- Do NOT use in production

---

## 🔧 If Login Not Working

**Check 1:** Verify admin table has data
```sql
SELECT COUNT(*) FROM admin_users;
-- Should show: 2
```

**Check 2:** Verify partner table has data
```sql
SELECT COUNT(*) FROM partner_users;
-- Should show: 3
```

**Check 3:** Check server logs for errors
```bash
# Look for authentication errors in npm run dev output
```

**Check 4:** Clear browser cache
```
Press Ctrl+Shift+Delete and clear all cache
Or use Incognito/Private mode
```

---

## 📝 Notes

- All passwords use the same bcrypt hash for easy testing
- In production, use unique passwords for each account
- API uses JWT tokens for session management
- Tokens expire after 7 days (check your .env for TOKEN_EXPIRY)
- Partner and Admin use different endpoints

---

## Next Steps

1. ✅ Run SQL reset script
2. ✅ Start `npm run dev`
3. ✅ Login with admin credentials
4. ✅ Verify all data is loaded
5. ✅ Create test orders/subscriptions
6. ✅ Test chef assignment
7. ✅ Test partner dashboard

**Everything is ready! Start testing! 🎉**
