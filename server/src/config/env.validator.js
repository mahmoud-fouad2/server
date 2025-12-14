/**
 * Faheemly™ - Environment Variables Validator
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * Validates required environment variables on server startup
 * Prevents production deployment with missing or weak configurations
 * 
 * @module config/env.validator
 */

const logger = require('../utils/logger');

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL database connection string',
    validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://')
  },
  
  // Security
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token signing (use: openssl rand -base64 48)',
    validate: (value) => value.length >= 48,
    errorMessage: 'JWT_SECRET must be at least 48 characters for production security. Generate with: openssl rand -base64 48'
  },
  
  // Redis Cache (REQUIRED in production for performance & cost savings)
  REDIS_URL: {
    required: true, // Production requires Redis for $200-500/mo savings
    description: 'Redis connection URL for caching (MANDATORY in production)',
    validate: (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
    errorMessage: 'REDIS_URL must be a valid Redis connection string (redis:// or rediss://)'
  },
  
  // AI Services (at least one required)
  GROQ_API_KEY: {
    required: false,
    description: 'Groq API key for AI responses'
  },
  DEEPSEEK_API_KEY: {
    required: false,
    description: 'DeepSeek API key for AI responses'
  },
  CEREBRAS_API_KEY: {
    required: false,
    description: 'Cerebras API key for AI responses'
  },
  GEMINI_API_KEY: {
    required: false,
    description: 'Google Gemini API key for AI responses'
  },
  VOYAGE_API_KEY: {
    required: false,
    description: 'VoyageAI API key for AI responses and embeddings'
  },
  
  // Client
  CLIENT_URL: {
    required: false, // Optional - will use default if not provided
    description: 'Frontend client URL for CORS (legacy name - prefer FRONTEND_URL)',
    validate: (value) => !value || value.startsWith('http://') || value.startsWith('https://')
  },
  FRONTEND_URL: {
    required: false, // Preferred name for the same setting
    description: 'Frontend client URL for CORS (preferred name)',
    validate: (value) => !value || value.startsWith('http://') || value.startsWith('https://')
  },
  
  // Server
  PORT: {
    required: false,
    description: 'Server port (default: 3002)',
    validate: (value) => !isNaN(parseInt(value))
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment (development/production/test)',
    validate: (value) => ['development', 'production', 'test'].includes(value)
  }
};

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'SENTRY_DSN'
];

/**
 * Dangerous configurations that should never be in production
 */
const FORBIDDEN_IN_PRODUCTION = {
  DEV_NO_AUTH: {
    forbiddenValue: 'true',
    errorMessage: 'DEV_NO_AUTH=true is FORBIDDEN in production - removes authentication!'
  }
};

/**
 * Validate all environment variables
 * @throws {Error} If critical validation fails
 */
function validateEnv() {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

  // Skip validation in test environment
  if (isTest) {
    logger.info('⚠️  Test environment detected - skipping strict env validation');
    return { success: true, warnings: [], errors: [] };
  }

  logger.info('🔍 Validating environment variables...');

  // Check required variables
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value) {
      if (config.required) {
        errors.push(`❌ Missing required: ${key} - ${config.description}`);
      } else {
        warnings.push(`⚠️  Optional missing: ${key} - ${config.description}`);
      }
      continue;
    }

    // Validate format if validator provided
    if (config.validate && !config.validate(value)) {
      const message = config.errorMessage || `Invalid format for ${key}`;
      errors.push(`❌ ${message}`);
    }
  }

  // Check for at least one AI provider
  const hasAnyAIProvider = ['GROQ_API_KEY', 'DEEPSEEK_API_KEY', 'CEREBRAS_API_KEY', 'GEMINI_API_KEY', 'VOYAGE_API_KEY']
    .some(key => process.env[key]);
  
  if (!hasAnyAIProvider) {
    errors.push('❌ At least one AI provider API key required (GROQ/DEEPSEEK/CEREBRAS/GEMINI)');
  }

  // Check production-specific restrictions
  if (isProduction) {
    for (const [key, config] of Object.entries(FORBIDDEN_IN_PRODUCTION)) {
      const value = process.env[key];
      
      if (config.forbiddenValue && value === config.forbiddenValue) {
        warnings.push(`⚠️  SECURITY WARNING: ${config.errorMessage}`);
      }
      
      if (config.forbiddenValues && config.forbiddenValues.some(v => value?.toLowerCase().includes(v))) {
        warnings.push(`⚠️  SECURITY WARNING: ${config.errorMessage}`);
      }
    }

    // Ensure HTTPS in production
    const clientUrlToCheck = process.env.FRONTEND_URL || process.env.CLIENT_URL;
    if (clientUrlToCheck && !clientUrlToCheck.startsWith('https://')) {
      warnings.push('⚠️  FRONTEND_URL/CLIENT_URL should use HTTPS in production');
    }

    // Disallow localhost references in critical production settings
    const forbiddenHostPatterns = [/localhost/i, /127\.0\.0\.1/];

    if (process.env.DATABASE_URL && forbiddenHostPatterns.some(rx => rx.test(process.env.DATABASE_URL))) {
      errors.push('❌ DATABASE_URL must not point to localhost (127.0.0.1) in production');
    }

    const corsOrigins = process.env.CORS_ORIGINS || '';
    if (corsOrigins && forbiddenHostPatterns.some(rx => rx.test(corsOrigins))) {
      errors.push('❌ CORS_ORIGINS must not include localhost or 127.0.0.1 in production');
    }

    if (clientUrlToCheck && forbiddenHostPatterns.some(rx => rx.test(clientUrlToCheck))) {
      errors.push('❌ FRONTEND_URL/CLIENT_URL must not point to localhost (127.0.0.1) in production');
    }
  }

  // Check recommended variables
  for (const key of RECOMMENDED_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(`⚠️  Recommended but missing: ${key}`);
    }
  }

  // Log results
  if (errors.length > 0) {
    logger.error('❌ Environment validation FAILED:');
    errors.forEach(err => logger.error(err));
    
    if (isProduction) {
      logger.error('🚨 Cannot start server in production with invalid configuration');
      process.exit(1);
    } else {
      logger.error('⚠️  Server will start but may have issues');
    }
  }

  if (warnings.length > 0) {
    logger.warn('⚠️  Environment warnings:');
    warnings.forEach(warn => logger.warn(warn));
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('✅ Environment validation passed - all required variables set');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment info summary (safe for logging - no secrets)
 */
function getEnvSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3002',
    hasDatabase: !!process.env.DATABASE_URL,
    hasRedis: !!process.env.REDIS_URL,
    hasJWT: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    aiProviders: {
      groq: !!process.env.GROQ_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      cerebras: !!process.env.CEREBRAS_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      voyage: !!process.env.VOYAGE_API_KEY
    },
    hasClientURL: !!(process.env.CLIENT_URL || process.env.FRONTEND_URL),
    hasCORSOrigins: !!process.env.CORS_ORIGINS
  };
}

module.exports = {
  validateEnv,
  getEnvSummary
};
