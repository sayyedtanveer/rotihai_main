import axios from "axios";
import { formatTime12Hour } from "../shared/timeFormatter";

// WhatsApp API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

// Template Configuration (optional, for business-initiated messages outside 24h window)
const WHATSAPP_TEMPLATE_ORDER_ADMIN = process.env.WHATSAPP_TEMPLATE_ORDER_ADMIN || "";
const WHATSAPP_TEMPLATE_PAYMENT_ADMIN = process.env.WHATSAPP_TEMPLATE_PAYMENT_ADMIN || "";
const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

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

interface WhatsAppTextMessage {
  messaging_product: string;
  to: string;
  type: "text";
  text: {
    preview_url: boolean;
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: string;
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: "body";
      parameters: Array<{
        type: "text";
        text: string;
      }>;
    }>;
  };
}

type WhatsAppMessage = WhatsAppTextMessage | WhatsAppTemplateMessage;

export async function sendWhatsAppMessage(phoneNumber: string, message: string, contextId?: string): Promise<boolean> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("[WHATSAPP] Service not configured. Skipping message.");
    return false;
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const maskedPhone = cleanPhone.length > 4
    ? `${"*".repeat(cleanPhone.length - 4)}${cleanPhone.slice(-4)}`
    : "****";

  const endpoint = getWhatsAppMessagesEndpoint();
  const contextLog = contextId ? ` [${contextId}]` : "";

  try {
    // ✅ LOG BEFORE SENDING: Request details
    console.log(`[WHATSAPP] 📤 SENDING REQUEST${contextLog}`);
    console.log(`  → To: ${maskedPhone}`);
    console.log(`  → Endpoint: ${endpoint}`);
    console.log(`  → Phone ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
    console.log(`  → Auth Token: ${WHATSAPP_API_TOKEN ? "✅ Present" : "❌ Missing"}`);
    console.log(`  → Message length: ${message.length} chars`);

    const payload: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

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

    // ✅ LOG ON SUCCESS: ONLY AFTER axios resolves with 200
    const messageId = response.data?.messages?.[0]?.id;
    console.log(`[WHATSAPP] ✅ META API SUCCESS${contextLog}`);
    console.log(`  → Message ID: ${messageId || "unknown"}`);
    console.log(`  → Recipient: ${maskedPhone}`);
    console.log(`  → Status Code: ${response.status}`);
    return true;
  } catch (error) {
    // ❌ LOG ON FAILURE: Full error details for debugging
    console.error(`[WHATSAPP] ❌ META API FAILED${contextLog}`);
    console.error(`  → Recipient: ${maskedPhone}`);
    
    if (axios.isAxiosError(error)) {
      console.error(`  → HTTP Status: ${error.response?.status || "unknown"}`);
      console.error(`  → Message: ${error.message}`);
      
      if (error.response?.data) {
        console.error(`  → RAW ERROR RESPONSE:`, JSON.stringify(error.response.data, null, 2));
        
        // Extract Meta error code for easier debugging
        const metaError = error.response.data as any;
        if (metaError?.error?.code) {
          console.error(`  → Meta Error Code: ${metaError.error.code}`);
          console.error(`  → Meta Error Message: ${metaError.error.message}`);
          
          if (metaError.error.code === 131030) {
            console.error(`  → 🔍 HINT: Error 131030 = "Recipient not in allowed list" (Sandbox mode)`);
            console.error(`     → Add ${maskedPhone} to WhatsApp Test Numbers in Meta Business Manager`);
          }
        }
      }
    } else if (error instanceof Error) {
      console.error(`  → Error: ${error.message}`);
    } else {
      console.error(`  → Error: ${JSON.stringify(error)}`);
    }

    return false;
  }
}

/**
 * Send WhatsApp template message for business-initiated messages outside 24h conversation window
 * Falls back to text message if template is not configured or fails
 */
export async function sendWhatsAppTemplateMessage(
  phoneNumber: string,
  templateName: string,
  templateParams: string[],
  fallbackMessage: string,
  contextId?: string
): Promise<boolean> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("[WHATSAPP] Service not configured. Skipping message.");
    return false;
  }

  // If template not configured, use text mode
  if (!templateName || !templateName.trim()) {
    console.log(`[WHATSAPP] 📝 Template not configured. Using text mode as fallback.${contextId ? ` [${contextId}]` : ""}`);
    return sendWhatsAppMessage(phoneNumber, fallbackMessage, contextId);
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const maskedPhone = cleanPhone.length > 4
    ? `${"*".repeat(cleanPhone.length - 4)}${cleanPhone.slice(-4)}`
    : "****";

  const endpoint = getWhatsAppMessagesEndpoint();
  const contextLog = contextId ? ` [${contextId}]` : "";

  try {
    // ✅ LOG BEFORE SENDING: Template request details
    console.log(`[WHATSAPP] 📤 SENDING TEMPLATE REQUEST${contextLog}`);
    console.log(`  → To: ${maskedPhone}`);
    console.log(`  → Template: ${templateName}`);
    console.log(`  → Language: ${WHATSAPP_TEMPLATE_LANGUAGE}`);
    console.log(`  → Parameters: ${templateParams.length} variable(s)`);
    console.log(`  → Endpoint: ${endpoint}`);

    const payload: WhatsAppTemplateMessage = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: WHATSAPP_TEMPLATE_LANGUAGE,
        },
        components: [
          {
            type: "body",
            parameters: templateParams.map(param => ({
              type: "text",
              text: param,
            })),
          },
        ],
      },
    };

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

    // ✅ LOG ON SUCCESS: ONLY AFTER axios resolves with 200
    const messageId = response.data?.messages?.[0]?.id;
    console.log(`[WHATSAPP] ✅ TEMPLATE API SUCCESS${contextLog}`);
    console.log(`  → Message ID: ${messageId || "unknown"}`);
    console.log(`  → Recipient: ${maskedPhone}`);
    console.log(`  → Status Code: ${response.status}`);
    return true;
  } catch (error) {
    // ❌ LOG ON FAILURE: Attempt text fallback
    console.error(`[WHATSAPP] ⚠️ TEMPLATE API FAILED${contextLog}`);
    console.error(`  → Recipient: ${maskedPhone}`);
    
    if (axios.isAxiosError(error)) {
      console.error(`  → HTTP Status: ${error.response?.status || "unknown"}`);
      console.error(`  → Message: ${error.message}`);
      
      if (error.response?.data) {
        const metaError = error.response.data as any;
        if (metaError?.error?.message) {
          console.error(`  → Meta Error: ${metaError.error.message}`);
        }
      }
    }

    // Fallback: try text message
    console.log(`[WHATSAPP] 🔄 FALLING BACK TO TEXT MESSAGE${contextLog}`);
    return sendWhatsAppMessage(phoneNumber, fallbackMessage, `${contextId}|FALLBACK`);
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
 * Uses Meta template if configured, falls back to text mode
 * Non-blocking, fire-and-forget with graceful error handling
 */
export async function sendOrderPlacedAdminNotification(
  orderId: string,
  userName: string,
  amount: number,
  adminPhone?: string | null,
  items?: Array<{ name: string; quantity: number; price: number }>,
  address?: string,
  customerPhone?: string | null,
  deliveryTime?: string | null
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

  // Build complete message with all order details (used in both template fallback and text mode)
  const textMessage = `
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

  console.log(`📝 [WHATSAPP-ADMIN-ORDER] Message prepared: ${textMessage.length} chars`);

  // Non-blocking - fire and forget (actual async result visible in logs)
  if (WHATSAPP_TEMPLATE_ORDER_ADMIN) {
    // Use template mode if configured
    console.log(`[WHATSAPP-ADMIN-ORDER] Using template mode: ${WHATSAPP_TEMPLATE_ORDER_ADMIN}`);
    const templateParams = [
      orderId,                              // {{1}} Order ID
      userName,                             // {{2}} Customer
      customerPhone || "N/A",               // {{3}} Phone
      amount.toString(),                    // {{4}} Amount
      itemsList,                            // {{5}} Items
      deliveryTime || "ASAP",               // {{6}} Delivery Time
      address || "Address not provided",    // {{7}} Address
    ];
    sendWhatsAppTemplateMessage(adminPhone, WHATSAPP_TEMPLATE_ORDER_ADMIN, templateParams, textMessage, `ORDER#${orderId}`).catch(error => {
      console.error(`[WHATSAPP-ADMIN-ORDER] Async error caught:`, error);
    });
  } else {
    // Use text mode (default, backward compatible)
    console.log(`[WHATSAPP-ADMIN-ORDER] Using text mode (template not configured)`);
    sendWhatsAppMessage(adminPhone, textMessage, `ORDER#${orderId}`).catch(error => {
      console.error(`[WHATSAPP-ADMIN-ORDER] Async error caught:`, error);
    });
  }

  console.log(`[WHATSAPP-ADMIN-ORDER] ⏳ Background send initiated (check logs for async success/failure)\n`);
  return true;
}

/**
 * Send WhatsApp notification to admin when a customer clicks "I Paid"
 * Uses Meta template if configured, falls back to text mode
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
  const textMessage = `
*PAYMENT MARKED BY USER*

Order/Checkout ID: ${checkoutOrOrderId}
Customer: ${userName || "Unknown"}
Phone: ${userPhone || "Not provided"}
Amount: Rs.${safeAmount}

User clicked "I Paid". Please verify payment in Admin > Payments.

-RotiHai Admin System
  `.trim();

  // Non-blocking - fire and forget
  if (WHATSAPP_TEMPLATE_PAYMENT_ADMIN) {
    // Use template mode if configured
    console.log(`[WHATSAPP-PAYMENT] Using template mode: ${WHATSAPP_TEMPLATE_PAYMENT_ADMIN}`);
    const templateParams = [
      checkoutOrOrderId,
      userName || "Unknown",
      userPhone || "Not provided",
      safeAmount,
    ];
    sendWhatsAppTemplateMessage(adminPhone, WHATSAPP_TEMPLATE_PAYMENT_ADMIN, templateParams, textMessage, `PAYMENT#${checkoutOrOrderId}`).catch(error => {
      console.error(`[WHATSAPP-PAYMENT] Async error caught:`, error);
    });
  } else {
    // Use text mode (default, backward compatible)
    console.log(`[WHATSAPP-PAYMENT] Using text mode (template not configured)`);
    sendWhatsAppMessage(adminPhone, textMessage, `PAYMENT#${checkoutOrOrderId}`).catch(error => {
      console.error(`[WHATSAPP-PAYMENT] Async error caught:`, error);
    });
  }

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
