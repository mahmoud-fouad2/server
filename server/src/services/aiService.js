const axios = require('axios');
const levenshtein = require('fast-levenshtein');
const prisma = require('../config/database');
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    this.modelName = "llama-3.3-70b-versatile"; // Groq's fastest model
  }

  async generateResponse(userMessage, businessId, history = []) {
    try {
      // 1. Check Cache (Fahimo Magic: Levenshtein Similarity)
      const cachedResponse = this.checkCache(businessId, userMessage);
      if (cachedResponse) {
        console.log(`[Fahimo Cache] Hit for business ${businessId}`);
        return { response: cachedResponse, fromCache: true, tokensUsed: 0 };
      }

      // 2. Try Local Fallback Response
      const localResponse = getLocalResponse(userMessage);
      if (localResponse) {
        console.log(`[Local Fallback] Used for: ${userMessage}`);
        return { response: localResponse, fromCache: false, tokensUsed: 0 };
      }

      // 3. Fetch Business Context & Tone
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { 
            knowledgeBase: true
        }
      });

      if (!business) return { response: "I'm sorry, I seem to be disconnected from my business data.", fromCache: false, tokensUsed: 0 };

      // 4. Try Local Keyword Search in Knowledge Base
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

      // If we found a good match locally (50% keywords matched)
      if (bestScore >= keywords.length * 0.5 && bestMatch) {
        const snippet = bestMatch.substring(0, 500);
        const localAnswer = `بناءً على معلوماتنا: ${snippet}... \n\nللمزيد من التفاصيل، يرجى التواصل معنا.`;
        console.log(`[Local KB Match] Score: ${bestScore}/${keywords.length}`);
        this.addToCache(businessId, userMessage, localAnswer);
        return { response: localAnswer, fromCache: false, tokensUsed: 0 };
      }

      // 3. Construct Context from Knowledge Base
      // For MVP, we concatenate text. In production, we'd use vector search here.
      const context = business.knowledgeBase.map(kb => kb.content).join("\n\n").substring(0, 30000); // Limit context size

      // 4. Call Groq API (with timeout and fallback)
      let response;
      try {
        const messages = [
          {
            role: "system",
            content: `You are a helpful AI assistant for a business named "${business.name}".
Industry: ${business.activityType}
Your Tone: ${business.botTone} (Strictly adhere to this tone).

Instructions:
- Answer in the same language as the user (Arabic/English).
- Answer based ONLY on the provided Context.
- If the answer is not in the context, politely say you don't know.
- Keep answers concise (under 3 sentences) unless asked for details.

Context:
${context}`
          },
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
          { role: "user", content: userMessage }
        ];

        const groqResponse = await axios.post(
          GROQ_API_URL,
          {
            model: this.modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1
          },
          {
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        response = groqResponse.data.choices[0].message.content;
      } catch (apiError) {
        console.error("Groq API Error:", apiError.response?.data || apiError.message);
        // Fallback to local response
        const fallback = fallbackResponses.unknown[Math.floor(Math.random() * fallbackResponses.unknown.length)];
        response = fallback + "\n\n" + (bestMatch ? `معلومة قد تفيدك: ${bestMatch.substring(0, 300)}...` : "");
      }

      // 6. Save to Cache
      this.addToCache(businessId, userMessage, response);

      return { response, fromCache: false, tokensUsed: 0 }; // TODO: Calculate tokens

    } catch (error) {
      console.error("AI Generation Error:", error);
      // Return intelligent fallback
      const fallback = fallbackResponses.unknown[0];
      return { response: fallback, fromCache: false, tokensUsed: 0 };
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
