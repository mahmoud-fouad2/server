/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - AI Services Unit Tests
 * ═══════════════════════════════════════════════════
 */

const {
  generateResponse,
  getProviderStatus,
  checkProvidersHealth,
  resetProviderState
} = require('../../src/services/ai.service');

// Mock axios for testing
jest.mock('axios');
const axios = require('axios');

describe('Hybrid AI Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    resetProviderState();

    // Mock environment variables
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  describe('generateResponse', () => {
    test('should successfully generate response with first available provider', async () => {
      // Mock successful response from Groq
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Test response from Groq' }
          }],
          usage: { total_tokens: 150 }
        }
      });

      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' }
      ];

      const result = await generateResponse(messages);

      expect(result.response).toBe('Test response from Groq');
      expect(result.tokensUsed).toBe(150);
      expect(result.provider).toBe('Groq');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('should fallback to next provider when first fails', async () => {
      // Mock first provider (Groq) failing with rate limit
      axios.post.mockRejectedValueOnce({
        response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } }
      });

      // Mock second provider (DeepSeek) succeeding
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Test response from DeepSeek' }
          }],
          usage: { total_tokens: 120 }
        }
      });

      const messages = [
        { role: 'user', content: 'Hello' }
      ];

      const result = await generateResponse(messages);

      expect(result.response).toBe('Test response from DeepSeek');
      expect(result.tokensUsed).toBe(120);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    test('should throw error when all providers fail', async () => {
      // Mock all providers failing
      axios.post.mockRejectedValue(new Error('Network error'));

      const messages = [{ role: 'user', content: 'Hello' }];

      await expect(generateResponse(messages)).rejects.toThrow('All AI providers failed');
    });

    test('should handle timeout errors correctly', async () => {
      // Mock timeout error
      axios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      });

      // Mock next provider succeeding
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Success after timeout' }
          }],
          usage: { total_tokens: 100 }
        }
      });

      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await generateResponse(messages);

      expect(result.response).toBe('Success after timeout');
    });

    test('should respect temperature and maxTokens options', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Custom options response' }
          }],
          usage: { total_tokens: 200 }
        }
      });

      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { temperature: 0.5, maxTokens: 500 };

      await generateResponse(messages, options);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 500
        }),
        expect.any(Object)
      );
    });
  });

  describe('Provider Status and Health', () => {
    test('should return correct provider status', () => {
      const status = getProviderStatus();

      expect(status).toHaveProperty('GROQ');
      expect(status).toHaveProperty('DEEPSEEK');
      expect(status).toHaveProperty('CEREBRAS');
      expect(status).toHaveProperty('GEMINI');

      expect(status.GROQ.enabled).toBe(true);
      expect(status.GROQ.name).toBe('Groq');
      expect(status.GROQ.limits.requestsPerMinute).toBe(30);
    });

    test('should detect disabled providers when API key is missing', () => {
      // Temporarily remove API key
      delete process.env.GROQ_API_KEY;

      const status = getProviderStatus();

      expect(status.GROQ.enabled).toBe(false);

      // Restore for other tests
      process.env.GROQ_API_KEY = 'test-groq-key';
    });

    test('should check providers health correctly', () => {
      const health = checkProvidersHealth();

      expect(health).toHaveProperty('totalConfigured');
      expect(health).toHaveProperty('totalAvailable');
      expect(health).toHaveProperty('providers');

      expect(health.totalConfigured).toBe(4); // All providers configured in test
      expect(health.providers).toHaveLength(4);
    });
  });

  describe('Rate Limiting', () => {
    test('should track request usage correctly', async () => {
      // Mock successful response
      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Response' }
          }],
          usage: { total_tokens: 100 }
        }
      });

      // Make multiple requests
      await generateResponse([{ role: 'user', content: 'Test 1' }]);
      await generateResponse([{ role: 'user', content: 'Test 2' }]);

      const status = getProviderStatus();
      const totalRequests = Object.values(status)
        .reduce((sum, provider) => sum + provider.currentUsage.requests, 0);

      // Should record both requests across available providers
      expect(totalRequests).toBe(2);
      expect(Object.values(status).some(provider => provider.currentUsage.requests > 0)).toBe(true);
    });

    test('should prevent requests when rate limit exceeded', async () => {
      axios.post
        .mockRejectedValueOnce({
          response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } }
        })
        .mockResolvedValue({
          data: {
            choices: [{ message: { content: 'From backup provider' } }],
            usage: { total_tokens: 100 }
          }
        });

      const fallbackResult = await generateResponse([{ role: 'user', content: 'Should use backup' }]);
      const postStatus = getProviderStatus();

      expect(fallbackResult.provider).not.toBe('Groq');
      expect(postStatus.GROQ.available).toBe(false);
      const fallbackKey = fallbackResult.provider.toUpperCase();
      expect(postStatus[fallbackKey].currentUsage.requests).toBeGreaterThan(0);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Gemini Provider', () => {
    test('should handle Gemini API format correctly', async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.CEREBRAS_API_KEY;
      resetProviderState();

      // Mock Gemini response format
      axios.post.mockResolvedValueOnce({
        data: {
          candidates: [{
            content: {
              parts: [{ text: 'Gemini response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 80 }
        }
      });

      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await generateResponse(messages);

      expect(result.response).toBe('Gemini response');
      expect(result.tokensUsed).toBe(80);
      expect(result.model).toBe('gemini-1.5-flash');
    });

    test('should convert messages to Gemini format', async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.CEREBRAS_API_KEY;
      resetProviderState();

      axios.post.mockResolvedValueOnce({
        data: {
          candidates: [{
            content: {
              parts: [{ text: 'OK' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 }
        }
      });

      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Say OK' }
      ];

      await generateResponse(messages);

      // Verify the request was made with Gemini format
      const callArgs = axios.post.mock.calls[0];
      const requestBody = callArgs[1];

      expect(requestBody.contents).toHaveLength(1);
      expect(requestBody.contents[0].role).toBe('user');
      expect(requestBody.contents[0].parts[0].text).toBe('Say OK');
      expect(requestBody.systemInstruction).toBe('You are helpful');
    });
  });
});