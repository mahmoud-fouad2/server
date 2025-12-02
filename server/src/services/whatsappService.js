const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // From Meta Dashboard
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID; // From Meta Dashboard

async function sendMessage(to, text) {
  try {
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
      },
    });
    console.log(`WhatsApp response sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
  }
}

module.exports = { sendMessage };
