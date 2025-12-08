// Adapter to keep legacy routes working while using the unified hybrid AI service
// Prefer requiring ai.service.js directly in new code.

const aiService = require('./ai.service');

// Legacy signature used by routes: messages array + options
async function generateResponse(messages, options = {}) {
  return aiService.generateResponse(messages, options);
}

// Legacy signature used by Telegram/Twilio/Widget routes
// message: string, business: object, history: [{role,content}], knowledgeBase: array
async function generateChatResponse(message, business, history = [], knowledgeBase = []) {
  const systemPrompt = `You are an AI assistant for ${business?.name || 'the business'}. ` +
    `Use the provided knowledge base when relevant. Respond concisely.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];

  const result = await aiService.generateResponse(messages);

  return {
    response: result.response,
    tokensUsed: result.tokensUsed,
    model: result.model,
    provider: result.provider,
    knowledgeUsed: knowledgeBase?.length || 0
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