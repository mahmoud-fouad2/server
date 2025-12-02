const axios = require('axios');

/**
 * Embedding service using Groq embeddings only.
 * Requires GROQ_API_KEY and GROQ_EMBED_URL to be configured.
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GROQ_EMBED_URL = process.env.GROQ_EMBED_URL;
  // Only use Groq for embeddings (no OpenAI calls) — require both key and endpoint
  if (GROQ_KEY && GROQ_EMBED_URL) {
    try {
      const resp = await axios.post(GROQ_EMBED_URL, { input: text }, {
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      // Expecting response with embedding array (provider-specific structure)
      const emb = resp.data?.data?.[0]?.embedding || resp.data?.embedding;
      return Array.isArray(emb) ? emb : null;
    } catch (err) {
      console.error('Groq embedding error:', err.response?.data || err.message);
      // Dev fallback: if Groq failed but we're in dev, return deterministic pseudo-embedding
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Groq embedding failed — falling back to deterministic dev embedding');
        const seed = Array.from(text).reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17);
        const dims = 128;
        const vec = new Array(dims).fill(0).map((_, i) => {
          const v = Math.sin(seed + i * 9973) * 0.5;
          return Number((v).toFixed(6));
        });
        return vec;
      }
      throw new Error('Groq embedding failed');
    }
  }

  // Development fallback: return a deterministic pseudo-embedding so local dev and tests
  // don't fail when Groq credentials are not provided. This is NOT suitable for
  // production and should be replaced by a real provider (GROQ_EMBED_URL + GROQ_API_KEY).
  if (process.env.NODE_ENV !== 'production') {
    // Simple hash -> vector generator (128 dims)
    const seed = Array.from(text).reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17);
    const dims = 128;
    const vec = new Array(dims).fill(0).map((_, i) => {
      // simple pseudo-random but deterministic based on seed and index
      const v = Math.sin(seed + i * 9973) * 0.5;
      return Number((v).toFixed(6));
    });
    return vec;
  }

  throw new Error('No embedding provider configured. Set GROQ_API_KEY and GROQ_EMBED_URL to use Groq embeddings.');
}

module.exports = { generateEmbedding };
