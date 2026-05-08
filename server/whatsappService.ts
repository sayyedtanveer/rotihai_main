import axios from "axios";
import { formatTime12Hour } from "../shared/timeFormatter";

// WhatsApp API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

// 🔍 Log environment variables at module load time
console.log("\n================================================================================");
console.log("📱 [WHATSAPP-CONFIG] Environment Variables Loaded at Module Init:");
console.log("================================================================================");
console.log(`✅ WHATSAPP_API_URL: ${WHATSAPP_API_URL ? "SET" : "❌ MISSING"}`);
console.log(`   Value: ${WHATSAPP_API_URL}`);
console.log(`✅ WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID ? "SET" : "❌ MISSING"}`);
console.log(`   Value: ${WHATSAPP_PHONE_NUMBER_ID}`);
console.log(`✅ WHATSAPP_API_TOKEN: ${WHATSAPP_API_TOKEN ? "SET" : "❌ MISSING"}`);
console.log(`   Length: ${WHATSAPP_API_TOKEN.length} chars`);
console.log(`   First 20 chars: ${WHATSAPP_API_TOKEN.substring(0, 20)}...`);
console.log(`   Last 20 chars: ...${WHATSAPP_API_TOKEN.substring(WHATSAPP_API_TOKEN.length - 20)}`);
console.log("================================================================================\n");

function getWhatsAppMessagesEndpoint(): string {
  const baseUrl = WHATSAPP_API_URL.replace(/\/$/, "");

  if (baseUrl.endsWith("/messages")) {
    return baseUrl;
  }

  if (WHATSAPP_PHONE_NUMBER_ID && !baseUrl.endsWith(`/${WHATSAPP_PHONE_NUMBER_ID}`)) {
    return `${baseUrl}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  }

  return `${baseUrl}/messages`;
}

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
    console.warn(`\n⚠️ [WHATSAPP] Service NOT configured - skipping message to ${phoneNumber}`);
    console.warn(`   WHATSAPP_API_URL: ${WHATSAPP_API_URL ? "✅ Set" : "❌ Missing"}`);
    console.warn(`   WHATSAPP_API_TOKEN: ${WHATSAPP_API_TOKEN ? "✅ Set" : "❌ Missing"}`);
    console.warn(`   WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID ? "✅ Set" : "❌ Missing"}`);
    console.warn(`   To enable: Configure these in .env file\n`);
    return false;
  }

  try {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    
    console.log("\n================================================================================");
    console.log(`📱 [WHATSAPP-REQUEST] Sending message to: ${phoneNumber}`);
    console.log("================================================================================");
    console.log(`📞 Cleaned phone: ${cleanPhone}`);
    console.log(`📝 Message length: ${message.length} chars`);
    console.log(`📍 API Base URL: ${WHATSAPP_API_URL}`);
    
    // 🔐 Log token info
    console.log(`\n🔐 [TOKEN-DEBUG]`);
    console.log(`   Token exists: ${WHATSAPP_API_TOKEN ? "✅ YES" : "❌ NO"}`);
    console.log(`   Token length: ${WHATSAPP_API_TOKEN.length} chars`);
    console.log(`   Token first 30: ${WHATSAPP_API_TOKEN.substring(0, 30)}...`);
    console.log(`   Token last 30: ...${WHATSAPP_API_TOKEN.substring(Math.max(0, WHATSAPP_API_TOKEN.length - 30))}`);
    
    // 🆔 Log phone ID info
    console.log(`\n🆔 [PHONE-ID-DEBUG]`);
    console.log(`   Phone ID exists: ${WHATSAPP_PHONE_NUMBER_ID ? "✅ YES" : "❌ NO"}`);
    console.log(`   Phone ID value: ${WHATSAPP_PHONE_NUMBER_ID}`);
    console.log(`   Phone ID length: ${WHATSAPP_PHONE_NUMBER_ID.length} chars`);

    const payload: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    console.log(`\n📤 [PAYLOAD-DEBUG]`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));

    const endpoint = getWhatsAppMessagesEndpoint();
    console.log(`\n🔗 [ENDPOINT-DEBUG]`);
    console.log(`   Full endpoint: ${endpoint}`);
    console.log(`   Method: POST`);

    // 📋 Log request headers
    const requestHeaders = {
      Authorization: `Bearer ${WHATSAPP_API_TOKEN.substring(0, 20)}...${WHATSAPP_API_TOKEN.substring(WHATSAPP_API_TOKEN.length - 20)}`,
      "Content-Type": "application/json",
    };
    console.log(`\n📋 [HEADERS-DEBUG]`);
    console.log(`   Authorization (masked): Bearer ${WHATSAPP_API_TOKEN.substring(0, 20)}...`);
    console.log(`   Content-Type: application/json`);
    console.log(`   Full Authorization length: ${WHATSAPP_API_TOKEN.length} chars`);

    console.log(`\n⏳ [REQUEST-STATUS] Making HTTP POST request...`);
    
    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const msgId = response.data?.messages?.[0]?.id;
    console.log(`\n✅ [WHATSAPP-SUCCESS]`);
    console.log(`   Message sent successfully!`);
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    console.log(`   Message ID: ${msgId}`);
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Response data:`, JSON.stringify(response.data, null, 2));
    console.log("================================================================================\n");
    return true;
  } catch (error) {
    console.error(`\n================================================================================`);
    console.error(`❌ [WHATSAPP-ERROR] Failed to send message to ${phoneNumber}`);
    console.error(`================================================================================`);
    
    if (axios.isAxiosError(error)) {
      console.error(`📊 [ERROR-DETAILS]`);
      console.error(`   Status Code: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Method: ${error.config?.method}`);
      
      // Log request headers (masked)
      if (error.config?.headers) {
        console.error(`   Request Headers:`, JSON.stringify({
          Authorization: `Bearer ${WHATSAPP_API_TOKEN.substring(0, 20)}...`,
          "Content-Type": error.config.headers["Content-Type"],
        }, null, 2));
      }
      
      // Log response data
      if (error.response?.data) {
        console.error(`   Response Body:`, JSON.stringify(error.response.data, null, 2));
      }
      
      // Log error codes
      console.error(`   Error Code: ${error.code}`);
      
    } else if (error instanceof Error) {
      console.error(`   Type: ${error.name}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   Error (unknown type): ${JSON.stringify(error)}`);
    }
    
    console.error(`\n⚠️ [POSSIBLE-CAUSES]`);
    console.error(`   • Token has expired or been revoked`);
    console.error(`   • Phone number ID is incorrect`);
    console.error(`   • Invalid recipient phone number`);
    console.error(`   • WhatsApp API endpoint changed`);
    console.error(`   • Network connectivity issue`);
    console.error("================================================================================\n");
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
  adminPhone?: string | null,
  items?: Array<{ name: string; quantity: number; price: number }>,
  address?: string
): Promise<boolean> {
  console.log(`\n📱 [WHATSAPP-ADMIN-ORDER] Starting order notification for ${orderId}`);
  
  // Gracefully handle missing phone number
  if (!adminPhone || typeof adminPhone !== "string" || adminPhone.trim().length === 0) {
    console.warn(`❌ [WHATSAPP-ADMIN-ORDER] Admin phone not configured!`);
    console.warn(`   Phone value: ${adminPhone}`);
    console.warn(`   Type: ${typeof adminPhone}`);
    console.warn(`   Length: ${adminPhone?.length || 0}`);
    console.warn(`   Order ${orderId} notification SKIPPED - no admin phone to send to`);
    return false;
  }

  console.log(`✅ [WHATSAPP-ADMIN-ORDER] Admin phone found: ${adminPhone}`);
  console.log(`   Order: ${orderId}`);
  console.log(`   Customer: ${userName}`);
  console.log(`   Amount: ₹${amount}`);
  console.log(`   Items: ${items?.length || 0} item(s)`);
  console.log(`   Address: ${address ? "✅ Provided" : "❌ Missing"}`);

  // Format items list
  let itemsList = "";
  if (items && items.length > 0) {
    itemsList = items
      .map((item) => `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`)
      .join("\n");
  } else {
    itemsList = "• No items provided";
  }

  // Build message with items and address
  const message = `
📦 *NEW ORDER RECEIVED* 📦

Order #: ${orderId}
Customer: ${userName}
Amount: ₹${amount}

📋 *Items:*
${itemsList}

📍 *Delivery Address:*
${address || "Address not provided"}

🔗 View in dashboard to approve payment

-RotiHai Admin System
  `.trim();

  console.log(`📝 [WHATSAPP-ADMIN-ORDER] Message prepared: ${message.length} chars`);

  // Non-blocking - fire and forget
  sendWhatsAppMessage(adminPhone, message).catch(error => {
    console.error(`❌ [WHATSAPP-ADMIN-ORDER] Failed to send admin notification for order ${orderId}:`, error);
  });

  console.log(`📤 [WHATSAPP-ADMIN-ORDER] WhatsApp message queued for sending (non-blocking)\n`);
  return true;
}

/**
 * Send WhatsApp notification to admin when a customer clicks "I Paid"
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendPaymentInitiatedAdminNotification(
  checkoutOrOrderId: string,
  userName: string,
  userPhone: string,
  amount: number,
  adminPhone?: string | null
): Promise<boolean> {
  if (!adminPhone || typeof adminPhone !== "string" || adminPhone.trim().length === 0) {
    console.warn(`Admin phone not configured. Skipping payment initiated notification for ${checkoutOrOrderId}`);
    return false;
  }

  const safeAmount = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const message = `
*PAYMENT MARKED BY USER*

Order/Checkout ID: ${checkoutOrOrderId}
Customer: ${userName || "Unknown"}
Phone: ${userPhone || "Not provided"}
Amount: Rs.${safeAmount}

User clicked "I Paid". Please verify payment in Admin > Payments.

-RotiHai Admin System
  `.trim();

  sendWhatsAppMessage(adminPhone, message).catch(error => {
    console.error(`Failed to send payment initiated admin notification for ${checkoutOrOrderId}:`, error);
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

  // Send to each delivery person (non-blocking, fire and forget)
  for (const deliveryPersonId of deliveryPersonIds) {
    const phone = deliveryPersonPhones.get(deliveryPersonId);
    
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      console.warn(`⚠️ Phone not found for delivery person ${deliveryPersonId}, skipping notification`);
      continue;
    }

    sendWhatsAppMessage(phone, message)
      .catch(error => {
        console.error(`⚠️ Failed to send delivery notification to ${deliveryPersonId}:`, error);
      });
  }

  // Return number of delivery persons notified (fire-and-forget doesn't wait for completion)
  return deliveryPersonIds.length;
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
