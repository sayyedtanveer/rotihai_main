import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

// Initialize transporter
if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  console.log("✅ Email service initialized with Gmail:", process.env.GMAIL_USER);
} else {
  console.warn(
    "⚠️ Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD."
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
  if (!transporter) {
    console.warn("⚠️ Email service not configured. Skipping email:", to);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"RotiHai - घर की रोटी" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err);
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
