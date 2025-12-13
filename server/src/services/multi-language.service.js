const logger = require('../utils/logger');

/**
 * Multi-Language & Dialect Support Service
 * Handles Modern Standard Arabic and regional dialects
 */
class MultiLanguageService {
  constructor() {
    this.dialects = {
      'msa': { name: 'Modern Standard Arabic', code: 'ar' },
      'gulf': { name: 'Gulf Arabic', code: 'ar-GULF' },
      'egyptian': { name: 'Egyptian Arabic', code: 'ar-EG' },
      'levantine': { name: 'Levantine Arabic', code: 'ar-LEV' },
      'moroccan': { name: 'Moroccan Arabic', code: 'ar-MA' },
      'tunisian': { name: 'Tunisian Arabic', code: 'ar-TN' }
    };

    this.translationCache = new Map();
  }

  /**
   * Detect language and dialect from text
   * @param {string} text - Input text
   * @returns {Object} Detection result
   */
  detectLanguage(text) {
    // Simple dialect detection based on common words and patterns
    const detection = {
      language: 'ar',
      dialect: 'msa',
      confidence: 0.5
    };

    // Gulf Arabic indicators
    if (this.containsGulfIndicators(text)) {
      detection.dialect = 'gulf';
      detection.confidence = 0.8;
    }
    // Egyptian Arabic indicators
    else if (this.containsEgyptianIndicators(text)) {
      detection.dialect = 'egyptian';
      detection.confidence = 0.8;
    }
    // Levantine Arabic indicators
    else if (this.containsLevantineIndicators(text)) {
      detection.dialect = 'levantine';
      detection.confidence = 0.8;
    }

    return detection;
  }

  /**
   * Check for Gulf Arabic indicators
   * @param {string} text - Text to check
   * @returns {boolean} True if Gulf indicators found
   */
  containsGulfIndicators(text) {
    const gulfWords = ['شلون', 'وين', 'ايش', 'كيفك', 'الحين', 'بعدين', 'يلا'];
    const gulfPatterns = [/شلون/, /وين/, /ايش/, /كيفك/, /الحين/, /بعدين/, /يلا/];

    return gulfPatterns.some(pattern => pattern.test(text)) ||
           gulfWords.some(word => text.includes(word));
  }

  /**
   * Check for Egyptian Arabic indicators
   * @param {string} text - Text to check
   * @returns {boolean} True if Egyptian indicators found
   */
  containsEgyptianIndicators(text) {
    const egyptianWords = ['ايه', 'ازاي', 'كده', 'دلوقتي', 'بعدين', 'يلا'];
    const egyptianPatterns = [/ايه/, /ازاي/, /كده/, /دلوقتي/, /بعدين/, /يلا/];

    return egyptianPatterns.some(pattern => pattern.test(text)) ||
           egyptianWords.some(word => text.includes(word));
  }

  /**
   * Check for Levantine Arabic indicators
   * @param {string} text - Text to check
   * @returns {boolean} True if Levantine indicators found
   */
  containsLevantineIndicators(text) {
    const levantineWords = ['كيفك', 'شو', 'وين', 'هاي', 'هيك', 'بعدين', 'يلا'];
    const levantinePatterns = [/كيفك/, /شو/, /وين/, /هاي/, /هيك/, /بعدين/, /يلا/];

    return levantinePatterns.some(pattern => pattern.test(text)) ||
           levantineWords.some(word => text.includes(word));
  }

  /**
   * Translate text between dialects
   * @param {string} text - Text to translate
   * @param {string} fromDialect - Source dialect
   * @param {string} toDialect - Target dialect
   * @returns {Promise<string>} Translated text
   */
  async translateBetweenDialects(text, fromDialect, toDialect) {
    const cacheKey = `${text}-${fromDialect}-${toDialect}`;

    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    try {
      // In a real implementation, this would use a translation API
      // For demo purposes, we'll use simple rule-based translation
      let translated = text;

      if (fromDialect === 'gulf' && toDialect === 'msa') {
        translated = this.gulfToMSA(text);
      } else if (fromDialect === 'egyptian' && toDialect === 'msa') {
        translated = this.egyptianToMSA(text);
      } else if (fromDialect === 'levantine' && toDialect === 'msa') {
        translated = this.levantineToMSA(text);
      }

      this.translationCache.set(cacheKey, translated);
      return translated;

    } catch (error) {
      logger.error('[MultiLanguage] Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Convert Gulf Arabic to Modern Standard Arabic
   * @param {string} text - Gulf Arabic text
   * @returns {string} MSA text
   */
  gulfToMSA(text) {
    const mappings = {
      'شلون': 'كيف',
      'وين': 'أين',
      'ايش': 'ماذا',
      'كيفك': 'كيف حالك',
      'الحين': 'الآن',
      'بعدين': 'بعد ذلك',
      'يلا': 'هيا'
    };

    let result = text;
    for (const [gulf, msa] of Object.entries(mappings)) {
      result = result.replace(new RegExp(gulf, 'g'), msa);
    }

    return result;
  }

  /**
   * Convert Egyptian Arabic to Modern Standard Arabic
   * @param {string} text - Egyptian Arabic text
   * @returns {string} MSA text
   */
  egyptianToMSA(text) {
    const mappings = {
      'ايه': 'ماذا',
      'ازاي': 'كيف',
      'كده': 'هكذا',
      'دلوقتي': 'الآن',
      'بعدين': 'بعد ذلك',
      'يلا': 'هيا'
    };

    let result = text;
    for (const [egyptian, msa] of Object.entries(mappings)) {
      result = result.replace(new RegExp(egyptian, 'g'), msa);
    }

    return result;
  }

  /**
   * Convert Levantine Arabic to Modern Standard Arabic
   * @param {string} text - Levantine Arabic text
   * @returns {string} MSA text
   */
  levantineToMSA(text) {
    const mappings = {
      'كيفك': 'كيف حالك',
      'شو': 'ماذا',
      'وين': 'أين',
      'هاي': 'هذه',
      'هيك': 'هكذا',
      'بعدين': 'بعد ذلك',
      'يلا': 'هيا'
    };

    let result = text;
    for (const [levantine, msa] of Object.entries(mappings)) {
      result = result.replace(new RegExp(levantine, 'g'), msa);
    }

    return result;
  }

  /**
   * Get dialect information
   * @param {string} dialectCode - Dialect code
   * @returns {Object} Dialect info
   */
  getDialectInfo(dialectCode) {
    return this.dialects[dialectCode] || this.dialects['msa'];
  }

  /**
   * List all supported dialects
   * @returns {Array} List of dialects
   */
  getSupportedDialects() {
    return Object.entries(this.dialects).map(([code, info]) => ({
      code,
      ...info
    }));
  }

  /**
   * Process message with language detection and normalization
   * @param {string} message - User message
   * @returns {Object} Processed message with language info
   */
  processMessage(message) {
    const detection = this.detectLanguage(message);

    return {
      originalMessage: message,
      detectedLanguage: detection.language,
      detectedDialect: detection.dialect,
      confidence: detection.confidence,
      normalizedMessage: message, // Could be normalized to MSA if needed
      dialectInfo: this.getDialectInfo(detection.dialect)
    };
  }

  /**
   * Generate response in appropriate dialect
   * @param {string} response - Base response
   * @param {string} targetDialect - Target dialect
   * @returns {string} Dialect-specific response
   */
  generateDialectResponse(response, _targetDialect) {
    // In a real implementation, this would translate the response to the target dialect
    // For demo, we'll return the response as-is with dialect awareness
    return response;
  }
}

module.exports = new MultiLanguageService();