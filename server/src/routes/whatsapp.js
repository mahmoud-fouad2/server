import express from 'express';
const router = express.Router();
import prisma from '../config/database.js';
import aiService from '../services/ai.service.js';
import whatsappService from '../services/whatsappService.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Fahimo Insight: WhatsApp Integration (Meta Cloud API)
// This is a placeholder structure. To make this live, you need to:
// 1. Verify a Meta Developer Account
// 2. Configure the Webhook URL in Meta Dashboard to point here
// 3. Set WHATSAPP_VERIFY_TOKEN and WHATSAPP_APP_SECRET in your environment

router.get('/webhook', (req, res) => {
  // Meta verification challenge
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    logger.error('WHATSAPP_VERIFY_TOKEN not configured - cannot verify webhook');
    return res.sendStatus(500);
  }

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified successfully');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Verify webhook signature if app secret is configured
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      const signatureHeader = req.get('x-hub-signature-256') || req.get('x-hub-signature');
      if (!signatureHeader) {
        logger.warn('Missing webhook signature header');
        return res.sendStatus(403);
      }

      const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody || JSON.stringify(req.body)).digest('hex');
      try {
        const sigBuf = Buffer.from(signatureHeader);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          logger.warn('Invalid webhook signature');
          return res.sendStatus(403);
        }
      } catch (e) {
        logger.warn('Error verifying webhook signature', { error: e.message });
        return res.sendStatus(403);
      }
    } else {
      logger.warn('WHATSAPP_APP_SECRET not set; skipping webhook signature verification (not recommended for production)');
    }

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

          logger.info('WhatsApp message received', { from, messageLength: msgBody.length });

        // Find the bot associated with this WhatsApp Phone Number ID
        const whatsappAccount = await prisma.whatsAppAccount.findFirst({
            where: { phoneNumberId: phoneNumberId },
            include: { business: { include: { bots: true } } }
        });

        if (!whatsappAccount || !whatsappAccount.business || whatsappAccount.business.bots.length === 0) {
          logger.error('WhatsApp bot not found', { phoneNumberId });
          return res.sendStatus(200); // Return 200 to stop Meta from retrying
        }

        // For MVP, pick the first active bot (unused variable removed if not needed)
        // const bot = whatsappAccount.business.bots.find(b => b.isActive) || whatsappAccount.business.bots[0];

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
    logger.error('WhatsApp webhook error', { error: error.message, stack: error.stack });
    res.sendStatus(500);
  }
});
export default router;
