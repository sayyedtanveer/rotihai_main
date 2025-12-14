# Test Login Endpoint - Development Only

## 🔓 Test Login (No Password Required)

**Endpoint:** `POST /api/admin/auth/test-login`

This endpoint is for **development/testing only**. It allows you to login as any admin user without entering a password.

### Usage

**Request:**
```json
{
  "username": "admin"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin-1",
    "username": "admin",
    "email": "admin@rotihai.com",
    "role": "super_admin"
  }
}
```

### How to Use

1. **Using cURL:**
```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

2. **Using Postman:**
   - Method: POST
   - URL: http://localhost:5000/api/admin/auth/test-login
   - Body (JSON):
     ```json
     {
       "username": "admin"
     }
     ```

3. **Using Frontend:**
```javascript
const response = await fetch('/api/admin/auth/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin' })
});

const data = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

### Available Test Usernames

```
admin        → Super Admin (full access)
manager      → Manager (limited access)
rotiwala     → Roti Chef (partner)
mealchef     → Lunch Chef (partner)
premiumchef  → Hotel Chef (partner)
```

### Create New Admin Users

If you want to create a new admin user to test with:

1. **Via Database:**
```sql
INSERT INTO admin_users (id, username, email, phone, password_hash, role, created_at, updated_at) 
VALUES (
  'admin-3', 
  'testadmin', 
  'test@rotihai.com', 
  '9999999997', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',  -- password: Admin@123
  'manager', 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
```

2. **Then login:**
```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username": "testadmin"}'
```

### Error Cases

**1. Username not provided:**
```
Status: 400
{
  "message": "Username is required"
}
```

**2. User not found:**
```
Status: 404
{
  "message": "Admin user 'unknownuser' not found. Create it first or use 'admin'"
}
```

**3. Database error:**
```
Status: 500
{
  "message": "Test login failed"
}
```

---

## ⚠️ Important Notes

- **Development Only**: This endpoint should NOT be enabled in production
- **No Password Validation**: This bypass password checks for testing convenience
- **Admin Must Exist**: The username must already exist in the database
- **Access Token Valid**: You still get a valid JWT token for 7 days
- **Same Security Features**: Still includes refresh tokens and session management

---

## 🔒 Production Login (With Password)

For production/actual login, use the regular login endpoint:

**Endpoint:** `POST /api/admin/auth/login`

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

This requires BOTH username and password to be correct.

---

## Quick Setup Flow

1. **Run SQL Reset Script** to create test users
2. **Start Server:** `npm run dev`
3. **Test Login:** Use the test-login endpoint with just username
4. **Get Access Token** from response
5. **Use Token** in Authorization header for other endpoints

```bash
Authorization: Bearer <accessToken>
```

---

## Testing Admin Actions

After logging in with the test endpoint:

```bash
# Get all admin data
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:5000/api/admin/dashboard

# Create order
curl -X POST http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Enjoy quick testing! 🚀**
