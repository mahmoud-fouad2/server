/**
 * Smoke Tests for Bot AI Logic
 * Tests core functionality: Intent, Sentiment, Dialect, AI Response
 */
import prisma from '../config/database.js';
import aiService from '../services/ai.service.js';
import intentDetectionService from '../services/intent-detection.service.js';
import sentimentAnalysisService from '../services/sentiment-analysis.service.js';
import { dialectService } from '../services/dialect.service.js';
import logger from '../utils/logger.js';

interface SmokeTestResult {
  test: string;
  passed: boolean;
  duration: number;
  expected: any;
  actual: any;
  error?: string;
}

interface BusinessTestSuite {
  businessId: string;
  businessName: string;
  results: SmokeTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
}

class BotSmokeTests {
  private testPrompts = {
    greeting: {
      ar_eg: 'ازيك عامل ايه',
      ar_sa: 'السلام عليكم كيف حالك',
      en: 'Hello, how are you?'
    },
    inquiry: {
      ar_eg: 'عايز أعرف السعر',
      ar_sa: 'ابي أعرف كم السعر',
      en: 'What is the price?'
    },
    complaint: {
      ar_eg: 'الخدمة مش شغالة عندي',
      ar_sa: 'الخدمة ما تشتغل',
      en: 'The service is not working'
    },
    support: {
      ar_eg: 'محتاج مساعدة في الطلب',
      ar_sa: 'احتاج مساعدة',
      en: 'I need help with my order'
    }
  };

  /**
   * Run smoke tests for a specific business
   */
  async runBusinessTests(businessId: string): Promise<BusinessTestSuite> {
    const startTime = Date.now();
    const results: SmokeTestResult[] = [];

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, language: true }
      });

      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }

      logger.info(`🧪 Starting smoke tests for: ${business.name}`);

      // Test 1: Intent Detection
      results.push(await this.testIntentDetection());

      // Test 2: Sentiment Analysis
      results.push(await this.testSentimentAnalysis());

      // Test 3: Dialect Detection
      results.push(await this.testDialectDetection());

      // Test 4: AI Response Generation
      results.push(...await this.testAIResponses(businessId));

      // Test 5: Response Time
      results.push(await this.testResponseTime(businessId));

      // Calculate summary
      const passedTests = results.filter(r => r.passed).length;
      const failedTests = results.filter(r => !r.passed).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

      logger.info(`✅ Smoke tests completed: ${passedTests}/${results.length} passed`);

      return {
        businessId,
        businessName: business.name,
        results,
        totalTests: results.length,
        passedTests,
        failedTests,
        averageResponseTime: Math.round(avgResponseTime)
      };
    } catch (error: any) {
      logger.error('Smoke tests failed:', error);
      throw error;
    }
  }

  /**
   * Test Intent Detection Service
   */
  private async testIntentDetection(): Promise<SmokeTestResult> {
    const start = Date.now();
    try {
      const tests = [
        { text: 'مرحبا كيف حالك', expected: 'greeting' },
        { text: 'عندي مشكلة في الخدمة', expected: 'complaint' },
        { text: 'ما هو السعر', expected: 'inquiry' }
      ];

      for (const test of tests) {
        const result = intentDetectionService.detectIntent(test.text);
        if (result.intent !== test.expected) {
          throw new Error(`Expected ${test.expected}, got ${result.intent}`);
        }
      }

      return {
        test: 'Intent Detection',
        passed: true,
        duration: Date.now() - start,
        expected: 'All intents detected correctly',
        actual: 'Success'
      };
    } catch (error: any) {
      return {
        test: 'Intent Detection',
        passed: false,
        duration: Date.now() - start,
        expected: 'All intents detected correctly',
        actual: error.message,
        error: error.message
      };
    }
  }

  /**
   * Test Sentiment Analysis Service
   */
  private async testSentimentAnalysis(): Promise<SmokeTestResult> {
    const start = Date.now();
    try {
      const tests = [
        { text: 'أنا سعيد جداً بالخدمة', expected: 'POSITIVE' },
        { text: 'الخدمة سيئة جداً', expected: 'NEGATIVE' },
        { text: 'الطلب وصل', expected: 'NEUTRAL' }
      ];

      for (const test of tests) {
        const result = await sentimentAnalysisService.analyzeSentiment(test.text);
        if (result.sentiment !== test.expected) {
          throw new Error(`Expected ${test.expected}, got ${result.sentiment}`);
        }
      }

      return {
        test: 'Sentiment Analysis',
        passed: true,
        duration: Date.now() - start,
        expected: 'All sentiments detected correctly',
        actual: 'Success'
      };
    } catch (error: any) {
      return {
        test: 'Sentiment Analysis',
        passed: false,
        duration: Date.now() - start,
        expected: 'All sentiments detected correctly',
        actual: error.message,
        error: error.message
      };
    }
  }

  /**
   * Test Dialect Detection Service
   */
  private async testDialectDetection(): Promise<SmokeTestResult> {
    const start = Date.now();
    try {
      const tests = [
        { text: 'عايز أطلب منتج', expected: 'eg', country: 'EG' },
        { text: 'ابي أشتري منتج', expected: 'sa', country: 'SA' },
        { text: 'شحالك عامل شو', expected: 'ae', country: 'AE' }
      ];

      for (const test of tests) {
        const result = await dialectService.detectDialect(test.text, { country: test.country });
        // Accept if dialect matches OR if it's a Gulf variant
        const isValid = result.dialect === test.expected || 
                       (test.expected === 'ae' && result.dialect === 'gulf');
        
        if (!isValid) {
          throw new Error(`Expected ${test.expected}, got ${result.dialect}`);
        }
      }

      return {
        test: 'Dialect Detection',
        passed: true,
        duration: Date.now() - start,
        expected: 'All dialects detected correctly',
        actual: 'Success'
      };
    } catch (error: any) {
      return {
        test: 'Dialect Detection',
        passed: false,
        duration: Date.now() - start,
        expected: 'All dialects detected correctly',
        actual: error.message,
        error: error.message
      };
    }
  }

  /**
   * Test AI Response Generation
   */
  private async testAIResponses(businessId: string): Promise<SmokeTestResult[]> {
    const results: SmokeTestResult[] = [];
    
    // Test different intents
    const testCases = [
      { message: 'مرحبا', expectedType: 'greeting' },
      { message: 'ما السعر', expectedType: 'inquiry' },
      { message: 'عندي مشكلة', expectedType: 'complaint' }
    ];

    for (const testCase of testCases) {
      const start = Date.now();
      try {
        const response = await aiService.generateResponse(
          businessId,
          testCase.message,
          [],
          {
            useVectorSearch: false, // Faster for smoke test
            detectIntent: true,
            analyzeSentiment: true,
            detectLanguage: true
          }
        );

        // Validate response exists and is not empty
        if (!response || response.length < 10) {
          throw new Error('Response too short or empty');
        }

        // Validate response is in Arabic (for AR businesses)
        const hasArabic = /[\u0600-\u06FF]/.test(response);
        if (!hasArabic && testCase.message.match(/[\u0600-\u06FF]/)) {
          throw new Error('Response not in Arabic for Arabic query');
        }

        results.push({
          test: `AI Response (${testCase.expectedType})`,
          passed: true,
          duration: Date.now() - start,
          expected: 'Valid response generated',
          actual: `${response.substring(0, 50)}...`
        });
      } catch (error: any) {
        results.push({
          test: `AI Response (${testCase.expectedType})`,
          passed: false,
          duration: Date.now() - start,
          expected: 'Valid response generated',
          actual: error.message,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Test Response Time
   */
  private async testResponseTime(businessId: string): Promise<SmokeTestResult> {
    const start = Date.now();
    try {
      const response = await aiService.generateResponse(
        businessId,
        'مرحبا كيف حالك',
        [],
        { useVectorSearch: false }
      );

      const duration = Date.now() - start;
      const passed = duration < 5000; // Must respond within 5 seconds

      return {
        test: 'Response Time',
        passed,
        duration,
        expected: '< 5000ms',
        actual: `${duration}ms`
      };
    } catch (error: any) {
      return {
        test: 'Response Time',
        passed: false,
        duration: Date.now() - start,
        expected: '< 5000ms',
        actual: 'Error',
        error: error.message
      };
    }
  }

  /**
   * Run smoke tests for all businesses
   */
  async runAllBusinessTests(): Promise<BusinessTestSuite[]> {
    try {
      const businesses = await prisma.business.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true }
      });

      logger.info(`🧪 Running smoke tests for ${businesses.length} businesses`);

      const results: BusinessTestSuite[] = [];
      for (const business of businesses) {
        try {
          const result = await this.runBusinessTests(business.id);
          results.push(result);
        } catch (error: any) {
          logger.error(`Failed tests for ${business.name}:`, error);
        }
      }

      return results;
    } catch (error: any) {
      logger.error('Failed to run all business tests:', error);
      throw error;
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(suites: BusinessTestSuite[]): string {
    const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
    const totalPassed = suites.reduce((sum, s) => sum + s.passedTests, 0);
    const totalFailed = suites.reduce((sum, s) => sum + s.failedTests, 0);

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير اختبارات البوت</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .stat.failed { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .stat h3 { margin: 0; font-size: 32px; }
    .stat p { margin: 5px 0 0 0; opacity: 0.9; }
    .business { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .business h2 { color: #1f2937; margin-top: 0; }
    .test { padding: 15px; margin: 10px 0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
    .test.passed { background: #d1fae5; border-right: 4px solid #10b981; }
    .test.failed { background: #fee2e2; border-right: 4px solid #ef4444; }
    .test-name { font-weight: 600; }
    .test-duration { color: #6b7280; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge.success { background: #10b981; color: white; }
    .badge.failed { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 تقرير اختبارات البوت - ${new Date().toLocaleDateString('ar-EG')}</h1>
    
    <div class="summary">
      <div class="stat">
        <h3>${totalTests}</h3>
        <p>إجمالي الاختبارات</p>
      </div>
      <div class="stat success">
        <h3>${totalPassed}</h3>
        <p>اختبارات ناجحة</p>
      </div>
      <div class="stat failed">
        <h3>${totalFailed}</h3>
        <p>اختبارات فاشلة</p>
      </div>
      <div class="stat">
        <h3>${Math.round((totalPassed / totalTests) * 100)}%</h3>
        <p>معدل النجاح</p>
      </div>
    </div>

    ${suites.map(suite => `
      <div class="business">
        <h2>${suite.businessName}</h2>
        <p><strong>Business ID:</strong> ${suite.businessId}</p>
        <p><strong>متوسط وقت الاستجابة:</strong> ${suite.averageResponseTime}ms</p>
        <p>
          <span class="badge success">${suite.passedTests} ناجح</span>
          <span class="badge failed">${suite.failedTests} فاشل</span>
        </p>
        
        ${suite.results.map(result => `
          <div class="test ${result.passed ? 'passed' : 'failed'}">
            <div>
              <div class="test-name">${result.test}</div>
              <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                ${result.passed ? '✅ ' + result.actual : '❌ ' + result.error}
              </div>
            </div>
            <div class="test-duration">${result.duration}ms</div>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }
}

export default new BotSmokeTests();
