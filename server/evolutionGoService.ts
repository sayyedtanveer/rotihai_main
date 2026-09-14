import axios from "axios";

export async function sendEvolutionTextMessage(phone: string, text: string): Promise<boolean> {
  try {
    const baseUrl = process.env.EVOLUTION_GO_BASE_URL;
    const apiKey = process.env.EVOLUTION_GO_API_KEY;
    const instance = process.env.EVOLUTION_GO_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
      console.warn("⚠️ [EVOLUTION-GO] Missing configuration: EVOLUTION_GO_BASE_URL, EVOLUTION_GO_API_KEY, or EVOLUTION_GO_INSTANCE.");
      return false;
    }

    // Clean phone number (strip spaces, +, etc)
    const cleanPhone = phone.replace(/\D/g, "");

    // Evolution Go /message/sendText endpoint
    const url = `${baseUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
    
    console.log(`[EVOLUTION-GO] Sending message to ${cleanPhone}...`);
    
    const response = await axios.post(
      url,
      {
        number: cleanPhone,
        text: text,
        delay: 1000,
        linkPreview: false
      },
      {
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json"
        },
        // Don't throw error on non-200 responses, we'll handle it
        validateStatus: () => true 
      }
    );

    if (response.status >= 200 && response.status < 300) {
      console.log(`[EVOLUTION-GO] ✅ Message successfully sent to ${cleanPhone}.`);
      return true;
    } else {
      console.error(`[EVOLUTION-GO] ❌ Failed to send message to ${cleanPhone}. Status: ${response.status}`);
      console.error(`[EVOLUTION-GO] Response:`, response.data);
      return false;
    }

  } catch (error: any) {
    console.error("[EVOLUTION-GO] ❌ Error sending message:", error.message || error);
    return false;
  }
}
