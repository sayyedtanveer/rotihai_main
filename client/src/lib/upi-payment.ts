import QRCode from "qrcode";

export interface UPIPaymentParams {
  upiId: string;
  name: string;
  amount: number;
  transactionNote: string;
}

/**
 * Generates UPI intent string for payment
 * For personal accounts: uses UPIID only (NO amount) to avoid merchant validation
 * Bank validation is triggered by including amount - user enters amount manually in app
 * Format: upi://pay?pa=<UPI_ID>
 */
export function generateUPIIntent({
  upiId,
  name,
  amount,
  transactionNote,
}: UPIPaymentParams): string {
  // CRITICAL: Do NOT include amount (am) parameter
  // Including amount triggers merchant validation which blocks personal accounts
  // Bank will show limit errors even for ₹1 transfers
  // User will manually enter amount in their UPI app
  const params = new URLSearchParams({
    pa: upiId,
    cu: "INR",
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates QR code data URL from UPI intent
 */
export async function generateUPIQRCode(
  upiIntent: string
): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(upiIntent, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Opens UPI payment app directly (for mobile users)
 */
export function openUPIApp(upiIntent: string): void {
  window.location.href = upiIntent;
}

/**
 * Detects if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Gets deep link for specific payment app
 */
export function getPaymentAppDeepLink(
  app: "gpay" | "phonepe" | "paytm",
  upiIntent: string
): string {
  const encodedIntent = encodeURIComponent(upiIntent);

  switch (app) {
    case "gpay":
      return `tez://upi/pay?${upiIntent.replace("upi://pay?", "")}`;
    case "phonepe":
      return `phonepe://pay?${upiIntent.replace("upi://pay?", "")}`;
    case "paytm":
      return `paytmmp://pay?${upiIntent.replace("upi://pay?", "")}`;
    default:
      return upiIntent;
  }
}
