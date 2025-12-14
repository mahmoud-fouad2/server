/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Embedding Service Unit Tests
 * ═══════════════════════════════════════════════════
 */

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateEmbedding } = require('../../src/services/embedding.service');

// Mock dependencies
jest.mock('axios');
jest.mock('@google/generative-ai');

describe('Embedding Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
      delete process.env.DEEPSEEK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.SKIP_GEMINI_EMBEDDING;
    delete process.env.NODE_ENV;
  });

  describe('generateEmbedding', () => {
    test('should return null for invalid input', async () => {
      expect(await generateEmbedding(null)).toBeNull();
      expect(await generateEmbedding(undefined)).toBeNull();
      expect(await generateEmbedding('')).toBeNull();
      expect(await generateEmbedding(123)).toBeNull();
      expect(await generateEmbedding({})).toBeNull();
    });

    test('should generate embedding using Gemini successfully', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GEMINI_EMBED_MODEL = 'text-embedding-004';

      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const mockGeminiModel = {
        embedContent: jest.fn().mockResolvedValue({ embedding: { values: mockEmbedding } })
      };
      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
      expect(mockGeminiModel.embedContent).toHaveBeenCalledWith('test text');
      expect(result).toEqual(mockEmbedding);
    });

    test('should return diagnostic object when diagnostic option is set', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GEMINI_EMBED_MODEL = 'text-embedding-004';

      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockGeminiModel = { embedContent: jest.fn().mockResolvedValue({ embedding: { values: mockEmbedding } }) };
      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text', { diagnostic: true });

      expect(result).toHaveProperty('provider', 'gemini');
      expect(result).toHaveProperty('model', 'text-embedding-004');
      expect(result).toHaveProperty('embedding');
      expect(result.embedding).toEqual(mockEmbedding);
    });

    test('should use Gemini in production when available', async () => {
      process.env.NODE_ENV = 'production';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockEmbedding = [0.11, 0.22, 0.33];
      const mockGeminiModel = { embedContent: jest.fn().mockResolvedValue({ embedding: { values: mockEmbedding } }) };
      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
    });

    test('should use default Gemini model when not specified', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockGeminiModel = { embedContent: jest.fn().mockResolvedValue({ embedding: { values: mockEmbedding } }) };
      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      await generateEmbedding('test text');

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'text-embedding-004' });
    });

    test('should return null when Gemini fails and no other providers are configured', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockGeminiModel = {
        embedContent: jest.fn().mockRejectedValue(new Error('Gemini API error'))
      };

      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
      expect(mockGeminiModel.embedContent).toHaveBeenCalledWith('test text');
      expect(result).toBeNull();
    });

    test('should skip Gemini when SKIP_GEMINI_EMBEDDING is set', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SKIP_GEMINI_EMBEDDING = 'true';
      process.env.NODE_ENV = 'development';

      const result = await generateEmbedding('test text');

      expect(GoogleGenerativeAI).not.toHaveBeenCalled();
      // Should use development fallback
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(768);
    });

    test('should handle Gemini API error gracefully', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockGeminiModel = { embedContent: jest.fn().mockRejectedValue(new Error('Gemini API error')) };
      const mockGenAI = { getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel) };
      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(result).toBeNull();
    });

    test('should handle Gemini API error gracefully', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockGeminiModel = {
        embedContent: jest.fn().mockRejectedValue(new Error('Gemini API error'))
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel)
      };

      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(result).toBeNull();
    });

    test('should fallback to embedText when embedContent is not supported', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GEMINI_EMBED_MODEL = 'textembedding-gecko-001';

      const mockGeminiModel = {
        embedContent: jest.fn().mockRejectedValue({ response: { status: 404, data: 'models/textembedding-gecko-001 is not found for API version v1beta, or is not supported for embedContent' } }),
        embedText: jest.fn().mockResolvedValue({ embedding: { values: [0.12, 0.34, 0.56] } })
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel)
      };

      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
      expect(mockGeminiModel.embedContent).toHaveBeenCalledWith('test text');
      expect(mockGeminiModel.embedText).toHaveBeenCalledWith('test text');
      expect(result).toEqual([0.12, 0.34, 0.56]);
    });

    test('should handle leaked Gemini API key gracefully', async () => {
      process.env.GEMINI_API_KEY = 'leaked-key';

      const mockGeminiModel = {
        embedContent: jest.fn().mockRejectedValue(new Error('API key is leaked'))
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel)
      };

      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      // We no longer mutate process.env; we expect a null result and internal cooldown handling
      expect(result).toBeNull();
    });

    test('should use development fallback in non-production environment', async () => {
      process.env.NODE_ENV = 'development';

      const result = await generateEmbedding('test text');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(768);
      expect(typeof result[0]).toBe('number');
      expect(result[0]).toBeGreaterThanOrEqual(-0.5);
      expect(result[0]).toBeLessThanOrEqual(0.5);
    });

    test('should throw error in production without any API keys', async () => {
      process.env.NODE_ENV = 'production';

      await expect(generateEmbedding('test text')).rejects.toThrow(
        'No embedding provider configured. Set GEMINI_API_KEY.'
      );
    });

    test('should handle Groq response without embedding data', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      axios.post.mockResolvedValue({
        data: { data: [{}] } // Missing embedding
      });

      const result = await generateEmbedding('test text');

      expect(result).toBeNull();
    });

    test('should handle Gemini response without embedding values', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockGeminiModel = {
        embedContent: jest.fn().mockResolvedValue({
          embedding: {} // Missing values
        })
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel)
      };

      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(result).toBeNull();
    });

    test('should generate consistent fake embeddings for same text', async () => {
      process.env.NODE_ENV = 'development';

      const result1 = await generateEmbedding('test text');
      const result2 = await generateEmbedding('test text');

      expect(result1).toEqual(result2);
      expect(result1.length).toBe(768);
    });

    test('should generate different fake embeddings for different text', async () => {
      process.env.NODE_ENV = 'development';

      const result1 = await generateEmbedding('test text 1');
      const result2 = await generateEmbedding('test text 2');

      expect(result1).not.toEqual(result2);
      expect(result1.length).toBe(768);
      expect(result2.length).toBe(768);
    });
  });
});