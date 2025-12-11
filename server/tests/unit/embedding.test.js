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
    delete process.env.GROQ_API_KEY;
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

    test('should generate embedding using Groq successfully', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.GROQ_EMBED_MODEL = 'groq-embedder';

      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const mockResponse = {
        data: {
          data: [{ embedding: mockEmbedding }]
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await generateEmbedding('test text');

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/embeddings',
        {
          input: 'test text',
          model: 'groq-embedder'
        },
        {
          headers: {
            'Authorization': 'Bearer test-groq-key',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      expect(result).toEqual(mockEmbedding);
    });

    test('should use default Groq model when not specified', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      const mockEmbedding = [0.1, 0.2, 0.3];
      axios.post.mockResolvedValue({
        data: { data: [{ embedding: mockEmbedding }] }
      });

      await generateEmbedding('test text');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'groq-embedder' }),
        expect.any(Object)
      );
    });

    test('should fallback to Gemini when Groq fails', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      // Groq fails
      axios.post.mockRejectedValue(new Error('Groq API error'));

      // Gemini succeeds
      const mockGeminiEmbedding = [0.2, 0.3, 0.4, 0.5, 0.6];
      const mockGeminiModel = {
        embedContent: jest.fn().mockResolvedValue({
          embedding: { values: mockGeminiEmbedding }
        })
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockGeminiModel)
      };

      GoogleGenerativeAI.mockImplementation(() => mockGenAI);

      const result = await generateEmbedding('test text');

      expect(axios.post).toHaveBeenCalled();
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
      expect(mockGeminiModel.embedContent).toHaveBeenCalledWith('test text');
      expect(result).toEqual(mockGeminiEmbedding);
    });

    test('should skip Gemini when SKIP_GEMINI_EMBEDDING is set', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SKIP_GEMINI_EMBEDDING = 'true';

      axios.post.mockRejectedValue(new Error('Groq API error'));

      const result = await generateEmbedding('test text');

      expect(axios.post).toHaveBeenCalled();
      expect(GoogleGenerativeAI).not.toHaveBeenCalled();
      // Should use development fallback
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(768);
    });

    test('should handle Groq API error gracefully', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      axios.post.mockRejectedValue({
        response: { data: { error: { message: 'Invalid API key' } } }
      });

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
        'No embedding provider configured. Set GEMINI_API_KEY or GROQ_API_KEY/GROQ_EMBED_URL.'
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