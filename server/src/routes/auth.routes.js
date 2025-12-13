const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const { validateRegister, validateLogin } = require('../middleware/zodValidation');
const authController = require('../controllers/auth.controller');

// Rate limiter for login attempts (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Register - with rate limiting
router.post('/register', registerLimiter, validateRegister, asyncHandler(authController.register));

// Login - with rate limiting to prevent brute force
router.post('/login', loginLimiter, validateLogin, asyncHandler(authController.login));

// Demo login (safe helper for testing / demo environments)
router.post('/demo-login', asyncHandler(authController.demoLogin));

// Update Profile
router.put('/profile', authenticateToken, asyncHandler(authController.updateProfile));

// Get current profile
router.get('/profile', authenticateToken, asyncHandler(authController.getProfile));

module.exports = router;
