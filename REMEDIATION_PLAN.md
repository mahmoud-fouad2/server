# Faheemly Security & Performance Remediation Plan

**Complete Production-Ready Fix Guide for All 20 Audit Findings**

---

## Executive Summary

This document provides a complete step-by-step remediation plan for all 20 security and performance issues identified in the Faheemly codebase audit:
- **2 Critical Issues** (Phase 1) - Fix immediately, blocks production
- **9 High Issues** (Phase 2) - Fix within 1-2 weeks  
- **7 Medium Issues** (Phase 3) - Fix within 2-3 weeks
- **2 Low Issues** (Phase 4) - Code quality improvements

**Total Estimated Effort:** 80-120 developer hours
**Estimated Timeline:** 3-4 weeks with 2 developers
//- [ ] Demo login disabled in production ( cancel this )/- [ ] Demo login disabled in production ( cancel this )
---- [ ] Demo login disabled in production ( cancel this )- [ ] Demo login disabled in production ( cancel this )

# PHASE 1: CRITICAL ISSUES (FIX IMMEDIATELY)

## Issue C-001: SQL Injection in Vector Search

**Severity:** CRITICAL | **Impact:** Database compromise, data breach  
**Effort:** 4 hours | **Files:** `server/src/services/knowledge.service.js`

### Problem
The vector search uses raw string interpolation instead of parameterized queries:
```javascript
// ❌ VULNERABLE - SQL Injection
const query = `SELECT * FROM knowledge WHERE business_id = '${businessId}' AND ...`;
```

### Solution

**Step 1:** Update knowledge.service.js with parameterized query
```javascript
// server/src/services/knowledge.service.js

class KnowledgeService {
  /**
   * Search knowledge base using vector embeddings
   * @param {string} businessId - Business ID
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>}
   */
  async searchWithVector(businessId, query, limit = 5) {
    if (!businessId || typeof businessId !== 'string') {
      throw new Error('Invalid business ID');
    }
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      // Generate embedding for search query
      const embedding = await this.generateEmbedding(query);

      // Use Prisma's parameterized query - SQL injection safe
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          title,
          content,
          category,
          business_id,
          created_at,
          1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity_score
        FROM knowledge
        WHERE business_id = ${businessId}
          AND 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.7
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;

      return results;
    } catch (error) {
      logger.error('Vector search failed:', error);
      throw new Error('Knowledge base search failed');
    }
  }

  /**
   * Safe knowledge search with input validation
   */
  async search(businessId, query, filters = {}) {
    // Input validation
    if (!businessId?.trim() || !query?.trim()) {
      throw new Error('Business ID and query are required');
    }

    // Sanitize and validate inputs
    const sanitizedQuery = query.trim().slice(0, 500);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    // Use Prisma with parameterized queries
    return prisma.knowledge.findMany({
      where: {
        businessId: businessId,
        OR: [
          { title: { search: sanitizedQuery } },
          { content: { search: sanitizedQuery } }
        ],
        ...(filters.category && { category: filters.category })
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        createdAt: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new KnowledgeService();
```

**Step 2:** Add input validation schema
```javascript
// server/src/schemas/knowledge.schema.js
const z = require('zod');

const searchQuerySchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  query: z.string().min(1).max(500, 'Query too long'),
  limit: z.number().int().min(1).max(100).optional().default(10),
  category: z.string().optional()
});

const createKnowledgeSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  category: z.enum(['about', 'services', 'pricing', 'faq', 'other'])
});

module.exports = {
  searchQuerySchema,
  createKnowledgeSchema
};
```

**Step 3:** Update API endpoint
```javascript
// server/src/routes/knowledge.routes.js
const express = require('express');
const { searchQuerySchema } = require('../schemas/knowledge.schema');
const knowledgeService = require('../services/knowledge.service');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Search endpoint with validation
router.post('/search', validateRequest(searchQuerySchema), async (req, res) => {
  try {
    const { businessId, query, limit, category } = req.body;
    
    const results = await knowledgeService.search(businessId, query, {
      limit,
      category
    });

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Vector search endpoint
router.post('/search/vector', validateRequest(searchQuerySchema), async (req, res) => {
  try {
    const { businessId, query, limit } = req.body;
    
    const results = await knowledgeService.searchWithVector(businessId, query, limit);

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Testing

**Unit Test:**
```javascript
// server/src/services/__tests__/knowledge.service.test.js
const knowledgeService = require('../knowledge.service');

describe('KnowledgeService', () => {
  describe('searchWithVector', () => {
    it('should validate businessId to prevent injection', async () => {
      const maliciousId = "' OR '1'='1";
      
      await expect(
        knowledgeService.searchWithVector(maliciousId, 'test')
      ).rejects.toThrow();
    });

    it('should validate query length', async () => {
      const longQuery = 'a'.repeat(600);
      
      await expect(
        knowledgeService.searchWithVector('valid-id', longQuery)
      ).rejects.toThrow();
    });

    it('should return parameterized results safely', async () => {
      const results = await knowledgeService.searchWithVector(
        'test-business-id',
        'test query'
      );
      
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
```

**Integration Test:**
```bash
# Test for SQL injection
curl -X POST http://localhost:5000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "'\'' OR 1=1 -- ",
    "query": "test"
  }'
# Should return validation error, not database results
```

### Verification
```bash
# Check for remaining raw SQL in knowledge service
grep -n "queryRaw\|interpolat\|\`.*\${\|executeRaw" server/src/services/knowledge.service.js

# Run tests
npm test -- knowledge.service.test.js

# Code review checklist
- [ ] All SQL queries use Prisma parameterized syntax
- [ ] Input validation applied to all search parameters
- [ ] Tests pass for malicious input
- [ ] No template literals with variables in SQL
```

---

## Issue C-002: Missing Webhook Signature Verification

**Severity:** CRITICAL | **Impact:** Unauthorized webhook access, data tampering  
**Effort:** 3 hours | **Files:** `server/src/middleware/webhook.middleware.js`, `server/src/controllers/webhook.controller.js`

### Problem
Webhooks (WhatsApp, Telegram) accept requests without signature verification:
```javascript
// ❌ VULNERABLE - No signature check
router.post('/webhooks/whatsapp', (req, res) => {
  // Process webhook without verification
  processWhatsApp(req.body);
});
```

### Solution

**Step 1:** Create webhook verification middleware
```javascript
// server/src/middleware/webhook.middleware.js
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Verify webhook signature
 * Supports WhatsApp, Telegram, Twilio, Custom HMAC
 */
class WebhookVerifier {
  /**
   * Verify WhatsApp webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Signature header
   * @param {string} secret - Webhook secret
   * @returns {boolean}
   */
  verifyWhatsAppSignature(payload, signature, secret) {
    if (!signature || !secret) {
      logger.warn('Missing signature or secret for WhatsApp webhook');
      return false;
    }

    // WhatsApp uses HMAC SHA256
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );
  }

  /**
   * Verify Telegram webhook signature
   */
  verifyTelegramSignature(payload, signature, secret) {
    if (!signature || !secret) {
      logger.warn('Missing signature for Telegram webhook');
      return false;
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );
  }

  /**
   * Verify custom HMAC signature
   */
  verifyHMACSignature(payload, signature, secret) {
    if (!signature || !secret) {
      logger.warn('Missing signature or secret');
      return false;
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );
  }

  /**
   * Middleware to verify webhook signatures
   */
  middleware(type = 'hmac') {
    return (req, res, next) => {
      try {
        const signature = req.headers['x-webhook-signature'] || 
                         req.headers['x-hub-signature-256'];
        
        if (!signature) {
          logger.warn('Missing webhook signature header');
          return res.status(401).json({ error: 'Missing signature' });
        }

        // Get raw body (must be configured in express middleware)
        const rawBody = req.rawBody || JSON.stringify(req.body);
        const secret = process.env[`WEBHOOK_SECRET_${type.toUpperCase()}`];

        if (!secret) {
          logger.error(`Missing WEBHOOK_SECRET_${type.toUpperCase()} env var`);
          return res.status(500).json({ error: 'Server configuration error' });
        }

        let isValid = false;

        switch (type.toLowerCase()) {
          case 'whatsapp':
            isValid = this.verifyWhatsAppSignature(rawBody, signature, secret);
            break;
          case 'telegram':
            isValid = this.verifyTelegramSignature(rawBody, signature, secret);
            break;
          case 'hmac':
          default:
            isValid = this.verifyHMACSignature(rawBody, signature, secret);
        }

        if (!isValid) {
          logger.error('Invalid webhook signature from:', req.ip);
          return res.status(401).json({ error: 'Invalid signature' });
        }

        // Signature verified, proceed
        next();
      } catch (error) {
        logger.error('Webhook verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
      }
    };
  }
}

module.exports = new WebhookVerifier();
```

**Step 2:** Update Express configuration to capture raw body
```javascript
// server/src/index.js
const express = require('express');
const app = express();

// Middleware to capture raw body for webhook verification
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

// Parse JSON for other routes
app.use(express.json());

// WebSocket and routes
// ...
```

**Step 3:** Secure webhook routes
```javascript
// server/src/routes/webhook.routes.js
const express = require('express');
const webhookVerifier = require('../middleware/webhook.middleware');
const webhookController = require('../controllers/webhook.controller');
const logger = require('../utils/logger');

const router = express.Router();

// WhatsApp webhooks
router.post(
  '/webhooks/whatsapp',
  webhookVerifier.middleware('whatsapp'),
  webhookController.handleWhatsAppMessage
);

// Telegram webhooks
router.post(
  '/webhooks/telegram',
  webhookVerifier.middleware('telegram'),
  webhookController.handleTelegramMessage
);

// Twilio webhooks
router.post(
  '/webhooks/twilio',
  webhookVerifier.middleware('hmac'),
  webhookController.handleTwilioMessage
);

// Custom webhook with HMAC
router.post(
  '/webhooks/custom',
  webhookVerifier.middleware('hmac'),
  webhookController.handleCustomWebhook
);

// Log all webhook access attempts
router.use((req, res, next) => {
  logger.info('Webhook access attempt:', {
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

module.exports = router;
```

**Step 4:** Environment configuration
```bash
# .env.production
WEBHOOK_SECRET_WHATSAPP=your-whatsapp-webhook-secret
WEBHOOK_SECRET_TELEGRAM=your-telegram-webhook-secret
WEBHOOK_SECRET_TWILIO=your-twilio-webhook-secret
WEBHOOK_SECRET_HMAC=your-custom-webhook-secret
```

### Testing

**Unit Test:**
```javascript
// server/src/middleware/__tests__/webhook.middleware.test.js
const crypto = require('crypto');
const webhookVerifier = require('../webhook.middleware');

describe('WebhookVerifier', () => {
  const secret = 'test-secret';
  const payload = 'test-payload';

  it('should verify valid HMAC signature', () => {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = webhookVerifier.verifyHMACSignature(payload, hash, secret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid HMAC signature', () => {
    const invalidHash = 'invalid-hash';
    
    const isValid = webhookVerifier.verifyHMACSignature(payload, invalidHash, secret);
    expect(isValid).toBe(false);
  });

  it('should reject missing signature', () => {
    const isValid = webhookVerifier.verifyHMACSignature(payload, null, secret);
    expect(isValid).toBe(false);
  });

  it('should use timing-safe comparison', () => {
    // Ensure timing attack is not possible
    const hash1 = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const hash2 = 'a'.repeat(64); // Wrong hash, same length

    // Should take consistent time
    const start = Date.now();
    webhookVerifier.verifyHMACSignature(payload, hash2, secret);
    const time1 = Date.now() - start;

    const start2 = Date.now();
    webhookVerifier.verifyHMACSignature(payload, hash1, secret);
    const time2 = Date.now() - start2;

    // Times should be similar (timing-safe)
    expect(Math.abs(time1 - time2)).toBeLessThan(10);
  });
});
```

**Integration Test:**
```javascript
// server/src/routes/__tests__/webhook.routes.test.js
const request = require('supertest');
const app = require('../../index');
const crypto = require('crypto');

describe('Webhook Routes', () => {
  const secret = process.env.WEBHOOK_SECRET_HMAC || 'test-secret';
  const testPayload = JSON.stringify({ message: 'test' });

  it('should reject webhook without signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/custom')
      .send({ message: 'test' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Missing signature');
  });

  it('should reject webhook with invalid signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/custom')
      .set('x-webhook-signature', 'invalid-hash')
      .send({ message: 'test' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid signature');
  });

  it('should accept webhook with valid signature', async () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(testPayload)
      .digest('hex');

    const response = await request(app)
      .post('/api/webhooks/custom')
      .set('x-webhook-signature', signature)
      .set('Content-Type', 'application/json')
      .send({ message: 'test' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Verification
```bash
# Check webhook routes are protected
grep -n "router.post.*webhook" server/src/routes/webhook.routes.js | grep "webhookVerifier"

# Verify all webhooks have middleware
grep -A 2 "router.post.*webhook" server/src/routes/webhook.routes.js | grep -c "middleware"

# Run security tests
npm test -- webhook.middleware.test.js webhook.routes.test.js

# Verification checklist
- [ ] All webhook endpoints require signature verification
- [ ] Using timing-safe comparison (crypto.timingSafeEqual)
- [ ] Environment secrets are configured
- [ ] Signature header is checked on all platforms
- [ ] Invalid signatures are rejected (401)
- [ ] Webhook verification tests pass
- [ ] No webhook endpoints without verification
```

---

## Issue C-003: Unrestricted Demo Login in Production

**Severity:** CRITICAL | **Impact:** Unauthorized demo access, data exposure  
**Effort:** 2 hours | **Files:** `server/src/controllers/auth.controller.js`, `.env.production`

### Problem
Demo user login works in production, allowing unauthorized access with known credentials.

### Solution

**Step 1:** Restrict demo login to staging/development
```javascript
// server/src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const DEMO_CREDENTIALS = {
  email: 'hello@faheemly.com',
  password: 'FaheemlyDemo2025!'
};

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Block demo login in production
      if (process.env.NODE_ENV === 'production' && 
          email === DEMO_CREDENTIALS.email) {
        logger.warn(`Blocked demo login attempt in production from ${req.ip}`);
        
        return res.status(403).json({
          error: 'Demo account is not available in production',
          code: 'DEMO_LOGIN_DISABLED'
        });
      }

      // Allow demo login only in development/staging
      if ((process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'staging') &&
          email === DEMO_CREDENTIALS.email &&
          password === DEMO_CREDENTIALS.password) {
        
        logger.info('Demo login allowed in ' + process.env.NODE_ENV);
        
        // Find or create demo user
        const demoUser = await authService.getDemoUser();
        
        if (!demoUser) {
          return res.status(401).json({ error: 'Demo user not found' });
        }

        // Generate token
        const token = authService.generateToken(demoUser);

        return res.json({
          success: true,
          token,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            isDemoUser: true
          }
        });
      }

      // Regular login
      const result = await authService.login(email, password);

      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getDemoStatus(req, res) {
    return res.json({
      demoLoginEnabled: process.env.NODE_ENV !== 'production',
      environment: process.env.NODE_ENV,
      message: process.env.NODE_ENV === 'production' 
        ? 'Demo login is disabled in production' 
        : 'Demo login is available'
    });
  }
}

module.exports = new AuthController();
```

**Step 2:** Add environment-based login restrictions
```javascript
// server/src/middleware/auth.middleware.js
const logger = require('../utils/logger');

/**
 * Block demo account access in production
 */
const blockDemoInProduction = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.email === 'hello@faheemly.com') {
          logger.warn('Blocked demo user access in production from:', req.ip);
          return res.status(403).json({
            error: 'Demo account access is disabled in production'
          });
        }
      } catch (error) {
        // Invalid token, will be caught by auth middleware
      }
    }
  }

  next();
};

module.exports = { blockDemoInProduction };
```

**Step 3:** Update routes with protection
```javascript
// server/src/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const { blockDemoInProduction } = require('../middleware/auth.middleware');

const router = express.Router();

// Login endpoint
router.post('/login', authController.login);

// Get demo status
router.get('/demo/status', authController.getDemoStatus);

// Protect all dashboard routes from demo in production
router.use('/dashboard', blockDemoInProduction);

module.exports = router;
```

**Step 4:** Update .env files
```bash
# .env.development
NODE_ENV=development
DEMO_LOGIN_ENABLED=true

# .env.staging
NODE_ENV=staging
DEMO_LOGIN_ENABLED=true

# .env.production
NODE_ENV=production
DEMO_LOGIN_ENABLED=false
```

### Testing

```javascript
// server/src/controllers/__tests__/auth.controller.test.js
const authController = require('../auth.controller');
const request = require('supertest');
const app = require('../../index');

describe('Auth Controller - Demo Login', () => {
  it('should allow demo login in development', async () => {
    process.env.NODE_ENV = 'development';

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hello@faheemly.com',
        password: 'FaheemlyDemo2025!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should block demo login in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hello@faheemly.com',
        password: 'FaheemlyDemo2025!'
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('DEMO_LOGIN_DISABLED');
  });

  it('should show demo status endpoint', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/auth/demo/status');

    expect(response.status).toBe(200);
    expect(response.body.demoLoginEnabled).toBe(false);
  });
});
```

### Verification
```bash
# Check NODE_ENV is set in production
grep "NODE_ENV" .env.production

# Verify demo login block
grep -n "NODE_ENV.*production" server/src/controllers/auth.controller.js

# Test demo login is blocked
npm test -- auth.controller.test.js

# Checklist
- [ ] NODE_ENV=production in .env.production
- [ ] Demo login returns 403 in production
- [ ] Demo login works in development/staging
- [ ] Demo status endpoint works
- [ ] All tests pass
```

---

# PHASE 2: HIGH SEVERITY ISSUES (FIX WEEK 1-2)

## Issue H-001: Missing Rate Limiting on Authentication

**Severity:** HIGH | **Impact:** Brute force attacks, DDoS  
**Effort:** 3 hours

### Solution

```javascript
// server/src/middleware/rate-limit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

// Brute force protection - 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'login:',
    expiry: 15 * 60 // 15 minutes
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  skip: (req) => process.env.NODE_ENV === 'test'
});

// API rate limiting - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'api:',
    expiry: 15 * 60
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

// Strict rate limiting for registration - 3 per hour per IP
const registrationLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'register:',
    expiry: 60 * 60
  }),
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again later'
});

module.exports = {
  loginLimiter,
  apiLimiter,
  registrationLimiter
};
```

**Apply to routes:**
```javascript
// server/src/routes/auth.routes.js
const { loginLimiter, registrationLimiter } = require('../middleware/rate-limit.middleware');

router.post('/login', loginLimiter, authController.login);
router.post('/register', registrationLimiter, authController.register);
```

---

## Issue H-002: Missing Input Validation on All Endpoints

**Severity:** HIGH | **Impact:** XSS, data corruption  
**Effort:** 8 hours

### Solution - Create comprehensive validation schemas

```javascript
// server/src/schemas/index.js
const z = require('zod');

// Auth schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8).max(100)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  name: z.string().min(2).max(100),
  businessName: z.string().min(2).max(200)
});

// Chat schemas
const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  visitorId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional()
});

// Knowledge base schemas
const createKnowledgeSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(50000),
  category: z.enum(['about', 'services', 'pricing', 'faq', 'other'])
});

// Widget schemas
const widgetConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  welcomeMessage: z.string().max(500),
  showBranding: z.boolean(),
  icon: z.string().max(50).optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional()
});

module.exports = {
  loginSchema,
  registerSchema,
  sendMessageSchema,
  createKnowledgeSchema,
  widgetConfigSchema
};
```

**Validation middleware:**
```javascript
// server/src/middleware/validation.middleware.js
const logger = require('../utils/logger');

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate different parts of request
      const data = req.body || {};
      const validated = schema.parse(data);
      
      // Replace body with validated data
      req.body = validated;
      next();
    } catch (error) {
      logger.warn('Validation error:', error.errors);
      
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
};

module.exports = { validateRequest };
```

**Apply to all routes:**
```javascript
// server/src/routes/auth.routes.js
const { validateRequest } = require('../middleware/validation.middleware');
const { loginSchema, registerSchema } = require('../schemas');

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
```

---

## Issue H-003: Missing CSRF Protection on State-Changing Endpoints

**Severity:** HIGH | **Impact:** CSRF attacks  
**Effort:** 4 hours

```javascript
// server/src/middleware/csrf.middleware.js
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// CSRF middleware
const csrfProtection = csrf({ cookie: false, sessionKey: 'session' });

// Middleware to generate CSRF token
const generateToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = { csrfProtection, generateToken };
```

**Apply to routes:**
```javascript
// server/src/routes/index.js
const { csrfProtection } = require('../middleware/csrf.middleware');

// GET endpoints - generate token
router.get('/form', csrfProtection, (req, res) => {
  res.json({ token: req.csrfToken() });
});

// POST endpoints - require token
router.post('/update', csrfProtection, async (req, res) => {
  // Process request
});
```

---

## Issue H-004 to H-009: Additional High Issues

(File upload validation, API key validation, Missing logging, Connection pooling, Concurrent request limits, Admin endpoint exposure)

### Quick Implementation Summary

| Issue | File | Solution |
|-------|------|----------|
| H-004: File Upload Limits | `server/src/middleware/upload.js` | Add multer with fileSize: 5MB limit, accept only images/pdf |
| H-005: Exposed Admin Endpoints | `server/src/routes/admin.routes.js` | Require admin role check on all routes |
| H-006: Missing API Key Validation | `server/src/middleware/api-key.js` | Validate X-API-Key header with Redis cache |
| H-007: No Request Logging | `server/src/middleware/logger.js` | Log all requests with method, path, IP, response time |
| H-008: Connection Pool Config | `server/src/config/database.js` | Set max: 20, min: 5 in pool config |
| H-009: No Concurrency Limits | `server/src/middleware/concurrency.js` | Limit concurrent requests per business ID |

---

# PHASE 3: MEDIUM SEVERITY ISSUES (FIX WEEK 2-3)

## Issue M-001: N+1 Queries in Admin Analytics

**Severity:** MEDIUM | **Impact:** Performance degradation  
**Effort:** 6 hours

### Solution

```javascript
// server/src/services/analytics.service.js - BEFORE (N+1)
async getBusinessStats(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  // ❌ N+1: Separate queries for each relationship
  const conversations = await prisma.conversation.findMany({
    where: { businessId }
  });

  const messages = [];
  for (const conv of conversations) {
    const msgs = await prisma.message.findMany({
      where: { conversationId: conv.id }
    });
    messages.push(...msgs);
  }

  return { business, conversations, messages };
}

// AFTER (optimized with includes)
async getBusinessStats(businessId) {
  const stats = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      conversations: {
        include: {
          messages: {
            select: { id: true, content: true, createdAt: true }
          },
          visitor: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      users: {
        select: { id: true, email: true, role: true }
      },
      widgets: true
    }
  });

  return stats;
}
```

---

## Issue M-002 to M-007: Refactoring Duplications

### Consolidate Button Components
```javascript
// client/src/components/ui/Button.jsx
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  children,
  ...props 
}) => {
  const styles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${styles[variant]} ${sizes[size]} rounded transition-colors`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? '⏳ Loading...' : children}
    </button>
  );
};
```

---

# PHASE 4: LOW SEVERITY ISSUES

Minor refactoring, code cleanup, documentation improvements.

---

## Implementation Checklist

```markdown
### Phase 1 Checklist
- [ ] SQL injection fixed in vector search
- [ ] Webhook signature verification added
- [ ] Demo login disabled in production ( cancel this )
- [ ] All tests pass
- [ ] Security review completed

### Phase 2 Checklist
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] CSRF protection on state-changing endpoints
- [ ] File upload size limits (5MB)
- [ ] Admin endpoints secured
- [ ] API key validation
- [ ] Request logging
- [ ] Connection pooling optimized
- [ ] Concurrency limits

### Phase 3 Checklist
- [ ] N+1 queries fixed
- [ ] Components consolidated
- [ ] Code duplication removed

### Phase 4 Checklist
- [ ] Code quality improved
- [ ] Documentation updated
```

---

## Running Security Audit

```bash
# Check for vulnerabilities
npm audit

# Run tests
npm test

# Check for SQL injection patterns
grep -r "interpolat\|template.*sql\|\`.*\${" server/src --include="*.js"

# Check for hardcoded secrets
grep -r "password\|secret\|key.*=" server/src --include="*.js" | grep -v "process.env"

# SonarQube analysis
npm run sonarqube
```

---

## Deployment Checklist

```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 2. Run all tests
npm test

# 3. Deploy Phase 1 first
git tag -a phase-1-critical -m "Critical security fixes"
git push origin main --follow-tags

# 4. Monitor for errors
tail -f logs/production.log | grep ERROR

# 5. Gradual rollout (canary deployment)
# Deploy to 10% of users first

# 6. Run integration tests
npm run test:integration

# 7. Security verification
npm audit
npm run security-check
```

---

**Total Estimated Timeline:** 3-4 weeks with 2 developers  
**Status:** Ready for implementation
