# WhatsApp 2-Hour Scheduled Order Notification Implementation

## Overview
Implemented automated WhatsApp notifications to send to chef and admin when a scheduled order has **2 hours left** until delivery.

## Changes Made

### 1. **Schema Updates** (`shared/schema.ts`)
- Added `phone` field to `adminUsers` table to store admin phone numbers
- Added `phone` field to `chefs` table to store chef phone numbers

### 2. **WhatsApp Service** (`server/whatsappService.ts`)
- Added new function: `sendScheduledOrder2HourReminder()`
  - Sends formatted WhatsApp message with order details
  - Converts delivery time to 12-hour format (AM/PM)
  - Includes order number, customer name, items, delivery time, and date
  - Used by both chef and admin notifications

### 3. **Cron Jobs** (`server/cronJobs.ts`)
- Added import for WhatsApp notification service and database tables
- Created new function: `sendScheduledOrder2HourNotifications()`
  - Queries all "approved" orders with delivery time and date
  - Calculates time until delivery for each order
  - Sends notifications when delivery is approximately 2 hours away (within 1hr 50min - 2hr 10min window)
  - Notifies both the assigned chef (if phone exists) and all active admins (if phone exists)
  - Logs number of notifications sent
  
- Integrated `sendScheduledOrder2HourNotifications()` into `runScheduledTasks()`
  - Runs every 5 minutes as part of the scheduled task loop

### 4. **Database Migration** (`migrations/0003_add_phone_fields.sql`)
- Created migration file to add `phone` columns to:
  - `admin_users` table
  - `chefs` table

## How It Works

1. **Every 5 minutes**, the cron job runs `runScheduledTasks()`
2. **`sendScheduledOrder2HourNotifications()` function:**
   - Fetches all approved orders with scheduled delivery times
   - For each order, calculates time until delivery
   - If delivery is ~2 hours away:
     - Sends WhatsApp notification to the chef (if phone number exists)
     - Sends WhatsApp notification to all admin users (if phone number exists)
   - Logs the number of notifications sent

## WhatsApp Message Format

```
⏰ *URGENT: Order Delivery in 2 Hours* ⏰

Hi [Recipient Name],

An order is scheduled for delivery in 2 HOURS!

📋 *Order Details:*
• Order #: [Order ID]
• Customer: [Customer Name]
• Items: [Item List]
• Delivery Time: [Time in 12-hour format]
• Delivery Date: [Date]

🚀 Please prepare and get ready for delivery!

-RotiHai Team
```

## Requirements

### Database Setup
Run the migration to add phone columns:
```bash
npm run migrate
```

### Configuration
Ensure WhatsApp API credentials are set in environment variables:
- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

### Phone Numbers
Both admin users and chefs must have phone numbers stored in their profiles for notifications to be sent.

## Testing

To test the functionality:
1. Create a scheduled order with an approved status
2. Set the delivery time to be approximately 2 hours from the current time
3. Ensure the associated chef and admin users have phone numbers in their profiles
4. The cron job will automatically send WhatsApp notifications within the 5-minute execution window

## Logs
The system logs:
- Total 2-hour reminder notifications sent
- Any errors encountered during the process
- Failed WhatsApp messages
