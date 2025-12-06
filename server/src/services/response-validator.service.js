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
      /hack|exploit|crack|steal/i,
      /illegal|forbidden|prohibited/i,
      /harm|damage|destroy/i,
      /drugs|weapons|nuclear/i
    ];

    // Quality patterns
    this.qualityPatterns = {
      greeting: /^(مرحبا|hello|hi|أهلاً|هاي)/i,
      complete: /\.$/, // Ends with period
      arabic: /[\u0600-\u06FF]/ // Contains Arabic characters
    };
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

    // Content validation
    const contentResult = this.validateContent(response);
    results.score = Math.max(0, results.score + contentResult.scoreModifier);
    results.issues.push(...contentResult.issues);
    results.suggestions.push(...contentResult.suggestions);

    // Final validation
    results.isValid = results.score >= 60 && results.issues.filter(i => i.includes('unsafe')).length === 0;

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
  validateContent(response) {
    const result = { scoreModifier: 0, issues: [], suggestions: [] };

    // Check for excessive repetition
    const words = response.toLowerCase().split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
      if (word.length > 3) { // Only check meaningful words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const repeats = Object.values(wordCount).filter(count => count > this.maxRepeats);
    if (repeats.length > 0) {
      result.scoreModifier -= 10;
      result.issues.push(`Excessive word repetition (${repeats.length} words repeated >${this.maxRepeats} times)`);
      result.suggestions.push('Reduce repetition for better readability');
    }

    // Check for generic responses
    const genericPhrases = ['I don\'t know', 'لا أعرف', 'sorry', 'عذراً', 'I\'m not sure'];
    const hasGeneric = genericPhrases.some(phrase =>
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    if (hasGeneric && response.length < 50) {
      result.scoreModifier -= 20;
      result.issues.push('Response is too generic');
      result.suggestions.push('Provide more specific and helpful information');
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

module.exports = new ResponseValidator();