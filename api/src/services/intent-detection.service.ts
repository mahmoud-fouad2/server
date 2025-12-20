import natural from 'natural';
import logger from '../utils/logger.js';

interface Intent {
  intent: string;
  confidence: number;
  entities: any[];
}

class IntentDetectionService {
  private classifier: any;
  private intents: Map<string, string[]> = new Map();

  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.initializeIntents();
    this.trainClassifier();
  }

  private initializeIntents() {
    // General intents
    this.intents.set('greeting', [
      'hello', 'hi', 'hey', 'good morning', 'good evening',
      'مرحبا', 'السلام عليكم', 'أهلا', 'صباح الخير', 'مساء الخير'
    ]);

    this.intents.set('inquiry', [
      'what', 'when', 'where', 'how', 'why', 'which',
      'ما', 'متى', 'أين', 'كيف', 'لماذا', 'أي'
    ]);

    this.intents.set('complaint', [
      'problem', 'issue', 'not working', 'broken', 'error', 'wrong',
      'مشكلة', 'خطأ', 'لا يعمل', 'عطل'
    ]);

    this.intents.set('purchase', [
      'buy', 'purchase', 'order', 'price', 'cost', 'payment',
      'شراء', 'طلب', 'سعر', 'دفع', 'تكلفة'
    ]);

    this.intents.set('support', [
      'help', 'support', 'assist', 'need help', 'can you help',
      'مساعدة', 'دعم', 'ساعدني', 'أحتاج مساعدة'
    ]);

    this.intents.set('feedback', [
      'feedback', 'suggestion', 'improve', 'better', 'recommend',
      'اقتراح', 'تحسين', 'أفضل', 'رأي'
    ]);

    this.intents.set('farewell', [
      'bye', 'goodbye', 'see you', 'thanks', 'thank you',
      'وداعا', 'مع السلامة', 'شكرا', 'شكراً'
    ]);

    this.intents.set('cancellation', [
      'cancel', 'stop', 'end', 'terminate', 'quit',
      'إلغاء', 'توقف', 'إنهاء'
    ]);
  }

  private trainClassifier() {
    this.intents.forEach((samples, intent) => {
      samples.forEach((sample) => {
        this.classifier.addDocument(sample, intent);
      });
    });

    this.classifier.train();
    logger.info('Intent classifier trained');
  }

  detectIntent(text: string): Intent {
    try {
      const lowerText = text.toLowerCase();
      
      // Get classification
      const classifications = this.classifier.getClassifications(lowerText);
      const topClassification = classifications[0];

      // Extract entities (simple implementation)
      const entities = this.extractEntities(text);

      return {
        intent: topClassification.label,
        confidence: topClassification.value,
        entities,
      };
    } catch (error: any) {
      logger.error('Intent detection failed:', error.message);
      return {
        intent: 'unknown',
        confidence: 0,
        entities: [],
      };
    }
  }

  private extractEntities(text: string): any[] {
    const entities: any[] = [];

    // Extract dates
    const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g;
    const dates = text.match(datePattern);
    if (dates) {
      dates.forEach((date) => {
        entities.push({ type: 'date', value: date });
      });
    }

    // Extract numbers
    const numberPattern = /\b\d+\b/g;
    const numbers = text.match(numberPattern);
    if (numbers) {
      numbers.forEach((num) => {
        entities.push({ type: 'number', value: parseInt(num) });
      });
    }

    // Extract emails
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      emails.forEach((email) => {
        entities.push({ type: 'email', value: email });
      });
    }

    // Extract phone numbers
    const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    const phones = text.match(phonePattern);
    if (phones) {
      phones.forEach((phone) => {
        entities.push({ type: 'phone', value: phone });
      });
    }

    return entities;
  }

  addTrainingData(text: string, intent: string) {
    this.classifier.addDocument(text, intent);
    this.classifier.retrain();
  }

  getSupportedIntents(): string[] {
    return Array.from(this.intents.keys());
  }
}

export default new IntentDetectionService();
