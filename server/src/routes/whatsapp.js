const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const aiService = require('../services/ai.service');
const whatsappService = require('../services/whatsappService');

// Fahimo Insight: WhatsApp Integration (Meta Cloud API)
// This is a placeholder structure. To make this live, you need to:
// 1. Verify a Meta Developer Account
// 2. Configure the Webhook URL in Meta Dashboard to point here
// 3. Add WHATSAPP_TOKEN to .env

router.get('/webhook', (req, res) => {
  // Meta verification challenge
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Default verify token if not set in env
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'fahimo_secret_123';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      const logger = require('../utils/logger');
      logger.info('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is an event from a WhatsApp API subscription
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;
        const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

        const logger = require('../utils/logger');
        logger.info('WhatsApp message received', { from, messageLength: msgBody.length });

        // Find the bot associated with this WhatsApp Phone Number ID
        const whatsappAccount = await prisma.whatsAppAccount.findFirst({
            where: { phoneNumberId: phoneNumberId },
            include: { business: { include: { bots: true } } }
        });

        if (!whatsappAccount || !whatsappAccount.business || whatsappAccount.business.bots.length === 0) {
            const logger = require('../utils/logger');
            logger.error('WhatsApp bot not found', { phoneNumberId });
            return res.sendStatus(200); // Return 200 to stop Meta from retrying
        }

        // For MVP, pick the first active bot
        const bot = whatsappAccount.business.bots.find(b => b.isActive) || whatsappAccount.business.bots[0];
        const botId = bot.id;

        // Generate AI Response
        const systemPrompt = `You are the WhatsApp assistant for ${whatsappAccount.business?.name || 'our business'}. Keep answers brief and helpful.`;
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: msgBody }
        ];

        const aiResponse = await aiService.generateResponse(messages);

        // Send Response back to WhatsApp
        await whatsappService.sendMessage(from, aiResponse.response);
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('WhatsApp webhook error', { error: error.message, stack: error.stack });
    res.sendStatus(500);
  }
});

module.exports = router;
