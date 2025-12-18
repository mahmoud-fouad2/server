import axios from 'axios';
import logger from '../utils/logger.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

class TelegramService {
  /**
   * Set the webhook for a specific bot token
   * @param {string} token - The Telegram Bot Token
   * @param {string} webhookUrl - The URL where Telegram should send updates
   */
  async setWebhook(token, webhookUrl) {
    try {
      const response = await axios.post(`${TELEGRAM_API_BASE}${token}/setWebhook`, {
        url: webhookUrl
      });
      return response.data;
    } catch (error) {
      logger.error('Telegram setWebhook Error', { error: error.response?.data || error.message });
      throw new Error('Failed to set Telegram webhook');
    }
  }

  /**
   * Send a text message to a chat
   * @param {string} token - The Telegram Bot Token
   * @param {string} chatId - The Chat ID to send to
   * @param {string} text - The message text
   */
  async sendMessage(token, chatId, text) {
    try {
      const response = await axios.post(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
        chat_id: chatId,
        text: text
      });
      return response.data;
    } catch (error) {
      logger.error('Telegram sendMessage Error', { error: error.response?.data || error.message });
      throw new Error('Failed to send Telegram message');
    }
  }

  /**
   * Get information about the bot (useful for validation)
   * @param {string} token 
   */
  async getMe(token) {
    try {
      const response = await axios.get(`${TELEGRAM_API_BASE}${token}/getMe`);
      return response.data;
    } catch (error) {
      logger.error('Telegram getMe Error', { error: error.response?.data || error.message });
      throw new Error('Invalid Bot Token');
    }
  }
}

export default new TelegramService();
