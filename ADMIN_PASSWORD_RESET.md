# Admin Password Reset - Development Guide

## 🔑 Forgot Admin Password?

No problem! Use the password reset endpoint to set a new password without needing the old one.

---

## 🔓 Reset Password Endpoint

**Endpoint:** `POST /api/admin/auth/reset-password`

This endpoint is for **development only** and allows you to reset ANY admin password without verification.

---

## 📝 How to Use

### 1. Using cURL

```bash
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "newPassword": "NewPassword@123"
  }'
```

### 2. Using Postman

1. **Method:** POST
2. **URL:** http://localhost:5000/api/admin/auth/reset-password
3. **Headers:**
   - Content-Type: application/json
4. **Body (JSON):**
```json
{
  "username": "admin",
  "newPassword": "MyNewPassword@123"
}
```

### 3. Using JavaScript/Frontend

```javascript
const response = await fetch('/api/admin/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    newPassword: 'NewPassword@123'
  })
});

const data = await response.json();
console.log(data);
```

---

## ✅ Success Response

```json
{
  "message": "✅ Password reset successfully",
  "username": "admin",
  "newPassword": "NewPassword@123",
  "instruction": "You can now login with the new password"
}
```

---

## 🔑 Then Login with New Password

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "NewPassword@123"
  }'
```

---

## 📋 Reset Multiple Admin Passwords

```bash
# Reset admin password
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","newPassword":"Admin@123"}'

# Reset manager password
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","newPassword":"Manager@123"}'
```

---

## ⚠️ Error Cases

### 1. Missing Parameters
```
Status: 400
{
  "message": "Username and newPassword are required"
}
```

**Fix:** Make sure you include both `username` and `newPassword` in the request body.

### 2. User Not Found
```
Status: 404
{
  "message": "Admin user 'unknownuser' not found"
}
```

**Fix:** Check the username is correct. Use:
- `admin` (default super admin)
- `manager` (default manager)
- Or any other admin username that exists

### 3. Database Error
```
Status: 500
{
  "message": "Password reset failed",
  "error": "Database connection error"
}
```

**Fix:** Make sure the database is running and connected.

---

## 🚀 Quick Reference

### Default Credentials (If you have them)

**Before Reset:**
```
Username: admin
Password: (forgotten)
```

**Reset Command:**
```bash
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","newPassword":"Admin@123"}'
```

**After Reset:**
```
Username: admin
Password: Admin@123
```

---

## 🔐 Password Requirements

- ✅ Any password you want (no validation in dev mode)
- ✅ Include special characters for security
- ✅ Use different passwords for different admins
- ✅ Store securely

**Recommendation:** Use strong passwords like:
- `Admin@123` 
- `MySecurePassword!2024`
- `RotiHai$Admin99`

---

## 📝 Complete Flow Example

```bash
# 1. Forgot your password? Reset it
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","newPassword":"NewAdmin@123"}'

# 2. You should see:
# {"message": "✅ Password reset successfully", ...}

# 3. Now login with new password
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NewAdmin@123"}'

# 4. You'll get accessToken
# {"accessToken": "eyJ...", "admin": {...}}

# 5. Use the token for protected endpoints
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:5000/api/admin/dashboard
```

---

## 🎯 If You Don't Even Have Access

If you forgot your password AND can't access anything:

### Option 1: Use Test Login (No Password Needed!)
```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```

Then use the token to reset password:
```bash
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","newPassword":"NewPassword@123"}'
```

### Option 2: Direct Database Reset
If database is accessible, run SQL:
```sql
UPDATE admin_users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm'
WHERE username = 'admin';
```
This sets password to: `Admin@123`

---

## 📌 Important Notes

- ✅ **Development Only** - This endpoint is for development/testing
- ✅ **No Verification** - Resets password without checking old password
- ✅ **Instant** - Changes take effect immediately
- ✅ **Works Offline** - Doesn't need email/OTP
- ⚠️ **Not Secure** - For production, add verification steps

---

## Troubleshooting

### "Connection refused" or "Cannot reach server"
- Make sure server is running: `npm run dev`
- Check port 5000 is available: `netstat -ano | findstr :5000`

### "Admin user not found"
- Username is case-sensitive
- Make sure the admin exists in the database
- Use test-login to verify database is working

### "Database error"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run the database reset script

---

## Next Steps

After resetting your password:

1. ✅ Login with new credentials
2. ✅ Update profile information
3. ✅ Set a stronger password
4. ✅ Create other admin users
5. ✅ Start testing features

**You're all set! 🎉**
