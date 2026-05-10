import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 WhatsApp Test Configuration:');
console.log(`   API URL: ${WHATSAPP_API_URL}`);
console.log(`   Phone ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
console.log(`   Token: ${WHATSAPP_API_TOKEN ? '✅ Set' : '❌ Missing'}`);

if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  console.error('❌ Missing WhatsApp credentials in .env');
  process.exit(1);
}

const adminPhone = '918169020290';  // Your admin phone from DB
const testMessage = `
🧪 *TEST MESSAGE* 🧪

This is a test WhatsApp message from RotiHai
Sent at: ${new Date().toLocaleString()}

If you received this, WhatsApp integration is working! ✅
`.trim();

async function sendTestMessage() {
  try {
    const endpoint = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    console.log(`\n📤 Sending test message to: ${adminPhone}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await axios.post(
      endpoint,
      {
        messaging_product: 'whatsapp',
        to: adminPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: testMessage,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    console.log(`\n✅ TEST MESSAGE SENT SUCCESSFULLY!`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   To: ${adminPhone}`);
    console.log(`   Status Code: ${response.status}`);
    console.log(`\n📱 Check your WhatsApp phone for the message!`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ FAILED TO SEND TEST MESSAGE:`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error(`\n⚠️  ERROR 400: Bad Request`);
        console.error(`   - Check if phone number is in correct format (country code + number)`);
        console.error(`   - Verify WHATSAPP_PHONE_NUMBER_ID is correct`);
      }
      
      if (error.response.data?.error?.code === 131030) {
        console.error(`\n⚠️  ERROR 131030: Recipient not in allowed list`);
        console.error(`   - Your WhatsApp is in SANDBOX MODE`);
        console.error(`   - Add ${adminPhone} to "Allowed Test Numbers" in Meta Business Manager`);
        console.error(`   - Or upgrade to production WhatsApp API`);
      }
      
      if (error.response.status === 401) {
        console.error(`\n⚠️  ERROR 401: Unauthorized`);
        console.error(`   - Your WHATSAPP_API_TOKEN may have expired`);
        console.error(`   - Generate a new token in Meta Business Manager`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
    
    process.exit(1);
  }
}

sendTestMessage();
