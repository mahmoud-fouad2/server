const { expect } = require('chai');
const sinon = require('sinon');

/**
 * Testing Framework Service
 * Provides automated tests for all Phase 2 features
 */
class TestingFrameworkService {
  constructor() {
    this.testSuites = new Map();
    this.testResults = new Map();
    this.mockServices = new Map();
    this.testConfig = {
      timeout: 30000,
      retries: 3,
      parallel: false
    };

    this.initializeTestSuites();
  }

  /**
   * Initialize test suites for Phase 2 features
   */
  initializeTestSuites() {
    this.addTestSuite('multi-language', this.createMultiLanguageTests());
    this.addTestSuite('sentiment-analysis', this.createSentimentAnalysisTests());
    this.addTestSuite('conversation-analytics', this.createConversationAnalyticsTests());
    this.addTestSuite('agent-handoff', this.createAgentHandoffTests());
    this.addTestSuite('integrations', this.createIntegrationsTests());
    this.addTestSuite('integration-dashboard', this.createIntegrationDashboardTests());
    this.addTestSuite('custom-ai-models', this.createCustomAIModelTests());
  }

  /**
   * Add test suite
   * @param {string} name - Suite name
   * @param {Array} tests - Test cases
   */
  addTestSuite(name, tests) {
    this.testSuites.set(name, {
      name,
      tests,
      createdAt: new Date(),
      lastRun: null,
      status: 'pending'
    });
  }

  /**
   * Run all test suites
   * @returns {Object} Test results
   */
  async runAllTests() {
    const results = {
      totalSuites: this.testSuites.size,
      passedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      suiteResults: []
    };

    const startTime = Date.now();

    for (const [suiteName, suite] of this.testSuites) {
      const suiteResult = await this.runTestSuite(suiteName);
      results.suiteResults.push(suiteResult);

      if (suiteResult.status === 'passed') {
        results.passedSuites++;
      } else {
        results.failedSuites++;
      }

      results.totalTests += suiteResult.totalTests;
      results.passedTests += suiteResult.passedTests;
      results.failedTests += suiteResult.failedTests;
      results.skippedTests += suiteResult.skippedTests;
    }

    results.duration = Date.now() - startTime;

    return results;
  }

  /**
   * Run specific test suite
   * @param {string} suiteName - Test suite name
   * @returns {Object} Suite results
   */
  async runTestSuite(suiteName) {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite ${suiteName} not found`);
    }

    const result = {
      suiteName,
      status: 'running',
      totalTests: suite.tests.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      testResults: [],
      errors: []
    };

    const startTime = Date.now();

    try {
      for (const test of suite.tests) {
        const testResult = await this.runTest(test);
        result.testResults.push(testResult);

        if (testResult.status === 'passed') {
          result.passedTests++;
        } else if (testResult.status === 'failed') {
          result.failedTests++;
          result.errors.push(testResult.error);
        } else if (testResult.status === 'skipped') {
          result.skippedTests++;
        }
      }

      result.status = result.failedTests === 0 ? 'passed' : 'failed';
      result.duration = Date.now() - startTime;
      suite.lastRun = new Date();
      suite.status = result.status;

    } catch (error) {
      result.status = 'error';
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
    }

    this.testResults.set(suiteName, result);
    return result;
  }

  /**
   * Run individual test
   * @param {Object} test - Test case
   * @returns {Object} Test result
   */
  async runTest(test) {
    const result = {
      testName: test.name,
      status: 'running',
      duration: 0,
      error: null
    };

    const startTime = Date.now();

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), this.testConfig.timeout);
      });

      // Run test with timeout
      await Promise.race([
        test.fn(),
        timeoutPromise
      ]);

      result.status = 'passed';

    } catch (error) {
      result.status = 'failed';
      result.error = {
        message: error.message,
        stack: error.stack
      };
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Create multi-language tests
   * @returns {Array} Test cases
   */
  createMultiLanguageTests() {
    const MultiLanguageService = require('./multi-language.service');

    return [
      {
        name: 'Language Detection - Arabic',
        fn: async () => {
          const result = MultiLanguageService.detectLanguage('مرحبا كيف حالك');
          expect(result.language).to.equal('ar');
          expect(result.dialect).to.be.oneOf(['msa', 'gulf', 'egyptian', 'levantine']);
        }
      },
      {
        name: 'Dialect Translation - Gulf to MSA',
        fn: async () => {
          const result = await MultiLanguageService.translateBetweenDialects(
            'شلون حالك', 'gulf', 'msa'
          );
          expect(result).to.equal('كيف حالك');
        }
      },
      {
        name: 'Message Processing',
        fn: async () => {
          const result = MultiLanguageService.processMessage('مرحبا أنا بخير');
          expect(result).to.have.property('detectedLanguage');
          expect(result).to.have.property('normalizedMessage');
        }
      }
    ];
  }

  /**
   * Create sentiment analysis tests
   * @returns {Array} Test cases
   */
  createSentimentAnalysisTests() {
    const SentimentAnalysisService = require('./sentiment-analysis.service');

    return [
      {
        name: 'Positive Sentiment Detection',
        fn: async () => {
          const result = SentimentAnalysisService.analyzeSentiment('ممتاز جداً أحب هذه الخدمة', 'ar');
          expect(result.sentiment).to.equal('positive');
          expect(result.confidence).to.be.greaterThan(0.5);
        }
      },
      {
        name: 'Negative Sentiment Detection',
        fn: async () => {
          const result = SentimentAnalysisService.analyzeSentiment('سيء جداً لا أوصي به', 'ar');
          expect(result.sentiment).to.equal('negative');
          expect(result.confidence).to.be.greaterThan(0.5);
        }
      },
      {
        name: 'Conversation Sentiment Analysis',
        fn: async () => {
          const messages = [
            { content: 'مرحبا', sentiment: 'neutral' },
            { content: 'ممتاز الخدمة', sentiment: 'positive' },
            { content: 'شكراً لكم', sentiment: 'positive' }
          ];
          const result = SentimentAnalysisService.analyzeConversation(messages);
          expect(result).to.have.property('overallSentiment');
          expect(result.averageScore).to.be.greaterThan(0);
        }
      }
    ];
  }

  /**
   * Create conversation analytics tests
   * @returns {Array} Test cases
   */
  createConversationAnalyticsTests() {
    const ConversationAnalyticsService = require('./conversation-analytics.service');

    return [
      {
        name: 'Topic Detection',
        fn: async () => {
          const messages = [
            { content: 'كيف أستخدم هذه الميزة', sender: 'user' },
            { content: 'يمكنني مساعدتك في ذلك', sender: 'bot' }
          ];
          const result = ConversationAnalyticsService.extractTopics(messages);
          expect(result).to.be.an('array');
          expect(result.length).to.be.greaterThan(0);
        }
      },
      {
        name: 'Conversation Analysis',
        fn: async () => {
          const messages = [
            { content: 'مرحبا', sender: 'user', timestamp: new Date() },
            { content: 'أهلاً', sender: 'bot', timestamp: new Date() }
          ];
          const result = ConversationAnalyticsService.analyzeConversation(messages, 'conv_123');
          expect(result).to.have.property('conversationId', 'conv_123');
          expect(result).to.have.property('topics');
          expect(result).to.have.property('sentiment');
        }
      },
      {
        name: 'Dashboard Data Generation',
        fn: async () => {
          const result = ConversationAnalyticsService.getDashboardData(7);
          expect(result).to.have.property('summary');
          expect(result).to.have.property('trends');
          expect(result.trends.conversations).to.be.an('array');
        }
      }
    ];
  }

  /**
   * Create agent handoff tests
   * @returns {Array} Test cases
   */
  createAgentHandoffTests() {
    const AgentHandoffService = require('./agent-handoff.service');

    return [
      {
        name: 'Handoff Evaluation - Negative Sentiment',
        fn: async () => {
          const conversation = {
            messages: [
              { content: 'سيء جداً الخدمة', sender: 'user' }
            ]
          };
          const sentiment = { score: -0.6, emotions: {} };
          const result = AgentHandoffService.evaluateHandoff(conversation, sentiment);
          expect(result.shouldHandoff).to.be.true;
          expect(result.reason).to.equal('negative_sentiment');
        }
      },
      {
        name: 'Agent Pool Management',
        fn: async () => {
          AgentHandoffService.addAgent({ id: 'agent_1', name: 'Test Agent' });
          const status = AgentHandoffService.getAgentPoolStatus();
          expect(status.total).to.be.greaterThan(0);
        }
      },
      {
        name: 'Handoff Statistics',
        fn: async () => {
          const stats = AgentHandoffService.getHandoffStatistics();
          expect(stats).to.have.property('active');
          expect(stats).to.have.property('successRate');
        }
      }
    ];
  }

  /**
   * Create integrations tests
   * @returns {Array} Test cases
   */
  createIntegrationsTests() {
    const IntegrationsService = require('./integrations.service');

    return [
      {
        name: 'Integration Configuration',
        fn: async () => {
          const result = await IntegrationsService.configureIntegration('telegram', {
            botToken: 'test_token'
          });
          expect(result.success).to.be.true;
        }
      },
      {
        name: 'Integration Status Check',
        fn: async () => {
          const status = IntegrationsService.getIntegrationStatus('whatsapp');
          expect(status).to.have.property('status');
          expect(status).to.have.property('name');
        }
      },
      {
        name: 'Webhook Handling',
        fn: async () => {
          const payload = {
            message: {
              text: 'test message',
              chat: { id: 123 },
              from: { id: 456 },
              date: Date.now() / 1000
            }
          };
          const result = await IntegrationsService.handleWebhook('telegram', payload);
          expect(result.success).to.be.true;
          expect(result.messages).to.be.an('array');
        }
      }
    ];
  }

  /**
   * Create integration dashboard tests
   * @returns {Array} Test cases
   */
  createIntegrationDashboardTests() {
    const IntegrationDashboardService = require('./integration-dashboard.service');

    return [
      {
        name: 'Dashboard Generation',
        fn: async () => {
          const result = await IntegrationDashboardService.generateDashboard('business_123');
          expect(result).to.have.property('layout');
          expect(result).to.have.property('sections');
          expect(result.sections).to.be.an('array');
        }
      },
      {
        name: 'Integration Cards Formatting',
        fn: async () => {
          const integrations = [
            { id: 'whatsapp', name: 'WhatsApp', status: 'active' }
          ];
          const permissions = { canView: true, canConfigure: true };
          const section = IntegrationDashboardService.generateIntegrationsSection(integrations, permissions);
          expect(section).to.have.property('categories');
          expect(section.categories[0].items[0]).to.have.property('icon');
        }
      },
      {
        name: 'Dashboard Export',
        fn: async () => {
          const result = await IntegrationDashboardService.exportDashboard('business_123', 'json');
          expect(result).to.have.property('format', 'json');
          expect(result).to.have.property('data');
        }
      }
    ];
  }

  /**
   * Create custom AI model tests
   * @returns {Array} Test cases
   */
  createCustomAIModelTests() {
    const CustomAIModelsService = require('./custom-ai-models.service');

    return [
      {
        name: 'Model Creation',
        fn: async () => {
          const result = await CustomAIModelsService.createCustomModel('business_123', {
            name: 'Test Model',
            baseModel: 'gpt-3.5-turbo',
            trainingData: ['sample text']
          });
          expect(result).to.have.property('modelId');
          expect(result.status).to.equal('created');
        }
      },
      {
        name: 'Training Data Preparation',
        fn: async () => {
          const result = CustomAIModelsService.prepareTrainingData([
            { content: 'Hello world', type: 'text' }
          ]);
          expect(result).to.have.property('processedData');
          expect(result.processedData).to.be.an('array');
        }
      },
      {
        name: 'Custom Response Generation',
        fn: async () => {
          const result = await CustomAIModelsService.generateCustomResponse(
            'business_123',
            'Hello',
            [{ content: 'Hi there', score: 0.9 }]
          );
          expect(result).to.have.property('response');
          expect(result).to.have.property('confidence');
        }
      }
    ];
  }

  /**
   * Create mock service for testing
   * @param {string} serviceName - Service name
   * @param {Object} mockImplementation - Mock implementation
   */
  createMockService(serviceName, mockImplementation) {
    this.mockServices.set(serviceName, mockImplementation);
  }

  /**
   * Get test coverage report
   * @returns {Object} Coverage report
   */
  getTestCoverageReport() {
    const suites = Array.from(this.testSuites.values());
    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const completedSuites = suites.filter(suite => suite.lastRun).length;

    return {
      totalSuites: suites.length,
      completedSuites,
      totalTests,
      coverage: suites.length > 0 ? (completedSuites / suites.length) * 100 : 0,
      lastRun: suites
        .filter(suite => suite.lastRun)
        .sort((a, b) => b.lastRun - a.lastRun)[0]?.lastRun || null
    };
  }

  /**
   * Generate test report
   * @param {string} format - Report format (json, html, xml)
   * @returns {string} Formatted report
   */
  generateTestReport(format = 'json') {
    const results = Array.from(this.testResults.values());
    const coverage = this.getTestCoverageReport();

    const report = {
      generatedAt: new Date(),
      coverage,
      results,
      summary: {
        totalSuites: results.length,
        passedSuites: results.filter(r => r.status === 'passed').length,
        failedSuites: results.filter(r => r.status === 'failed').length,
        totalTests: results.reduce((sum, r) => sum + r.totalTests, 0),
        passedTests: results.reduce((sum, r) => sum + r.passedTests, 0),
        failedTests: results.reduce((sum, r) => sum + r.failedTests, 0)
      }
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'html':
        return this.generateHTMLReport(report);

      case 'xml':
        return this.generateXMLReport(report);

      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Generate HTML test report
   * @param {Object} report - Test report data
   * @returns {string} HTML report
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تقرير الاختبارات - Phase 2</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .suite { background: white; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; }
        .passed { border-left-color: #27ae60; }
        .failed { border-left-color: #e74c3c; }
        .test { margin: 5px 0; padding: 5px; }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>تقرير اختبارات Phase 2</h1>
        <p>تاريخ التوليد: ${report.generatedAt.toLocaleString('ar')}</p>
    </div>

    <div class="summary">
        <h2>الملخص</h2>
        <p>التغطية: ${report.coverage.coverage.toFixed(1)}%</p>
        <p>إجمالي الاختبارات: ${report.summary.totalTests}</p>
        <p>الناجحة: ${report.summary.passedTests}</p>
        <p>الفاشلة: ${report.summary.failedTests}</p>
    </div>

    <h2>نتائج الاختبارات</h2>
    ${report.results.map(suite => `
        <div class="suite ${suite.status}">
            <h3>${suite.suiteName}</h3>
            <p>الحالة: ${suite.status === 'passed' ? 'ناجح' : 'فاشل'}</p>
            <p>الاختبارات: ${suite.totalTests}, الناجحة: ${suite.passedTests}, الفاشلة: ${suite.failedTests}</p>
            ${suite.testResults.map(test => `
                <div class="test ${test.status}">
                    ${test.testName}: ${test.status === 'passed' ? '✅ ناجح' : '❌ فاشل'}
                    ${test.error ? `<br>الخطأ: ${test.error.message}` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate XML test report
   * @param {Object} report - Test report data
   * @returns {string} XML report
   */
  generateXMLReport(report) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<testReport generated="${report.generatedAt.toISOString()}">
    <coverage percentage="${report.coverage.coverage}" />
    <summary>
        <totalSuites>${report.summary.totalSuites}</totalSuites>
        <passedSuites>${report.summary.passedSuites}</passedSuites>
        <failedSuites>${report.summary.failedSuites}</failedSuites>
        <totalTests>${report.summary.totalTests}</totalTests>
        <passedTests>${report.summary.passedTests}</passedTests>
        <failedTests>${report.summary.failedTests}</failedTests>
    </summary>
    <suites>
        ${report.results.map(suite => `
        <suite name="${suite.suiteName}" status="${suite.status}">
            <stats total="${suite.totalTests}" passed="${suite.passedTests}" failed="${suite.failedTests}" />
            <tests>
                ${suite.testResults.map(test => `
                <test name="${test.testName}" status="${test.status}" duration="${test.duration}">
                    ${test.error ? `<error message="${test.error.message}" />` : ''}
                </test>`).join('')}
            </tests>
        </suite>`).join('')}
    </suites>
</testReport>`;
  }

  /**
   * Update test configuration
   * @param {Object} config - New configuration
   */
  updateTestConfig(config) {
    this.testConfig = { ...this.testConfig, ...config };
  }

  /**
   * Get test suite details
   * @param {string} suiteName - Suite name
   * @returns {Object} Suite details
   */
  getTestSuiteDetails(suiteName) {
    const suite = this.testSuites.get(suiteName);
    const results = this.testResults.get(suiteName);

    return {
      suite,
      results,
      lastResult: results || null
    };
  }
}

module.exports = new TestingFrameworkService();