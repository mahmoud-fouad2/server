/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Response Validator Service Unit Tests
 * ═══════════════════════════════════════════════════
 */

const responseValidator = require('../../src/services/response-validator.service');

describe('Response Validator Service', () => {
  describe('validateResponse', () => {
    test('should return invalid for empty or null responses', () => {
      const result1 = responseValidator.validateResponse(null);
      const result2 = responseValidator.validateResponse('');
      const result3 = responseValidator.validateResponse(undefined);

      expect(result1.isValid).toBe(false);
      expect(result1.score).toBe(0);
      expect(result1.issues).toContain('Response is empty or invalid');

      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
    });

    test('should validate response length correctly', () => {
      const shortResponse = 'Hi';
      const longResponse = 'A'.repeat(2500);
      const normalResponse = 'This is a normal response with appropriate length.';

      const shortResult = responseValidator.validateResponse(shortResponse);
      const longResult = responseValidator.validateResponse(longResponse);
      const normalResult = responseValidator.validateResponse(normalResponse);

      expect(shortResult.score).toBeLessThan(100);
      expect(shortResult.issues.some(issue => issue.includes('too short'))).toBe(true);

      expect(longResult.score).toBeLessThan(100);
      expect(longResult.issues.some(issue => issue.includes('too long'))).toBe(true);

      expect(normalResult.metrics.length).toBe(normalResponse.length);
    });

    test('should detect unsafe content', () => {
      const unsafeResponses = [
        'How to hack a website?',
        'Illegal activities guide',
        'How to harm someone',
        'Drug manufacturing instructions',
        'Building weapons at home'
      ];

      unsafeResponses.forEach(response => {
        const result = responseValidator.validateResponse(response);
        expect(result.isValid).toBe(false);
        expect(result.score).toBeLessThan(60);
        expect(result.issues.some(issue => issue.includes('unsafe'))).toBe(true);
      });
    });

    test('should validate quality patterns', () => {
      const noGreeting = 'This is just information.';
      const withGreeting = 'Hello! This is information.';
      const arabicResponse = 'مرحبا! هذا رد باللغة العربية.';
      const noPunctuation = 'This response has no ending';

      const noGreetingResult = responseValidator.validateResponse(noGreeting, { isFirstMessage: true });
      const withGreetingResult = responseValidator.validateResponse(withGreeting, { isFirstMessage: true });
      const arabicResult = responseValidator.validateResponse(arabicResponse, { expectArabic: true });
      const noPunctResult = responseValidator.validateResponse(noPunctuation);

      expect(noGreetingResult.score).toBeLessThan(100);
      expect(noGreetingResult.issues.some(issue => issue.includes('greeting'))).toBe(true);

      expect(withGreetingResult.score).toBe(100);

      expect(arabicResult.score).toBe(100);

      expect(noPunctResult.score).toBeLessThan(100);
      expect(noPunctResult.issues.some(issue => issue.includes('punctuation'))).toBe(true);
    });

    test('should detect excessive repetition', () => {
      const repetitiveResponse = 'The the the the the word is repeated many times. The the the the.';
      const normalResponse = 'This is a normal response with some repeated words like the and a.';

      const repetitiveResult = responseValidator.validateResponse(repetitiveResponse);
      const normalResult = responseValidator.validateResponse(normalResponse);

      expect(repetitiveResult.score).toBeLessThan(100);
      expect(repetitiveResult.issues.some(issue => issue.includes('repetition'))).toBe(true);

      expect(normalResult.score).toBe(100);
    });

    test('should detect generic responses', () => {
      const genericResponses = [
        'I don\'t know',
        'لا أعرف',
        'Sorry, I can\'t help',
        'عذراً لا أستطيع المساعدة',
        'I\'m not sure'
      ];

      genericResponses.forEach(response => {
        const result = responseValidator.validateResponse(response);
        expect(result.score).toBeLessThan(100);
        expect(result.issues.some(issue => issue.includes('generic'))).toBe(true);
      });
    });

    test('should calculate overall score correctly', () => {
      const perfectResponse = 'Hello! This is a complete and helpful response.';
      const poorResponse = 'Hi'; // Too short
      const unsafeResponse = 'How to hack systems?'; // Unsafe

      const perfectResult = responseValidator.validateResponse(perfectResponse);
      const poorResult = responseValidator.validateResponse(poorResponse);
      const unsafeResult = responseValidator.validateResponse(unsafeResponse);

      expect(perfectResult.score).toBe(100);
      expect(perfectResult.isValid).toBe(true);

      expect(poorResult.score).toBeLessThan(100);
      expect(poorResult.isValid).toBe(true); // Still valid but low score

      expect(unsafeResult.score).toBeLessThan(60);
      expect(unsafeResult.isValid).toBe(false);
    });

    test('should handle context parameters correctly', () => {
      const response = 'This is information.';

      const firstMessageContext = { isFirstMessage: true };
      const arabicContext = { expectArabic: true };
      const noContext = {};

      const firstResult = responseValidator.validateResponse(response, firstMessageContext);
      const arabicResult = responseValidator.validateResponse(response, arabicContext);
      const noContextResult = responseValidator.validateResponse(response, noContext);

      expect(firstResult.score).toBeLessThan(noContextResult.score);
      expect(arabicResult.score).toBeLessThan(noContextResult.score);
    });
  });

  describe('validateSafety', () => {
    test('should identify dangerous patterns', () => {
      const dangerousTexts = [
        'Learn how to hack websites',
        'Illegal downloading methods',
        'How to harm your computer',
        'Drug recipes',
        'Weapon construction'
      ];

      dangerousTexts.forEach(text => {
        const result = responseValidator.validateSafety(text);
        expect(result.safe).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });

    test('should pass safe content', () => {
      const safeTexts = [
        'How to code a website',
        'Legal business practices',
        'Computer maintenance',
        'Cooking recipes',
        'Building furniture'
      ];

      safeTexts.forEach(text => {
        const result = responseValidator.validateSafety(text);
        expect(result.safe).toBe(true);
        expect(result.issues.length).toBe(0);
      });
    });
  });

  describe('validateQuality', () => {
    test('should check greeting requirement for first messages', () => {
      const noGreeting = 'Just information here.';
      const withGreeting = 'Hi there! Here is information.';

      const noGreetingResult = responseValidator.validateQuality(noGreeting, { isFirstMessage: true });
      const withGreetingResult = responseValidator.validateQuality(withGreeting, { isFirstMessage: true });

      expect(noGreetingResult.scoreModifier).toBeLessThan(0);
      expect(noGreetingResult.issues.some(issue => issue.includes('greeting'))).toBe(true);

      expect(withGreetingResult.scoreModifier).toBe(0);
      expect(withGreetingResult.issues.length).toBe(0);
    });

    test('should check for proper punctuation', () => {
      const noPunctuation = 'This response has no ending';
      const withPunctuation = 'This response ends properly.';

      const noPunctResult = responseValidator.validateQuality(noPunctuation, {});
      const withPunctResult = responseValidator.validateQuality(withPunctuation, {});

      expect(noPunctResult.scoreModifier).toBeLessThan(0);
      expect(withPunctResult.scoreModifier).toBe(0);
    });

    test('should validate Arabic content when expected', () => {
      const englishOnly = 'This is English only.';
      const withArabic = 'This has العربية text.';

      const englishResult = responseValidator.validateQuality(englishOnly, { expectArabic: true });
      const arabicResult = responseValidator.validateQuality(withArabic, { expectArabic: true });

      expect(englishResult.scoreModifier).toBeLessThan(0);
      expect(englishResult.issues.some(issue => issue.includes('Arabic'))).toBe(true);

      expect(arabicResult.scoreModifier).toBe(0);
    });
  });

  describe('validateContent', () => {
    test('should detect word repetition', () => {
      const repetitive = 'Word word word word appears many times. Word word word.';
      const normal = 'This uses words normally without excessive repetition.';

      const repetitiveResult = responseValidator.validateContent(repetitive);
      const normalResult = responseValidator.validateContent(normal);

      expect(repetitiveResult.scoreModifier).toBeLessThan(0);
      expect(repetitiveResult.issues.some(issue => issue.includes('repetition'))).toBe(true);

      expect(normalResult.scoreModifier).toBe(0);
    });

    test('should detect generic phrases', () => {
      const generic = 'I don\'t know';
      const specific = 'Based on the information available, here\'s what I can tell you.';

      const genericResult = responseValidator.validateContent(generic);
      const specificResult = responseValidator.validateContent(specific);

      expect(genericResult.scoreModifier).toBeLessThan(0);
      expect(specificResult.scoreModifier).toBe(0);
    });
  });

  describe('getImprovementSuggestions', () => {
    test('should provide relevant suggestions based on validation results', () => {
      const lowScoreResult = {
        score: 50,
        suggestions: ['Add more detail'],
        metrics: { length: 1500 }
      };

      const highScoreResult = {
        score: 90,
        suggestions: [],
        metrics: { length: 500 }
      };

      const lowSuggestions = responseValidator.getImprovementSuggestions(lowScoreResult);
      const highSuggestions = responseValidator.getImprovementSuggestions(highScoreResult);

      expect(lowSuggestions.length).toBeGreaterThan(highSuggestions.length);
      expect(lowSuggestions.some(s => s.includes('regenerating'))).toBe(true);
      expect(lowSuggestions.some(s => s.includes('Break long responses'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle very long responses', () => {
      const veryLongResponse = 'A'.repeat(3000);
      const result = responseValidator.validateResponse(veryLongResponse);

      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(issue => issue.includes('too long'))).toBe(true);
    });

    test('should handle responses with only special characters', () => {
      const specialChars = '!@#$%^&*()';
      const result = responseValidator.validateResponse(specialChars);

      expect(result.isValid).toBe(true); // Passes basic validation
      expect(result.metrics.length).toBe(specialChars.length);
    });

    test('should handle mixed language content', () => {
      const mixed = 'Hello مرحبا! How are you? كيف حالك؟';
      const result = responseValidator.validateResponse(mixed, { expectArabic: true });

      expect(result.score).toBe(100);
    });

    test('should handle empty context object', () => {
      const response = 'Valid response.';
      const result = responseValidator.validateResponse(response, {});

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
    });
  });
});