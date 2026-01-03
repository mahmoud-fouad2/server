import { PrismaClient } from '@prisma/client';
import embeddingService from '../services/embedding.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

async function generateEmbeddings() {
  try {
    logger.info('🔄 Starting embedding generation for Knowledge Base...');

    const BUSINESS_ID = 'cmjx5hz7a000br594zctuurus';

    // Get all KB entries
    const kbEntries = await prisma.knowledgeBase.findMany({
      where: { businessId: BUSINESS_ID },
      select: { id: true, title: true, content: true }
    });

    logger.info(`Found ${kbEntries.length} KB entries`);

    if (kbEntries.length === 0) {
      logger.warn('No KB entries found!');
      return;
    }

    // Delete existing chunks for this business
    await prisma.knowledgeChunk.deleteMany({
      where: { businessId: BUSINESS_ID }
    });
    logger.info('Cleared existing chunks');

    let processed = 0;
    let failed = 0;

    // Process each KB entry
    for (const kb of kbEntries) {
      try {
        const text = `${kb.title}\n${kb.content}`;
        
        // Split into chunks if too long (max 1000 chars per chunk)
        const chunks = splitIntoChunks(text, 1000);
        
        for (let i = 0; i < chunks.length; i++) {
          try {
            // Generate embedding (will try VOYAGE, OPENAI, GROQ in order)
            const { embedding, provider } = await embeddingService.generateEmbedding(chunks[i]);
            
            // Save to KnowledgeChunk
            await prisma.knowledgeChunk.create({
              data: {
                businessId: BUSINESS_ID,
                knowledgeBaseId: kb.id,
                content: chunks[i],
                embedding: JSON.stringify(embedding),
                metadata: JSON.stringify({
                  provider,
                  title: kb.title,
                  chunkIndex: i,
                  totalChunks: chunks.length
                })
              }
            });
            
            processed++;
            logger.info(`✅ Processed chunk ${i + 1}/${chunks.length} for: ${kb.title.substring(0, 50)}...`);
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (chunkError: any) {
            logger.error(`Failed to process chunk ${i + 1} for ${kb.title}:`, chunkError.message);
            failed++;
          }
        }
      } catch (error: any) {
        logger.error(`Failed to process KB entry ${kb.title}:`, error.message);
        failed++;
      }
    }

    logger.info(`\n✅ Embedding generation complete!`);
    logger.info(`   Total chunks processed: ${processed}`);
    logger.info(`   Failed: ${failed}`);
    logger.info(`   Success rate: ${((processed / (processed + failed)) * 100).toFixed(1)}%`);

  } catch (error: any) {
    logger.error('Embedding generation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?؟]\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence + '. ';
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks.length > 0 ? chunks : [text.substring(0, maxLength)];
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEmbeddings()
    .then(() => {
      logger.info('Done!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Failed:', error);
      process.exit(1);
    });
}

export default generateEmbeddings;
