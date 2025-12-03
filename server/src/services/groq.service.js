const axios = require('axios');
const prisma = require('../config/database');

/**
 * Groq AI Service - Fast and powerful AI with open models
 * Models: llama-3.3-70b-versatile, mixtral-8x7b-32768
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

// Available models
const MODELS = {
  LLAMA_70B: 'llama-3.3-70b-versatile',  // Best quality
  LLAMA_8B: 'llama-3.1-8b-instant',       // Fastest
  MIXTRAL: 'mixtral-8x7b-32768',          // Good balance
  GEMMA: 'gemma2-9b-it'                   // Alternative
};

/**
 * Generate AI response using Groq with multi-provider fallback
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - Additional options (model, temperature, max_tokens)
 * @returns {Promise<Object>} - { response, tokensUsed, model }
 */
async function generateResponse(messages, options = {}) {
  // Fetch ALL active models ordered by priority (highest first)
  const activeModels = await prisma.aIModel.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' }
  });

  // If no models in DB, use default Groq
  if (activeModels.length === 0) {
    console.log('[Groq] No active models in DB, using default Groq configuration');
    return await attemptGenerateResponse(messages, {
      apiKey: GROQ_API_KEY,
      modelName: options.model || MODELS.LLAMA_70B,
      endpoint: GROQ_API_URL,
      maxTokensLimit: options.maxTokens || 1024
    }, options);
  }

  // Try each model in priority order until one succeeds
  let lastError = null;
  for (const model of activeModels) {
    try {
      console.log(`[Groq] Attempting with model: ${model.name} (priority: ${model.priority})`);
      
      const result = await attemptGenerateResponse(messages, {
        apiKey: model.apiKey || GROQ_API_KEY,
        modelName: model.name,
        endpoint: model.endpoint || GROQ_API_URL,
        maxTokensLimit: model.maxTokens || options.maxTokens || 1024
      }, options);

      console.log(`[Groq] ✅ Success with model: ${model.name}`);
      return result;

    } catch (error) {
      console.error(`[Groq] ❌ Failed with model ${model.name}:`, error.message);
      lastError = error;
      
      // If this is a rate limit error, wait before trying next provider
      if (error.message.includes('Rate limit')) {
        console.log('[Groq] Rate limit hit, trying next provider immediately...');
      }
      
      // Continue to next model
      continue;
    }
  }

  // If all models failed, throw the last error
  throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Helper: Attempt to generate response with specific provider config
 * @private
 */
async function attemptGenerateResponse(messages, providerConfig, options = {}) {
  const { apiKey, modelName, endpoint, maxTokensLimit } = providerConfig;

  const {
    temperature = 0.7,
    stream = false
  } = options;

  console.log(`[Groq] Generating response with ${modelName}...`);

  try {
    const response = await axios.post(
      endpoint,
      {
        model: modelName,
        messages,
        temperature,
        max_tokens: maxTokensLimit,
        top_p: 0.9,
        stream
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      }
    );

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      throw new Error('Invalid response from AI API');
    }

    const aiMessage = response.data.choices[0].message.content;
    const tokensUsed = response.data.usage?.total_tokens || 0;

    console.log(`[Groq] ✅ Response generated. Tokens: ${tokensUsed}`);

    return {
      response: aiMessage,
      tokensUsed,
      model: modelName,
      finishReason: response.data.choices[0].finish_reason
    };

  } catch (error) {
    console.error('[Groq] Error with provider:', error.response?.data || error.message);
    
    // Throw error with specific code for fallback logic
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication failed - Invalid API key');
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Request timeout');
    } else if (error.response?.status >= 500) {
      throw new Error('Provider server error');
    }
    
    throw new Error(`AI Provider error: ${error.message}`);
  }
}

const embeddingService = require('./embedding.service');

/**
 * Generate embedding for semantic search
 * Uses the centralized embedding service
 */
async function generateEmbedding(text) {
  return await embeddingService.generateEmbedding(text);
}

/**
 * Build context-aware system prompt for the chatbot
 * @param {Object} business - Business configuration
 * @param {Array} knowledgeContext - Relevant knowledge base entries
 * @returns {string} - System prompt
 */
function buildSystemPrompt(business, knowledgeContext = []) {
  const businessName = business?.name || 'فهيم';
  const activityType = business?.activityType || 'RESTAURANT';
  const botTone = business?.botTone || 'friendly';
  const dialect = business?.widgetConfig?.dialect || 'sa';

  // Activity-specific instructions
  const activityInstructions = {
    RESTAURANT: 'أنت مساعد مطعم ذكي. ساعد العملاء في معرفة القائمة، الأسعار، أوقات العمل، والحجوزات.',
    RETAIL: 'أنت مساعد متجر ذكي. ساعد العملاء في معرفة المنتجات، الأسعار، التوصيل، وطرق الدفع.',
    CLINIC: 'أنت مساعد عيادة ذكي. ساعد المرضى في حجز المواعيد، معرفة الأطباء، والخدمات المتاحة.',
    COMPANY: 'أنت مساعد شركة ذكي. ساعد العملاء في معرفة الخدمات، التواصل مع الأقسام، والاستفسارات العامة.',
    OTHER: 'أنت مساعد ذكي متعدد الاستخدامات. ساعد العملاء بطريقة احترافية ومفيدة.'
  };

  // Dialect-specific phrases
  const dialectPhrases = {
    sa: {
      greeting: 'يا هلا والله',
      thanks: 'بالخدمة طال عمرك',
      sorry: 'والله المعذرة'
    },
    eg: {
      greeting: 'أهلاً يا باشا',
      thanks: 'على راسي يا غالي',
      sorry: 'لامؤاخذة يا ريس'
    },
    official: {
      greeting: 'مرحباً بك',
      thanks: 'على الرحب والسعة',
      sorry: 'نعتذر عن ذلك'
    }
  };

  const phrases = dialectPhrases[dialect] || dialectPhrases.sa;

  let systemPrompt = `أنت ${businessName}، ${activityInstructions[activityType]}

# شخصيتك:
- استخدم ${dialect === 'sa' ? 'اللهجة السعودية' : dialect === 'eg' ? 'اللهجة المصرية' : 'العربية الفصحى'}
- كن ${botTone === 'friendly' ? 'ودوداً ومرحباً' : botTone === 'formal' ? 'رسمياً ومهنياً' : 'استشارياً ومفيداً'}
- استخدم عبارات مثل: "${phrases.greeting}"، "${phrases.thanks}"، "${phrases.sorry}"
- رد بجمل قصيرة وواضحة (2-3 جمل)
- استخدم الإيموجي بحكمة لإضفاء الحيوية

# قواعد الرد:
1. إذا كانت المعلومة في قاعدة المعرفة، استخدمها مباشرة
2. إذا لم تكن موجودة، اعتذر بلطف واعرض تحويل للإدارة
3. لا تخترع معلومات غير موجودة
4. كن دقيقاً في الأسعار والأوقات
5. اختصر الرد قدر الإمكان

# قاعدة المعرفة المتاحة:`;

  if (knowledgeContext && knowledgeContext.length > 0) {
    knowledgeContext.forEach((kb, index) => {
      systemPrompt += `\n\n## مصدر ${index + 1}:\n${kb.content.substring(0, 500)}${kb.content.length > 500 ? '...' : ''}`;
    });
  } else {
    systemPrompt += '\n(لا توجد معلومات متاحة حالياً. اعتذر بلطف وقل أنك ستحول للإدارة)';
  }

  systemPrompt += `\n\n# ملاحظة مهمة:
- رد فقط بناءً على المعلومات المتوفرة
- إذا لم تعرف، قل "ما عندي هالمعلومة حالياً، تحب أحولك للإدارة؟"
- لا تقدم معلومات من خارج قاعدة المعرفة
- **لا تذكر أبداً أسماء الملفات أو المصادر** (مثل "في ملف Menu.pdf"). إذا سألك العميل عن مصدرك، قل "أنا مدرب على معلومات الشركة الداخلية".
- تحدث وكأنك موظف خبير يعرف المعلومات عن ظهر قلب.`;

  return systemPrompt;
}

/**
 * Generate chatbot response with context
 * @param {string} userMessage - User's message
 * @param {Object} business - Business configuration
 * @param {Array} conversationHistory - Previous messages
 * @param {Array} knowledgeContext - Relevant knowledge base
 * @returns {Promise<Object>} - AI response
 */
async function generateChatResponse(userMessage, business, conversationHistory = [], knowledgeContext = []) {
  try {
    const systemPrompt = buildSystemPrompt(business, knowledgeContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Last 6 messages for context
      { role: 'user', content: userMessage }
    ];

    const response = await generateResponse(messages, {
      model: MODELS.LLAMA_70B,
      temperature: 0.7,
      maxTokens: 512 // Keep responses concise
    });

    return response;

  } catch (error) {
    console.error('[Groq] Chat response error:', error);
    throw error;
  }
}

/**
 * Summarize text using Groq (for knowledge base processing)
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum summary length in words
 * @returns {Promise<string>} - Summary
 */
async function summarizeText(text, maxLength = 100) {
  try {
    const messages = [
      {
        role: 'system',
        content: `أنت خبير في تلخيص النصوص العربية. 
قدم ملخصاً واضحاً ومفيداً لا يتجاوز ${maxLength} كلمة.
ركز على المعلومات المهمة فقط.`
      },
      {
        role: 'user',
        content: `لخص هذا النص:\n\n${text}`
      }
    ];

    const response = await generateResponse(messages, {
      model: MODELS.LLAMA_8B, // Use faster model for summarization
      temperature: 0.3,
      maxTokens: 256
    });

    return response.response;

  } catch (error) {
    console.error('[Groq] Summarization error:', error);
    // Return truncated text as fallback
    return text.substring(0, maxLength * 5) + '...';
  }
}

module.exports = {
  generateResponse,
  generateChatResponse,
  generateEmbedding,
  summarizeText,
  buildSystemPrompt,
  MODELS
};
