/**
 * Environment Variables Check Script
 * Run this to verify all required variables are set
 */

const chalk = require('chalk');

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL'
];

const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY',
  'CEREBRAS_API_KEY',
  'GROQ_API_KEY',
  'GROQ_API_URL'
];

console.log('\n═══════════════════════════════════════════════════');
console.log('🔍 ENVIRONMENT VARIABLES CHECK');
console.log('═══════════════════════════════════════════════════\n');

let allGood = true;

// Check required variables
console.log('📋 REQUIRED VARIABLES:');
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  }
});

// Check optional variables (AI providers)
console.log('\n🤖 OPTIONAL AI PROVIDERS:');
let aiProvidersCount = 0;
OPTIONAL_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
    if (varName.includes('API_KEY')) aiProvidersCount++;
  } else {
    console.log(`⚠️  ${varName}: NOT SET`);
  }
});

console.log(`\n🤖 AI Providers Available: ${aiProvidersCount}`);

console.log('\n═══════════════════════════════════════════════════');
if (allGood && aiProvidersCount > 0) {
  console.log('✅ ALL CHECKS PASSED! Ready to deploy.');
} else if (allGood) {
  console.log('⚠️  Required vars OK, but no AI providers configured!');
} else {
  console.log('❌ MISSING REQUIRED VARIABLES! Fix before deploying.');
}
console.log('═══════════════════════════════════════════════════\n');

process.exit(allGood && aiProvidersCount > 0 ? 0 : 1);
