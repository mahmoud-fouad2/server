const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Module-scoped cooldown timestamp for Gemini to avoid repeated 429 retries
let geminiDisabledUntil = 0;

// Simple helper to perform HTTP POST with a small retry/backoff
async function postWithRetry(url, payload, opts = {}, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.post(url, payload, opts);
    } catch (err) {
      if (i === attempts - 1) throw err;
      const wait = 150 * (i + 1);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

function normalizeEmbeddingResponse(resp) {
  if (!resp) return null;
  // Groq: resp.data.data[0].embedding
  const d = resp.data;
  let arr = null;
  if (Array.isArray(d)) arr = d;
  else if (d && Array.isArray(d.data) && d.data[0] && Array.isArray(d.data[0].embedding)) arr = d.data[0].embedding;
  else if (d && Array.isArray(d.embedding)) arr = d.embedding;
  else if (d && Array.isArray(d.data)) arr = d.data; // last-resort

  if (!arr) return null;

  // Coerce numeric strings to numbers and filter invalid entries
  const nums = arr.map(x => {
    if (typeof x === 'number') return x;
    if (typeof x === 'string' && x.trim() !== '') {
      const n = Number(x);
      return Number.isFinite(n) ? n : NaN;
    }
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }).filter(n => Number.isFinite(n));

  return nums.length > 0 ? nums : null;
}

function isValidEmbedding(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(n => typeof n === 'number' && Number.isFinite(n));
}

/**
 * Embedding service using Google Gemini (primary) or Groq (if configured).
 * Requires GEMINI_API_KEY or (GROQ_API_KEY + GROQ_EMBED_URL).
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  // Configs
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GROQ_EMBED_URL = process.env.GROQ_EMBED_URL || 'https://api.groq.com/openai/v1/embeddings';
  const GROQ_EMBED_MODEL = process.env.GROQ_EMBED_MODEL || 'groq-embedder';
  const skipGeminiEnv = process.env.SKIP_GEMINI_EMBEDDING === 'true';

  // Determine provider priority. Can be overridden with EMBEDDING_PROVIDER_ORDER
  // Example: EMBEDDING_PROVIDER_ORDER=deepseek,cerebras,groq,gemini
  const envPriority = (process.env.EMBEDDING_PROVIDER_ORDER || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  // By default do NOT include Cerebras in embedding priority because many
  // Cerebras deployments do not expose an embeddings endpoint. If you do have
  // a Cerebras embeddings endpoint, either add it explicitly to
  // EMBEDDING_PROVIDER_ORDER or set CEREBRAS_SUPPORTS_EMBEDDINGS=true in env.
  const defaultPriority = ['deepseek', 'voyage', 'groq'];
  const priority = envPriority.length ? envPriority : defaultPriority;

  // Helper to attempt Groq with candidate models
  async function tryGroq() {
    if (!GROQ_KEY) return null;
    const candidates = [GROQ_EMBED_MODEL, 'groq-embedder', 'groq-embed-multilingual-v3'].filter(Boolean);
    for (const modelName of candidates) {
      try {
        const resp = await postWithRetry(
          GROQ_EMBED_URL,
          { input: text, model: modelName },
          { headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 },
          2
        );

        const emb = normalizeEmbeddingResponse(resp);
        if (isValidEmbedding(emb)) {
          logger.info('[Embedding] ✅ Groq embedding generated', { provider: 'Groq', model: modelName, dims: emb.length });
          return emb.map(Number);
        }
        logger.warn('[Embedding] Groq returned no valid embedding for model', { provider: 'Groq', model: modelName });
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.error?.message || err?.response?.data || err?.message || String(err);
        logger.error('[Embedding] Groq embedding request failed', { provider: 'Groq', model: modelName, status, message: msg });
        // If model not found, try next candidate. For other errors, continue to next provider.
        if (msg && /does not exist|model not found|Unknown model|nomic-embed-text/i.test(String(msg))) {
          continue;
        }
        break;
      }
    }
    return null;
  }

  // 2) Try DeepSeek if configured
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  const DEEPSEEK_EMBED_URL = process.env.DEEPSEEK_EMBED_URL || 'https://api.deepseek.com/v1/embeddings';
  const DEEPSEEK_EMBED_MODEL = process.env.DEEPSEEK_EMBED_MODEL || 'deepseek-embed';
  async function tryDeepseek() {
    if (!DEEPSEEK_KEY) return null;
    try {
      const resp = await postWithRetry(DEEPSEEK_EMBED_URL, { input: text, model: DEEPSEEK_EMBED_MODEL }, { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }, 2);
      const emb = normalizeEmbeddingResponse(resp);
      if (isValidEmbedding(emb)) {
        logger.info('[Embedding] ✅ DeepSeek embedding generated', { dims: emb.length });
        return emb.map(Number);
      }
      logger.warn('[Embedding] DeepSeek returned no valid embedding');
    } catch (err) {
      logger.error('[Embedding] DeepSeek embedding failed:', err?.response?.data || err?.message || String(err));
    }
    return null;
  }

  // 2a) Try Voyage AI if configured
  const VOYAGE_KEY = process.env.VOYAGE_API_KEY;
  const VOYAGE_EMBED_URL = process.env.VOYAGE_EMBED_URL || 'https://api.voyageai.com/v1/embeddings';
  const VOYAGE_EMBED_MODEL = process.env.VOYAGE_EMBED_MODEL || 'voyage-embed';
  async function tryVoyage() {
    if (!VOYAGE_KEY) return null;
    try {
      const resp = await postWithRetry(VOYAGE_EMBED_URL, { input: text, model: VOYAGE_EMBED_MODEL }, { headers: { Authorization: `Bearer ${VOYAGE_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }, 2);
      const emb = normalizeEmbeddingResponse(resp);
      if (isValidEmbedding(emb)) {
        logger.info('[Embedding] ✅ Voyage embedding generated', { dims: emb.length });
        return emb.map(Number);
      }
      logger.warn('[Embedding] Voyage returned no valid embedding');
    } catch (err) {
      logger.error('[Embedding] Voyage embedding failed:', err?.response?.data || err?.message || String(err));
    }
    return null;
  }

  // 3) Try Cerebras if configured
  const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY || process.env.CEBRUS_API_KEY || process.env.CEBRAS_API_KEY;
  const CEREBRAS_EMBED_URL = process.env.CEREBRAS_EMBED_URL;
  const CEREBRAS_EMBED_MODEL = process.env.CEREBRAS_EMBED_MODEL || process.env.CEBRAS_EMBED_MODEL || 'cerebras-embed';
  const CEREBRAS_SUPPORTS_EMBEDDINGS = String(process.env.CEREBRAS_SUPPORTS_EMBEDDINGS || 'false').toLowerCase() === 'true';

  // Only attempt Cerebras embeddings if the deployment explicitly supports
  // embeddings (guarded by CEREBRAS_SUPPORTS_EMBEDDINGS) AND both key+embed_url
  // are provided. This prevents accidental requests to a chat-only endpoint.
  async function tryCerebras() {
    if (!CEREBRAS_SUPPORTS_EMBEDDINGS) return null;
    if (!CEREBRAS_KEY || !CEREBRAS_EMBED_URL) return null;
    try {
      const resp = await postWithRetry(CEREBRAS_EMBED_URL, { input: text, model: CEREBRAS_EMBED_MODEL }, { headers: { Authorization: `Bearer ${CEREBRAS_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }, 2);
      const emb = normalizeEmbeddingResponse(resp);
      if (isValidEmbedding(emb)) {
        logger.info('[Embedding] ✅ Cerebras embedding generated', { dims: emb.length });
        return emb.map(Number);
      }
      logger.warn('[Embedding] Cerebras returned no valid embedding');
    } catch (err) {
      logger.error('[Embedding] Cerebras embedding failed:', err?.response?.data || err?.message || String(err));
    }
    return null;
  }

  // 4) Try Gemini embeddings last (unless explicitly skipped or in cooldown)
  const geminiAvailable = !!process.env.GEMINI_API_KEY && !skipGeminiEnv && Date.now() > geminiDisabledUntil;
  async function tryGemini() {
    if (!geminiAvailable) return null;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      const embedding = result?.embedding?.values || result?.embedding || null;
      if (isValidEmbedding(embedding)) {
        logger.info(`[Embedding] ✅ Gemini embedding generated (${embedding.length} dims)`);
        return embedding.map(Number);
      }
      logger.warn('[Embedding] Gemini returned invalid embedding payload');
    } catch (error) {
      const msg = error?.response?.data?.error?.message || error?.message || String(error);
      if (error.response?.status === 429 || /quota|rate limit|Too Many Requests/i.test(msg)) {
        // disable Gemini for a longer cooldown depending on quota severity to avoid repeated 429 storms
        const longer = /limit: 0|quota exceeded/i.test(msg) ? (60 * 60 * 1000) : (5 * 60 * 1000); // 1 hour if free-tier disabled, else 5 minutes
        geminiDisabledUntil = Date.now() + longer;
        logger.error('[Embedding] Gemini quota/rate-limit error:', msg, `— disabling for ${Math.round(longer/60000)}m`);
      } else if (msg && msg.toLowerCase().includes('leak')) {
        logger.error('[Embedding] ❌ Gemini API key may be compromised. Rotate the key immediately and update configuration.');
        geminiDisabledUntil = Date.now() + (60 * 60 * 1000); // 1 hour safer window
      } else {
        logger.error('[Embedding] Gemini failed:', msg);
      }
      // continue to fallback rather than returning early
    }
    return null;
  }

  // Execute providers in preferred order
  for (const p of priority) {
    if (p === 'deepseek') {
      const out = await tryDeepseek();
      if (isValidEmbedding(out)) return out;
    } else if (p === 'voyage' || p === 'voyageai') {
      const out = await tryVoyage();
      if (isValidEmbedding(out)) return out;
    } else if (p === 'cerebras' || p === 'cebrus' || p === 'cebras') {
      const out = await tryCerebras();
      if (isValidEmbedding(out)) return out;
    } else if (p === 'groq') {
      const out = await tryGroq();
      if (isValidEmbedding(out)) return out;
    } else if (p === 'gemini') {
      const out = await tryGemini();
      if (isValidEmbedding(out)) return out;
    }
  }

  // 5) Development / forced fake fallback — only if explicitly allowed or in dev without providers
  const FORCE_FAKE = process.env.FORCE_FAKE_EMBEDDINGS === 'true';
  const providersAvailable = !!(GROQ_KEY || DEEPSEEK_KEY || CEREBRAS_KEY || process.env.GEMINI_API_KEY || VOYAGE_KEY);

  if (FORCE_FAKE || (process.env.NODE_ENV === 'development' && !providersAvailable)) {
    logger.warn('⚠️ WARNING: Using FAKE embeddings. Vector search will NOT work correctly.', { forceFake: FORCE_FAKE, providersAvailable });
    const seed = Array.from(text).reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17);
    const dims = 768;
    const vec = new Array(dims).fill(0).map((_, i) => {
      const v = Math.sin(seed + i * 9973) * 0.5;
      return Number((v).toFixed(6));
    });
    return vec;
  }

  // Production: no provider produced an embedding
  if (process.env.NODE_ENV === 'production') {
    logger.error('[Embedding] No embedding provider produced an embedding in production. Configure GROQ_API_KEY or other providers. Falling back to null embedding to avoid crashing.');
    // Return null so callers can fallback to keyword search or other strategies
    return null;
  }

  return null;
}

module.exports = { generateEmbedding };
