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

  async generateResponse(businessId: string, prompt: string) {
    // Fetch tenant config
    const business = await prisma.business.findUnique({ 
      where: { id: businessId }, 
      select: { aiProviderConfig: true } 
    });

    const config = business?.aiProviderConfig as any;
    let providerType = config?.type || 'groq';
    let provider = this.providers.get(providerType);

    // Intelligent Failover
    if (!provider || !(await provider.healthCheck())) {
      console.warn(`Provider ${providerType} unavailable, failing over to Gemini`);
      provider = this.providers.get('gemini');
    }

    if (!provider) throw new Error('No AI providers available');

    const { response, usage } = await provider.generateResponse(prompt);
    
    // Async billing update
    prisma.business.update({
      where: { id: businessId },
      data: { messagesUsed: { increment: 1 } } // Simplified billing
    }).catch(console.error);

    return response;
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

  private async generateChatResponse(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options: AIOptions = {}
  ) {
    const providers: AIProviderName[] = ['groq', 'gemini', 'deepseek', 'cerebras'];
    const preferredProvider = options.provider || providers[0];
    
    // Try preferred provider first
    const sortedProviders = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
    
    for (const providerName of sortedProviders) {
      const provider = this.providers.get(providerName);
      if (!provider?.available) continue;

      try {
        let response: string;
        
        switch (providerName) {
          case 'groq':
            response = await this.callGroq(systemPrompt, userMessage, history, options);
            break;
          case 'gemini':
            response = await this.callGemini(systemPrompt, userMessage, history, options);
            break;
          case 'deepseek':
            response = await this.callDeepSeek(systemPrompt, userMessage, history, options);
            break;
          case 'cerebras':
            response = await this.callCerebras(systemPrompt, userMessage, history, options);
            break;
          default:
            continue;
        }

        provider.requestCount++;
        return { text: response, provider: providerName, tokensUsed: 0 };
      } catch (error: any) {
        provider.errorCount++;
        provider.lastError = error.message;
        logger.error(`${providerName} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }

  private async callGroq(systemPrompt: string, userMessage: string, history: any[], options: AIOptions) {
    if (!this.groqClient) throw new Error('Groq not configured');
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: userMessage }
    ];

    const completion = await this.groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async callGemini(systemPrompt: string, userMessage: string, history: any[], options: AIOptions) {
    if (!this.geminiClient) throw new Error('Gemini not configured');
    
    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      },
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\n${userMessage}`);
    return result.response.text();
  }

  private async callDeepSeek(systemPrompt: string, userMessage: string, history: any[], options: AIOptions) {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    return response.data.choices[0].message.content;
  }

  private async callCerebras(systemPrompt: string, userMessage: string, history: any[], options: AIOptions) {
    const response = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        model: 'llama3.1-8b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      },
      { headers: { Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}` } }
    );
    return response.data.choices[0].message.content;
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

      // 6. Format conversation history
      const formattedHistory = history.map(msg => ({
        role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      }));

      // 7. Call AI Service (with multi-provider fallback)
      const response = await this.generateChatResponse(
        systemPrompt,
        userMessage,
        formattedHistory,
        {
          maxTokens: 1000,
          temperature: 0.7,
        }
      );

      // 8. Log analytics
      logger.info('AI Response Generated:', {
        businessId,
        provider: response.provider,
        tokensUsed: response.tokensUsed,
        intent: intentResult?.intent,
        sentiment: sentimentResult?.sentiment,
      });

      return response.text;
    } catch (error) {
      logger.error('AI Generation Error:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }
  }

  // Get AI Provider Status
  async getProviderStatus() {
    const status: any = {};
    this.providers.forEach((provider, name) => {
      status[name] = {
        available: provider.available,
        requestCount: provider.requestCount,
        errorCount: provider.errorCount,
        lastError: provider.lastError,
      };
    });
    return status;
  }
}

export default new AIService();
