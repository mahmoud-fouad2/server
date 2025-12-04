const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Embedding service using Google Gemini (primary) or Groq (if configured).
 * Requires GEMINI_API_KEY or (GROQ_API_KEY + GROQ_EMBED_URL).
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Try Groq Embeddings FIRST (More reliable)
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GROQ_EMBED_MODEL = process.env.GROQ_EMBED_MODEL || 'nomic-embed-text';
  
  if (GROQ_KEY) {
    try {
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/embeddings',
        { 
          input: text,
          model: GROQ_EMBED_MODEL
        },
        {
          headers: { 
            'Authorization': `Bearer ${GROQ_KEY}`, 
            'Content-Type': 'application/json' 
          },
          timeout: 15000
        }
      );
      const emb = resp.data?.data?.[0]?.embedding;
      if (Array.isArray(emb)) {
        console.log(`[Embedding] ✅ Groq embedding generated (${emb.length} dims)`);
        return emb;
      }
    } catch (err) {
      console.error('[Embedding] Groq failed:', err.response?.data?.error?.message || err.message);
    }
  }

  // 2. Try Google Gemini Embeddings (Fallback - may be leaked)
  if (process.env.GEMINI_API_KEY && !process.env.SKIP_GEMINI_EMBEDDING) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;
      if (Array.isArray(embedding)) {
        console.log(`[Embedding] ✅ Gemini embedding generated (${embedding.length} dims)`);
        return embedding;
      }
    } catch (error) {
      // Check if API key is leaked
      if (error.message && error.message.includes('leaked')) {
        console.error('[Embedding] ❌ Gemini API key is LEAKED! Get new key from https://aistudio.google.com/');
        // Auto-disable Gemini to prevent further errors
        process.env.SKIP_GEMINI_EMBEDDING = 'true';
      } else {
        console.error('[Embedding] Gemini failed:', error.message);
      }
    }
  }

  // 3. Development Fallback (ONLY for local dev without keys)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ WARNING: Using FAKE embeddings. Vector search will NOT work correctly.');
    // Simple hash -> vector generator (768 dims to match Gemini/BERT roughly)
    const seed = Array.from(text).reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17);
    const dims = 768; 
    const vec = new Array(dims).fill(0).map((_, i) => {
      const v = Math.sin(seed + i * 9973) * 0.5;
      return Number((v).toFixed(6));
    });
    return vec;
  }

  throw new Error('No embedding provider configured. Set GEMINI_API_KEY or GROQ_API_KEY/GROQ_EMBED_URL.');
}

module.exports = { generateEmbedding };
