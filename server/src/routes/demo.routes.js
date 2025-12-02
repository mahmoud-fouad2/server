const express = require('express');
const router = express.Router();
const groqService = require('../services/groq.service');
const prisma = require('../config/database');

// Public Demo Chat Endpoint
router.post('/demo', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Find the "Demo Business" (created by seed)
    // We look for a business associated with 'demo@fahimo.com' or just pick the first one
    let demoBusiness = await prisma.business.findFirst({
      where: {
        user: {
          email: 'demo@fahimo.com'
        }
      },
      include: {
        knowledgeBase: true
      }
    });

    // Fallback: If no demo user, pick ANY business (e.g. the first one created)
    if (!demoBusiness) {
      demoBusiness = await prisma.business.findFirst({
        include: { knowledgeBase: true }
      });
    }

    // If still no business, we can't use the AI properly with context
    if (!demoBusiness) {
      return res.json({ 
        response: "عذراً، النظام التجريبي غير جاهز حالياً. يرجى المحاولة لاحقاً.",
        isFallback: true
      });
    }

    // 2. Prepare Context
    // We'll use a hardcoded "Fahimo" persona for the landing page demo
    const demoConfig = {
      name: 'فهيم',
      activityType: 'COMPANY', // Acts as Fahimo Company Agent
      botTone: 'friendly',
      widgetConfig: { dialect: 'sa' } // Default to Saudi dialect for demo
    };

    // 3. Prepare Knowledge Base (Hardcoded for Landing Page Demo)
    // This ensures the bot knows about Fahimo even if the DB is empty
    const demoKnowledge = [
      {
        content: `
        معلومات عن منصة فهملي (Fahimo):
        - منصة شات بوت عربي ذكي مدعوم بالذكاء الاصطناعي (AI).
        - تساعد الشركات والمتاجر على الرد الآلي على العملاء 24/7.
        - تدعم اللهجات العربية (مصري، سعودي، خليجي) بطلاقة.
        - المميزات: حجز مواعيد، رد على استفسارات، إتمام مبيعات، تحليل محادثات.
        - الأسعار:
          1. باقة المبتدئ: 99 ريال/شهر (1000 رسالة).
          2. باقة المحترف: 199 ريال/شهر (5000 رسالة) - الأكثر طلباً.
          3. باقة الشركات: 499 ريال/شهر (غير محدود).
        - يوجد تجربة مجانية لمدة 7 أيام.
        - طريقة الاشتراك: اضغط على زر "ابدأ التجربة المجانية" في الموقع.
        `
      },
      ...(demoBusiness.knowledgeBase || [])
    ];

    // 4. Call Groq AI
    const aiResult = await groqService.generateChatResponse(
      message,
      demoConfig,
      history || [], // Pass client-side history
      demoKnowledge
    );

    res.json({
      response: aiResult.response,
      model: aiResult.model
    });

  } catch (error) {
    console.error('Demo Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process demo message',
      fallback: "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي." 
    });
  }
});

module.exports = router;
