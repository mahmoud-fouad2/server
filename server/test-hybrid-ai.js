/**
 * Quick Test Script for Hybrid AI System
 * Run: node test-hybrid-ai.js
 */

require('dotenv').config();
const hybridAI = require('./src/services/hybrid-ai.service');

async function testHybridAI() {
  console.log('\n🤖 Testing Hybrid AI System...\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Check Provider Status
  console.log('📊 Provider Status:');
  console.log('─────────────────────────────────────────────────');
  const status = hybridAI.getProviderStatus();
  
  Object.entries(status).forEach(([key, info]) => {
    const icon = info.available ? '✅' : '❌';
    const enabled = info.enabled ? '🟢' : '⚫';
    console.log(`${icon} ${enabled} ${info.name.padEnd(10)} | Enabled: ${info.enabled} | Available: ${info.available} | Usage: ${info.utilization.requests}`);
  });

  const availableCount = Object.values(status).filter(p => p.available).length;
  console.log(`\n📈 Available Providers: ${availableCount}/4\n`);

  if (availableCount === 0) {
    console.error('❌ No providers available! Please check your API keys in .env file.\n');
    console.log('Required environment variables:');
    console.log('  - DEEPSEEK_API_KEY');
    console.log('  - GROQ_API_KEY');
    console.log('  - CEREBRAS_API_KEY');
    console.log('  - GEMINI_API_KEY\n');
    process.exit(1);
  }

  // 2. Health Check
  console.log('🏥 Running Health Check...');
  console.log('─────────────────────────────────────────────────');
  
  try {
    const healthResults = await hybridAI.healthCheck();
    
    Object.entries(healthResults).forEach(([key, result]) => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'disabled' ? '⚫' : '❌';
      const providerName = key.padEnd(10);
      
      if (result.status === 'healthy') {
        console.log(`${icon} ${providerName} | Status: ${result.status} | Response: ${result.response}`);
      } else if (result.status === 'disabled') {
        console.log(`${icon} ${providerName} | Status: ${result.status} | Reason: ${result.reason}`);
      } else {
        console.log(`${icon} ${providerName} | Status: ${result.status} | Error: ${result.reason}`);
      }
    });

    const healthyCount = Object.values(healthResults).filter(r => r.status === 'healthy').length;
    console.log(`\n💚 Healthy Providers: ${healthyCount}/4\n`);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  // 3. Test Real AI Request
  console.log('🧪 Testing Real AI Request...');
  console.log('─────────────────────────────────────────────────');
  
  const testMessages = [
    { role: 'system', content: 'You are a helpful assistant. Keep responses very short.' },
    { role: 'user', content: 'What is 2+2? Answer in one word.' }
  ];

  try {
    const startTime = Date.now();
    const result = await hybridAI.generateResponse(testMessages, { maxTokens: 50 });
    const duration = Date.now() - startTime;

    console.log(`\n✅ Request Successful!`);
    console.log(`   Provider: ${result.provider || 'Unknown'}`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Response: "${result.response.trim()}"`);
    console.log(`   Tokens: ${result.tokensUsed}`);
    console.log(`   Time: ${duration}ms\n`);

  } catch (error) {
    console.error('❌ AI request failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your API keys are valid');
    console.log('2. Verify you have not exceeded rate limits');
    console.log('3. Check your internet connection\n');
  }

  // 4. Load Test (10 rapid requests)
  console.log('⚡ Load Test (10 rapid requests)...');
  console.log('─────────────────────────────────────────────────');
  
  const loadTestMessages = [
    { role: 'user', content: 'Say OK' }
  ];

  let successCount = 0;
  let failCount = 0;
  const startLoadTest = Date.now();

  for (let i = 1; i <= 10; i++) {
    try {
      const result = await hybridAI.generateResponse(loadTestMessages, { maxTokens: 10 });
      successCount++;
      process.stdout.write(`✅ `);
    } catch (error) {
      failCount++;
      process.stdout.write(`❌ `);
    }
  }

  const loadTestDuration = Date.now() - startLoadTest;
  console.log(`\n\n📊 Load Test Results:`);
  console.log(`   Success: ${successCount}/10`);
  console.log(`   Failed: ${failCount}/10`);
  console.log(`   Total Time: ${loadTestDuration}ms`);
  console.log(`   Avg Time: ${Math.round(loadTestDuration / 10)}ms per request\n`);

  // 5. Final Status Check
  console.log('📊 Final Provider Status:');
  console.log('─────────────────────────────────────────────────');
  const finalStatus = hybridAI.getProviderStatus();
  
  Object.entries(finalStatus).forEach(([key, info]) => {
    const icon = info.available ? '✅' : '⚠️';
    console.log(`${icon} ${info.name.padEnd(10)} | Usage: ${info.utilization.requests} (${info.utilization.requestsPercent}%)`);
  });

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Hybrid AI System Test Complete!\n');
}

// Run the test
testHybridAI().catch(error => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});
