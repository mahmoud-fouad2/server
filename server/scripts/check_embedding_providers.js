#!/usr/bin/env node
const { generateEmbedding } = require('../src/services/embedding.service');

const KNOWN_PROVIDERS = ['gemini'];

async function probeProvider(provider) {
  const orig = process.env.EMBEDDING_PROVIDER_ORDER;
  process.env.EMBEDDING_PROVIDER_ORDER = provider;
  try {
    // Ask for diagnostic info so we get { provider, model, embedding }
    const resp = await generateEmbedding('health-check: probe provider ' + provider, { diagnostic: true });
    if (!resp) return { provider, status: 'fail', message: 'No response (null)' };

    // If resp indicates a provider-level failure (diagnostic info), pass that through
    if (resp && resp.status === 'fail') {
      return { provider: resp.provider || provider, status: 'fail', message: resp.message || 'Provider failed', statusCode: resp.statusCode };
    }

    // resp may be { provider, model, embedding } or a raw array
    if (Array.isArray(resp)) {
      return { provider, status: 'ok', model: null, dims: resp.length };
    }

    const { model, embedding } = resp;
    if (embedding && Array.isArray(embedding)) {
      return { provider: resp.provider || provider, status: 'ok', model: model || null, dims: embedding.length };
    }

    return { provider, status: 'fail', message: 'Invalid embedding payload', resp };
  } catch (err) {
    // If provider is not configured, some providers return null or throw
    const msg = err?.message || String(err);
    return { provider, status: 'fail', message: msg };
  } finally {
    process.env.EMBEDDING_PROVIDER_ORDER = orig;
  }
}

async function checkProviders() {
  const results = [];

  for (const p of KNOWN_PROVIDERS) {
    // Heuristic: skip providers that clearly lack env credentials
    if (p === 'groq' && !process.env.GROQ_API_KEY) {
      results.push({ provider: 'groq', status: 'skipped', message: 'Missing GROQ_API_KEY' });
      continue;
    }
    if (p === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      results.push({ provider: 'deepseek', status: 'skipped', message: 'Missing DEEPSEEK_API_KEY' });
      continue;
    }
    if (p === 'voyage' && !process.env.VOYAGE_API_KEY) {
      results.push({ provider: 'voyage', status: 'skipped', message: 'Missing VOYAGE_API_KEY' });
      continue;
    }
    if (p === 'cerebras' && !process.env.CEREBRAS_API_KEY) {
      results.push({ provider: 'cerebras', status: 'skipped', message: 'Missing CEREBRAS_API_KEY' });
      continue;
    }
    if (p === 'gemini' && !process.env.GEMINI_API_KEY) {
      results.push({ provider: 'gemini', status: 'skipped', message: 'Missing GEMINI_API_KEY' });
      continue;
    }

    const res = await probeProvider(p);
    results.push(res);
  }

  return results;
}

if (require.main === module) {
  (async () => {
    try {
      const out = await checkProviders();
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), results: out }, null, 2));
      process.exit(0);
    } catch (err) {
      console.error('Provider check failed:', err);
      process.exit(2);
    }
  })();
}

module.exports = { checkProviders, probeProvider };
