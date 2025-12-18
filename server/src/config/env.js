/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present and valid
 */

import logger from '../utils/logger.js';

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

const optionalEnvVars = [
  'REDIS_URL',
  'GROQ_API_KEY',
  'PORT',
  'NODE_ENV',
  'SMTP_EMAIL',
  'SMTP_PASSWORD'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // ✅ ENFORCE JWT secret strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      warnings.push('⚠️ JWT_SECRET should be at least 32 characters for better security (current: ' + process.env.JWT_SECRET.length + ')');
    }
    
    // Check for weak patterns
    const weakPatterns = ['secret', 'password', 'fahimo', '12345'];
    if (weakPatterns.some(pattern => process.env.JWT_SECRET.toLowerCase().includes(pattern))) {
      warnings.push('⚠️ JWT_SECRET contains common words. Consider using cryptographically random string.');
    }
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    warnings.push('DATABASE_URL should be a valid PostgreSQL connection string');
  }

  // Check for default/example values
  if (process.env.JWT_SECRET === 'your-secret-key') {
    warnings.push('⚠️ JWT_SECRET is using default/example value - change immediately');
  }

  if (missing.length > 0) {
    const message = `❌ FATAL: Missing required environment variables: ${missing.join(', ')}`;
    logger.error(message, null, { missing });
    missing.forEach(varName => logger.error(`Missing: ${varName}`));
    logger.error('Copy .env.example to .env and fill in the values');
    // Throw an error so callers can decide how to handle (tests can catch, index.js can shutdown)
    throw new Error(message);
  }

  if (warnings.length > 0) {
    logger.warn('Environment warnings', { warnings });
    warnings.forEach(warning => logger.warn(warning));
  }

  logger.info('Environment validation passed');
}

export { validateEnvironment, requiredEnvVars, optionalEnvVars };