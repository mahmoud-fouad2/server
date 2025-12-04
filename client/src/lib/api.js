import { API_CONFIG } from './config';

/**
 * Generic API client for making HTTP requests
 * Automatically handles:
 * - Base URL
 * - Authorization headers
 * - JSON parsing
 * - Error handling
 * - Retry logic with exponential backoff
 */
export const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {}, retries = 3, retryDelay = 1000, ...customConfig } = options;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
    ...customConfig,
  };

  if (body) {
    // If body is FormData, let the browser set Content-Type (multipart/form-data)
    if (body instanceof FormData) {
      delete config.headers['Content-Type'];
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  // Ensure endpoint starts with / if not provided (though getApiUrl handles it, we want to be safe)
  // But wait, we should use the full URL construction logic here or in config.
  // Let's use the config logic.
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - Redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          // Optional: Clear token?
          // localStorage.removeItem('token');
          // window.location.href = '/login'; 
          // Better to let the caller handle redirect or use a global event
        }
      }

      const data = await response.json().catch(() => ({})); // Handle empty responses gracefully

      if (!response.ok) {
        // Don't retry on 4xx client errors (except 429 Too Many Requests)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(data.error || data.message || 'Something went wrong');
        }
        
        // Retry on 5xx server errors or 429
        throw new Error(data.error || data.message || 'Server error');
      }

      return data;
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        console.error(`API Error (${endpoint}) after ${retries + 1} attempts:`, error);
        throw error;
      }
      
      // Calculate exponential backoff: retryDelay * 2^attempt
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(`API call failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const authApi = {
  login: (credentials) => apiCall('/api/auth/login', { method: 'POST', body: credentials }),
  register: (data) => apiCall('/api/auth/register', { method: 'POST', body: data }),
  getProfile: () => apiCall('/api/auth/profile'),
  updateProfile: (data) => apiCall('/api/auth/profile', { method: 'PUT', body: data }),
  forgotPassword: (email) => apiCall('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (data) => apiCall('/api/auth/reset-password', { method: 'POST', body: data }),
};

export const businessApi = {
  getStats: () => apiCall('/api/business/stats'),
  getSettings: () => apiCall('/api/business/settings'),
  updateSettings: (data) => apiCall('/api/business/settings', { method: 'PUT', body: data }),
  getIntegrations: () => apiCall('/api/business/integrations'),
  getChartData: () => apiCall('/api/business/chart-data'),
  getConversations: () => apiCall('/api/business/conversations'),
};

export const contactApi = {
  send: (data) => apiCall('/api/contact', { method: 'POST', body: data }),
};

export const adminApi = {
  getStats: () => apiCall('/api/admin/stats'),
  getUsers: () => apiCall('/api/admin/users'),
  getSettings: () => apiCall('/api/admin/settings'),
  updateSettings: (data) => apiCall('/api/admin/settings', { method: 'PUT', body: data }),
  getAIModels: () => apiCall('/api/admin/ai-models'),
  addAIModel: (data) => apiCall('/api/admin/ai-models', { method: 'POST', body: data }),
  deleteAIModel: (id) => apiCall(`/api/admin/ai-models/${id}`, { method: 'DELETE' }),
  toggleAIModel: (id) => apiCall(`/api/admin/ai-models/${id}/toggle`, { method: 'PUT' }),
  getLogs: () => apiCall('/api/admin/logs'),
  getAllTickets: () => apiCall('/api/tickets/all'),
  updateBusinessPlan: (businessId, planType) => apiCall(`/api/admin/business/${businessId}/plan`, { method: 'PUT', body: { planType } }),
};

export const widgetApi = {
  getConfig: (businessId) => {
    // This one might be public, so we might need to handle auth differently if needed, 
    // but apiCall handles token if present.
    // If businessId is provided, it's likely the public endpoint.
    if (businessId) return apiCall(`/api/widget/config/${businessId}`);
    return apiCall('/api/widget/config');
  },
  updateConfig: (data) => apiCall('/api/widget/config', { method: 'POST', body: data }),
  uploadIcon: (formData) => apiCall('/api/widget/upload-icon', { method: 'POST', body: formData }),
};

export const knowledgeApi = {
  list: () => apiCall('/api/knowledge'),
  upload: (formData) => apiCall('/api/knowledge/upload', { method: 'POST', body: formData }),
  addText: (data) => apiCall('/api/knowledge/text', { method: 'POST', body: data }),
  addUrl: (data) => apiCall('/api/knowledge/url', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/api/knowledge/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiCall(`/api/knowledge/${id}`, { method: 'DELETE' }),
};

export const ticketApi = {
  list: () => apiCall('/api/tickets/my-tickets'),
  create: (data) => apiCall('/api/tickets', { method: 'POST', body: data }),
  get: (id) => apiCall(`/api/tickets/${id}`),
  reply: (id, message) => apiCall(`/api/tickets/${id}/reply`, { method: 'POST', body: { message } }),
  updateStatus: (id, status) => apiCall(`/api/tickets/${id}/status`, { method: 'PUT', body: { status } }),
};

export const chatApi = {
  getConversations: () => apiCall('/api/chat/conversations'),
  getMessages: (id) => apiCall(`/api/chat/${id}/messages`),
  reply: (conversationId, message) => apiCall('/api/chat/reply', { method: 'POST', body: { conversationId, message } }),
  getHandoverRequests: () => apiCall('/api/chat/handover-requests'),
  sendMessage: (data) => apiCall('/api/chat/message', { method: 'POST', body: data }),
  demoChat: (message) => apiCall('/api/chat/demo', { method: 'POST', body: { message } }),
};

export const teamApi = {
  list: () => apiCall('/api/team'),
  add: (data) => apiCall('/api/team', { method: 'POST', body: data }),
  delete: (id) => apiCall(`/api/team/${id}`, { method: 'DELETE' }),
};

export const telegramApi = {
  setup: (token) => apiCall('/api/telegram/setup', { method: 'POST', body: { token } }),
};
