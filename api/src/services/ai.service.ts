/*
 * 🛡️ CORE SYSTEM FILE - DO NOT MODIFY WITHOUT EXPERT REVIEW 🛡️
 * This file controls the AI generation logic, provider strategy, and fallback mechanisms.
 * Any changes here can break the AI functionality.
 */
import prisma from '../config/database.js';
import vectorSearchService from './vector-search.service.js';
import intentDetectionService from './intent-detection.service.js';
import sentimentAnalysisService from './sentiment-analysis.service.js';
import multiLanguageService from './multi-language.service.js';
import queueService from './queue.service.js';
import cacheService from './cache.service.js';
import logger from '../utils/logger.js';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

interface AIProvider {
  generateResponse(prompt: string, options?: any): Promise<{ response: string, usage: { tokens: number } }>;
  healthCheck(): Promise<boolean>;
}

class GroqProvider implements AIProvider {
  private client: Groq;
  constructor(apiKey: string) { this.client = new Groq({ apiKey }); }
  
  async generateResponse(prompt: string, options?: any) {
    const completion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: options?.model || 'mixtral-8x7b-32768',
    });
    return {
      response: completion.choices[0]?.message?.content || '',
      usage: { tokens: completion.usage?.total_tokens || 0 }
    };
  }

  async healthCheck() { return true; } // Implement real check
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  constructor(apiKey: string) { this.client = new GoogleGenerativeAI(apiKey); }

  async generateResponse(prompt: string, options?: any) {
    const model = this.client.getGenerativeModel({ model: options?.model || 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return {
      response: response.text(),
      usage: { tokens: 0 } // Gemini doesn't always return usage easily
    };
  }

  async healthCheck() { return true; }
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  
  constructor() {
    if (process.env.GROQ_API_KEY) this.providers.set('groq', new GroqProvider(process.env.GROQ_API_KEY));
    if (process.env.GEMINI_API_KEY) this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
  }

  // Enhanced Core Generation Logic with Vector Search, Intent Detection, and Multi-Provider
  async generateResponse(
    businessId: string, 
    userMessage: string, 
    history: any[] = [],
    options: {
      conversationId?: string;
      messageId?: string;
      useVectorSearch?: boolean;
      detectIntent?: boolean;
      analyzeSentiment?: boolean;
      detectLanguage?: boolean;
    } = {}
  ) {
    const { 
      conversationId, 
      messageId,
      useVectorSearch = true, 
      detectIntent = true,
      analyzeSentiment = true,
      detectLanguage = true 
    } = options;

    try {
      // 1. Fetch Business Settings
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { 
          knowledgeBase: true,
          customAIModels: { where: { isActive: true } }
        }
      });

      if (!business) throw new Error('Business not found');

      // 2. Parallel Processing: Intent, Sentiment, Language Detection
      const [intentResult, sentimentResult, languageResult] = await Promise.all([
        detectIntent ? intentDetectionService.detectIntent(userMessage) : null,
        analyzeSentiment && conversationId ? 
          queueService.addJob('sentiment', 'analyze-sentiment', { conversationId, messageId, text: userMessage })
            .then(() => sentimentAnalysisService.analyzeSentiment(userMessage))
            .catch(() => null) : null,
        detectLanguage && conversationId ? 
          queueService.addJob('language-detection', 'detect-language', { conversationId, messageId, text: userMessage })
            .then(() => multiLanguageService.detectLanguage(userMessage))
            .catch(() => null) : null,
      ]);

      logger.info('AI Analysis:', { 
        intent: intentResult?.intent, 
        sentiment: sentimentResult?.sentiment,
        language: languageResult?.language 
      });

      // 3. Vector Search for Relevant Knowledge (Enhanced RAG)
      let relevantKnowledge = '';
      if (useVectorSearch && business.knowledgeBase.length > 0) {
        const cacheKey = `knowledge:${businessId}:${Buffer.from(userMessage).toString('base64').slice(0, 32)}`;
        
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          relevantKnowledge = cached;
          logger.info('Using cached knowledge search');
        } else {
          try {
            const searchResults = await vectorSearchService.searchKnowledge(userMessage, businessId, 5, 0.7);
            
            if (searchResults.length > 0) {
              relevantKnowledge = searchResults
                .map((r, i) => `[${i + 1}] (Relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`)
                .join('\n\n');
              
              await cacheService.set(cacheKey, relevantKnowledge, 3600); // Cache for 1 hour
            }
          } catch (error) {
            logger.error('Vector search failed, falling back to basic search:', error);
            // Fallback to simple keyword search
            relevantKnowledge = business.knowledgeBase
              .filter(kb => kb.content.toLowerCase().includes(userMessage.toLowerCase().split(' ')[0]))
              .map(kb => `${kb.title}\n${kb.content}`)
              .join('\n\n');
          }
        }
      }

      // 4. Construct Enhanced System Prompt
      let systemPrompt = `You are an intelligent AI assistant for ${business.name}.

**Business Context:**
- Name: ${business.name}
- Tone: ${business.botTone}
- Language: ${business.language}
- Industry: ${business.industry || 'General'}

**User Context:**
${intentResult ? `- Intent: ${intentResult.intent}` : ''}
${sentimentResult ? `- Sentiment: ${sentimentResult.sentiment} (Confidence: ${sentimentResult.confidence})` : ''}
${languageResult ? `- Language: ${languageResult.language}` : ''}
${intentResult?.entities && intentResult.entities.length > 0 ? `- Entities: ${intentResult.entities.join(', ')}` : ''}

**Instructions:**
1. Respond in ${business.language || 'the user\'s language'}
2. Use a ${business.botTone || 'professional'} tone
3. Be helpful, accurate, and concise
4. If you don't know the answer, say so clearly
${intentResult?.intent === 'complaint' ? '5. Show empathy and offer solutions' : ''}
${sentimentResult?.sentiment === 'NEGATIVE' ? '6. Be extra supportive and understanding' : ''}
`;

      // 5. Add Knowledge Context
      if (relevantKnowledge) {
        systemPrompt += `\n\n**Relevant Knowledge Base:**\n${relevantKnowledge}\n\nUse this information to answer the user's question accurately.`;
      }

      // 6. Select Provider Strategy
      const config = business.aiProviderConfig as any;
      let providerType = config?.type || 'groq';
      let provider = this.providers.get(providerType);

      // Intelligent Failover
      if (!provider || !(await provider.healthCheck())) {
        console.warn(`Provider ${providerType} unavailable, failing over to Gemini`);
        provider = this.providers.get('gemini');
      }

      if (!provider) throw new Error('No AI providers available');

      // 7. Generate Response
      const { response, usage } = await provider.generateResponse(
        `${systemPrompt}\n\nUser: ${userMessage}`,
        { model: config?.model }
      );

      // 8. Async billing update
      prisma.business.update({
        where: { id: businessId },
        data: { messagesUsed: { increment: 1 } }
      }).catch(console.error);

      // 9. Log analytics
      logger.info('AI Response Generated:', {
        businessId,
        provider: providerType,
        tokensUsed: usage.tokens,
        intent: intentResult?.intent,
        sentiment: sentimentResult?.sentiment,
      });

      return response;
    } catch (error) {
      logger.error('AI Generation Error:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }
  }
  
  // CRUD for Custom Models
  async getModels(businessId: string) {
    return prisma.customAIModel.findMany({
      where: { businessId }
    });
  }

  async createModel(businessId: string, name: string, config: any) {
    return prisma.customAIModel.create({
      data: {
        businessId,
        name,
        isActive: true
      }
    });
  }
}

export default new AIService();
