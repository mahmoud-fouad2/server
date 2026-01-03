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
import { dialectService } from './dialect.service.js';
import queueService from './queue.service.js';
import { cacheService } from './cache.service.js';
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
      model: options?.model || 'llama-3.3-70b-versatile',
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

// Custom AI Model Provider (supports OpenAI-compatible APIs)
class CustomAIProvider implements AIProvider {
  private config: any;
  constructor(config: any) { this.config = config; }
  
  async generateResponse(prompt: string, options?: any) {
    const modelConfig = typeof this.config === 'string' ? JSON.parse(this.config) : this.config;
    const endpoint = modelConfig.endpoint || modelConfig.apiUrl;
    const apiKey = modelConfig.apiKey || modelConfig.key;
    const model = options?.model || modelConfig.model || modelConfig.defaultModel;

    if (!endpoint || !apiKey) {
      throw new Error('Custom model missing endpoint or API key');
    }

    // OpenAI-compatible API call
    const response = await axios.post(
      endpoint,
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: modelConfig.temperature || 0.7,
        max_tokens: modelConfig.maxTokens || 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      response: response.data.choices[0]?.message?.content || '',
      usage: { tokens: response.data.usage?.total_tokens || 0 }
    };
  }

  async healthCheck() { 
    try {
      const modelConfig = typeof this.config === 'string' ? JSON.parse(this.config) : this.config;
      return !!(modelConfig.endpoint && modelConfig.apiKey);
    } catch {
      return false;
    }
  }
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  
  constructor() {
    // Use GROQ_API_KEY or fallback to GROQ_API_KEY_BACKUP
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP;
    if (groqKey) this.providers.set('groq', new GroqProvider(groqKey));
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
      country?: string; // Added for geo-aware dialect detection
    } = {}
  ) {
    const { 
      conversationId, 
      messageId,
      useVectorSearch = true, 
      detectIntent = true,
      analyzeSentiment = true,
      detectLanguage = true,
      country
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
      const [intentResult, sentimentResult, dialectResult] = await Promise.all([
        detectIntent ? intentDetectionService.detectIntent(userMessage) : null,
        analyzeSentiment && conversationId ? 
          queueService.addJob('sentiment', 'analyze-sentiment', { conversationId, messageId, text: userMessage })
            .then(() => sentimentAnalysisService.analyzeSentiment(userMessage))
            .catch(() => null) : null,
        detectLanguage && conversationId ? 
          dialectService.detectDialect(userMessage, { country, conversationId })
            .catch(() => multiLanguageService.detectLanguage(userMessage))
            .catch(() => null) : null,
      ]);

      logger.info('AI Analysis:', { 
        intent: intentResult?.intent, 
        sentiment: sentimentResult?.sentiment,
        dialect: dialectResult?.dialect,
        dialectConfidence: dialectResult?.confidence,
        dialectMethod: (dialectResult as any)?.method
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

**User Context:**
${intentResult ? `- Intent: ${intentResult.intent}` : ''}
${sentimentResult ? `- Sentiment: ${sentimentResult.sentiment} (Confidence: ${sentimentResult.confidence})` : ''}
${dialectResult ? `- Dialect: ${dialectResult.dialect} (Confidence: ${(dialectResult.confidence * 100).toFixed(1)}%${(dialectResult as any)?.method ? `, Method: ${(dialectResult as any).method}` : ''})` : ''}
${intentResult?.entities && intentResult.entities.length > 0 ? `- Entities: ${intentResult.entities.join(', ')}` : ''}

**Instructions:**
1. Respond in ${dialectResult?.dialect || business.language || 'the user\'s language'} dialect/language
2. Use a ${business.botTone || 'professional'} tone
3. Be helpful, accurate, and concise
4. If you don't know the answer, say so clearly
${intentResult?.intent === 'complaint' ? '5. Show empathy and offer solutions' : ''}
${sentimentResult?.sentiment === 'NEGATIVE' ? '6. Be extra supportive and understanding' : ''}
${dialectResult ? `7. Match the user's detected dialect (${dialectResult.dialect}) in your response` : ''}
`;

      // 5. Add Knowledge Context
      if (relevantKnowledge) {
        systemPrompt += `\n\n**Relevant Knowledge Base:**\n${relevantKnowledge}\n\nUse this information to answer the user's question accurately.`;
      }

      // 6. Select Provider Strategy
      let provider: AIProvider | undefined;
      let providerType = 'groq'; // default

      // Priority 1: Use Custom AI Models if available
      if (business.customAIModels && business.customAIModels.length > 0) {
        const customModel = business.customAIModels[0]; // Use first active model
        logger.info('Using custom AI model:', { modelId: customModel.id, name: customModel.name });
        try {
          provider = new CustomAIProvider(customModel.config);
          providerType = `custom:${customModel.name}`;
          
          // Validate custom provider
          if (!(await provider.healthCheck())) {
            logger.warn('Custom model health check failed, falling back');
            provider = undefined;
          }
        } catch (error) {
          logger.error('Failed to initialize custom model:', error);
          provider = undefined;
        }
      }

      // Priority 2: Use aiProviderConfig if no custom models
      if (!provider) {
        const config = business.aiProviderConfig as any;
        providerType = config?.type || 'groq';
        provider = this.providers.get(providerType);
      }

      // Priority 3: Intelligent Failover
      if (!provider || !(await provider.healthCheck())) {
        logger.warn(`Provider ${providerType} unavailable, failing over to Groq`);
        provider = this.providers.get('groq');
        providerType = 'groq';
      }

      // Priority 4: Try Gemini as last resort
      if (!provider || !(await provider.healthCheck())) {
        logger.warn('Groq unavailable, failing over to Gemini');
        provider = this.providers.get('gemini');
        providerType = 'gemini';
      }

      if (!provider) throw new Error('No AI providers available');

      // 7. Generate Response
      const modelConfig = business.aiProviderConfig as any;
      const { response, usage } = await provider.generateResponse(
        `${systemPrompt}\n\nUser: ${userMessage}`,
        { model: modelConfig?.model }
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
        dialect: dialectResult?.dialect,
        dialectConfidence: dialectResult?.confidence,
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
