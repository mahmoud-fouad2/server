/**
 * Response Quality Validation Service
 * Validates AI responses for quality, safety, and relevance
 */

class ResponseValidator {
  constructor() {
    // Quality thresholds
    this.minLength = 10;
    this.maxLength = 2000;
    this.maxRepeats = 3; // Max repeated words/phrases

    // Safety patterns to check
    this.dangerousPatterns = [
      /\b(hack|exploit|crack|steal)\b/i,
      /\b(illegal|forbidden|prohibited|unauthorized)\b/i,
      /\b(harm|damage|destroy|attack)\b/i,
      /\b(drug|drugs|weapon|weapons|bomb|explosive|nuclear)\b/i
    ];

    // Quality patterns
    this.qualityPatterns = {
      greeting: /^(مرحبا|hello|hi|أهلاً|هاي)/i,
      complete: /[.!؟?]$/, // Ends with acceptable punctuation
      arabic: /[\u0600-\u06FF]/ // Contains Arabic characters
    };
  }

  /**
   * Sanitize AI response to remove provider/model self-identification or leaked provider signatures
   * Returns cleaned string
   */
  sanitizeResponse(response) {
    if (!response || typeof response !== 'string') return response;

    let out = response;

    // Remove sentences that claim provider identity or model names
    // e.g. "I am Compound", "I'm Compound", "You are Compound", or provider signatures
    const providerNames = ['Compound', 'Groq', 'Cerebras', 'DeepSeek', 'Deepseek', 'Deep Seek', 'Gemini', 'Voyage', 'VoyageAI', 'nomic', 'OpenAI', 'ChatGPT', 'GPT', 'Claude'];
    const providerRegex = new RegExp(`\\b(${providerNames.join('|')})\\b`, 'i');

    // Split into sentences and filter ones that contain provider identity patterns
    const sentences = out
      .replace(/\r/g, '')
      .split(/(?<=[.?!\n])\s+/)
      .filter(Boolean);

    const filtered = sentences.filter(s => {
      // If sentence explicitly says "I am <provider>" or mentions provider in first-person, drop it
      if (/\bI\s*(am|'m|’m)\b/i.test(s) && providerRegex.test(s)) return false;
      if (/\bI'm\b/i.test(s) && providerRegex.test(s)) return false;
      if (/\bYou\s*(are|'re)\b/i.test(s) && providerRegex.test(s)) return false;
      // Also drop short signatures that only contain provider name or model id
      if (providerRegex.test(s) && s.trim().length < 60 && /\b(model|system|assistant|I am|I'm)\b/i.test(s)) return false;
      return true;
    });

    out = filtered.join(' ').trim();

    // Remove any remaining lines that contain provider names (best-effort)
    try {
      const lines = out.split(/\n+/).map(l => l.trim()).filter(Boolean);
      const cleanLines = lines.filter(l => !providerRegex.test(l));
      out = cleanLines.join('\n');
    } catch (e) {
      // if anything odd happens while trimming lines, fallback to original output
    }

    // As a last resort, remove standalone provider names at start/end
      // Remove leading provider name and following punctuation/whitespace (colon, hyphen, spaces)
      out = out.replace(new RegExp('^\\s*(?:' + providerNames.join('|') + ')[:\\s-]*', 'i'), '');
    out = out.replace(new RegExp('(?:' + providerNames.join('|') + ')\\s*$', 'i'), '');

    return out;
  }

  /**
   * Validate response quality
   * @param {string} response - AI response text
   * @param {Object} context - Validation context
   * @returns {Object} - Validation results
   */
  validateResponse(response, context = {}) {
    const results = {
      isValid: true,
      score: 100,
      issues: [],
      suggestions: [],
      metrics: {}
    };

    // Basic validations
    if (!response || typeof response !== 'string') {
      results.isValid = false;
      results.score = 0;
      results.issues.push('Response is empty or invalid');
      return results;
    }

    // Length validation
    const length = response.trim().length;
    results.metrics.length = length;

    if (length < this.minLength) {
      results.score -= 30;
      results.issues.push(`Response too short (${length} chars, min ${this.minLength})`);
      results.suggestions.push('Provide more detailed response');
    }

    if (length > this.maxLength) {
      results.score -= 20;
      results.issues.push(`Response too long (${length} chars, max ${this.maxLength})`);
      results.suggestions.push('Shorten response for better user experience');
    }

    // Safety validation
    const safetyResult = this.validateSafety(response);
    if (!safetyResult.safe) {
      results.isValid = false;
      results.score = Math.max(0, results.score - 50);
      results.issues.push(...safetyResult.issues);
      results.suggestions.push('Remove unsafe content');
    }

    // Quality validation
    const qualityResult = this.validateQuality(response, context);
    results.score = Math.max(0, results.score + qualityResult.scoreModifier);
    results.issues.push(...qualityResult.issues);
    results.suggestions.push(...qualityResult.suggestions);

    // Content validation (pass context)
    const contentResult = this.validateContent(response, context);
    results.score = Math.max(0, results.score + contentResult.scoreModifier);
    results.issues.push(...contentResult.issues);
    results.suggestions.push(...contentResult.suggestions);

    // Final validation
    const hasUnsafeIssues = results.issues.some(issue => issue.toLowerCase().includes('unsafe'));
    results.isValid = results.isValid && results.score >= 60 && !hasUnsafeIssues;

    return results;
  }

  /**
   * Validate response safety
   */
  validateSafety(response) {
    const result = { safe: true, issues: [] };

    this.dangerousPatterns.forEach(pattern => {
      if (pattern.test(response)) {
        result.safe = false;
        result.issues.push(`Potentially unsafe content detected: ${pattern}`);
      }
    });

    return result;
  }

  /**
   * Validate response quality
   */
  validateQuality(response, context) {
    const result = { scoreModifier: 0, issues: [], suggestions: [] };

    // Check for greeting if it's the first response
    if (context.isFirstMessage && !this.qualityPatterns.greeting.test(response)) {
      result.scoreModifier -= 10;
      result.issues.push('First response should include greeting');
      result.suggestions.push('Add appropriate greeting');
    }

    // Check completeness
    if (!this.qualityPatterns.complete.test(response.trim())) {
      result.scoreModifier -= 5;
      result.issues.push('Response should end with proper punctuation');
      result.suggestions.push('Add period or appropriate ending');
    }

    // Check Arabic content if expected
    if (context.expectArabic && !this.qualityPatterns.arabic.test(response)) {
      result.scoreModifier -= 15;
      result.issues.push('Response should contain Arabic text');
      result.suggestions.push('Include Arabic content for Arabic queries');
    }

    return result;
  }

  /**
   * Validate response content
   */
  validateContent(response, context = {}) {
    const result = { scoreModifier: 0, issues: [], suggestions: [] };

    // Check for excessive repetition
    const words = response
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[^a-z0-9\u0600-\u06FF]+/g, ''))
      .filter(Boolean);
    const wordCount = {};
    words.forEach(word => {
      if (word.length >= 3) { // Ignore very short filler words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const repeats = Object.values(wordCount).filter(count => count > this.maxRepeats);
    if (repeats.length > 0) {
      result.scoreModifier -= 10;
      result.issues.push(`Excessive word repetition (${repeats.length} words repeated >${this.maxRepeats} times)`);
      result.suggestions.push('Reduce repetition for better readability');
    }

    // Check for generic responses (but allow if knowledge base is empty)
    const genericPhrases = ['I don\'t know', 'لا أعرف', 'sorry', 'عذراً', 'I\'m not sure', 'لا أستطيع'];
    const hasGeneric = genericPhrases.some(phrase =>
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    // Check if response mentions AI providers (should be removed)
    const aiProviderMentions = ['deepseek', 'groq', 'gemini', 'cerebras', 'chatgpt', 'openai', 'ai assistant', 'مساعد ذكي'];
    const mentionsAI = aiProviderMentions.some(provider => 
      response.toLowerCase().includes(provider.toLowerCase())
    );

    if (mentionsAI) {
      result.scoreModifier -= 30;
      result.issues.push('Response mentions AI provider - should be sanitized');
      result.suggestions.push('Remove AI provider mentions from response');
    }

    // Penalize generic phrases in all contexts (smaller penalty), and apply
    // an extra penalty when knowledge base exists but response is still generic.
    if (hasGeneric) {
      result.scoreModifier -= 10;
      result.issues.push('Response contains generic phrasing');
      result.suggestions.push('Provide a more specific or informative answer');
    }

    if (context.hasKnowledgeBase && hasGeneric && response.length < 100) {
      result.scoreModifier -= 15; // additional penalty on top of the generic penalty
      result.issues.push('Response is too generic despite having knowledge base');
      result.suggestions.push('Use knowledge base information more effectively');
    }

    // Check for overly verbose responses (common when KB is empty)
    if (!context.hasKnowledgeBase && response.length > 300) {
      result.scoreModifier -= 15;
      result.issues.push('Response too verbose without knowledge base');
      result.suggestions.push('Keep response concise when knowledge base is empty');
    }

    return result;
  }

  /**
   * Get response improvement suggestions
   */
  getImprovementSuggestions(validationResult) {
    const suggestions = [...validationResult.suggestions];

    if (validationResult.score < 70) {
      suggestions.push('Consider regenerating response with different parameters');
    }

    if (validationResult.metrics.length > 1000) {
      suggestions.push('Break long responses into shorter, digestible parts');
    }

    return suggestions;
  }
}

const _responseValidator = new ResponseValidator();

// Default export for ESM consumers
export default _responseValidator;

// Named exports for CommonJS test compatibility (so `require(..)` works as expected)
export const validateResponse = _responseValidator.validateResponse.bind(_responseValidator);
export const validateSafety = _responseValidator.validateSafety.bind(_responseValidator);
export const validateQuality = _responseValidator.validateQuality.bind(_responseValidator);
export const validateContent = _responseValidator.validateContent.bind(_responseValidator);
export const sanitizeResponse = _responseValidator.sanitizeResponse.bind(_responseValidator);
export const getImprovementSuggestions = _responseValidator.getImprovementSuggestions.bind(_responseValidator);