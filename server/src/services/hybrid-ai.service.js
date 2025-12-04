const axios = require('axios');

/**
 * Hybrid AI Service - Intelligent Load Balancing Across Free Tier Providers
 * 
 * FREE TIER LIMITS:
 * - Groq: 30 req/min, 14,400 tokens/min
 * - Gemini: 15 req/min, 1M tokens/day
 * - Cerebras: 30 req/min
 * - DeepSeek: 60 req/min (most generous)
 * 
 * Strategy: Round-robin load balancing with smart fallback
 */

// Provider Configurations
const PROVIDERS = {
  GROQ: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 14400 },
    priority: 1, // PRIMARY - Fast and reliable
    enabled: true
  },
  CEREBRAS: {
    name: 'Cerebras',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    apiKey: process.env.CEREBRAS_API_KEY,
    model: 'llama3.1-8b',
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 30000 },
    priority: 2,
    enabled: true
  },
  GEMINI: {
    name: 'Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    rateLimit: { requestsPerMinute: 15, tokensPerDay: 1000000 },
    priority: 3,
    enabled: true,
    isGemini: true
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 50000 },
    priority: 4, // LAST - Insufficient balance reported
    enabled: false // Disabled due to balance issues
    isGemini: true // Special flag for different API format
  }
};

// Usage tracking for rate limit management
const usageTracker = {
  DEEPSEEK: { requests: [], tokens: [] },
  GROQ: { requests: [], tokens: [] },
  CEREBRAS: { requests: [], tokens: [] },
  GEMINI: { requests: [], tokens: [] }
};

// Round-robin index
let currentProviderIndex = 0;

/**
 * Clean up old usage records (older than 1 minute/1 day)
 */
function cleanupUsageTracker(provider, type = 'requests') {
  const now = Date.now();
  const timeWindow = type === 'requests' ? 60 * 1000 : 24 * 60 * 60 * 1000; // 1 min or 1 day
  
  if (!usageTracker[provider]) return;
  usageTracker[provider][type] = usageTracker[provider][type].filter(
    timestamp => (now - timestamp) < timeWindow
  );
}

/**
 * Check if provider is available (not rate limited)
 */
function isProviderAvailable(providerKey) {
  const provider = PROVIDERS[providerKey];
  if (!provider || !provider.enabled || !provider.apiKey) return false;

  cleanupUsageTracker(providerKey, 'requests');
  cleanupUsageTracker(providerKey, 'tokens');

  const tracker = usageTracker[providerKey];
  const limits = provider.rateLimit;

  // Check request rate limit
  if (tracker.requests.length >= limits.requestsPerMinute) {
    console.log(`[HybridAI] ${provider.name} rate limit reached: ${tracker.requests.length}/${limits.requestsPerMinute} req/min`);
    return false;
  }

  // Check token rate limit (if applicable)
  if (limits.tokensPerMinute) {
    const tokenCount = tracker.tokens.reduce((sum, t) => sum + t.count, 0);
    if (tokenCount >= limits.tokensPerMinute) {
      console.log(`[HybridAI] ${provider.name} token limit reached: ${tokenCount}/${limits.tokensPerMinute} tokens/min`);
      return false;
    }
  }

  return true;
}

/**
 * Record usage for rate limit tracking
 */
function recordUsage(providerKey, tokensUsed = 0) {
  const now = Date.now();
  usageTracker[providerKey].requests.push(now);
  if (tokensUsed > 0) {
    usageTracker[providerKey].tokens.push({ timestamp: now, count: tokensUsed });
  }
}

/**
 * Get next available provider using round-robin with smart fallback
 */
function getNextProvider() {
  const providerKeys = Object.keys(PROVIDERS).sort((a, b) => 
    PROVIDERS[a].priority - PROVIDERS[b].priority
  );

  // Try round-robin first
  let attempts = 0;
  while (attempts < providerKeys.length) {
    const provider = providerKeys[currentProviderIndex % providerKeys.length];
    currentProviderIndex++;

    if (isProviderAvailable(provider)) {
      return { key: provider, config: PROVIDERS[provider] };
    }
    attempts++;
  }

  // If all providers are rate limited, wait and retry with highest priority
  console.warn('[HybridAI] All providers rate limited. Using fallback strategy...');
  return null;
}

/**
 * Convert OpenAI format to Gemini format
 */
function convertToGeminiFormat(messages) {
  const contents = [];
  let systemInstruction = '';

  messages.forEach(msg => {
    if (msg.role === 'system') {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  });

  return {
    contents,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9
    }
  };
}

/**
 * Convert Gemini response to OpenAI format
 */
function convertGeminiResponse(geminiResponse) {
  const candidate = geminiResponse.candidates?.[0];
  if (!candidate) {
    throw new Error('No response from Gemini');
  }

  return {
    response: candidate.content.parts[0].text,
    tokensUsed: geminiResponse.usageMetadata?.totalTokenCount || 0,
    model: 'gemini-1.5-flash'
  };
}

/**
 * Call AI provider with proper error handling
 */
async function callProvider(providerKey, providerConfig, messages, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log(`[HybridAI] Calling ${providerConfig.name}...`);

    // Special handling for Gemini
    if (providerConfig.isGemini) {
      const geminiPayload = convertToGeminiFormat(messages);
      const response = await axios.post(
        `${providerConfig.endpoint}?key=${providerConfig.apiKey}`,
        geminiPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      const result = convertGeminiResponse(response.data);
      recordUsage(providerKey, result.tokensUsed);
      
      console.log(`[HybridAI] ✅ ${providerConfig.name} succeeded in ${Date.now() - startTime}ms`);
      return result;
    }

    // Standard OpenAI-compatible format
    const payload = {
      model: providerConfig.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 0.9
    };

    const response = await axios.post(
      providerConfig.endpoint,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format');
    }

    const result = {
      response: response.data.choices[0].message.content,
      tokensUsed: response.data.usage?.total_tokens || 0,
      model: providerConfig.model,
      provider: providerConfig.name
    };

    recordUsage(providerKey, result.tokensUsed);
    
    console.log(`[HybridAI] ✅ ${providerConfig.name} succeeded in ${Date.now() - startTime}ms (${result.tokensUsed} tokens)`);
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[HybridAI] ❌ ${providerConfig.name} failed after ${duration}ms:`, error.response?.data?.error?.message || error.message);
    
    // Classify error type
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('AUTH_ERROR');
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('TIMEOUT');
    }
    
    throw error;
  }
}

/**
 * Generate AI response with intelligent provider selection and fallback
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<Object>} - { response, tokensUsed, model, provider }
 */
async function generateResponse(messages, options = {}) {
  let lastError = null;
  let attemptCount = 0;
  const maxAttempts = Object.keys(PROVIDERS).length;

  while (attemptCount < maxAttempts) {
    attemptCount++;

    // Get next available provider
    const provider = getNextProvider();
    
    if (!provider) {
      // All providers exhausted, wait a bit and retry
      console.warn('[HybridAI] All providers unavailable. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    try {
      const result = await callProvider(provider.key, provider.config, messages, options);
      
      // Success! Return result
      console.log(`[HybridAI] 🎉 Success with ${provider.config.name} on attempt ${attemptCount}`);
      return result;

    } catch (error) {
      lastError = error;
      console.log(`[HybridAI] Attempt ${attemptCount}/${maxAttempts} failed with ${provider.config.name}`);
      
      // If rate limit error, mark provider as temporarily unavailable
      if (error.message === 'RATE_LIMIT') {
        // Add fake timestamps to prevent immediate retry
        for (let i = 0; i < provider.config.rateLimit.requestsPerMinute; i++) {
          usageTracker[provider.key].requests.push(Date.now());
        }
      }
      
      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  console.error('[HybridAI] 💥 All providers exhausted. Last error:', lastError?.message);
  throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get provider status and statistics
 */
function getProviderStatus() {
  const status = {};
  
  Object.keys(PROVIDERS).forEach(key => {
    const provider = PROVIDERS[key];
    const tracker = usageTracker[key];
    
    cleanupUsageTracker(key, 'requests');
    cleanupUsageTracker(key, 'tokens');
    
    const tokenCount = tracker.tokens.reduce((sum, t) => sum + t.count, 0);
    
    status[key] = {
      name: provider.name,
      enabled: provider.enabled && !!provider.apiKey,
      available: isProviderAvailable(key),
      currentUsage: {
        requests: tracker.requests.length,
        tokens: tokenCount
      },
      limits: provider.rateLimit,
      utilization: {
        requests: `${tracker.requests.length}/${provider.rateLimit.requestsPerMinute}`,
        requestsPercent: Math.round((tracker.requests.length / provider.rateLimit.requestsPerMinute) * 100),
        tokens: provider.rateLimit.tokensPerMinute 
          ? `${tokenCount}/${provider.rateLimit.tokensPerMinute}`
          : 'N/A'
      }
    };
  });
  
  return status;
}

/**
 * Health check - test all providers
 */
async function healthCheck() {
  const results = {};
  const testMessages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say "OK" if you can read this.' }
  ];

  for (const [key, provider] of Object.entries(PROVIDERS)) {
    if (!provider.enabled || !provider.apiKey) {
      results[key] = { status: 'disabled', reason: 'No API key or disabled' };
      continue;
    }

    try {
      const result = await callProvider(key, provider, testMessages, { maxTokens: 10 });
      results[key] = { 
        status: 'healthy', 
        responseTime: 'fast',
        response: result.response.substring(0, 50)
      };
    } catch (error) {
      results[key] = { 
        status: 'error', 
        reason: error.message 
      };
    }
  }

  return results;
}

/**
 * Get provider stats for monitoring
 */
function getProviderStats() {
  return getProviderStatus();
}

/**
 * Check providers health summary
 */
function checkProvidersHealth() {
  const status = getProviderStatus();
  const providers = Object.values(status);
  
  const totalConfigured = providers.filter(p => p.enabled).length;
  const totalAvailable = providers.filter(p => p.available).length;
  
  return {
    totalConfigured,
    totalAvailable,
    providers: providers.map(p => ({
      name: p.name,
      status: p.available ? 'available' : (p.enabled ? 'rate-limited' : 'disabled')
    }))
  };
}

module.exports = {
  generateResponse,
  getProviderStatus,
  getProviderStats,
  checkProvidersHealth,
  healthCheck,
  PROVIDERS
};
