import { z, ZodError } from 'zod';

// User Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  businessName: z.string().min(2).max(200).optional(),
  activityType: z.enum([
    'RESTAURANT', 'CAFE', 'BAKERY', 'CLINIC', 'HOSPITAL', 'PHARMACY', 'DENTAL',
    'RETAIL', 'FASHION', 'ELECTRONICS', 'JEWELRY', 'FURNITURE', 'COMPANY',
    'CONSULTING', 'LEGAL', 'ACCOUNTING', 'REALESTATE', 'EDUCATION', 'SCHOOL',
    'UNIVERSITY', 'BANK', 'INSURANCE', 'INVESTMENT', 'HOTEL', 'TRAVEL',
    'TOURISM', 'SALON', 'SPA', 'GYM', 'AUTOMOTIVE', 'CARMAINTENANCE',
    'LOGISTICS', 'CONSTRUCTION', 'ARCHITECTURE', 'INTERIOR', 'IT',
    'MAINTENANCE', 'SECURITY', 'SOFTWARE', 'TELECOM', 'DIGITAL', 'MARKETING',
    'DESIGN', 'PHOTOGRAPHY', 'EVENTS', 'ECOMMERCE', 'DROPSHIPPING', 'OTHER'
  ]).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8).max(100).optional()
});

// Chat Schemas
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  conversationId: z.string().cuid().optional(),
  businessId: z.string().cuid()
});

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional()
});

// Knowledge Base Schemas
const addTextKnowledgeSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters').max(50000),
  title: z.string().min(1).max(200).optional()
});

const addUrlKnowledgeSchema = z.object({
  url: z.string().url('Invalid URL format'),
  deepCrawl: z.boolean().optional()
});

const updateKnowledgeSchema = z.object({
  content: z.string().min(10).max(50000),
  title: z.string().min(1).max(200).optional()
});

// Business Schemas
const updateBusinessSchema = z.object({
  businessId: z.string().cuid().optional(),
  name: z.string().min(2).max(200).optional(),
  activityType: z.enum([
    'RESTAURANT', 'CAFE', 'BAKERY', 'CLINIC', 'HOSPITAL', 'PHARMACY', 'DENTAL',
    'RETAIL', 'FASHION', 'ELECTRONICS', 'JEWELRY', 'FURNITURE', 'COMPANY',
    'CONSULTING', 'LEGAL', 'ACCOUNTING', 'REALESTATE', 'EDUCATION', 'SCHOOL',
    'UNIVERSITY', 'BANK', 'INSURANCE', 'INVESTMENT', 'HOTEL', 'TRAVEL',
    'TOURISM', 'SALON', 'SPA', 'GYM', 'AUTOMOTIVE', 'CARMAINTENANCE',
    'LOGISTICS', 'CONSTRUCTION', 'ARCHITECTURE', 'INTERIOR', 'IT',
    'MAINTENANCE', 'SECURITY', 'SOFTWARE', 'TELECOM', 'DIGITAL', 'MARKETING',
    'DESIGN', 'PHOTOGRAPHY', 'EVENTS', 'ECOMMERCE', 'DROPSHIPPING', 'OTHER'
  ]).optional(),
  language: z.enum(['ar', 'en']).optional(),
  botTone: z.enum(['friendly', 'formal', 'advisory']).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional()
});

const updateBusinessPlanSchema = z.object({
  planType: z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'])
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Validation Middleware Factory
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError || (error && Array.isArray(error.errors))) {
        const details = Array.isArray(error.errors)
          ? error.errors.map(e => ({
              field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
              message: e.message || 'Invalid value'
            }))
          : [];

        return res.status(400).json({
          error: 'Validation failed',
          details
        });
      }
      next(error);
    }
  };
};

// Query validation middleware factory
const validateQuerySchema = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError || (error && Array.isArray(error.errors))) {
        const details = Array.isArray(error.errors)
          ? error.errors.map(e => ({
              field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
              message: e.message || 'Invalid query parameter'
            }))
          : [];

        return res.status(400).json({
          error: 'Query validation failed',
          details
        });
      }
      next(error);
    }
  };
};

export {
  // Schemas
  registerSchema,
  loginSchema,
  updateProfileSchema,
  chatMessageSchema,
  ratingSchema,
  addTextKnowledgeSchema,
  addUrlKnowledgeSchema,
  updateKnowledgeSchema,
  updateBusinessSchema,
  updateBusinessPlanSchema,
  paginationSchema,
  
  // Middleware
  validateSchema,
  validateQuerySchema,
  
  // Specific validators
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChatMessage,
  validateRating,
  validateAddTextKnowledge,
  validateAddUrlKnowledge,
  validateUpdateKnowledge,
  validateUpdateBusiness,
  validateUpdateBusinessPlan,
  validatePagination
};

// Create convenience exports
const validateRegister = validateSchema(registerSchema);
const validateLogin = validateSchema(loginSchema);
const validateUpdateProfile = validateSchema(updateProfileSchema);
const validateChatMessage = validateSchema(chatMessageSchema);
const validateRating = validateSchema(ratingSchema);
const validateAddTextKnowledge = validateSchema(addTextKnowledgeSchema);
const validateAddUrlKnowledge = validateSchema(addUrlKnowledgeSchema);
const validateUpdateKnowledge = validateSchema(updateKnowledgeSchema);
const validateUpdateBusiness = validateSchema(updateBusinessSchema);
const validateUpdateBusinessPlan = validateSchema(updateBusinessPlanSchema);
const validatePagination = validateQuerySchema(paginationSchema);
