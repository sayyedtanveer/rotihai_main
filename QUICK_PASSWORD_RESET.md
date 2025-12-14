# Quick Password Reset Reference

## 🔑 Forgot Admin Password?

### ONE Command to Fix It:

```bash
curl -X POST http://localhost:5000/api/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","newPassword":"Admin@123"}'
```

---

## Response You'll Get:

```json
{
  "message": "✅ Password reset successfully",
  "username": "admin",
  "newPassword": "Admin@123"
}
```

---

## Then Login:

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

---

## Or Use Test Login (No Password):

```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```

---

## 📋 Parameters

| Parameter | Value | Example |
|-----------|-------|---------|
| username | Your admin username | admin, manager, etc |
| newPassword | Your new password | MyPassword@123 |

---

## ✅ That's It!

Your password is now reset and ready to use! 🚀
