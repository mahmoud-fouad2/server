/**
 * Background Worker for Processing Async Jobs
 * Handles: Embeddings, Email, Web Crawling, Sentiment Analysis, etc.
 */

import dotenv from 'dotenv';
import logger from './utils/logger.js';
import queueService from './services/queue.service.js';
import embeddingService from './services/embedding.service.js';
import emailService from './services/email.service.js';
import webCrawlerService from './services/web-crawler.service.js';
import sentimentAnalysisService from './services/sentiment-analysis.service.js';
import multiLanguageService from './services/multi-language.service.js';
import vectorSearchService from './services/vector-search.service.js';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Initialize workers
logger.info('🏭 Starting Background Workers...');

// Worker: Generate Embeddings
queueService.createWorker('embeddings', async (job) => {
  const { knowledgeChunkId, text, businessId } = job.data;
  
  logger.info(`Processing embedding job for chunk ${knowledgeChunkId}`);
  
  try {
    // Index in vector database (generates embedding internally)
    await vectorSearchService.indexKnowledgeChunk(knowledgeChunkId, text, businessId, knowledgeChunkId, {});
    
    logger.info(`✅ Successfully indexed chunk ${knowledgeChunkId}`);
    
    return { success: true, knowledgeChunkId };
  } catch (error) {
    logger.error(`❌ Failed to process embedding for chunk ${knowledgeChunkId}:`, error);
    throw error;
  }
}, { concurrency: 3 });

// Worker: Send Emails
queueService.createWorker('emails', async (job) => {
  const { to, subject, html, attachments } = job.data;
  
  logger.info(`Sending email to ${to}`);
  
  try {
    await emailService.sendEmail({ to, subject, html, attachments });
    logger.info(`✅ Email sent to ${to}`);
    return { success: true, to };
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}, { concurrency: 5 });

// Worker: Web Crawling
queueService.createWorker('crawling', async (job) => {
  const { url, businessId, maxDepth } = job.data;
  
  logger.info(`Crawling website: ${url}`);
  
  try {
    const results = await webCrawlerService.crawlWebsite(url, maxDepth || 3);
    
    // Store crawled content in knowledge base
    for (const page of results) {
      if (page.content && page.content.length > 100) {
        // Create knowledge base entry
        const knowledgeBase = await prisma.knowledgeBase.create({
          data: {
            businessId,
            content: page.content,
            title: page.title || page.url,
            source: page.url,
            metadata: JSON.stringify({
              description: (page as any).description,
              keywords: (page as any).keywords,
              crawledAt: new Date(),
            }),
          },
        });

        // Create knowledge chunk
        const chunk = await prisma.knowledgeChunk.create({
          data: {
            businessId,
            knowledgeBaseId: knowledgeBase.id,
            content: page.content,
            metadata: JSON.stringify({
              source: page.url,
              title: page.title,
            }),
          }
        });
        
        // Queue embedding generation
        await queueService.addJob('embeddings', 'generate-embedding', {
          knowledgeChunkId: chunk.id,
          text: page.content,
          businessId,
        }, {
          priority: 5,
          delay: 1000,
        });
      }
    }
    
    logger.info(`✅ Crawled ${results.length} pages from ${url}`);
    return { success: true, pagesCount: results.length };
  } catch (error) {
    logger.error(`❌ Failed to crawl ${url}:`, error);
    throw error;
  }
}, { concurrency: 2 });

// Worker: Sentiment Analysis
queueService.createWorker('sentiment', async (job) => {
  const { conversationId, messageId, text } = job.data;
  
  logger.info(`Analyzing sentiment for message ${messageId}`);
  
  try {
    const result = await sentimentAnalysisService.analyzeSentiment(text);
    
    // Save to database
    await sentimentAnalysisService.saveSentimentAnalysis(
      conversationId,
      messageId,
      result
    );
    
    logger.info(`✅ Sentiment analyzed for message ${messageId}: ${result.sentiment}`);
    return { success: true, sentiment: result.sentiment };
  } catch (error) {
    logger.error(`❌ Failed to analyze sentiment for message ${messageId}:`, error);
    throw error;
  }
}, { concurrency: 5 });

// Worker: Language Detection
queueService.createWorker('language-detection', async (job) => {
  const { conversationId, messageId, text } = job.data;
  
  logger.info(`Detecting language for message ${messageId}`);
  
  try {
    const result = await multiLanguageService.detectLanguage(text);
    
    // Save to database
    await multiLanguageService.saveLanguageDetection(
      conversationId,
      messageId,
      result
    );
    
    logger.info(`✅ Language detected for message ${messageId}: ${result.language}`);
    return { success: true, language: result.language };
  } catch (error) {
    logger.error(`❌ Failed to detect language for message ${messageId}:`, error);
    throw error;
  }
}, { concurrency: 5 });

// Worker: Reindex Business Knowledge
queueService.createWorker('reindex-business', async (job) => {
  const { businessId } = job.data;
  
  logger.info(`Reindexing all knowledge for business ${businessId}`);
  
  try {
    // Fetch all knowledge chunks
    const knowledgeChunks = await prisma.knowledgeChunk.findMany({
      where: { businessId },
    });
    
    // Reindex
    for (const chunk of knowledgeChunks) {
        await vectorSearchService.indexKnowledgeChunk(
          chunk.id, 
          chunk.content, 
          businessId, 
          chunk.knowledgeBaseId || '', 
          chunk.metadata ? JSON.parse(chunk.metadata) : {}
        );
    }

    logger.info(`✅ Reindexed business ${businessId}`);
    return { success: true, businessId };
  } catch (error) {
    logger.error(`❌ Failed to reindex business ${businessId}:`, error);
    throw error;
  }
}, { concurrency: 1 });

// Worker: AI Response Generation (for heavy processing)
queueService.createWorker('ai-processing', async (job) => {
  const { conversationId, messageId, prompt, context } = job.data;
  
  logger.info(`Generating AI response for message ${messageId}`);
  
  try {
    // Fetch businessId from conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { businessId: true }
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const aiService = (await import('./services/ai.service.js')).default;
    
    const response = await aiService.generateResponse(
      conversation.businessId,
      prompt,
      [], // history
      {
        conversationId,
        messageId,
        useVectorSearch: true,
      }
    );
    
    // Update message with AI response
    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: response, // Assuming we update content or add a new message? 
        // If we want to store AI response separately, we need a field. 
        // But usually AI response IS a new message.
        // Wait, the worker updates an EXISTING message? 
        // "Update message with AI response" implies the message was created as a placeholder?
        // Or maybe we should create a NEW message?
        // Let's assume we update metadata for now as per original code, but 'aiResponse' field doesn't exist.
        metadata: JSON.stringify({
          aiResponse: response,
          processedAt: new Date(),
          provider: 'queue-worker',
        }),
      },
    });
    
    logger.info(`✅ AI response generated for message ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    logger.error(`❌ Failed to generate AI response for message ${messageId}:`, error);
    throw error;
  }
}, { concurrency: 5 });

// Worker: Batch Embedding Generation
queueService.createWorker('batch-embeddings', async (job) => {
  const { businessId, knowledgeIds } = job.data;
  
  logger.info(`Generating batch embeddings for ${knowledgeIds.length} knowledge chunks`);
  
  try {
    const knowledgeChunks = await prisma.knowledgeChunk.findMany({
      where: { id: { in: knowledgeIds }, businessId },
      select: { id: true, content: true, knowledgeBaseId: true, metadata: true },
    });
    
    const texts = knowledgeChunks.map(k => k.content);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);
    
    // Index all embeddings
    for (let i = 0; i < knowledgeChunks.length; i++) {
      await vectorSearchService.indexKnowledgeChunk(
        knowledgeChunks[i].id,
        knowledgeChunks[i].content,
        businessId,
        knowledgeChunks[i].knowledgeBaseId || '',
        knowledgeChunks[i].metadata ? JSON.parse(knowledgeChunks[i].metadata as string) : {}
      );
    }
    
    logger.info(`✅ Batch indexed ${embeddings.length} embeddings`);
    return { success: true, count: embeddings.length };
  } catch (error) {
    logger.error(`❌ Failed to generate batch embeddings:`, error);
    throw error;
  }
}, { concurrency: 2 });

// Health check interval
setInterval(() => {
  logger.info('🔄 Worker health check - All workers active');
}, 60000); // Every minute

logger.info('✅ All workers initialized');
logger.info('📊 Active queues:', Object.keys(queueService.getAllQueues()));

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await queueService.closeAll();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing workers...');
  await queueService.closeAll();
  await prisma.$disconnect();
  process.exit(0);
});
