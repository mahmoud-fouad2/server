const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const logger = require('../utils/logger');

// Register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, businessName, activityType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate Activity Type
    const validActivityTypes = ['RESTAURANT', 'RETAIL', 'CLINIC', 'COMPANY', 'OTHER'];
    let validActivityType = activityType || 'OTHER';
    if (!validActivityTypes.includes(validActivityType)) {
      validActivityType = 'OTHER';
    }

    // Create User and Business in transaction
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CLIENT'
        }
      });

      const business = await prisma.business.create({
        data: {
          userId: user.id,
          name: businessName || `${name}'s Business`,
          activityType: validActivityType,
          planType: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
        }
      });

      return { user, business };
    });

    // Generate Token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role, businessId: result.business.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'Registration successful', 
      token,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, businessId: result.business.id },
      business: result.business
    });

  } catch (error) {
    logger.error('Registration failed', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { businesses: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const businessId = user.businesses[0]?.id;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, businessId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId },
      businessId
    });

  } catch (error) {
    logger.error('Login failed', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.userId;

    const data = { name, email };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    res.json({ message: 'Profile updated successfully', user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email } });
  } catch (error) {
    logger.error('Profile update failed', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
