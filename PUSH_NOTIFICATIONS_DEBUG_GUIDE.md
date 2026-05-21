# 🔔 Push Notifications Debugging Guide

## ✅ What I Fixed

### 1. **Manifest.json Badge Icon** ✅
Added badge icon for Android notifications (shows in status bar)
```json
{
  "src": "/icon-96x96.png",
  "sizes": "96x96",
  "type": "image/png",
  "purpose": "badge"
}
```

### 2. **usePushNotifications Hook** ✅
- ✅ **Auto-registration**: Now auto-registers when user logs in (requests permission automatically)
- ✅ **HTTPS check**: Validates `window.isSecureContext` - CRITICAL for production
- ✅ **Better logging**: All push events now have `[PUSH]` prefix for easy debugging
- ✅ **Session tracking**: Uses `sessionStorage` to prevent multiple registration attempts
- ✅ **Graceful failures**: Doesn't show error toast for permission denials (user choice)

### 3. **Service Worker Push Handler** ✅
- ✅ **Better logging**: Shows exactly what happens when push arrives
- ✅ **Silent: false**: Allows system sound/vibration on arrival
- ✅ **Fallback notification**: Shows basic notification if JSON parsing fails

---

## 🔍 How to Test Push Notifications

### **Step 1: Prerequisites Check**
Before testing, verify:

```bash
# 1. Must be HTTPS (or localhost)
echo "Current URL: $(window.location.origin)"
echo "Is HTTPS: $(window.location.protocol === 'https:')"
echo "Is localhost: $(window.location.hostname === 'localhost')"

# 2. Check browser support
console.log('Push supported:', 
  'serviceWorker' in navigator && 
  'PushManager' in window && 
  'Notification' in window
)
```

### **Step 2: Open Browser DevTools and Check Console**

1. **Open DevTools** → `F12` → Console tab
2. **Log in to the app** (login page)
3. **Navigate to Home page** → User will land here after login
4. **Look for these logs:**

```
[PUSH] Support check: {
  serviceWorker: true,
  PushManager: true,
  Notification: true,
  isSecureContext: true,  ← CRITICAL: Must be true
  isSupported: true
}

[PUSH] Auto-registering push notifications for customer {userId}...
[PUSH] Current permission: default
[PUSH] Requesting notification permission from user...
[PUSH] User responded with: granted
[PUSH] ✅ Permission granted, proceeding with registration...
[PUSH] Registering service worker from /sw.js
✅ Service Worker registered for push
[PUSH] Fetching VAPID public key from server...
[PUSH] ✅ VAPID key fetched
[PUSH] Subscribing to push notifications...
✅ Push subscription created
✅ Push notification registered successfully
```

### **Step 3: Check Service Worker Registration**

In DevTools console, run:
```javascript
// Check if SW is registered
navigator.serviceWorker.getRegistration('/').then(reg => {
  console.log('SW registered:', !!reg);
  console.log('SW scope:', reg?.scope);
  
  // Check push subscription
  reg?.pushManager.getSubscription().then(sub => {
    if (sub) {
      console.log('✅ Push subscription exists:', sub.endpoint);
    } else {
      console.log('❌ No push subscription found');
    }
  });
});
```

**Expected output:**
```
SW registered: true
SW scope: https://yoursite.com/
✅ Push subscription exists: https://fcm.googleapis.com/fcm/send/...
```

---

## 📱 Testing on Mobile

### **iPhone/Safari:**
Push notifications require:
- ✅ HTTPS only
- ✅ Added to home screen (Install as PWA)
- ✅ Notification permission granted

**Test Steps:**
1. Open app in Safari → Add to Home Screen
2. Launch app from home screen
3. Allow notification permission when prompted
4. DevTools console will show all registration logs

### **Android/Chrome:**
Push notifications require:
- ✅ HTTPS only (or localhost)
- ✅ Chrome version 50+
- ✅ Notification permission granted
- ✅ Can be either in browser OR installed as PWA

**Test Steps:**
1. Open Chrome → Visit your site
2. DevTools → Check console for registration logs
3. Allow notification permission when prompted
4. Badge icon (96x96) should appear in status bar when notification arrives

---

## 🚨 Common Issues & Solutions

### **Issue 1: Permission Dialog Never Appears**
```
❌ Possible causes:
- User already denied permission in browser settings
- Not HTTPS/localhost
- Permission popup was blocked by browser

✅ Solution:
- Clear browser notification settings
- On Chrome: Settings → Privacy → Notifications → Clear RotiHai
- Try again in incognito window
```

### **Issue 2: "isSecureContext: false" in Console**
```
❌ This means:
- App is running on HTTP (not HTTPS)
- OR running on non-localhost domain

✅ Solution:
- For production: Use HTTPS
- For development: Use localhost:3000 (already works)
- For testing: Use ngrok to expose local server with HTTPS
```

### **Issue 3: Service Worker Not Registered**
```
❌ Console shows:
- "Service Worker registration: error"
- OR no SW logs at all

✅ Check:
1. Is /sw.js file accessible?
   - Open browser → Type in URL bar: yourdomain.com/sw.js
   - Should see JS code, not 404 error

2. Check browser console for errors during registration

3. Try this in console:
   navigator.serviceWorker.register('/sw.js').catch(err => {
     console.error('SW registration failed:', err)
   })
```

### **Issue 4: Push Subscription Created But No Notifications Arrive**
```
❌ Issue:
- Registration successful
- Push subscription created
- But notifications don't show

✅ Check:
1. Is backend sending push messages?
   - Verify /api/push/subscribe saved the subscription
   - Check backend code that sends push notifications

2. Check Service Worker push handler:
   - In DevTools → Application → Service Workers
   - Look for "push" event listener registered

3. Manual test with curl (if you have push sending endpoint):
   curl -X POST https://yourapi.com/send-test-push \
     -H "Content-Type: application/json" \
     -d '{"userId":"123","title":"Test","body":"Test notification"}'
```

### **Issue 5: Notification Shows But Doesn't Work Correctly**
```
✅ Check the logs:
- Should see: [PUSH] Displaying notification with: {...}
- Should see: ✅ Notification displayed successfully

❌ If you see:
- ❌ Error handling push notification: [error]
- ❌ Failed to display notification: [error]

✅ Solution:
- Check browser notification settings
- Ensure icon paths (/icon-192.png, /icon-96x96.png) are correct
- Ensure badge icon exists: /icon-96x96.png
```

---

## 🔧 Backend Testing

### **Check VAPID Keys Configuration**

In your backend, verify:
```javascript
// This should NOT be empty
console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY);
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY);
console.log('VAPID_EMAIL:', process.env.VAPID_EMAIL);

// Should all be defined
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error('⚠️ VAPID keys not configured - push will fail!');
}
```

### **Check Subscription Storage**

Verify your backend saved the subscription:
```sql
-- Check if push subscription was stored
SELECT * FROM pushSubscriptions WHERE userId = '123';

-- Should return:
-- userId | userType | subscription | endpoint | ...
```

### **Send Test Push Notification**

```javascript
// Example: Send push from backend (using node-pushnotifications or web-push)
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const subscription = {/* from database */};
const payload = {
  title: 'Test Notification',
  body: 'This is a test push notification',
};

webpush.sendNotification(subscription, JSON.stringify(payload))
  .then(res => console.log('✅ Push sent successfully'))
  .catch(err => console.error('❌ Push failed:', err));
```

---

## 📋 Complete Checklist

- [ ] **HTTPS enabled** (or localhost for testing)
- [ ] **VAPID keys configured** in .env
- [ ] **manifest.json has badge icon** (`/icon-96x96.png`)
- [ ] **Service Worker** exists at `/public/sw.js`
- [ ] **usePushNotifications hook** is called in Home.tsx with user ID
- [ ] **Notification permission** granted in browser settings
- [ ] **Browser version** supports Push API:
  - Chrome 50+
  - Firefox 44+
  - Edge 17+
  - Safari 16+ (limited support)
  - Mobile browsers (Chrome Android, Firefox Mobile)
- [ ] **Icons exist** in `/public/`:
  - `icon-192.png` (for notification display)
  - `icon-96x96.png` (for Android status bar badge)
- [ ] **Console logs** show successful registration
- [ ] **DevTools → Application → Service Workers** shows SW is active
- [ ] **DevTools → Application → Manifest** shows push-related fields

---

## 🎯 Next Steps

1. **Build and deploy** the updated code
2. **Open DevTools console** on your site
3. **Log in** → Navigate to Home
4. **Watch for registration logs** → Permission dialog should appear
5. **Allow notifications** → Registration should complete
6. **Test push** → Backend should be able to send notifications
7. **Verify notifications** → Should appear on mobile home screen even when app is closed

---

## 📞 Debug Commands

Copy-paste these in your browser console:

```javascript
// Check browser support
console.log('[DEBUG] Browser support:', {
  serviceWorker: 'serviceWorker' in navigator,
  PushManager: 'PushManager' in window,
  Notification: 'Notification' in window,
  isSecureContext: window.isSecureContext,
});

// Check SW registration
navigator.serviceWorker.getRegistration('/').then(reg => {
  console.log('[DEBUG] SW registered:', !!reg);
  console.log('[DEBUG] SW scope:', reg?.scope);
  reg?.pushManager.getSubscription().then(sub => {
    console.log('[DEBUG] Push subscription:', sub ? '✅ EXISTS' : '❌ NOT FOUND');
    if (sub) console.log('[DEBUG] Endpoint:', sub.endpoint);
  });
});

// Check notification permission
console.log('[DEBUG] Notification permission:', Notification.permission);

// Manually request permission
Notification.requestPermission().then(permission => {
  console.log('[DEBUG] Permission result:', permission);
});

// Test notification (if permission granted)
if (Notification.permission === 'granted') {
  new Notification('Test Notification', {
    body: 'This is a test local notification',
    icon: '/icon-192.png',
  });
}
```

---

## 🐛 If Nothing Works

1. **Check browser console** for all errors
2. **Screenshot console** with full error messages
3. **Check if `/sw.js` is accessible** → Visit in browser
4. **Check if `manifest.json` is valid** → Validate JSON
5. **Check network tab** for failed requests to:
   - `/api/push/vapid-public-key` → Should return 200
   - `/api/push/subscribe` → Should return 200
6. **Check backend logs** for errors in push subscription storage

---

## 📝 Key Files Modified

- ✅ `/client/src/hooks/usePushNotifications.ts` - Auto-registration, better logging
- ✅ `/client/public/manifest.json` - Added badge icon
- ✅ `/client/public/sw.js` - Enhanced push handler logging
- ✅ `/client/public/sw.js` - Silent: false option added

No changes needed to:
- Server routes (already correct)
- Home.tsx (hook now auto-registers)
- Other components

---

**Last Updated**: $(date)
**Status**: Ready for testing on production HTTPS environment
