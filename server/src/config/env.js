/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present and valid
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GROQ_API_KEY'
];

const optionalEnvVars = [
  'REDIS_URL',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY',
  'CEREBRAS_API_KEY',
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

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long');
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    warnings.push('DATABASE_URL should be a valid PostgreSQL connection string');
  }

  // Check for default/example values
  if (process.env.JWT_SECRET === 'your-secret-key') {
    warnings.push('JWT_SECRET is using default/example value - change immediately');
  }

  if (missing.length > 0) {
    const message = `❌ FATAL: Missing required environment variables: ${missing.join(', ')}`;
    console.error(message);
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Copy .env.example to .env and fill in the values');
    // Throw an error so callers can decide how to handle (tests can catch, index.js can shutdown)
    throw new Error(message);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  console.log('✅ Environment validation passed');
}

module.exports = {
  validateEnvironment,
  requiredEnvVars,
  optionalEnvVars
};