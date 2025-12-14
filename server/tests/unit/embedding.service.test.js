const { generateEmbedding } = require('../../src/services/embedding.service');

describe('generateEmbedding (production safety)', () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  test('throws when NODE_ENV=production and no provider configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.VOYAGE_API_KEY;
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.FORCE_FAKE_EMBEDDINGS;

    await expect(generateEmbedding('hello world')).rejects.toThrow(/No embedding provider configured/i);
  });

  test('returns fake embedding when FORCE_FAKE_EMBEDDINGS=true in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FORCE_FAKE_EMBEDDINGS = 'true';
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.VOYAGE_API_KEY;
    delete process.env.CEREBRAS_API_KEY;

    const emb = await generateEmbedding('hello world');
    expect(Array.isArray(emb)).toBe(true);
    expect(emb.length).toBeGreaterThanOrEqual(1);
    expect(typeof emb[0]).toBe('number');
  });
});
