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
    // Generate embedding
    const embedding = await embeddingService.generateEmbedding(text);
    
    // Index in vector database
    await vectorSearchService.indexKnowledgeChunk(knowledgeChunkId, embedding.embedding, businessId, knowledgeChunkId, {});
    
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
    const results = await webCrawlerService.crawlWebsite(url, { maxDepth: maxDepth || 3 });
    
    // Store crawled content in knowledge base
    for (const page of results) {
      if (page.content && page.content.length > 100) {
        // Create knowledge chunk
        const knowledge = await prisma.knowledge.create({
          data: {
            businessId,
            content: page.content,
            title: page.title || page.url,
            source: page.url,
            metadata: JSON.stringify({
              description: page.description,
              keywords: page.keywords,
              crawledAt: new Date(),
            }),
          },
        });
        
        // Queue embedding generation
        await queueService.addJob('embeddings', 'generate-embedding', {
          knowledgeChunkId: knowledge.id,
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
    await sentimentAnalysisService.saveSentimentAnalysis({
      conversationId,
      messageId,
      ...result,
    });
    
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
    await multiLanguageService.saveLanguageDetection({
      conversationId,
      messageId,
      ...result,
    });
    
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
    await vectorSearchService.reindexBusiness(businessId);
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
    const enhancedAIService = (await import('./services/enhanced-ai.service.js')).default;
    
    const response = await enhancedAIService.generateResponse(prompt, {
      context,
      maxTokens: 1000,
    });
    
    // Update message with AI response
    await prisma.message.update({
      where: { id: messageId },
      data: {
        aiResponse: response,
        metadata: JSON.stringify({
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
    const knowledgeChunks = await prisma.knowledge.findMany({
      where: { id: { in: knowledgeIds }, businessId },
      select: { id: true, content: true },
    });
    
    const texts = knowledgeChunks.map(k => k.content);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);
    
    // Index all embeddings
    for (let i = 0; i < knowledgeChunks.length; i++) {
      await vectorSearchService.indexKnowledgeChunk(
        knowledgeChunks[i].id,
        embeddings[i]
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
