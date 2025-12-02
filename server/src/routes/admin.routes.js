const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is SUPERADMIN
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get Dashboard Stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBusinesses = await prisma.business.count();
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();

    res.json({
      totalUsers,
      totalBusinesses,
      totalConversations,
      totalMessages
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get All Users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        businesses: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get System Settings
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array to object for easier frontend consumption
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    console.error('Admin Get Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update System Settings
router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = req.body; // Expect { key: value, key2: value2 }
    
    const updates = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin Update Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- AI Models Management ---

// Get All AI Models
router.get('/ai-models', authenticateToken, isAdmin, async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json(models);
  } catch (error) {
    console.error('Admin Get AI Models Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Add AI Model
router.post('/ai-models', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, apiKey, endpoint, maxTokens, priority } = req.body;
    const model = await prisma.aIModel.create({
      data: {
        name,
        apiKey,
        endpoint,
        maxTokens: parseInt(maxTokens) || 1000,
        priority: parseInt(priority) || 0,
        isActive: true
      }
    });
    res.json(model);
  } catch (error) {
    console.error('Admin Add AI Model Error:', error);
    res.status(500).json({ error: 'Failed to add AI model' });
  }
});

// Delete AI Model
router.delete('/ai-models/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.aIModel.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin Delete AI Model Error:', error);
    res.status(500).json({ error: 'Failed to delete AI model' });
  }
});

// Toggle AI Model Status
router.put('/ai-models/:id/toggle', authenticateToken, isAdmin, async (req, res) => {
  try {
    const model = await prisma.aIModel.findUnique({ where: { id: req.params.id } });
    const updated = await prisma.aIModel.update({
      where: { id: req.params.id },
      data: { isActive: !model.isActive }
    });
    res.json(updated);
  } catch (error) {
    console.error('Admin Toggle AI Model Error:', error);
    res.status(500).json({ error: 'Failed to toggle AI model' });
  }
});

// --- System Logs ---

// Get System Logs
router.get('/logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    console.error('Admin Get Logs Error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Update Business Plan
router.put('/business/:id/plan', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { planType } = req.body;
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: { planType }
    });
    res.json(business);
  } catch (error) {
    console.error('Admin Update Plan Error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

module.exports = router;
