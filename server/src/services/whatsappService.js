import axios from 'axios';
import logger from '../utils/logger.js';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // From Meta Dashboard
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID; // From Meta Dashboard

export async function sendMessage(to, text) {
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
    logger.info('WhatsApp message sent successfully', { to });
  } catch (error) {
    logger.error('WhatsApp message send failed', { 
      error: error.message,
      response: error.response?.data,
      statusCode: error.response?.status
    });
  }
}

export default { sendMessage };
