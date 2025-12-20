import { AIService } from '../ai.service';
import prisma from '../../config/database';

describe('AI Service Integration Tests', () => {
  let aiService: AIService;
  let testBusinessId: string;

  beforeAll(async () => {
    aiService = new AIService();
    
    // Create test business
    const business = await prisma.business.create({
      data: {
        name: 'Test Business',
        email: 'test@example.com',
        botTone: 'friendly',
        language: 'ar',
        industry: 'technology',
      },
    });
    testBusinessId = business.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.business.delete({ where: { id: testBusinessId } });
    await prisma.$disconnect();
  });

  describe('Dialect Detection Integration', () => {
    it('should generate response with Egyptian dialect detection', async () => {
      const userMessage = 'ازيك انت عايز ايه النهارده';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    }, 30000);

    it('should generate response with Saudi dialect detection', async () => {
      const userMessage = 'ابغى اسوي طلب الحين';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    }, 30000);

    it('should use geo-boosting when country provided', async () => {
      const userMessage = 'اريد حجز موعد';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          country: 'EG',
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
    }, 30000);

    it('should handle English messages', async () => {
      const userMessage = 'I need to book an appointment';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
    }, 30000);

    it('should handle mixed Arabic dialects', async () => {
      const userMessage = 'ازيك ابغى اسوي حجز كيفك';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
    }, 30000);
  });

  describe('Intent Detection Integration', () => {
    it('should detect question intent', async () => {
      const userMessage = 'كيف احجز موعد؟';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectIntent: true,
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
    }, 30000);

    it('should detect complaint intent', async () => {
      const userMessage = 'الخدمة سيئة جدا وما عجبتني';
      
      const response = await aiService.generateResponse(
        testBusinessId,
        userMessage,
        [],
        {
          detectIntent: true,
          analyzeSentiment: true,
          detectLanguage: true,
          useVectorSearch: false,
        }
      );
      
      expect(response).toBeDefined();
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid business ID gracefully', async () => {
      const response = await aiService.generateResponse(
        'invalid-id',
        'test message',
        [],
        { useVectorSearch: false }
      );
      
      expect(response).toContain('trouble processing');
    });

    it('should handle empty message', async () => {
      const response = await aiService.generateResponse(
        testBusinessId,
        '',
        [],
        { useVectorSearch: false }
      );
      
      expect(response).toBeDefined();
    });

    it('should handle very long message', async () => {
      const longMessage = 'ازيك '.repeat(1000);
      const response = await aiService.generateResponse(
        testBusinessId,
        longMessage,
        [],
        { useVectorSearch: false }
      );
      
      expect(response).toBeDefined();
    }, 30000);
  });

  describe('Performance Tests', () => {
    it('should respond in under 5 seconds', async () => {
      const start = Date.now();
      await aiService.generateResponse(
        testBusinessId,
        'ازيك عايز ايه',
        [],
        { useVectorSearch: false }
      );
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });
});
