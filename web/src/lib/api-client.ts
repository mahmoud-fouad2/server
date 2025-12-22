import { LoginInput, RegisterInput } from '@fahimo/shared/dist/auth.dto';

// --- Configuration & Helpers ---

function normalizeApiBaseUrl(value: string) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');
}

const API_BASE = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com');
const API_URL = `${API_BASE}/api`;

function normalizeEndpoint(endpoint: string) {
  const raw = String(endpoint || '').trim();
  if (!raw) return '/';
  let e = raw;
  if (e.startsWith('http://') || e.startsWith('https://')) {
    return e;
  }
  e = e.replace(/^\/+/, '');
  if (e.toLowerCase().startsWith('api/')) {
    e = e.slice(4);
  }
  return `/${e}`;
}

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function fetchAPI<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const {
    retries = 1, // Reduced default retries for faster feedback
    retryDelay = 1000,
    timeout = 30000,
    params,
    ...customConfig
  } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Get business ID from user object in localStorage
  let businessId = null;
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        const user = JSON.parse(userStr);
        businessId = user.currentBusinessId || user.businessId || (user.businesses && user.businesses[0]?.id);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  // Allow an explicit public widget business id injected at build time
  const PUBLIC_WIDGET_BUSINESS_ID = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID : undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    // Prefer stored user's businessId, otherwise fall back to a PUBLIC widget business id
    ...((businessId || PUBLIC_WIDGET_BUSINESS_ID) ? { 'x-business-id': businessId || PUBLIC_WIDGET_BUSINESS_ID } : {}),
    ...(customConfig.headers as Record<string, string>),
  };

  // Handle FormData
  if (customConfig.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Construct URL with query params
  const normalized = normalizeEndpoint(endpoint);
  let url = normalized.startsWith('http') ? normalized : `${API_URL}${normalized}`;
  
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== undefined && val !== null) acc[key] = String(val);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...customConfig,
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutHandle));

      // Handle 401/403 - Unauthorized
      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => null);
        
        // Check for specific "Invalid token" error which implies session expiry
        const isTokenInvalid = response.status === 403 && data && 
          ((data.error === 'Invalid token') || (data.message === 'Invalid token'));

        if (response.status === 401 || isTokenInvalid) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
               window.location.href = '/login?reason=session_expired';
            }
          }
          throw new Error('Unauthorized');
        }
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => null);
        if (response.ok) return { raw: text } as unknown as T; // Return raw text for non-JSON success
        data = { message: text || 'Server returned a non-JSON response' };
      }

      if (!response.ok) {
        const errorMessage = (data as Record<string, unknown>)?.error || (data as Record<string, unknown>)?.message || 'API Request Failed';
        const err = new Error(errorMessage as string) as Error & { status?: number; data?: unknown };
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data as T;

    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      lastError = err;
      if (attempt === retries) break;
      
      // Don't retry on 4xx errors (except 429)
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }

      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// --- API Definitions ---

export const api = {
  auth: {
    login: (data: LoginInput) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: RegisterInput) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchAPI('/auth/me'),
    profile: () => fetchAPI('/auth/profile'),
    updateProfile: (data: Record<string, unknown>) => fetchAPI('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data: Record<string, unknown>) => fetchAPI('/auth/password', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (email: string) => fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (data: Record<string, unknown>) => fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  },
  business: {
    get: () => fetchAPI('/business/'),
    update: (data: Record<string, unknown>) => fetchAPI('/business/', { method: 'PATCH', body: JSON.stringify(data) }),
    clearCache: () => fetchAPI('/business/cache/invalidate', { method: 'POST' }),
    stats: () => fetchAPI('/business/stats'),
    settings: () => fetchAPI('/business/settings'),
    updateSettings: (data: Record<string, unknown>) => fetchAPI('/business/settings', { method: 'PUT', body: JSON.stringify(data) }),
    updatePlan: (data: Record<string, unknown>) => fetchAPI('/business/plan', { method: 'PUT', body: JSON.stringify(data) }),
    integrations: () => fetchAPI('/business/integrations'),
    chartData: () => fetchAPI('/business/chart-data'),
    conversations: (params?: Record<string, string | number | boolean>) => fetchAPI('/business/conversations', { params }),
    updatePreChatSettings: (data: Record<string, unknown>) => fetchAPI('/business/pre-chat-settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  widget: {
    getConfig: (businessId?: string) => {
        if (businessId) return fetchAPI(`/widget/config/${businessId}`);
        return fetchAPI('/widget/config');
    },
    updateConfig: (data: Record<string, unknown>) => fetchAPI('/widget/config', { method: 'PATCH', body: JSON.stringify(data) }),
    uploadIcon: async (formData: FormData) => {
        return fetchAPI('/uploads', { method: 'POST', body: formData });
    }
  },
  knowledge: {
    list: async () => {
      const response: any = await fetchAPI('/knowledge');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.entries)) return response.entries;
      return [];
    },
    create: (data: Record<string, unknown>) => fetchAPI('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/knowledge/${id}`, { method: 'DELETE' }),
    update: (id: string, data: Record<string, unknown>) => fetchAPI(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    reindex: (opts?: Record<string, unknown>) => fetchAPI('/knowledge/reindex', { method: 'POST', body: JSON.stringify(opts) }),
    addText: (data: Record<string, unknown>) => fetchAPI('/knowledge/text', { method: 'POST', body: JSON.stringify(data) }),
    addUrl: (data: Record<string, unknown>) => fetchAPI('/knowledge/url', { method: 'POST', body: JSON.stringify(data) }),
    upload: (formData: FormData) => fetchAPI('/knowledge/upload', { method: 'POST', body: formData }),
  },
  chat: {
    conversations: (params?: Record<string, string | number | boolean>) => fetchAPI('/chat/conversations', { params }),
    messages: (conversationId: string) => fetchAPI(`/chat/messages/${conversationId}`),
    send: (data: Record<string, unknown>) => fetchAPI('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
    reply: (conversationId: string, message: string) => fetchAPI('/chat/reply', { method: 'POST', body: JSON.stringify({ conversationId, message }) }),
    handoverRequests: (status?: string) => fetchAPI('/chat/handover-requests', { params: { status } }),
    acceptHandover: (id: string) => fetchAPI(`/chat/handover/${id}/accept`, { method: 'POST' }),
    markRead: (conversationId: string) => fetchAPI(`/chat/${conversationId}/mark-read`, { method: 'POST' }),
    demoChat: (message: string) => fetchAPI('/chat/demo', { method: 'POST', body: JSON.stringify({ message }) }),
  },
  crm: {
    getLeads: (params?: Record<string, string | number | boolean>) => fetchAPI('/crm/leads', { params }),
    createLead: (data: Record<string, unknown>) => fetchAPI('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
    updateLead: (id: string, data: Record<string, unknown>) => fetchAPI(`/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteLead: (id: string) => fetchAPI(`/crm/leads/${id}`, { method: 'DELETE' }),
    exportLeads: (params?: Record<string, string | number | boolean>) => fetchAPI('/crm/export', { params }), // Note: might need blob handling
    toggleCrm: (enabled: boolean) => fetchAPI('/crm/toggle', { method: 'POST', body: JSON.stringify({ enabled }) }),
    getCrmStatus: () => fetchAPI('/crm/status'),
  },
  notifications: {
    list: () => fetchAPI('/notifications'),
    markRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
    getUnreadCounts: () => fetchAPI('/notifications/unread-count'),
    markAllRead: () => fetchAPI('/notifications/mark-all-read', { method: 'POST' }),
  },
  payment: {
    list: (params?: Record<string, string | number | boolean>) => fetchAPI('/payments', { params }),
    createIntent: (data: Record<string, unknown>) => fetchAPI('/payments/intent', { method: 'POST', body: JSON.stringify(data) }),
    getGateways: () => fetchAPI('/payments/gateways'),
    createPayment: (data: Record<string, unknown>) => fetchAPI('/payments/create', { method: 'POST', body: JSON.stringify(data) }),
    getPayment: (id: string) => fetchAPI(`/payments/${id}`),
  },
  apiKey: {
    list: () => fetchAPI('/api-keys'),
    create: (data: Record<string, unknown>) => fetchAPI('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api-keys/${id}`, { method: 'DELETE' }),
  },
  ai: {
    getModels: () => fetchAPI('/ai/models'),
    createModel: (data: Record<string, unknown>) => fetchAPI('/ai/models', { method: 'POST', body: JSON.stringify(data) }),
  },
  ticket: {
    list: () => fetchAPI('/tickets'),
    create: (data: Record<string, unknown>) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchAPI(`/tickets/${id}`),
    reply: (id: string, message: string) => fetchAPI(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
    updateStatus: (id: string, status: string) => fetchAPI(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    markRead: (id: string) => fetchAPI(`/tickets/${id}/mark-read`, { method: 'POST' }),
  },
  team: {
    list: () => fetchAPI('/team'),
    add: (data: Record<string, unknown>) => fetchAPI('/team', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/team/${id}`, { method: 'DELETE' }),
  },
  integration: {
    list: () => fetchAPI('/integrations'),
    updateTelegram: (botToken: string) => fetchAPI('/integrations/telegram', { method: 'POST', body: JSON.stringify({ botToken }) }),
    updateWhatsApp: (data: Record<string, unknown>) => fetchAPI('/integrations/whatsapp', { method: 'POST', body: JSON.stringify(data) }),
    remove: (type: string) => fetchAPI(`/integrations/${type}`, { method: 'DELETE' }),
  },
  visitor: {
    createSession: (data: Record<string, unknown>) => fetchAPI('/visitor/session', { method: 'POST', body: JSON.stringify(data) }),
    trackPage: (sessionId: string) => fetchAPI('/visitor/track', { method: 'POST', body: JSON.stringify({ sessionId }) }),
    getActiveSessions: () => fetchAPI('/visitor/active-sessions'),
    getAnalytics: (params?: Record<string, string | number | boolean>) => fetchAPI('/visitor/analytics', { params }),
  },
  improvement: {
    getGaps: (limit = 20, offset = 0) => fetchAPI(`/improvement/gaps?limit=${limit}&offset=${offset}`),
    getSuggestions: () => fetchAPI('/improvement/suggestions'),
  },
  customAIModel: {
    list: () => fetchAPI('/custom-ai-models'),
    create: (data: Record<string, unknown>) => fetchAPI('/custom-ai-models', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/custom-ai-models/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    getDashboard: (days?: number) => fetchAPI(days ? `/analytics/dashboard/${days}` : '/analytics/dashboard'),
    getRealtime: () => fetchAPI('/analytics/realtime'),
    getVectorStats: () => fetchAPI('/analytics/vector-stats'),
    getAlerts: () => fetchAPI('/analytics/alerts'),
    getRatingStats: () => fetchAPI('/rating/stats'),
  },
  admin: {
    getStats: () => fetchAPI('/admin/stats'),
    getUsers: () => fetchAPI('/admin/users'),
    getBusinesses: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/businesses', { params }),
    getBusiness: (id: string) => fetchAPI(`/admin/businesses/${id}`),
    updateBusiness: (id: string, data: Record<string, unknown>) => fetchAPI(`/admin/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBusiness: (id: string) => fetchAPI(`/admin/businesses/${id}`, { method: 'DELETE' }),
    activateBusiness: (id: string) => fetchAPI(`/admin/businesses/${id}/activate`, { method: 'POST' }),
    getAuditLogs: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/audit-logs', { params }),
    getIntegrations: () => fetchAPI('/admin/integrations'),
    getMedia: () => fetchAPI('/admin/media'),
    getPayments: () => fetchAPI('/admin/payments'),
    getSEO: () => fetchAPI('/admin/seo'),
    getSystemSettings: () => fetchAPI('/admin/system/settings'),
    updateSystemSetting: (key: string, value: unknown, description?: string) => fetchAPI(`/admin/system/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value, description }) }),
    getAIModels: () => fetchAPI('/admin/ai-models'),
    addAIModel: (data: Record<string, unknown>) => fetchAPI('/admin/ai-models', { method: 'POST', body: JSON.stringify(data) }),
    deleteAIModel: (id: string) => fetchAPI(`/admin/ai-models/${id}`, { method: 'DELETE' }),
    toggleAIModel: (id: string) => fetchAPI(`/admin/ai-models/${id}/toggle`, { method: 'PUT' }),
    getLogs: () => fetchAPI('/admin/logs'),
    getAllTickets: () => fetchAPI('/tickets/all'),
    updateBusinessPlan: (businessId: string, planType: string) => fetchAPI(`/admin/business/${businessId}/plan`, { method: 'PUT', body: JSON.stringify({ planType }) }),
    getMonitoring: () => fetchAPI('/admin/monitoring'),
    getInvoices: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/payments/invoices', { params }),
    getInvoice: (id: string) => fetchAPI(`/admin/payments/invoices/${id}`),
    getSubscriptions: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/payments/subscriptions', { params }),
    getPaymentGateways: () => fetchAPI('/admin/payments/gateways'),
    updatePaymentGateway: (id: string, data: Record<string, unknown>) => fetchAPI(`/admin/payments/gateways/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    createCustomPayment: (data: Record<string, unknown>) => fetchAPI('/admin/payments/create-custom', { method: 'POST', body: JSON.stringify(data) }),
    getAnalyticsOverview: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/stats', { params }),
    getAnalyticsByCountry: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/analytics/by-country', { params }),
    getCrmBusinesses: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/crm/businesses', { params }),
    toggleBusinessCrm: (id: string, enabled: boolean) => fetchAPI(`/admin/crm/businesses/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    toggleBusinessPreChat: (id: string, enabled: boolean) => fetchAPI(`/admin/crm/businesses/${id}/pre-chat`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    getAdminCrmLeads: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/crm/leads', { params }),
    getAdminCrmLeadById: (id: string) => fetchAPI(`/admin/crm/leads/${id}`),
    deleteAdminCrmLead: (id: string) => fetchAPI(`/admin/crm/leads/${id}`, { method: 'DELETE' }),
    bulkUpdateCrmLeads: (payload: unknown) => fetchAPI('/crm/leads/bulk-update', { method: 'POST', body: JSON.stringify(payload) }),
    getAdminCrmStats: (params?: Record<string, string | number | boolean>) => fetchAPI('/admin/crm/stats', { params }),
    getKnowledgeList: (params?: Record<string, string | number | boolean>) => fetchAPI('/knowledge', { params }),
    getKnowledgeStats: () => fetchAPI('/knowledge/stats'),
    deleteKnowledge: (id: string) => fetchAPI(`/knowledge/${id}`, { method: 'DELETE' }),
    deleteMedia: (url: string) => fetchAPI('/admin/media', { method: 'DELETE', body: JSON.stringify({ url }) }),
  }
};

// Legacy alias helper so older dashboard code keeps working even if the canonical
// method names changed (e.g. conversations() vs getConversations()).
type ApiMethod = (...args: unknown[]) => unknown;
type ApiSection = Record<string, ApiMethod>;

const ensureAlias = (section: ApiSection | undefined, alias: string, target: string) => {
  if (!section || section[alias]) return;
  const targetFn = section[target];
  if (typeof targetFn === 'function') {
    section[alias] = (...args: unknown[]) => targetFn(...args);
  }
};

ensureAlias(api.auth as ApiSection, 'getProfile', 'profile');

ensureAlias(api.business as ApiSection, 'getSettings', 'settings');
ensureAlias(api.business as ApiSection, 'getIntegrations', 'integrations');
ensureAlias(api.business as ApiSection, 'getConversations', 'conversations');

ensureAlias(api.chat as ApiSection, 'getConversations', 'conversations');
ensureAlias(api.chat as ApiSection, 'getMessages', 'messages');
ensureAlias(api.chat as ApiSection, 'getHandoverRequests', 'handoverRequests');

ensureAlias(api.integration as ApiSection, 'setup', 'updateTelegram');

// Export individual namespaces for backward compatibility if needed
export const authApi = api.auth;
export const businessApi = api.business;
export const widgetApi = api.widget;
export const knowledgeApi = api.knowledge;
export const chatApi = api.chat;
export const crmApi = api.crm;
export const notificationsApi = api.notifications;
export const paymentApi = api.payment;
export const apiKeyApi = api.apiKey;
export const aiApi = api.ai;
export const ticketApi = api.ticket;
export const teamApi = api.team;
export const integrationApi = api.integration;
export const visitorApi = api.visitor;
export const improvementApi = api.improvement;
export const customAIModelApi = api.customAIModel;
export const analyticsApi = api.analytics;
export const adminApi = api.admin;

export const apiCall = fetchAPI;

export default api;
