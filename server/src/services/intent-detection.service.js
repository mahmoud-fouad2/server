/**
 * Intent Detection Service
 * Classifies user messages into intents for better response handling
 */


class IntentDetectionService {
  constructor() {
    // Greeting patterns (Arabic and English)
    this.greetingPatterns = [
      /^(مرحبا|أهلاً|هاي|سلام|السلام عليكم|صباح الخير|مساء الخير|hello|hi|hey|good morning|good evening|good afternoon)/i,
      /^(مرحبتين|أهلاً وسهلاً|أهلاً بك|أهلاً وسهلاً بك)/i
    ];

    // Question patterns
    this.questionPatterns = [
      /[؟?]/, // Ends with question mark
      /^(ما|ماذا|من|أين|متى|كيف|لماذا|هل|what|where|when|how|why|who|which|can|do|does|is|are|will)/i,
      /(؟|\?)$/ // Ends with question mark
    ];

    // Closing patterns
    this.closingPatterns = [
      /^(شكراً|شكرا|مشكور|مشكورة|thanks|thank you|thank|bye|goodbye|مع السلامة|وداعاً|وداعا|to be continued|يتبع)/i,
      /^(تمام|ok|okay|حسناً|حسنا|تمام|ماشي|تمام|تمام|تمام)/i
    ];

    // Profanity/insult patterns (Arabic and English)
    this.profanityPatterns = [
      /(كلب|حمار|غبي|أحمق|idiot|stupid|fuck|damn|shit|bastard)/i,
      /(كس|زق|عرص|asshole|bitch|motherfucker)/i
    ];

    // Off-topic patterns (weather, time, general questions not related to business)
    this.offTopicPatterns = [
      /(الطقس|المناخ|weather|temperature|الوقت|time|الساعة|what time)/i,
      /(كيف حالك|how are you|كيفك|أخبارك)/i,
      /(من أنت|who are you|ما أنت|what are you)/i
    ];

    // Pricing patterns
    this.pricingPatterns = [
      /(السعر|الثمن|الأسعار|الأسعار|price|pricing|cost|كم|how much|كم يكلف|كم سعره)/i,
      /(بكم|بكم|بكم|بكم|بكم|بكم)/i
    ];

    // Support/help patterns
    this.supportPatterns = [
      /(مساعدة|مساعدة|مساعدة|help|support|مساعدة|مساعدة|مساعدة)/i,
      /(مشكلة|problem|issue|error|خطأ|bug)/i
    ];
  }

  /**
   * Detect intent from user message
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages in conversation
   * @returns {Object} - { intent: string, confidence: number, metadata: object }
   */
  detectIntent(message, conversationHistory = []) {
    if (!message || typeof message !== 'string') {
      return { intent: 'UNKNOWN', confidence: 0, metadata: {} };
    }

    const normalizedMessage = message.trim();
    const isFirstMessage = conversationHistory.length === 0;

    // 1. Check for greeting (highest priority for first message)
    if (isFirstMessage) {
      for (const pattern of this.greetingPatterns) {
        if (pattern.test(normalizedMessage)) {
          return {
            intent: 'GREETING',
            confidence: 0.95,
            metadata: { isFirstMessage: true }
          };
        }
      }
    }

    // 2. Check for profanity (high priority)
    for (const pattern of this.profanityPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'PROFANITY',
          confidence: 0.9,
          metadata: { requiresDeflection: true }
        };
      }
    }

    // 3. Check for closing
    for (const pattern of this.closingPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'CLOSING',
          confidence: 0.85,
          metadata: { shouldRequestRating: true }
        };
      }
    }

    // 4. Check for off-topic
    for (const pattern of this.offTopicPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'OFF_TOPIC',
          confidence: 0.8,
          metadata: { shouldRedirect: true }
        };
      }
    }

    // 5. Check for pricing
    for (const pattern of this.pricingPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'PRICING',
          confidence: 0.75,
          metadata: { requiresKB: true, topic: 'pricing' }
        };
      }
    }

    // 6. Check for support/help
    for (const pattern of this.supportPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'SUPPORT',
          confidence: 0.7,
          metadata: { requiresKB: true, topic: 'support' }
        };
      }
    }

    // 7. Check for question
    for (const pattern of this.questionPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          intent: 'QUESTION',
          confidence: 0.65,
          metadata: { requiresKB: true }
        };
      }
    }

    // 8. Default to statement (general message)
    return {
      intent: 'STATEMENT',
      confidence: 0.5,
      metadata: { requiresKB: false }
    };
  }

  /**
   * Check if message is a greeting
   */
  isGreeting(message) {
    if (!message) return false;
    for (const pattern of this.greetingPatterns) {
      if (pattern.test(message.trim())) return true;
    }
    return false;
  }

  /**
   * Check if message is a question
   */
  isQuestion(message) {
    if (!message) return false;
    for (const pattern of this.questionPatterns) {
      if (pattern.test(message.trim())) return true;
    }
    return false;
  }

  /**
   * Check if message contains profanity
   */
  containsProfanity(message) {
    if (!message) return false;
    for (const pattern of this.profanityPatterns) {
      if (pattern.test(message.trim())) return true;
    }
    return false;
  }
}

module.exports = new IntentDetectionService();

