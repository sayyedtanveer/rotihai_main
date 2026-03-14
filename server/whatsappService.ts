import axios from "axios";
import { formatTime12Hour } from "../shared/timeFormatter";

// WhatsApp API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    preview_url: boolean;
    body: string;
  };
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  // If WhatsApp credentials are not configured, log a warning but don't fail
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("⚠️ WhatsApp service not configured. Skipping WhatsApp message to:", phoneNumber);
    return false;
  }

  try {
    const payload: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: phoneNumber.replace(/[^0-9]/g, ""), // Remove non-numeric characters
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ WhatsApp message sent to ${phoneNumber}:`, response.data?.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error(`❌ WhatsApp send failed for ${phoneNumber}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function sendScheduledDeliveryReminder(
  recipientName: string,
  recipientPhone: string,
  orderNumber: string,
  deliveryTime: string,
  deliveryDate: string,
  customerName: string,
  items: string[]
): Promise<boolean> {
  const timeString = formatTime12Hour(deliveryTime);

  const itemsList = items.join(", ");

  const message = `
🚀 *Scheduled Delivery Reminder* 🚀

Hi ${recipientName},

You have a scheduled delivery order coming up!

📋 *Order Details:*
• Order #: ${orderNumber}
• Customer: ${customerName}
• Items: ${itemsList}
• Delivery Time: ${timeString}
• Delivery Date: ${deliveryDate}

⏰ Please prepare accordingly!

-RotiHai Team
  `.trim();

  return sendWhatsAppMessage(recipientPhone, message);
}

export async function sendScheduledOrder2HourReminder(
  recipientName: string,
  recipientPhone: string,
  orderNumber: string,
  deliveryTime: string,
  deliveryDate: string,
  customerName: string,
  items: string[]
): Promise<boolean> {
  const timeString = formatTime12Hour(deliveryTime);

  const itemsList = items.join(", ");

  const message = `
⏰ *URGENT: Order Delivery in 2 Hours* ⏰

Hi ${recipientName},

An order is scheduled for delivery in 2 HOURS!

📋 *Order Details:*
• Order #: ${orderNumber}
• Customer: ${customerName}
• Items: ${itemsList}
• Delivery Time: ${timeString}
• Delivery Date: ${deliveryDate}

🚀 Please prepare and get ready for delivery!

-RotiHai Team
  `.trim();

  return sendWhatsAppMessage(recipientPhone, message);
}

/**
 * Send WhatsApp notification to admin when a new order is placed
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendOrderPlacedAdminNotification(
  orderId: string,
  userName: string,
  amount: number,
  adminPhone?: string | null
): Promise<boolean> {
  // Gracefully handle missing phone number
  if (!adminPhone || typeof adminPhone !== "string" || adminPhone.trim().length === 0) {
    console.warn(`⚠️ Admin phone not configured. Skipping order notification for order ${orderId}`);
    return false;
  }

  const message = `
📦 *NEW ORDER RECEIVED* 📦

Order #: ${orderId}
Customer: ${userName}
Amount: ₹${amount}

🔗 View in dashboard to approve payment

-RotiHai Admin System
  `.trim();

  // Non-blocking - fire and forget
  sendWhatsAppMessage(adminPhone, message).catch(error => {
    console.error(`⚠️ Failed to send admin notification for order ${orderId}:`, error);
  });

  return true;
}

/**
 * Send WhatsApp notification to chef when order is assigned
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendChefAssignmentNotification(
  chefId: string,
  orderId: string,
  items: string[],
  chefPhone?: string | null
): Promise<boolean> {
  // Gracefully handle missing phone number
  if (!chefPhone || typeof chefPhone !== "string" || chefPhone.trim().length === 0) {
    console.warn(`⚠️ Chef phone not configured. Skipping assignment notification for chef ${chefId}, order ${orderId}`);
    return false;
  }

  const itemsList = items.join(", ");

  const message = `
👨‍🍳 *NEW ORDER ASSIGNED* 👨‍🍳

Order #: ${orderId}
Items: ${itemsList}
Prep Time: ~30 minutes

Please accept and start preparation!

-RotiHai Team
  `.trim();

  // Non-blocking - fire and forget
  sendWhatsAppMessage(chefPhone, message).catch(error => {
    console.error(`⚠️ Failed to send chef assignment notification for order ${orderId}:`, error);
  });

  return true;
}

/**
 * Send WhatsApp notification to all active delivery personnel when order is ready
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendDeliveryAvailableNotification(
  deliveryPersonIds: string[],
  orderId: string,
  address: string,
  deliveryPersonPhones: Map<string, string>
): Promise<number> {
  if (!deliveryPersonIds || deliveryPersonIds.length === 0) {
    console.warn(`⚠️ No delivery personnel available for order ${orderId}`);
    return 0;
  }

  const message = `
🚚 *ORDER READY FOR DELIVERY* 🚚

Order #: ${orderId}
Delivery Address: ${address}

📍 Tap to accept this delivery

-RotiHai Team
  `.trim();

  let successCount = 0;

  // Send to each delivery person (non-blocking, fire and forget)
  for (const deliveryPersonId of deliveryPersonIds) {
    const phone = deliveryPersonPhones.get(deliveryPersonId);
    
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      console.warn(`⚠️ Phone not found for delivery person ${deliveryPersonId}, skipping notification`);
      continue;
    }

    sendWhatsAppMessage(phone, message)
      .then(success => {
        if (success) successCount++;
      })
      .catch(error => {
        console.error(`⚠️ Failed to send delivery notification to ${deliveryPersonId}:`, error);
      });
  }

  return successCount;
}

/**
 * Send WhatsApp notification to user when delivery is completed
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendDeliveryCompletedNotification(
  userId: string,
  orderId: string,
  userPhone?: string | null
): Promise<boolean> {
  // Gracefully handle missing phone number
  if (!userPhone || typeof userPhone !== "string" || userPhone.trim().length === 0) {
    console.warn(`⚠️ User phone not configured. Skipping delivery notification for user ${userId}, order ${orderId}`);
    return false;
  }

  const message = `
✅ *ORDER DELIVERED* ✅

Order #: ${orderId}
Thank you for ordering with RotiHai!

⭐ Please rate your experience

-RotiHai Team
  `.trim();

  // Non-blocking - fire and forget
  sendWhatsAppMessage(userPhone, message).catch(error => {
    console.error(`⚠️ Failed to send delivery notification for order ${orderId}:`, error);
  });

  return true;
}

/**
 * Send WhatsApp notification to user when scheduled delivery is missed
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendMissedDeliveryNotification(
  userId: string,
  userPhone: string | null | undefined,
  deliveryDate: string,
  deliveryTime: string,
  subscriptionId: string
): Promise<boolean> {
  if (!userPhone || typeof userPhone !== "string" || userPhone.trim().length === 0) {
    console.warn(`⚠️ User phone not configured. Skipping missed delivery notification for user ${userId}`);
    return false;
  }

  const message = `
⚠️ *DELIVERY COULD NOT BE COMPLETED* ⚠️

We apologize! Your scheduled delivery on ${deliveryDate} at ${deliveryTime} could not be completed.

📞 Please contact our support team to reschedule or get assistance.

Subscription ID: ${subscriptionId}

We regret the inconvenience!
-RotiHai Team
  `.trim();

  // Non-blocking - fire and forget
  sendWhatsAppMessage(userPhone, message).catch(error => {
    console.error(`⚠️ Failed to send missed delivery notification for subscription ${subscriptionId}:`, error);
  });

  return true;
}
