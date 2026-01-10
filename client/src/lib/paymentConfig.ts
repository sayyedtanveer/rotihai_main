/**
 * Payment Configuration
 * Centralized config for all payment-related settings
 * 
 * Note: Uses import.meta.env for Vite (not process.env which is Node.js only)
 */

// UPI Details for payment
export const PAYMENT_CONFIG = {
  // UPI ID for receiving payments
  upiId: import.meta.env.VITE_UPI_ID || "sayyedtanveer1410-1@oksbi",
  
  // Merchant name to display in payment apps
  merchantName: "RotiHai",
  
  // Merchant phone number for callbacks (optional but recommended for some apps)
  merchantPhone: import.meta.env.VITE_MERCHANT_PHONE || "9773765103",
  
  // Support phone number
  supportPhone: "918169020290",
};

/**
 * Validate UPI ID format
 * Valid format: name@bank (e.g., user@paytm, user@oksbi)
 */
export function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
}

/**
 * Validate phone number format (Indian format)
 */
export function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}
