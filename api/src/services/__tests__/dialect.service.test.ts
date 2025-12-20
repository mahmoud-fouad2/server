import { dialectService } from '../dialect.service';

describe('DialectService', () => {
  describe('detectDialect', () => {
    // Egyptian Dialect Tests
    it('should detect Egyptian dialect with high confidence', async () => {
      const text = 'ازيك انت عايز ايه النهارده يا معلم بتاع الحاجة دي';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('eg');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(['keyword', 'hybrid']).toContain(result.method);
    });

    it('should detect Egyptian with multiple keywords', async () => {
      const text = 'محتاج حاجة كده علشان اسوي الشغل دلوقتي';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('eg');
      expect(result.confidence).toBeGreaterThan(0.75);
    });

    // Saudi Dialect Tests
    it('should detect Saudi dialect with high confidence', async () => {
      const text = 'ابغى اسوي طلب الحين وين اروح ياخي زين مره';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('sa');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Saudi with common phrases', async () => {
      const text = 'شلونك الحين ابي احجز موعد عشان كذا';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('sa');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    // Emirati Dialect Tests
    it('should detect Emirati dialect', async () => {
      const text = 'شحالك اليوم عادي تمام زين واجد';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('ae');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    // Kuwaiti Dialect Tests
    it('should detect Kuwaiti dialect', async () => {
      const text = 'شلونك شخبارك اليوم عادي زين مادري شنو';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('kw');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    // Levantine Dialect Tests
    it('should detect Levantine dialect', async () => {
      const text = 'كيفك شو اخبارك هلق بدي روح على المحل';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('lev');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    // Gulf Dialect Tests
    it('should detect Gulf dialect', async () => {
      const text = 'شحالك اليوم زين الحمدلله واجد تمام';
      const result = await dialectService.detectDialect(text);
      
      expect(['gulf', 'ae', 'kw']).toContain(result.dialect);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    // Maghrebi Dialect Tests
    it('should detect Maghrebi dialect', async () => {
      const text = 'كيداير واش راك غادي دابا بزاف مزيان';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('maghreb');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    // English Text Tests
    it('should detect English text', async () => {
      const text = 'Hello, how are you doing today?';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    // Geo-boosting Tests
    it('should boost confidence with country context (Egypt)', async () => {
      const text = 'عايز اعرف ازاي اقدر احجز';
      const resultWithoutGeo = await dialectService.detectDialect(text);
      const resultWithGeo = await dialectService.detectDialect(text, { country: 'EG' });
      
      expect(resultWithGeo.confidence).toBeGreaterThanOrEqual(resultWithoutGeo.confidence);
      expect(resultWithGeo.dialect).toBe('eg');
    });

    it('should boost confidence with country context (Saudi)', async () => {
      const text = 'ابي احجز موعد الحين';
      const resultWithGeo = await dialectService.detectDialect(text, { country: 'SA' });
      
      expect(resultWithGeo.dialect).toBe('sa');
      expect(resultWithGeo.confidence).toBeGreaterThan(0.75);
    });

    it('should use geo dialect when keyword confidence is low', async () => {
      const text = 'اريد حجز موعد من فضلك'; // MSA-like text
      const resultWithGeo = await dialectService.detectDialect(text, { country: 'AE' });
      
      expect(['ae', 'msa', 'gulf']).toContain(resultWithGeo.dialect);
      expect(resultWithGeo.method).toBe('hybrid');
    });

    // Edge Cases
    it('should handle short text', async () => {
      const text = 'ازيك';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBeDefined();
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should handle mixed Arabic and English', async () => {
      const text = 'ازيك how are you عامل ايه';
      const result = await dialectService.detectDialect(text);
      
      expect(['eg', 'en']).toContain(result.dialect);
    });

    it('should handle text with numbers and symbols', async () => {
      const text = 'عايز احجز 2 تذاكر يوم 25/12/2025 الساعة 3pm';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBe('eg');
    });

    it('should handle MSA (Modern Standard Arabic)', async () => {
      const text = 'أريد أن أحجز موعدا في الغد من فضلك';
      const result = await dialectService.detectDialect(text);
      
      expect(['msa', 'sa', 'eg']).toContain(result.dialect);
    });

    it('should handle empty text gracefully', async () => {
      const text = '';
      const result = await dialectService.detectDialect(text);
      
      expect(result.dialect).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle very long text', async () => {
      const longText = 'ازيك انت عايز ايه النهارده '.repeat(50);
      const result = await dialectService.detectDialect(longText);
      
      expect(result.dialect).toBe('eg');
      expect(result.confidence).toBeGreaterThan(0.85); // Longer text = higher confidence
    });
  });

  describe('detectByKeywords', () => {
    it('should return scores for all dialects', () => {
      const text = 'ازيك عايز حاجة كده';
      const result = dialectService.detectByKeywords(text);
      
      expect(result.dialect).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should prioritize dialect with most keyword matches', () => {
      const egyptianText = 'ازيك عايز محتاج قوي أوي علشان دلوقتي بتاع';
      const result = dialectService.detectByKeywords(egyptianText);
      
      expect(result.dialect).toBe('eg');
    });

    it('should apply weighted scoring correctly', () => {
      // Egyptian has weight 1.2, should get boost
      const text = 'عايز حاجة كده';
      const result = dialectService.detectByKeywords(text);
      
      expect(result.dialect).toBe('eg');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('getDialectAnalytics', () => {
    it('should return analytics for a business', async () => {
      const businessId = 'test-business-id';
      const analytics = await dialectService.getDialectAnalytics(businessId, { days: 7 });
      
      expect(Array.isArray(analytics)).toBe(true);
    });

    it('should handle date filtering', async () => {
      const businessId = 'test-business-id';
      const analytics = await dialectService.getDialectAnalytics(businessId, { 
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      });
      
      expect(Array.isArray(analytics)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should detect dialect in under 50ms', async () => {
      const text = 'ازيك عايز حاجة كده';
      const start = Date.now();
      await dialectService.detectDialect(text);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should handle concurrent requests', async () => {
      const texts = [
        'ازيك عايز ايه',
        'ابغى اسوي طلب',
        'شحالك زين',
        'كيفك شو اخبارك',
        'واش راك دابا'
      ];
      
      const results = await Promise.all(
        texts.map(text => dialectService.detectDialect(text))
      );
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.dialect && r.confidence)).toBe(true);
    });
  });
});
