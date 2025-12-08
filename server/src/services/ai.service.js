const axios = require('axios');
const logger = require('../utils/logger');

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

// Provider Definitions (API keys resolved at runtime for better testability)
const PROVIDER_DEFINITIONS = {
  GROQ: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    envVar: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 14400 },
    priority: 1, // PRIMARY - Fast and reliable
    enabled: true
  },
  CEREBRAS: {
    name: 'Cerebras',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    envVar: 'CEREBRAS_API_KEY',
    model: 'llama3.1-8b',
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 30000 },
    priority: 3,
    enabled: true
  },
  GEMINI: {
    name: 'Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    envVar: 'GEMINI_API_KEY',
    model: 'gemini-1.5-flash',
    rateLimit: { requestsPerMinute: 15, tokensPerDay: 1000000 },
    priority: 4,
    enabled: true,
    isGemini: true
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    envVar: 'DEEPSEEK_API_KEY',
    model: 'deepseek-chat',
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 50000 },
    priority: 2, // SECONDARY - Balance restored, fast and reliable
    enabled: true // Re-enabled after balance added
  }
};

function getProviderConfig(providerKey) {
  const definition = PROVIDER_DEFINITIONS[providerKey];
  if (!definition) return null;

  const apiKey = process.env[definition.envVar];
  const baseEnabled = definition.enabled !== false;

  return {
    ...definition,
    apiKey,
    enabled: baseEnabled && !!apiKey,
    configured: !!apiKey
  };
}

function getProviders() {
  return Object.keys(PROVIDER_DEFINITIONS).reduce((acc, key) => {
    acc[key] = getProviderConfig(key);
    return acc;
  }, {});
}

// Utility to reset internal state (primarily used in tests)
function resetProviderState() {
  currentProviderIndex = 0;
  Object.keys(usageTracker).forEach(key => {
    usageTracker[key].requests = [];
    usageTracker[key].tokens = [];
  });
}

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
function isProviderAvailable(providerKey, providerConfig = getProviderConfig(providerKey)) {
  const provider = providerConfig;
  if (!provider || !provider.enabled || !provider.apiKey) return false;

  cleanupUsageTracker(providerKey, 'requests');
  cleanupUsageTracker(providerKey, 'tokens');

  const tracker = usageTracker[providerKey];
  const limits = provider.rateLimit;

  // Check request rate limit
  if (tracker.requests.length >= limits.requestsPerMinute) {
    logger.warn(`${provider.name} rate limit reached`, {
      current: tracker.requests.length,
      limit: limits.requestsPerMinute
    });
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
  const providerKeys = Object.keys(PROVIDER_DEFINITIONS).sort((a, b) => 
    PROVIDER_DEFINITIONS[a].priority - PROVIDER_DEFINITIONS[b].priority
  );

  // Try round-robin first
  let attempts = 0;
  while (attempts < providerKeys.length) {
    const provider = providerKeys[currentProviderIndex % providerKeys.length];
    currentProviderIndex++;

    const config = getProviderConfig(provider);
    if (isProviderAvailable(provider, config)) {
      return { key: provider, config };
    }
    attempts++;
  }

  // If all providers are rate limited, wait and retry with highest priority
  logger.warn('[HybridAI] All providers rate limited. Using fallback strategy...');
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
  const logger = require('../utils/logger');
  
  try {
    logger.debug('AI provider call initiated', { provider: providerConfig.name });

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
      
      logger.info('AI provider success', { provider: providerConfig.name, duration: Date.now() - startTime, tokens: result.tokensUsed });
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
    
    logger.info('AI provider success', { provider: providerConfig.name, duration: Date.now() - startTime, tokensUsed: result.tokensUsed });
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('AI provider failed', { 
      provider: providerConfig.name, 
      duration, 
      error: error.message,
      statusCode: error.response?.status
    });
    
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
  const maxAttempts = Object.keys(PROVIDER_DEFINITIONS).length;

  while (attemptCount < maxAttempts) {
    attemptCount++;

    // Get next available provider
    const provider = getNextProvider();
    
    if (!provider) {
      // All providers exhausted, wait a bit and retry
      logger.warn('[HybridAI] All providers unavailable. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    try {
      const result = await callProvider(provider.key, provider.config, messages, options);
      
      // Success! Return result
      logger.info('AI request completed successfully', { provider: provider.config.name, attempt: attemptCount, model: result.model });
      return result;

    } catch (error) {
      lastError = error;
      logger.warn('AI attempt failed, retrying', { attempt: attemptCount, maxAttempts, provider: provider.config.name, error: error.message });
      
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
  logger.error('[HybridAI] 💥 All providers exhausted. Last error:', lastError?.message);
  throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get provider status and statistics
 */
function getProviderStatus() {
  const status = {};
  
  Object.keys(PROVIDER_DEFINITIONS).forEach(key => {
    const provider = getProviderConfig(key);
    const tracker = usageTracker[key];
    
    cleanupUsageTracker(key, 'requests');
    cleanupUsageTracker(key, 'tokens');
    
    const tokenCount = tracker.tokens.reduce((sum, t) => sum + t.count, 0);
    
    status[key] = {
      name: provider.name,
      enabled: provider.enabled && !!provider.apiKey,
      available: isProviderAvailable(key, provider),
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

  for (const key of Object.keys(PROVIDER_DEFINITIONS)) {
    const provider = getProviderConfig(key);
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

/**
 * Generate a response using a specific provider (no fallback)
 * Useful for diagnostics and admin testing.
 */
async function generateResponseWithProvider(providerKey, messages, options = {}) {
  const key = providerKey?.toUpperCase();
  const provider = key ? getProviderConfig(key) : null;

  if (!provider) {
    throw new Error(`Provider ${providerKey} is not supported`);
  }

  if (!provider.enabled || !provider.apiKey) {
    throw new Error(`${provider.name} is not configured or disabled`);
  }

  return callProvider(key, provider, messages, options);
}

/**
 * Generate a chat response with full context management (System Prompt, History, Knowledge)
 * @param {string} message - User message
 * @param {Object} business - Business context (name, tone, etc.)
 * @param {Array} history - Conversation history
 * @param {Array} knowledgeBase - Relevant knowledge chunks
 */
async function generateChatResponse(message, business, history = [], knowledgeBase = []) {
  // 1. Construct System Prompt
  let systemPrompt = `You are the AI assistant for ${business.name}. `;
  
  if (business.activityType) {
    systemPrompt += `This is a ${business.activityType} business. `;
  }
  
  if (business.botTone) {
    systemPrompt += `Your tone should be ${business.botTone}. `;
  }
  
  systemPrompt += `\n\nIMPORTANT: You represent ${business.name}. Never identify as an AI model (like DeepSeek, Llama, or Gemini). If asked who you are, say you are the virtual assistant for ${business.name}.`;
  
  // Add Knowledge Base Context
  if (knowledgeBase && knowledgeBase.length > 0) {
    systemPrompt += `\n\nUse the following knowledge base to answer the user's question. If the answer is not in the knowledge base, use your general knowledge but be polite and helpful.\n\nKnowledge Base:\n`;
    knowledgeBase.forEach((chunk, index) => {
      systemPrompt += `${index + 1}. ${chunk.content}\n`;
    });
  }

  // 2. Construct Messages Array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];

  // 3. Call Hybrid AI
  const result = await generateResponse(messages);
  
  return result;
}

module.exports = {
  generateChatResponse,
  generateResponse,
  generateResponseWithProvider,
  getProviderStatus,
  getProviderStats,
  checkProvidersHealth,
  healthCheck,
  resetProviderState,
  getProviders,
  getProviderConfig,
  PROVIDER_DEFINITIONS
};
