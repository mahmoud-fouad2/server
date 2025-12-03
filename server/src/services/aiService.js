const axios = require('axios');
const levenshtein = require('fast-levenshtein');
const prisma = require('../config/database');

// AI Provider Configuration
const AI_PROVIDERS = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBqhlvpIoPwIqGDQ-4zDUmqEowO4BSH9d8',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash'
  },
  cerebras: {
    apiKey: process.env.CEREBRAS_API_KEY || 'csk-92v9ywj8cr4et9k4h2rpm3mwfxpe4hnhvhxe9yfyfvtncjfm',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama3.1-8b'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-2cc3db21757f4af493012f75f6185ed1',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
};

// Fahimo Insight: Smart Caching System (LRU-like)
// We cache responses to save tokens and speed up replies for common questions.
const responseCache = new Map();
const CACHE_LIMIT = 100;

// Local Fallback Responses (if API fails)
const fallbackResponses = {
  greeting: [
    "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    "أهلاً بك! أنا هنا للإجابة على أسئلتك.",
    "مرحباً! كيف حالك؟ كيف أستطيع خدمتك؟"
  ],
  thanks: [
    "على الرحب والسعة!",
    "لا شكر على واجب! أنا هنا دائماً للمساعدة.",
    "العفو! سعيد بخدمتك."
  ],
  unknown: [
    "عذراً، لم أفهم سؤالك تماماً. هل يمكنك إعادة صياغته؟",
    "أنا آسف، لا أملك معلومات كافية للإجابة على هذا السؤال. يرجى التواصل مع فريق الدعم.",
    "للأسف، لا أستطيع الإجابة على هذا السؤال حالياً. هل لديك سؤال آخر؟"
  ]
};

// Simple keyword-based local matcher
function getLocalResponse(message) {
  const msg = message.toLowerCase().trim();
  
  // Greetings
  if (msg.match(/^(مرحبا|أهلا|هلا|السلام|صباح|مساء|hello|hi|hey)/)) {
    return fallbackResponses.greeting[Math.floor(Math.random() * fallbackResponses.greeting.length)];
  }
  
  // Thanks
  if (msg.match(/(شكرا|thank|thx|تسلم|ممتن)/)) {
    return fallbackResponses.thanks[Math.floor(Math.random() * fallbackResponses.thanks.length)];
  }
  
  return null; // No local match
}

class AIService {
  constructor() {
    this.providers = ['groq', 'gemini', 'cerebras', 'deepseek'];
    this.currentProviderIndex = 0;
  }

  async callGroq(messages) {
    const config = AI_PROVIDERS.groq;
    const response = await axios.post(
      config.url,
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data.choices[0].message.content;
  }

  async callGemini(messages) {
    const config = AI_PROVIDERS.gemini;
    // Convert messages to Gemini format
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    // Add system message as first user message
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemMsg.content }]
      });
    }

    const response = await axios.post(
      `${config.url}?key=${config.apiKey}`,
      { contents },
      { timeout: 10000 }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  }

  async callCerebras(messages) {
    const config = AI_PROVIDERS.cerebras;
    const response = await axios.post(
      config.url,
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data.choices[0].message.content;
  }

  async callDeepseek(messages) {
    const config = AI_PROVIDERS.deepseek;
    const response = await axios.post(
      config.url,
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data.choices[0].message.content;
  }

  async callAIProvider(messages, providerName) {
    try {
      console.log(`[AI] Trying ${providerName}...`);
      switch(providerName) {
        case 'groq':
          return await this.callGroq(messages);
        case 'gemini':
          return await this.callGemini(messages);
        case 'cerebras':
          return await this.callCerebras(messages);
        case 'deepseek':
          return await this.callDeepseek(messages);
        default:
          throw new Error('Unknown provider');
      }
    } catch (error) {
      console.error(`[AI] ${providerName} failed:`, error.message);
      throw error;
    }
  }

  async generateResponse(userMessage, businessId, history = []) {
    try {
      // 1. Check Cache
      const cachedResponse = this.checkCache(businessId, userMessage);
      if (cachedResponse) {
        console.log(`[Fahimo Cache] Hit for business ${businessId}`);
        return { response: cachedResponse, fromCache: true, tokensUsed: 0, provider: 'cache' };
      }

      // 2. Try Local Fallback Response
      const localResponse = getLocalResponse(userMessage);
      if (localResponse) {
        console.log(`[Local Fallback] Used for: ${userMessage}`);
        return { response: localResponse, fromCache: false, tokensUsed: 0, provider: 'local' };
      }

      // 3. Fetch Business Context & Tone
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { knowledgeBase: true }
      });

      if (!business) {
        return { 
          response: "عذراً، حدث خطأ في الاتصال بقاعدة البيانات.", 
          fromCache: false, 
          tokensUsed: 0,
          provider: 'none'
        };
      }

      // 4. Try Local Keyword Search
      const keywords = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let bestMatch = null;
      let bestScore = 0;
      
      for (const kb of business.knowledgeBase) {
        const content = kb.content.toLowerCase();
        let score = 0;
        keywords.forEach(keyword => {
          if (content.includes(keyword)) score++;
        });
        if (score > bestScore) {
          bestScore = score;
          bestMatch = kb.content;
        }
      }

      if (bestScore >= keywords.length * 0.5 && bestMatch) {
        const snippet = bestMatch.substring(0, 500);
        const localAnswer = `بناءً على معلوماتنا: ${snippet}... \n\nللمزيد من التفاصيل، يرجى التواصل معنا.`;
        console.log(`[Local KB Match] Score: ${bestScore}/${keywords.length}`);
        this.addToCache(businessId, userMessage, localAnswer);
        return { response: localAnswer, fromCache: false, tokensUsed: 0, provider: 'knowledge-base' };
      }

      // 5. Construct Context
      const context = business.knowledgeBase.map(kb => kb.content).join("\n\n").substring(0, 30000);

      // 6. Prepare messages
      const messages = [
        {
          role: "system",
          content: `You are a helpful AI assistant for "${business.name}".
Industry: ${business.activityType}
Tone: ${business.botTone}

Instructions:
- Answer in the same language as the user.
- Answer based ONLY on the provided Context.
- If not in context, politely say you don't know.
- Keep answers concise (under 3 sentences).

Context:
${context}`
        },
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
        { role: "user", content: userMessage }
      ];

      // 7. Try all providers in sequence (fallback chain)
      let response = null;
      let usedProvider = null;
      
      for (let attempt = 0; attempt < this.providers.length; attempt++) {
        const provider = this.providers[this.currentProviderIndex];
        try {
          response = await this.callAIProvider(messages, provider);
          usedProvider = provider;
          console.log(`[AI] Success with ${provider}`);
          break;
        } catch (error) {
          console.error(`[AI] ${provider} failed, trying next...`);
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        }
      }

      // If all providers failed
      if (!response) {
        const fallback = fallbackResponses.unknown[Math.floor(Math.random() * fallbackResponses.unknown.length)];
        response = fallback + (bestMatch ? `\n\nمعلومة قد تفيدك: ${bestMatch.substring(0, 300)}...` : "");
        usedProvider = 'fallback';
      }

      // 8. Save to Cache
      this.addToCache(businessId, userMessage, response);

      return { 
        response, 
        fromCache: false, 
        tokensUsed: 0,
        provider: usedProvider
      };

    } catch (error) {
      console.error("AI Generation Error:", error);
      const fallback = fallbackResponses.unknown[0];
      return { 
        response: fallback, 
        fromCache: false, 
        tokensUsed: 0,
        provider: 'error'
      };
    }
  }

  checkCache(businessId, message) {
    const botCache = responseCache.get(businessId) || [];
    // Check for similar questions (Levenshtein distance < 5 chars difference)
    const match = botCache.find(entry => 
      levenshtein.get(entry.question.toLowerCase(), message.toLowerCase()) < 5
    );
    return match ? match.answer : null;
  }

  addToCache(businessId, question, answer) {
    let botCache = responseCache.get(businessId) || [];
    
    // LRU Eviction if full
    if (botCache.length >= CACHE_LIMIT) {
      botCache.shift(); // Remove oldest
    }

    botCache.push({ question, answer, timestamp: Date.now() });
    responseCache.set(businessId, botCache);
  }
}

module.exports = new AIService();
