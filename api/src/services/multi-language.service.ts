import axios from 'axios';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LanguageDetectionResult {
  language: string;
  confidence: number;
  dialect?: string;
}

class MultiLanguageService {
  private supportedLanguages = [
    { code: 'ar', name: 'Arabic', dialects: ['eg', 'sa', 'ae', 'kw'] },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
  ];

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      // Simple language detection based on character sets
      const arabicPattern = /[\u0600-\u06FF]/;
      const hasArabic = arabicPattern.test(text);

      if (hasArabic) {
        const dialect = this.detectArabicDialect(text);
        return {
          language: 'ar',
          confidence: 0.9,
          dialect,
        };
      }

      // Default to English
      return {
        language: 'en',
        confidence: 0.8,
      };
    } catch (error: any) {
      logger.error('Language detection failed:', error.message);
      return {
        language: 'en',
        confidence: 0.5,
      };
    }
  }

  private detectArabicDialect(text: string): string {
    // Simple dialect detection based on common words
    const egyptianWords = ['عايز', 'محتاج', 'قوي', 'أوي'];
    const saudiWords = ['ابي', 'ابغى', 'كذا', 'زين'];
    const emiratiWords = ['شحالك', 'كيفك', 'مرحبا'];

    const lowerText = text.toLowerCase();

    if (egyptianWords.some((w) => lowerText.includes(w))) return 'eg';
    if (saudiWords.some((w) => lowerText.includes(w))) return 'sa';
    if (emiratiWords.some((w) => lowerText.includes(w))) return 'ae';

    return 'standard';
  }

  async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<string> {
    try {
      // Using Google Translate API (if configured)
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

      if (!apiKey) {
        logger.warn('Google Translate API not configured');
        return text;
      }

      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {
          q: text,
          target: targetLang,
          source: sourceLang,
        },
        {
          params: { key: apiKey },
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error: any) {
      logger.error('Translation failed:', error.message);
      return text;
    }
  }

  async saveLanguageDetection(
    conversationId: string,
    messageId: string,
    result: LanguageDetectionResult
  ): Promise<boolean> {
    try {
      await prisma.languageDetection.create({
        data: {
          conversationId,
          messageId,
          language: result.language,
          dialect: result.dialect,
          confidence: result.confidence,
        },
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to save language detection:', error.message);
      return false;
    }
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

export default new MultiLanguageService();
