# SMS Settings Quick Reference 📱

## Access SMS Settings
1. Go to Admin Dashboard
2. Sidebar → **SMS Settings**
3. URL: `/admin/sms-settings`

## Features on the Page

### SMS Toggle
- **Off (Default):** SMS notifications disabled
- **On:** SMS notifications enabled for order updates

### Configuration Fields (When SMS ON)
- **SMS Gateway:** Choose provider (Twilio / AWS SNS / Custom)
- **From Number:** Your SMS sender ID or phone number
- **API Key:** Your provider's authentication token

### Status Card
Shows:
- ✅ SMS is ENABLED/DISABLED
- 📱 Current provider
- 🕐 Last updated timestamp

### Save Button
- Click to save all settings
- Green toast = Success
- Red toast = Error (check required fields)

---

## SMS Providers Setup

### Twilio
```
Provider: Twilio
From Number: +1234567890 (your Twilio number)
API Key: Your Twilio Auth Token
Cost: ₹0.50-1.50 per SMS
```

### AWS SNS
```
Provider: AWS
From Number: Your SNS Sender ID
API Key: AWS credentials
Cost: ₹0.20-0.50 per SMS
```

### Custom Gateway
```
Provider: Custom
From Number: Your custom sender ID
API Key: Your gateway's API token
Cost: Depends on provider
```

---

## When SMS Notifications Are Sent

✅ Order Placed → Admin SMS
✅ Chef Assigned → Chef SMS
✅ Ready for Delivery → Delivery Boy SMS (broadcast)
✅ Order Delivered → Customer SMS

---

## Troubleshooting

**Settings Won't Save?**
- Check all required fields are filled
- Verify API key is correct
- Check browser console for errors

**No Toast Appears?**
- Refresh page
- Check network tab in DevTools
- Verify endpoint `/api/admin/sms-settings` responds

**Settings Not Persisting?**
- Clear browser cache
- Check localStorage in DevTools
- Verify database connection

---

## API Endpoints

**GET /api/admin/sms-settings**
- Returns: `{ enableSMS, smsGateway, fromNumber, updatedAt }`

**POST /api/admin/sms-settings**
- Accepts: `{ enableSMS, smsGateway, fromNumber, apiKey }`
- Returns: Updated settings

---

## Cost Comparison

| Service | Cost | Free? |
|---------|------|-------|
| WhatsApp | ₹0.50-1.50 per msg | ❌ No |
| SMS | ₹0.20-0.50 per msg | ✅ Cheaper |
| Email | Free | ✅ Free |

---

## Notes

- ⚠️ API keys are stored securely (password field)
- 📱 SMS enabled/disabled can be toggled anytime
- 🔄 No app restart needed after changing settings
- 📊 Settings apply immediately to new notifications
- 🌐 Multiple providers can be tested by switching

**Remember:** SMS is optional! WhatsApp is still the default.
