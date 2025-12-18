import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { sanitizeInput } from '../utils/sanitize.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, businessName, activityType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // ✅ PASSWORD STRENGTH VALIDATION
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate Activity Type
    const validActivityTypes = [
      'RESTAURANT', 'CAFE', 'BAKERY', 'CLINIC', 'HOSPITAL', 'PHARMACY', 'DENTAL',
      'RETAIL', 'FASHION', 'ELECTRONICS', 'JEWELRY', 'FURNITURE', 'COMPANY',
      'CONSULTING', 'LEGAL', 'ACCOUNTING', 'REALESTATE', 'EDUCATION', 'SCHOOL',
      'UNIVERSITY', 'BANK', 'INSURANCE', 'INVESTMENT', 'HOTEL', 'TRAVEL',
      'TOURISM', 'SALON', 'SPA', 'GYM', 'AUTOMOTIVE', 'CARMAINTENANCE',
      'LOGISTICS', 'CONSTRUCTION', 'ARCHITECTURE', 'INTERIOR', 'IT',
      'MAINTENANCE', 'SECURITY', 'SOFTWARE', 'TELECOM', 'DIGITAL', 'MARKETING',
      'DESIGN', 'PHOTOGRAPHY', 'EVENTS', 'ECOMMERCE', 'DROPSHIPPING', 'OTHER'
    ];
    let validActivityType = activityType || 'OTHER';
    if (!validActivityTypes.includes(validActivityType)) {
      validActivityType = 'OTHER';
    }

    // Sanitize inputs to prevent XSS
    const safeName = sanitizeInput(name);
    const safeBusinessName = sanitizeInput(businessName || `${name}'s Business`);

    // Create User and Business in transaction
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          name: safeName,
          email,
          password: hashedPassword,
          role: 'CLIENT'
        }
      });

      const business = await prisma.business.create({
        data: {
          userId: user.id,
          name: safeBusinessName,
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
      success: true,
      message: 'Registration successful', 
      token,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, businessId: result.business.id },
      business: result.business
    });

  } catch (error) {
    logger.error('Registration failed', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
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
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId },
      businessId
    });

  } catch (error) {
    logger.error('Login failed', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const demoLogin = async (req, res) => {
  try {
    // ✅ USE ENVIRONMENT VARIABLES INSTEAD OF HARDCODED
    const demoEmail = process.env.DEMO_USER_EMAIL || 'hello@faheemly.com';
    const demoPassword = process.env.DEMO_USER_PASSWORD;
    
    if (!demoPassword) {
      return res.status(503).json({ error: 'Demo login not configured. Contact administrator.' });
    }
    
    const { email, password } = req.body || {};

    if (email !== demoEmail || password !== demoPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find existing user (with businesses)
    let user = await prisma.user.findUnique({ where: { email }, include: { businesses: true } });

    // If not found, create demo user + business in a transaction
    if (!user) {
      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      const result = await prisma.$transaction(async (prismaTx) => {
        const newUser = await prismaTx.user.create({
          data: {
            name: 'Faheemly Assistant',
            email: demoEmail,
            password: hashedPassword,
            role: 'CLIENT'
          }
        });

        const business = await prismaTx.business.create({
          data: {
            userId: newUser.id,
            name: 'Faheemly Assistant',
            activityType: 'OTHER',
            planType: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });

        return { newUser, business };
      });

      user = { ...result.newUser, businesses: [result.business] };
    }

    const businessId = user.businesses[0]?.id;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, businessId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Demo login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId },
      businessId
    });
  } catch (error) {
    logger.error('Demo login failed', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
};

export const updateProfile = async (req, res) => {
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
};

export const getProfile = async (req, res) => {
  try {
    const payload = req.user || {};
    if (!payload.userId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch fresh user info from DB to include businesses and latest data
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { businesses: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const businessId = payload.businessId || user.businesses?.[0]?.id;
    const business = user.businesses?.find(b => b.id === businessId) || user.businesses?.[0] || null;

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId }, business, businesses: user.businesses || [] });
  } catch (error) {
    logger.error('Get profile failed', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
