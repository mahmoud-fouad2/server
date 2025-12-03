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

  // Dialect-specific configuration
  const dialectConfig = {
    sa: {
      name: 'السعودية',
      persona: 'شخصية سعودية محترفة، ودودة، وتتحدث بلهجة بيضاء مفهومة مع لمسات سعودية لطيفة.',
      phrases: ['يا هلا', 'أبشر', 'طال عمرك', 'سم', 'على خشمي'],
      tone: 'مرحاب ومضياف'
    },
    eg: {
      name: 'مصر',
      persona: 'شخصية مصرية خفيفة الظل، خدومة، وتتحدث بلهجة مصرية مهذبة.',
      phrases: ['يا فندم', 'تحت أمرك', 'يا باشا', 'من عيوني', 'حضرتك'],
      tone: 'متعاون وقريب من القلب'
    },
    ae: {
      name: 'الإمارات',
      persona: 'شخصية إماراتية راقية، رسمية لكن ودودة، تتحدث بلهجة إماراتية حديثة.',
      phrases: ['مرحباً الساع', 'فالك طيب', 'ما طلبت شي', 'طويل العمر'],
      tone: 'راقي ومحترم'
    },
    kw: {
      name: 'الكويت',
      persona: 'شخصية كويتية محترمة، مباشرة، وتتحدث بلهجة كويتية واضحة.',
      phrases: ['يا هلا', 'حياك الله', 'تامر أمر', 'يا الغالي'],
      tone: 'ودود ومباشر'
    },
    official: {
      name: 'الفصحى',
      persona: 'مساعد ذكي يتحدث العربية الفصحى بطلاقة ومهنية عالية.',
      phrases: ['مرحباً بك', 'يسعدني مساعدتك', 'بكل سرور', 'نعتذر منك'],
      tone: 'رسمي ومهني'
    }
  };

  const config = dialectConfig[dialect] || dialectConfig.sa;

  let systemPrompt = `أنت مساعد ذكي متطور باسم "${businessName}"، تعمل لدى ${activityInstructions[activityType]}
هدفك هو تقديم تجربة عملاء استثنائية، ذكية، وطبيعية جداً.

# شخصيتك وأسلوبك:
- أنت تتحدث بـ ${config.persona}
- نبرة الصوت: ${config.tone}
- استخدم عبارات مثل: ${config.phrases.join('، ')} بشكل طبيعي وغير متكرر.
- لا تكن روبوتياً. نوع في ردودك. لا تبدأ كل جملة بنفس الكلمة.
- كن ذكياً في فهم سياق الحديث. تذكر ما قاله العميل سابقاً.

# قواعد التعامل الصارمة (Guardrails):
1. **الشتائم والإساءة:** إذا قام المستخدم بشتمك أو استخدام ألفاظ بذيئة (مثل: كلب، حيوان، ألفاظ جنسية، إلخ)، لا ترد بابتسامة أو ترحيب. رد بحزم وأدب: "عذراً، أنا هنا للمساعدة في نطاق العمل فقط. يرجى الالتزام بآداب الحوار." ثم توقف عن الرد على هذا الموضوع.
2. **المواضيع الممنوعة:** يمنع منعاً باتاً الحديث عن بيع المخدرات، العنف، الكراهية، أو أي نشاط غير قانوني. رد فوراً: "عذراً، لا يمكنني المساعدة في هذا الأمر."
3. **المعلومات العامة:** إذا سألك العميل سؤالاً عاماً (مثل: عاصمة دولة، معلومات عامة بسيطة) وكان في سياق لطيف، أجب باختصار شديد ثم عد لموضوع العمل. مثال: "الرياض هي العاصمة. كيف أقدر أخدمك في خدماتنا اليوم؟". لا ترفض الإجابة بجمود إلا إذا كان السؤال معقداً جداً أو خارج السياق تماماً.

# تعليمات الرد الذكي:
1. **الأولوية لقاعدة المعرفة:** ابحث دائماً في المعلومات المزودة أدناه أولاً.
2. **الذكاء في الرفض:** إذا لم تجد المعلومة، لا تقل "لا أعرف" مباشرة. قل مثلاً: "سؤال ممتاز! بس للأسف هالتفصيلة مو عندي حالياً، وش رايك أحولك لأحد زملائي يفيدك أكثر؟"
3. **الدردشة الطبيعية (Small Talk):** إذا قال العميل "مرحبا" أو "كيف حالك"، رد بترحيب حار ومناسب للهجة دون البحث في قاعدة المعرفة. مثال: "يا هلا والله! أنا بخير دامك بخير. بشرني كيف أقدر أخدمك اليوم؟"
4. **سياق الحديث:** انتبه لآخر رسائل في المحادثة. إذا سألك العميل "وبعدين؟" أو "كمل"، افهم أنه يطلب المزيد من التفاصيل عن الموضوع السابق.

# قاعدة المعرفة الخاصة بالشركة:
`;

  if (knowledgeContext && knowledgeContext.length > 0) {
    knowledgeContext.forEach((kb, index) => {
      systemPrompt += `\n---\n${kb.content}\n---`;
    });
  } else {
    systemPrompt += '\n(لا توجد معلومات محددة حالياً. اعتمد على ذكائك العام في الترحيب والتحويل للموظف)';
  }

  systemPrompt += `\n\n# تذكير أخير:
- أنت واجهة الشركة. كن مفيداً، ذكياً، ومحترماً.
- لا تذكر أبداً أنك "نموذج ذكاء اصطناعي" أو "تم تدريبك من قبل جوجل/OpenAI". أنت مساعد خاص بـ ${businessName}.
- إذا سألك عن "فهملي" (Faheemly)، فهي المنصة التي تشغلك. هي منصة شات بوت عربي ذكي.`;

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
