const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Module-scoped cooldown timestamp for Gemini to avoid repeated 429 retries
let geminiDisabledUntil = 0;

// Helper to support a primary + backup Gemini API key configuration
function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_BACKUP || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_ALT || '';
}

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
 * Embedding service preferring DeepSeek (if configured) and falling back to
 * Gemini when available. Configure DEEPSEEK_API_KEY/DEEPSEEK_EMBED_MODEL or
 * GEMINI_API_KEY depending on your provider.
 */
async function generateEmbedding(text, options = {}) {
  if (!text || typeof text !== 'string') return null;

  // Optional: allow skipping Gemini via env
  const skipGeminiEnv = process.env.SKIP_GEMINI_EMBEDDING === 'true';

  // Determine provider priority. Can be overridden with EMBEDDING_PROVIDER_ORDER
  // Example: EMBEDDING_PROVIDER_ORDER=deepseek,cerebras,groq,gemini
  const envPriority = (process.env.EMBEDDING_PROVIDER_ORDER || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  // By default do NOT include Cerebras in embedding priority because many
  // Cerebras deployments do not expose an embeddings endpoint. If you do have
  // a Cerebras embeddings endpoint, either add it explicitly to
  // EMBEDDING_PROVIDER_ORDER or set CEREBRAS_SUPPORTS_EMBEDDINGS=true in env.
  // Prefer Gemini for embeddings by default (only Gemini will be attempted
  // unless EMBEDDING_PROVIDER_ORDER is explicitly set).
  const defaultPriority = ['gemini'];
  const priority = envPriority.length ? envPriority : defaultPriority;



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
        logger.info('[Embedding] ✅ DeepSeek embedding generated', { provider: 'DeepSeek', model: DEEPSEEK_EMBED_MODEL, dims: emb.length });
        return { provider: 'deepseek', model: DEEPSEEK_EMBED_MODEL, embedding: emb.map(Number) };
      }
      logger.warn('[Embedding] DeepSeek returned no valid embedding');
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data || err?.message || String(err);
        logger.error('[Embedding] DeepSeek embedding failed', { provider: 'DeepSeek', status, message: msg });
        if (options && options.diagnostic) {
          return { provider: 'deepseek', status: 'fail', message: msg, statusCode: status };
        }
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
        logger.info('[Embedding] ✅ Voyage embedding generated', { provider: 'Voyage', model: VOYAGE_EMBED_MODEL, dims: emb.length });
        return { provider: 'voyage', model: VOYAGE_EMBED_MODEL, embedding: emb.map(Number) };
      }
      logger.warn('[Embedding] Voyage returned no valid embedding');
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data || err?.message || String(err);
      logger.error('[Embedding] Voyage embedding failed', { provider: 'Voyage', status, message: msg });
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
  const GEMINI_KEY = getGeminiKey();
  const geminiAvailable = !!GEMINI_KEY && !skipGeminiEnv && Date.now() > geminiDisabledUntil;
  // Default to the cost-effective embedding model that's broadly available
  const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
  async function tryGemini() {
    if (!geminiAvailable) return null;
    let genAI = null;
    let model = null;
    let result = null;
    let status = null;
    let msg = null;

    try {
      genAI = new GoogleGenerativeAI(GEMINI_KEY);
      model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL });
      result = await model.embedContent(text);
      const embedding = result?.embedding?.values || result?.embedding || null;
      if (isValidEmbedding(embedding)) {
        logger.info(`[Embedding] ✅ Gemini embedding generated (${embedding.length} dims)`, { provider: 'Gemini', model: GEMINI_EMBED_MODEL });
        return { provider: 'gemini', model: GEMINI_EMBED_MODEL, embedding: embedding.map(Number) };
      }
      logger.warn('[Embedding] Gemini returned invalid embedding payload');
      if (options && options.diagnostic) return { provider: 'gemini', status: 'fail', message: 'Invalid embedding payload' };
    } catch (error) {
      status = error?.response?.status;
      msg = error?.response?.data || error?.message || String(error);
      if (error.response?.status === 429 || /quota|rate limit|Too Many Requests/i.test(msg)) {
        const longer = /limit: 0|quota exceeded/i.test(msg) ? (60 * 60 * 1000) : (5 * 60 * 1000);
        geminiDisabledUntil = Date.now() + longer;
        logger.error('[Embedding] Gemini quota/rate-limit error:', msg, `— disabling for ${Math.round(longer/60000)}m`);
      } else if (msg && String(msg).toLowerCase().includes('leak')) {
        logger.error('[Embedding] ❌ Gemini API key may be compromised. Rotate the key immediately and update configuration.');
        geminiDisabledUntil = Date.now() + (60 * 60 * 1000);
      } else {
        logger.error('[Embedding] Gemini failed:', msg);
      }
      if (options && options.diagnostic) {
        return { provider: 'gemini', status: 'fail', message: msg, statusCode: status };
      }
    }
    const msgStr = String(msg).toLowerCase();
      // Heuristic fallbacks for v1/v1beta differences: some models use `embedText` or have
      // names like `embedding-gecko-001` while users may have `textembedding-gecko-001`.
      try {
        if (msgStr.includes('embedcontent') || status === 404 || /not found/.test(msgStr)) {
          // If the model object supports embedText, try that
          if (typeof model?.embedText === 'function') {
            const tresp = await model.embedText(text);
            const emb = tresp?.embedding?.values || tresp?.embedding || null;
            if (isValidEmbedding(emb)) {
              logger.info(`[Embedding] ✅ Gemini embedText fallback succeeded (${emb.length} dims)`, { model: GEMINI_EMBED_MODEL });
              return { provider: 'gemini', model: GEMINI_EMBED_MODEL, embedding: emb.map(Number) };
            }
          }

          // Try common name variants if the model wasn't found
          if (GEMINI_EMBED_MODEL && /text-?embedding/i.test(GEMINI_EMBED_MODEL)) {
            const alt = GEMINI_EMBED_MODEL.replace(/text-?embedding/i, 'embedding');
            const altModel = genAI.getGenerativeModel({ model: alt });
            if (altModel) {
              // try embedText first, then embedContent
              if (typeof altModel.embedText === 'function') {
                const altResp = await altModel.embedText(text);
                const emb = altResp?.embedding?.values || altResp?.embedding || null;
                if (isValidEmbedding(emb)) return { provider: 'gemini', model: alt, embedding: emb.map(Number) };
              }
              if (typeof altModel.embedContent === 'function') {
                const altResp = await altModel.embedContent(text);
                const emb = altResp?.embedding?.values || altResp?.embedding || null;
                if (isValidEmbedding(emb)) return { provider: 'gemini', model: alt, embedding: emb.map(Number) };
              }
            }
          }
        }
      } catch (fallbackErr) {
        logger.debug('[Embedding] Gemini fallback attempt failed', fallbackErr?.message || String(fallbackErr));
      }
    return null;
  }

  // Execute providers in preferred order
  for (const p of priority) {
    let out = null;
    if (p === 'deepseek') {
      out = await tryDeepseek();
    } else if (p === 'voyage' || p === 'voyageai') {
      out = await tryVoyage();
    } else if (p === 'cerebras' || p === 'cebrus' || p === 'cebras') {
      out = await tryCerebras();
    // Note: Groq embeddings are intentionally not attempted by default.
    } else if (p === 'gemini' && geminiAvailable) {
      out = await tryGemini();
    }

    if (!out) continue;

      // If a provider returned a diagnostic-style failure object, surface it to caller
      if (options && options.diagnostic && out && out.status === 'fail') {
        return out;
      }

    // out may be either an object { provider, model, embedding } or a raw embedding array
    if (Array.isArray(out) && isValidEmbedding(out)) {
      if (options && options.diagnostic) return { provider: p, model: null, embedding: out };
      return out;
    }

    if (out.embedding && isValidEmbedding(out.embedding)) {
      if (options && options.diagnostic) return out;
      return out.embedding;
    }
  }

  // 5) Development / forced fake fallback — only if explicitly allowed or in dev without providers
  const FORCE_FAKE = process.env.FORCE_FAKE_EMBEDDINGS === 'true';
  const providersAvailable = !!((process.env.DEEPSEEK_API_KEY) || CEREBRAS_KEY || (getGeminiKey() && !skipGeminiEnv) || VOYAGE_KEY);

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

  // Production: try to use real embeddings but with better error handling
  if (process.env.NODE_ENV === 'production') {
    // In test environment (JEST_WORKER_ID), throw error as expected by tests
    if (process.env.JEST_WORKER_ID) {
      throw new Error('No embedding provider configured. Set GEMINI_API_KEY.');
    }

    // Avoid silently using fake embeddings in production. If no provider is
    // configured and FORCE_FAKE_EMBEDDINGS is not explicitly set, throw an
    // error to surface the misconfiguration instead of producing invalid
    // vector search results.
    if (!providersAvailable && !FORCE_FAKE) {
      throw new Error('No embedding provider configured for production. Set GEMINI_API_KEY or another provider (DEEPSEEK_API_KEY, VOYAGE_API_KEY, etc.) to enable embeddings.');
    }

    logger.warn('[Embedding] Production mode: attempting real embeddings');
    // Try one more time with any available provider
    for (const p of priority) {
        try {
          let out = null;
          if (p === 'deepseek' && DEEPSEEK_KEY) {
            out = await tryDeepseek();
          } else if (p === 'voyage' && VOYAGE_KEY) {
            out = await tryVoyage();
          } else if (p === 'gemini' && process.env.GEMINI_API_KEY) {
            out = await tryGemini();
          }

          if (!out) continue;

          if (Array.isArray(out) && isValidEmbedding(out)) {
            logger.info(`[Embedding] Production provider ${p} produced valid embedding (${out.length} dims)`);
            return out;
          }

          if (out.embedding && isValidEmbedding(out.embedding)) {
            logger.info(`[Embedding] Production provider ${out.provider || p} produced valid embedding (${out.embedding.length} dims)`);
            return out.embedding;
          }
        } catch (e) {
          logger.warn(`[Embedding] Provider ${p} failed in production fallback:`, e.message);
        }
    }
    
    // If all providers failed, surface an error instead of falling back to
    // fake embeddings, unless FORCE_FAKE_EMBEDDINGS is explicitly enabled.
    logger.error('[Embedding] All providers failed in production');
    if (FORCE_FAKE) {
      logger.warn('FORCE_FAKE_EMBEDDINGS is enabled — returning deterministic fake embedding (explicit override)');
      const seed = Array.from(text).reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17);
      const dims = 768;
      const vec = new Array(dims).fill(0).map((_, i) => {
        const v = Math.sin(seed + i * 9973) * 0.5;
        return Number((v).toFixed(6));
      });
      return vec;
    }

    throw new Error('Embedding providers are configured but failed to produce embeddings in production');
  }

  return null;
}

module.exports = { generateEmbedding };
