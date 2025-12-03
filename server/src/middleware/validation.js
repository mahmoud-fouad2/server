const { body, param, query, validationResult } = require('express-validator');

/**
 * Input Validation Middleware
 * Prevents XSS, SQL Injection, and malformed data
 */

/**
 * Helper: Check validation results and return errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

/**
 * Auth Validation Rules
 */
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .escape()
    .withMessage('Name must be 2-100 characters'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .escape()
    .withMessage('Business name too long'),
  body('activityType')
    .optional()
    .isIn(['RESTAURANT', 'RETAIL', 'CLINIC', 'COMPANY', 'OTHER'])
    .withMessage('Invalid activity type'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Chat Validation Rules
 */
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be 1-2000 characters'),
  body('businessId')
    .notEmpty()
    .isString()
    .withMessage('Business ID is required'),
  body('conversationId')
    .optional()
    .isString(),
  handleValidationErrors
];

const validateRating = [
  body('conversationId')
    .notEmpty()
    .isString()
    .withMessage('Conversation ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .escape()
    .withMessage('Feedback too long'),
  handleValidationErrors
];

/**
 * Knowledge Base Validation Rules
 */
const validateTextKnowledge = [
  body('text')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Text must be 10-50000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .escape()
    .withMessage('Title too long'),
  handleValidationErrors
];

const validateUrlKnowledge = [
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid URL format'),
  body('deepCrawl')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('deepCrawl must be boolean'),
  handleValidationErrors
];

/**
 * Ticket Validation Rules
 */
const validateCreateTicket = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .escape()
    .withMessage('Subject must be 5-200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be 10-2000 characters'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  handleValidationErrors
];

const validateTicketReply = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be 1-2000 characters'),
  handleValidationErrors
];

/**
 * Business Settings Validation
 */
const validateBusinessSettings = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .escape()
    .withMessage('Business name must be 2-200 characters'),
  body('activityType')
    .optional()
    .isIn(['RESTAURANT', 'RETAIL', 'CLINIC', 'COMPANY', 'OTHER'])
    .withMessage('Invalid activity type'),
  body('botTone')
    .optional()
    .isIn(['friendly', 'formal', 'empathetic'])
    .withMessage('Invalid bot tone'),
  body('language')
    .optional()
    .isIn(['ar', 'en', 'sa', 'eg'])
    .withMessage('Invalid language'),
  handleValidationErrors
];

/**
 * Widget Configuration Validation
 */
const validateWidgetConfig = [
  body('welcomeMessage')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Welcome message too long'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid color format (use #RRGGBB)'),
  body('personality')
    .optional()
    .isIn(['friendly', 'formal', 'empathetic'])
    .withMessage('Invalid personality'),
  body('showBranding')
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage('showBranding must be boolean'),
  handleValidationErrors
];

/**
 * Team Member Validation
 */
const validateTeamMember = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .escape()
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateId = [
  param('id')
    .notEmpty()
    .isString()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChatMessage,
  validateRating,
  validateTextKnowledge,
  validateUrlKnowledge,
  validateCreateTicket,
  validateTicketReply,
  validateBusinessSettings,
  validateWidgetConfig,
  validateTeamMember,
  validateId,
  handleValidationErrors
};
