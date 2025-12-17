import * as aiService from './ai.service.js';
import logger from '../utils/logger.js';

/**
 * Rerank candidates using an LLM-based rerank model.
 * Expects process.env.RERANK_MODEL to be set (e.g., 'rerank-2-lite')
 * Returns reordered array of candidates (same objects) using scores returned by LLM.
 */
async function rerankCandidates(query, candidates = []) {
  const model = process.env.RERANK_MODEL || null;
  if (!model || candidates.length <= 1) return candidates;

  try {
    // Build a structured prompt instructing the model to return JSON scores
    const system = `You are a helpful scorer. Given a short query and a list of candidate passages, return a JSON array of objects [{id: <id>, score: <0-1 number>}]. Do not output any extra text.`;
    const candidateText = candidates.map((c, i) => ({ id: c.id || String(i), text: (c.content || '').slice(0, 400) }));

    const user = `Query: ${query}\nCandidates: ${JSON.stringify(candidateText)}`;

    const result = await aiService.generateResponse([{ role: 'system', content: system }, { role: 'user', content: user }], { maxTokens: 256, temperature: 0.0, model: model });

    // Try to extract JSON from response
    const parse = (text) => {
      try {
        // crude extraction of JSON object/array
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return match ? JSON.parse(match[0]) : null;
      } catch (e) {
        return null;
      }
    };

    const parsed = parse(result.response || '');
    if (!Array.isArray(parsed)) return candidates;

    const scoreMap = {};
    parsed.forEach(p => { if (p && p.id) scoreMap[String(p.id)] = Number(p.score || 0); });

    const ranked = candidates.slice().sort((a, b) => {
      const sa = scoreMap[String(a.id)] ?? 0;
      const sb = scoreMap[String(b.id)] ?? 0;
      return sb - sa;
    });

    return ranked;
  } catch (e) {
    logger.warn('Rerank failed, returning original order', { error: e?.message || e });
    return candidates;
  }
}

export { rerankCandidates };
