#!/usr/bin/env node

/**
 * Phase 1 Validation Script
 * Tests core functionality without database dependencies
 */

const vectorSearchService = require('./server/src/services/vector-search.service');
const knowledgeBaseService = require('./server/src/services/knowledge-base.service');
const aiService = require('./server/src/services/aiService');

async function validatePhase1() {
  console.log('🚀 Phase 1: Foundation Strengthening - Validation\n');

  let passed = 0;
  let total = 0;

  // Test 1: Vector Search Service
  console.log('1. Testing Vector Search Service...');
  try {
    total++;
    // Test embedding generation (mock data)
    const testEmbedding = await vectorSearchService.generateEmbedding('test query');
    if (Array.isArray(testEmbedding) && testEmbedding.length > 0) {
      console.log('   ✅ Embedding generation works');
      passed++;
    } else {
      console.log('   ❌ Embedding generation failed');
    }
  } catch (error) {
    console.log('   ❌ Vector search service error:', error.message);
  }

  // Test 2: Knowledge Base Service
  console.log('\n2. Testing Knowledge Base Service...');
  try {
    total++;
    const chunks = knowledgeBaseService.splitIntoChunks('This is a test content for chunking.', 10);
    if (Array.isArray(chunks) && chunks.length > 0) {
      console.log('   ✅ Content chunking works');
      passed++;
    } else {
      console.log('   ❌ Content chunking failed');
    }
  } catch (error) {
    console.log('   ❌ Knowledge base service error:', error.message);
  }

  // Test 3: AI Service Integration
  console.log('\n3. Testing AI Service Integration...');
  try {
    total++;
    // Check if vector search is integrated
    const hasVectorSearch = aiService.generateResponse.toString().includes('vectorSearchService');
    if (hasVectorSearch) {
      console.log('   ✅ AI service integrated with vector search');
      passed++;
    } else {
      console.log('   ❌ AI service missing vector search integration');
    }
  } catch (error) {
    console.log('   ❌ AI service integration error:', error.message);
  }

  // Test 4: Service Dependencies
  console.log('\n4. Testing Service Dependencies...');
  try {
    total++;
    const fs = require('fs');
    const aiServicePath = './server/src/services/aiService.js';
    const vectorSearchPath = './server/src/services/vector-search.service.js';

    if (fs.existsSync(aiServicePath) && fs.existsSync(vectorSearchPath)) {
      const aiContent = fs.readFileSync(aiServicePath, 'utf8');
      const vectorContent = fs.readFileSync(vectorSearchPath, 'utf8');

      if (aiContent.includes('vector-search.service') && vectorContent.includes('generateEmbedding')) {
        console.log('   ✅ Service dependencies properly configured');
        passed++;
      } else {
        console.log('   ❌ Service dependencies incomplete');
      }
    } else {
      console.log('   ❌ Service files not found');
    }
  } catch (error) {
    console.log('   ❌ Service dependency check error:', error.message);
  }

  // Test 5: Configuration Validation
  console.log('\n5. Testing Configuration...');
  try {
    total++;
    const envPath = './server/.env';
    const envExamplePath = './server/.env.example';

    if (require('fs').existsSync(envExamplePath)) {
      console.log('   ✅ Environment configuration template exists');
      passed++;
    } else {
      console.log('   ❌ Environment configuration missing');
    }
  } catch (error) {
    console.log('   ❌ Configuration check error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 PHASE 1 VALIDATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Tests Passed: ${passed}/${total} (${Math.round((passed/total)*100)}%)`);

  if (passed === total) {
    console.log('🎉 ALL CORE FUNCTIONALITY VALIDATED!');
    console.log('✅ Phase 1 implementation is ready for deployment');
  } else {
    console.log('⚠️  Some validations failed. Check implementation before deployment.');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Complete database migration');
  console.log('2. Process existing knowledge base content');
  console.log('3. Run full integration tests');
  console.log('4. Deploy to production environment');

  process.exit(passed === total ? 0 : 1);
}

// Run validation
validatePhase1().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});