const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const prisma = require('../config/database');
const upload = multer({ dest: 'uploads/' });

// Middleware to check auth (simplified for speed)
const authenticate = (req, res, next) => {
  // In a real app, verify JWT here. For now, we assume userId is passed or handled via headers
  // This is a placeholder to keep the flow moving for the "do all" request
  next();
};

// Fahimo Insight: Create the bot "Soul"
router.post('/create', async (req, res) => {
  try {
    const { name, businessType, tone, userId } = req.body;
    
    // 1. Find the user to get the businessId
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { business: true }
    });

    if (!user || !user.businessId) {
        return res.status(400).json({ error: 'User or Business not found' });
    }

    // 2. Map frontend businessType to Schema Industry Enum
    let industry = 'OTHER';
    const typeMap = {
        'restaurant': 'RESTAURANT',
        'retail': 'RETAIL',
        'service': 'SERVICE',
        'clinic': 'CLINIC'
    };
    if (typeMap[businessType]) industry = typeMap[businessType];

    // 3. Update Business Industry
    await prisma.business.update({
        where: { id: user.businessId },
        data: { industry: industry }
    });

    // 4. Create Bot
    const bot = await prisma.bot.create({
      data: {
        name,
        businessId: user.businessId,
        aiModelId: 1, // Default to Grok/Gemini (seeded)
        systemPrompt: `You are a helpful AI assistant for a ${businessType}.`,
        widgetConfig: {
            color: '#000000',
            position: 'bottom-right',
            welcomeMessage: 'Hello! How can I help you today?'
        }
      }
    });

    res.status(201).json(bot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// Fahimo Insight: The "Brain" - Uploading Knowledge
router.post('/:botId/upload', upload.single('file'), async (req, res) => {
  try {
    const { botId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let content = '';
    
    if (file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdfParse(dataBuffer);
        content = data.text;
    } else {
        // Assume text file
        content = fs.readFileSync(file.path, 'utf8');
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Save to KnowledgeBase
    // Fahimo Magic: Here we would normally chunk and embed using Groq
    // For now, we store the raw text to get the MVP running
    await prisma.knowledgeBase.create({
      data: {
        botId: parseInt(botId),
        type: 'PDF',
        content: content
      }
    });

    res.json({ message: 'Knowledge base updated successfully', preview: content.substring(0, 100) + '...' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Get Bot Config for Widget
router.get('/:botId/config', async (req, res) => {
    try {
        const bot = await prisma.bot.findUnique({
            where: { id: parseInt(req.params.botId) }
        });
        if (!bot) return res.status(404).json({ error: 'Bot not found' });
        res.json(bot);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching config' });
    }
});

module.exports = router;
