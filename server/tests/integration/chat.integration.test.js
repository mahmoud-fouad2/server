/*
 * Integration-like tests for chat flows: backup key usage, KB compliance,
 * structured JSON enforcement and formatting fallback.
 */

const axios = require('axios');
jest.mock('axios');

const aiService = require('../../src/services/ai.service');
const { generateChatResponse } = aiService;

describe('Chat Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset provider state if available
    try { aiService.resetProviderState(); } catch (e) {}

    // Default env keys for tests
    process.env.GROQ_API_KEY = 'primary-groq-key';
    process.env.GROQ_API_KEY_BACKUP = 'backup-groq-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.CEREBRAS_API_KEY = 'test-cerebras-key';
  });

  test('uses GROQ backup key when primary is rate-limited (429)', async () => {
    // Mock axios.post to behave differently based on Authorization header
    axios.post.mockImplementation((url, payload, opts = {}) => {
      const auth = opts?.headers?.Authorization || '';
      if (auth.includes('primary-groq-key')) {
        // Simulate primary returning 429
        return Promise.reject({ response: { status: 429, data: { error: 'Rate limit' } } });
      }
      if (auth.includes('backup-groq-key')) {
        // Backup succeeds and returns structured JSON referencing KB#A
        const structured = JSON.stringify({ language: 'ar', tone: 'friendly', answer: 'هذا مقتبس من KB#A', sources: ['KB#A'], action: 'no_action' });
        return Promise.resolve({ data: { choices: [{ message: { content: structured } }], usage: { total_tokens: 10 } } });
      }
      // Any other provider succeeds generically
      return Promise.resolve({ data: { choices: [{ message: { content: 'Generic success' } }], usage: { total_tokens: 5 } } });
    });

    const business = { id: 'cmir2oyaz00013ltwis4xc4tp', name: 'فهملي', widgetConfig: { personality: 'friendly' } };

    const res = await generateChatResponse('هل عندكم فرع في الإسكندرية؟', business, [], ['فرعنا في الاسكندرية - KB#A'], null);
    expect(res).toBeDefined();
    // Should have used the backup key and returned structured JSON referencing KB#A
    const parsed = JSON.parse(res.response);
    expect(Array.isArray(parsed.sources)).toBe(true);
    expect(parsed.sources).toContain('KB#A');
    // Ensure axios.post was called at least twice (primary+backup)
    expect(axios.post.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('structured provider JSON is parsed and sources preserved (KB referenced)', async () => {
    // Provider returns a structured JSON string referencing KB#A
    const structured = JSON.stringify({ language: 'ar', tone: 'friendly', answer: 'هذا مقتبس من KB#A', sources: ['KB#A'], action: 'no_action' });
    axios.post.mockResolvedValue({ data: { choices: [{ message: { content: structured } }], usage: { total_tokens: 12 } } });

    const business = { id: 'cmir2oyaz00013ltwis4xc4tp', name: 'فهملي', widgetConfig: { personality: 'friendly' } };
    const kb = [{ id: 'KB#A', content: 'معلومات حول فرع الاسكندرية' }];

    const res = await generateChatResponse('اذكر مصدر الاجابة', business, [], kb, null);

    // Response should include the KB reference in sources (either directly or preserved)
    const parsed = JSON.parse(res.response);
    expect(parsed).toHaveProperty('sources');
    expect(Array.isArray(parsed.sources)).toBe(true);
    expect(parsed.sources).toContain('KB#A');
    // Answer should be present (may be fallback summary or original text)
    expect(parsed.answer).toBeTruthy();
  });

  test('formatting retry fallback preserves metadata and returns valid JSON', async () => {
    // First provider returns a short placeholder answer; formatting retry returns a structured JSON without sources
    axios.post
      .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'placeholder answer' } }], usage: { total_tokens: 5 } } })
      // formatting retry returns a structured JSON string missing sources
      .mockResolvedValueOnce({ data: { choices: [{ message: { content: JSON.stringify({ language: 'ar', tone: 'friendly', answer: '', sources: [], action: 'no_action' }) } }], usage: { total_tokens: 3 } } });

    const business = { id: 'cmir2oyaz00013ltwis4xc4tp', name: 'فهملي', widgetConfig: { personality: 'friendly' } };
    // Use empty KB for this test so KB-only enforcement does not trigger and the
    // formatting fallback (preserving language/tone) becomes the final response.
    const kb = [];

    const res = await generateChatResponse('لخصلي', business, [], kb, null);

    // Response should be parseable JSON with language preserved and sources present (maybe empty)
    const parsed = JSON.parse(res.response);
    expect(parsed).toHaveProperty('language');
    expect(parsed.language).toBe('ar');
    expect(parsed).toHaveProperty('sources');
    expect(Array.isArray(parsed.sources)).toBe(true);
    expect(parsed).toHaveProperty('action');
  });

  // More scenarios can be added here: KB conflicts, rating append, clarification flows, etc.
});
