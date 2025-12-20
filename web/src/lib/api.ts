const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data;
}

// Alias for internal use if needed, but apiCall is the public one now
const fetchAPI = apiCall;

export const authApi = {
  login: (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => fetchAPI('/auth/me'),
  updateProfile: (data: any) => fetchAPI('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: any) => fetchAPI('/auth/password', { method: 'POST', body: JSON.stringify(data) }),
};

export const businessApi = {
  get: () => fetchAPI('/business'),
  update: (data: any) => fetchAPI('/business', { method: 'PATCH', body: JSON.stringify(data) }),
  getStats: () => fetchAPI('/business/stats'),
};

export const crmApi = {
  getLeads: () => fetchAPI('/crm/leads'),
  createLead: (data: any) => fetchAPI('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) => fetchAPI(`/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: string) => fetchAPI(`/crm/leads/${id}`, { method: 'DELETE' }),
  exportLeads: () => fetchAPI('/crm/export'),
  toggleCrm: (enabled: boolean) => fetchAPI('/crm/toggle', { method: 'POST', body: JSON.stringify({ enabled }) }),
  getCrmStatus: () => fetchAPI('/crm/status'),
};

export const knowledgeApi = {
  list: () => fetchAPI('/knowledge'),
  add: (data: any) => fetchAPI('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/knowledge/${id}`, { method: 'DELETE' }),
  update: (id: string, data: any) => fetchAPI(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reindex: (opts: any) => fetchAPI('/knowledge/reindex', { method: 'POST', body: JSON.stringify(opts) }),
};

export const chatApi = {
  getConversations: () => fetchAPI('/chat/conversations'),
  getMessages: (id: string) => fetchAPI(`/chat/conversations/${id}/messages`),
  sendMessage: (data: any) => fetchAPI('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  reply: (conversationId: string, message: string) => fetchAPI('/chat/reply', { method: 'POST', body: JSON.stringify({ conversationId, message }) }),
  getHandoverRequests: () => fetchAPI('/chat/handover-requests'),
  markRead: (conversationId: string) => fetchAPI(`/chat/${conversationId}/mark-read`, { method: 'POST' }),
  demoChat: (message: string) => fetchAPI('/chat/demo', { method: 'POST', body: JSON.stringify({ message }) }),
};

export const notificationsApi = {
  list: () => fetchAPI('/notifications'),
  markRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
  getUnreadCounts: () => fetchAPI('/notifications/unread-count'),
  markAllRead: () => fetchAPI('/notifications/mark-all-read', { method: 'POST' }),
};

export const paymentApi = {
  list: () => fetchAPI('/payments'),
  createIntent: (data: any) => fetchAPI('/payments/intent', { method: 'POST', body: JSON.stringify(data) }),
  getGateways: () => fetchAPI('/payments/gateways'),
  createPayment: (data: any) => fetchAPI('/payments/create', { method: 'POST', body: JSON.stringify(data) }),
  getPayment: (id: string) => fetchAPI(`/payments/${id}`),
  getPayments: (params: any) => fetchAPI('/payments'), // Simplified
};

export const aiApi = {
  getModels: () => fetchAPI('/ai/models'),
  createModel: (data: any) => fetchAPI('/ai/models', { method: 'POST', body: JSON.stringify(data) }),
};

export const ticketApi = {
  list: () => fetchAPI('/tickets'),
  create: (data: any) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => fetchAPI(`/tickets/${id}`),
  reply: (id: string, message: string) => fetchAPI(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  updateStatus: (id: string, status: string) => fetchAPI(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markRead: (id: string) => fetchAPI(`/tickets/${id}/mark-read`, { method: 'POST' }),
};

export const teamApi = {
  list: () => fetchAPI('/team'),
  add: (data: any) => fetchAPI('/team', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/team/${id}`, { method: 'DELETE' }),
};

export const integrationApi = {
  list: () => fetchAPI('/integrations'),
  updateTelegram: (botToken: string) => fetchAPI('/integrations/telegram', { method: 'POST', body: JSON.stringify({ botToken }) }),
  updateWhatsApp: (data: any) => fetchAPI('/integrations/whatsapp', { method: 'POST', body: JSON.stringify(data) }),
  remove: (type: string) => fetchAPI(`/integrations/${type}`, { method: 'DELETE' }),
};

export const telegramApi = {
  setup: (token: string) => integrationApi.updateTelegram(token),
};

export const visitorApi = {
  createSession: (data: any) => fetchAPI('/visitor/session', { method: 'POST', body: JSON.stringify(data) }),
  trackPage: (sessionId: string) => fetchAPI('/visitor/track', { method: 'POST', body: JSON.stringify({ sessionId }) }),
};

export const improvementApi = {
  getGaps: (limit = 20, offset = 0) => fetchAPI(`/improvement/gaps?limit=${limit}&offset=${offset}`),
  getSuggestions: () => fetchAPI('/improvement/suggestions'),
};

export const customAIModelApi = {
  list: () => fetchAPI('/custom-ai-models'),
  create: (data: any) => fetchAPI('/custom-ai-models', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/custom-ai-models/${id}`, { method: 'DELETE' }),
};

export const widgetApi = {
  getConfig: (businessId: string) => fetchAPI(`/widget/config/${businessId}`),
  updateConfig: (data: any) => fetchAPI('/widget/config', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const adminApi = {
  getStats: () => fetchAPI('/admin/stats'),
  getUsers: () => fetchAPI('/admin/users'),
  getBusinesses: () => fetchAPI('/admin/businesses'),
  getAuditLogs: () => fetchAPI('/admin/audit-logs'),
  getIntegrations: () => fetchAPI('/admin/integrations'),
  getMedia: () => fetchAPI('/admin/media'),
  getPayments: () => fetchAPI('/admin/payments'),
  getSEO: () => fetchAPI('/admin/seo'),
};

// Default export for backward compatibility if needed
export default {
  auth: authApi,
  business: businessApi,
  crm: crmApi,
  knowledge: knowledgeApi,
  chat: chatApi,
  notifications: notificationsApi,
  payment: paymentApi,
  ai: aiApi,
  ticket: ticketApi,
  team: teamApi,
  telegram: telegramApi,
  integration: integrationApi,
  visitor: visitorApi,
  improvement: improvementApi,
  customAIModel: customAIModelApi,
  widget: widgetApi,
  admin: adminApi,
  apiCall
};
