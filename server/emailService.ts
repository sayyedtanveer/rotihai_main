import { Resend } from "resend";

let resend: Resend | null = null;

// Initialize Resend transporter
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ Email service initialized with Resend");
  console.log("[EMAIL] API Key configured: " + (process.env.RESEND_API_KEY?.substring(0, 10) + "..."));
} else {
  console.warn(
    "⚠️ Email service not configured. Set RESEND_API_KEY environment variable."
  );
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

/* ============================================
   SEND EMAIL (COMMON FUNCTION)
============================================ */
export async function sendEmail({ to, subject, html }: EmailTemplate) {
  if (!resend) {
    console.warn("⚠️ Email service not configured. Skipping email:", to);
    return false;
  }

  // === STEP 1: Log email start ===
  console.log("\n" + "=".repeat(60));
  console.log("📧 [EMAIL] STEP 1️⃣ - Starting email send");
  console.log("   To: " + to);
  console.log("   Subject: " + subject);
  console.log("   HTML Size: " + html.length + " chars");

  try {
    // === STEP 2: Call Resend API ===
    console.log("📧 [EMAIL] STEP 2️⃣ - Calling Resend API...");
    const response = await resend.emails.send({
      from: `RotiHai <noreply@rotihai.com>`,
      to,
      subject,
      html,
    });

    // === STEP 3: Check response ===
    console.log("📧 [EMAIL] STEP 3️⃣ - Resend API Response:");
    console.log("   Status: " + (response.error ? "ERROR" : "OK"));
    console.log("   Response: " + JSON.stringify(response));

    if (response.error) {
      // === EMAIL FAILED ===
      console.error(
        "❌ [EMAIL-FAILED] Email send failed for: " + to
      );
      console.error("❌ [EMAIL-ERROR] Error: " + JSON.stringify(response.error));
      console.log("=".repeat(60) + "\n");
      return false;
    }

    // === EMAIL SENT SUCCESSFULLY ===
    if (response && !response.error) {
      const messageId = (response as any).id;
      console.log("✅ [EMAIL-SUCCESS] Email sent successfully!");
      if (messageId) {
        console.log("   Message ID: " + messageId);
      }
      console.log("   To: " + to);
      console.log("   Subject: " + subject);
      console.log("=".repeat(60) + "\n");
      return true;
    }

    console.warn("⚠️ [EMAIL-WARNING] No message ID returned from Resend");
    console.log("=".repeat(60) + "\n");
    return false;
  } catch (error: any) {
    // === EMAIL EXCEPTION ===
    console.error("❌ [EMAIL-EXCEPTION] Email send threw error");
    console.error("❌ Error Type: " + error.constructor.name);
    console.error("❌ Error Message: " + error.message);
    console.error("❌ Error Stack: " + error.stack);
    console.error(
      "❌ Full Error: " + JSON.stringify(error, null, 2)
    );
    console.log("=".repeat(60) + "\n");
    return false;
  }
}

/* ============================================
   WELCOME EMAIL TEMPLATE
============================================ */
export function createWelcomeEmail(
  name: string,
  phone: string,
  password: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; line-height:1.6; color:#333; }
        .container { max-width:600px; margin:0 auto; padding:20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome ${name}! 👋</h2>
        <p>Your account has been created successfully.</p>

        <h3>Your Password:</h3>
        <div style="font-size:24px; font-weight:bold;">${password}</div>

        <p>Use this with phone: <b>${phone}</b></p>
      </div>
    </body>
    </html>
  `;
}

/* ============================================
   PASSWORD RESET EMAIL (SINGLE FINAL VERSION)
============================================ */
export function createPasswordResetEmail(
  name: string,
  phone: string,
  newPassword: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>Your new temporary password is:</p>

      <div style="
          padding: 15px;
          background: #eee;
          border-radius: 6px;
          width: fit-content;
        ">
        <b style="font-size: 24px;">${newPassword}</b>
      </div>

      <p>
        Use it to login with phone: <b>${phone}</b><br>
        Please change it after logging in.
      </p>
    </body>
    </html>
  `;
}

/* ============================================
   ADMIN PASSWORD RESET EMAIL
============================================ */
export function createAdminPasswordResetEmail(
  username: string,
  tempPassword: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>🔐 Admin Password Reset</h2>
      <p>Hello ${username},</p>
      <p>Your password has been reset by the Super Admin. Your new temporary password is:</p>

      <div style="
          padding: 15px;
          background: #f0f0f0;
          border-radius: 6px;
          width: fit-content;
          margin: 15px 0;
        ">
        <b style="font-size: 20px; letter-spacing: 2px;">${tempPassword}</b>
      </div>

      <p>
        <strong>Login credentials:</strong><br>
        • Username: <b>${username}</b><br>
        • Password: <b>${tempPassword}</b><br>
      </p>

      <p style="color: #d32f2f; font-weight: bold;">
        ⚠️ Please change this password immediately after logging in for security.
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This is an automated message from RotiHai Admin System.
      </p>
    </body>
    </html>
  `;
}

/* ============================================
   PASSWORD CHANGE CONFIRMATION
============================================ */
export function createPasswordChangeConfirmationEmail(
  name: string,
  phone: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>Password Changed Successfully</h2>
      <p>Hello ${name},</p>
      <p>Your password for <b>${phone}</b> has been updated.</p>
    </body>
    </html>
  `;
}

/* ============================================
   SEND WELCOME EMAIL
============================================ */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  phone: string,
  password: string
) {
  return sendEmail({
    to: email,
    subject: "Welcome to RotiHai 🎉",
    html: createWelcomeEmail(name, phone, password),
  });
}

/* ============================================
   COMBINED WELCOME + ORDER CONFIRMATION EMAIL
============================================ */
export interface OrderEmailParams {
  customerName: string;
  phone: string;
  password: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
}

export function createOrderConfirmationEmail(params: OrderEmailParams) {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${item.name}</td>
          <td style="text-align: center; padding: 8px;">x${item.quantity}</td>
          <td style="text-align: right; padding: 8px;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b35; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .section { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 6px; }
        .account-info { background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .password-box { background: white; border: 2px solid #4caf50; padding: 15px; border-radius: 6px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #ff6b35; padding: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <h1 style="margin: 0;">🎉 Welcome to RotiHai!</h1>
          <p style="margin: 5px 0;">Your Order is Confirmed</p>
        </div>

        <!-- ACCOUNT CREATION SECTION -->
        <div class="account-info">
          <h3 style="margin-top: 0;">👤 Your Account Created</h3>
          <p>Hello <b>${params.customerName}</b>,</p>
          <p>An account has been created for you with the following credentials:</p>
          
          <div class="password-box">
            <strong>Phone:</strong> ${params.phone}<br>
            <strong>Password:</strong> <span style="font-size: 18px; font-weight: bold; color: #4caf50;">${params.password}</span>
          </div>
          
          <p style="font-size: 12px; color: #666;">
            💡 Save this password. You'll need it to login and track your orders.
          </p>
        </div>

        <!-- ORDER CONFIRMATION SECTION -->
        <div class="section">
          <h3 style="margin-top: 0;">📦 Your Order Details</h3>
          
          <p><strong>Order ID:</strong> ${params.orderId}</p>
          
          <table>
            <thead>
              <tr style="background: #f0f0f0; border-bottom: 2px solid #ff6b35;">
                <th style="text-align: left; padding: 10px;">Item</th>
                <th style="text-align: center; padding: 10px;">Qty</th>
                <th style="text-align: right; padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table style="margin-top: 15px;">
            <tr>
              <td style="text-align: right; padding: 8px;">Subtotal:</td>
              <td style="text-align: right; padding: 8px; width: 100px;">₹${params.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="text-align: right; padding: 8px;">Delivery Fee:</td>
              <td style="text-align: right; padding: 8px;">₹${params.deliveryFee.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: right; padding: 10px;">Total Amount:</td>
              <td style="text-align: right; padding: 10px; color: #ff6b35;">₹${params.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- DELIVERY DETAILS -->
        <div class="section">
          <h3 style="margin-top: 0;">🏠 Delivery Address</h3>
          <p>${params.deliveryAddress}</p>
          ${
            params.estimatedDeliveryTime
              ? `<p><strong>⏱️ Estimated Delivery:</strong> ${params.estimatedDeliveryTime}</p>`
              : ""
          }
        </div>

        <!-- FOOTER -->
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>Thank you for ordering with RotiHai! 🙏</p>
          <p>Questions? Contact us or check your account dashboard.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/* ============================================
   SEND ORDER CONFIRMATION EMAIL
============================================ */
export async function sendOrderConfirmationEmail(
  email: string,
  params: OrderEmailParams
) {
  return sendEmail({
    to: email,
    subject: `🎉 Welcome & Order Confirmation - Order #${params.orderId}`,
    html: createOrderConfirmationEmail(params),
  });
}

/* ============================================
   MISSED DELIVERY EMAIL TEMPLATE
============================================ */
export function createMissedDeliveryEmail(
  name: string,
  deliveryDate: string,
  deliveryTime: string,
  subscriptionId: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; line-height:1.6; color:#333; }
        .container { max-width:600px; margin:0 auto; padding:20px; border: 1px solid #ddd; }
        .alert { background-color:#fff3cd; border:1px solid #ffc107; padding:15px; border-radius:5px; margin:20px 0; }
        .details { background-color:#f5f5f5; padding:15px; border-radius:5px; margin:15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Delivery Issue - We Apologize ⚠️</h2>
        <p>Hello <b>${name}</b>,</p>
        
        <div class="alert">
          <p><b>Your scheduled delivery on ${deliveryDate} at ${deliveryTime} could not be completed.</b></p>
        </div>

        <div class="details">
          <h3>Delivery Details:</h3>
          <ul>
            <li><b>Date:</b> ${deliveryDate}</li>
            <li><b>Time:</b> ${deliveryTime}</li>
            <li><b>Subscription ID:</b> ${subscriptionId}</li>
          </ul>
        </div>

        <h3>What can you do?</h3>
        <ul>
          <li>📞 Contact our support team to reschedule</li>
          <li>⏭️ Skip this delivery to adjust your schedule</li>
          <li>💬 Chat with us in the app for immediate assistance</li>
        </ul>

        <p style="color:#666; font-size:12px; margin-top:30px;">
          We regret the inconvenience. Thank you for your patience!<br>
          <b>RotiHai - घर की रोटी</b>
        </p>
      </div>
    </body>
    </html>
  `;
}

/* ============================================
   SEND MISSED DELIVERY EMAIL
============================================ */
export async function sendMissedDeliveryEmail(
  email: string,
  name: string,
  deliveryDate: string,
  deliveryTime: string,
  subscriptionId: string
) {
  return sendEmail({
    to: email,
    subject: "Your Delivery Could Not Be Completed ⚠️",
    html: createMissedDeliveryEmail(name, deliveryDate, deliveryTime, subscriptionId),
  });
}
