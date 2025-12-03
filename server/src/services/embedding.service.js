const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Embedding service using Google Gemini (primary) or Groq (if configured).
 * Requires GEMINI_API_KEY or (GROQ_API_KEY + GROQ_EMBED_URL).
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Try Google Gemini Embeddings (Best Free/Cheap Option)
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;
      if (Array.isArray(embedding)) return embedding;
    } catch (error) {
      console.error('Gemini embedding error:', error.message);
      // Continue to next provider...
    }
  }

  // 2. Try Groq Embeddings (if configured)
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GROQ_EMBED_URL = process.env.GROQ_EMBED_URL;
  
  if (GROQ_KEY && GROQ_EMBED_URL) {
    try {
      const resp = await axios.post(GROQ_EMBED_URL, { input: text }, {
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      const emb = resp.data?.data?.[0]?.embedding || resp.data?.embedding;
      if (Array.isArray(emb)) return emb;
    } catch (err) {
      console.error('Groq embedding error:', err.response?.data || err.message);
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
