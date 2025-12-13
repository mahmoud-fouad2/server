// Adapter to keep legacy routes working while using the unified hybrid AI service
// Prefer requiring ai.service.js directly in new code.

const aiService = require('./ai.service');

// Legacy signature used by routes: messages array + options
async function generateResponse(messages, options = {}) {
  return aiService.generateResponse(messages, options);
}

// Legacy signature used by Telegram/Twilio/Widget routes
// message: string, business: object, history: [{role,content}], knowledgeBase: array, conversationId: string
// Now uses the unified generateChatResponse for consistency
async function generateChatResponse(message, business, history = [], knowledgeBase = [], conversationId = null) {
  // Use the unified generateChatResponse method for consistency across all channels
  const result = await aiService.generateChatResponse(message, business, history, knowledgeBase, conversationId);

  return {
    response: result.response,
    tokensUsed: result.tokensUsed,
    model: result.model,
    provider: result.provider,
    knowledgeUsed: knowledgeBase?.length || 0,
    knowledgeBaseUsed: result.knowledgeBaseUsed,
    knowledgeBaseCount: result.knowledgeBaseCount
  };
}

function getProviderStatus() {
  return aiService.getProviderStatus();
}

async function healthCheck() {
  return aiService.healthCheck();
}

module.exports = {
  generateResponse,
  generateChatResponse,
  getProviderStatus,
  healthCheck
};