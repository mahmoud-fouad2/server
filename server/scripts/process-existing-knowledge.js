#!/usr/bin/env node

/**
 * Knowledge Base Processing Script
 * Processes existing knowledge base content into searchable chunks
 * Run this after database migration in production
 */

const { PrismaClient } = require('@prisma/client');
const knowledgeBaseService = require('../src/services/knowledge-base.service');

const prisma = new PrismaClient();

async function processExistingKnowledgeBases() {
  console.log('🔄 Processing Existing Knowledge Base Content\n');

  try {
    // Get all businesses with knowledge bases
    const businesses = await prisma.business.findMany({
      include: {
        knowledgeBase: true
      }
    });

    console.log(`Found ${businesses.length} businesses to process\n`);

    let totalProcessed = 0;
    let totalChunks = 0;

    for (const business of businesses) {
      console.log(`📁 Processing business: ${business.name} (${business.id})`);

      if (business.knowledgeBase.length === 0) {
        console.log(`   ℹ️  No knowledge base content found`);
        continue;
      }

      console.log(`   📄 Found ${business.knowledgeBase.length} knowledge base entries`);

      // Clear existing chunks for this business
      const deletedChunks = await prisma.knowledgeChunk.deleteMany({
        where: { businessId: business.id }
      });

      if (deletedChunks.count > 0) {
        console.log(`   🗑️  Cleared ${deletedChunks.count} existing chunks`);
      }

      // Process each knowledge base entry
      let businessChunks = 0;
      for (const kb of business.knowledgeBase) {
        console.log(`     📝 Processing: ${kb.title || 'Untitled'} (${kb.content.length} chars)`);

        const result = await knowledgeBaseService.processKnowledgeBase(
          business.id,
          kb.content,
          kb.title
        );

        if (result.success) {
          businessChunks += result.chunksStored;
          console.log(`        ✅ Created ${result.chunksStored} chunks`);
        } else {
          console.log(`        ❌ Failed: ${result.error}`);
        }
      }

      totalProcessed++;
      totalChunks += businessChunks;
      console.log(`   🎯 Business complete: ${businessChunks} chunks created\n`);
    }

    console.log('=' .repeat(50));
    console.log('📊 PROCESSING COMPLETE');
    console.log('=' .repeat(50));
    console.log(`Businesses processed: ${totalProcessed}`);
    console.log(`Total chunks created: ${totalChunks}`);
    console.log(`Average chunks per business: ${totalProcessed > 0 ? (totalChunks / totalProcessed).toFixed(1) : 0}`);

    if (totalChunks > 0) {
      console.log('\n🎉 Knowledge base processing successful!');
      console.log('✅ Vector search is now ready for production use');
    } else {
      console.log('\n⚠️  No knowledge base content was processed');
      console.log('ℹ️  Add knowledge base content to businesses before using vector search');
    }

  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the processing
if (require.main === module) {
  processExistingKnowledgeBases().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processExistingKnowledgeBases };