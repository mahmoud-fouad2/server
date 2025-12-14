const { checkProviders } = require('../../scripts/check_embedding_providers');

jest.mock('../../src/services/embedding.service', () => ({
  generateEmbedding: jest.fn((text, opts) => {
    // Behavior: if EMBEDDING_PROVIDER_ORDER is set to 'deepseek' return success
    const order = (process.env.EMBEDDING_PROVIDER_ORDER || '').toLowerCase();
    if (order === 'gemini') return Promise.resolve({ provider: 'gemini', model: 'text-embedding-004', embedding: [0.1, 0.2] });
    if (order === 'groq') return Promise.resolve(null);
    if (order === 'voyage') return Promise.reject(new Error('Voyage 404')); // throw
    if (order === 'cerebras') return Promise.resolve([0.5, 0.6]); // raw array
    return Promise.resolve(null);
  })
}));

describe('checkProviders script', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.GROQ_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.VOYAGE_API_KEY;
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  test('skips providers when API keys missing and reports successes/failures when available', async () => {
    // Provide a key for Gemini so the probe runs
    process.env.GEMINI_API_KEY = 'fake';

    const results = await checkProviders();

    const byProvider = results.reduce((acc, r) => { acc[r.provider] = r; return acc; }, {});

    expect(byProvider.gemini.status).toBe('ok');
    expect(byProvider.gemini.model).toBe('text-embedding-004');
  });
});
