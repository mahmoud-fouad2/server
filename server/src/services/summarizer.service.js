const axios = require('axios');
const logger = require('../utils/logger');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

async function summarizeText(text, maxTokens = 200) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return '';
  if (!GROQ_API_KEY) {
    // If no Groq key is configured, degrade gracefully in development by returning
    // a short truncated form of the text. In production we keep strict behavior.
    if (process.env.NODE_ENV !== 'production') {
      return text.length > 200 ? text.slice(0, 200) + '...' : text;
    }
    throw new Error('GROQ_API_KEY not configured for summarization.');
  }

  const prompt = `Summarize and condense the following content into a short, fact-only summary (2-3 sentences) that preserves key facts. Return only the summary text; do not invent facts.

Content:\n${text}\n`;

  try {
    const resp = await axios.post(
      GROQ_API_URL,
      {
        model: process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a summarization assistant. Keep summaries factual and concise.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: maxTokens
      },
      {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const out = resp.data?.choices?.[0]?.message?.content;
    return out ? out.trim() : '';
  } catch (err) {
    logger.error('Groq summarization error', { error: err.response?.data || err.message });
    return ''; // degrade gracefully
  }
}

module.exports = { summarizeText };
