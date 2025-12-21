import { LoginInput, RegisterInput } from '@fahimo/shared/dist/auth.dto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Get business ID from user object in localStorage
  let businessId = null;
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        businessId = user.currentBusinessId || user.businessId || (user.businesses && user.businesses[0]?.id);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(businessId && { 'x-business-id': businessId }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - Unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API Request Failed');
    }

    // Extract actual data if wrapped in success object
    return data.data || data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  auth: {
    login: (data: LoginInput) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: RegisterInput) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchAPI('/auth/me'),
    profile: () => fetchAPI('/auth/profile'),
    updateProfile: (data: any) => fetchAPI('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  business: {
    get: () => fetchAPI('/business'),
    update: (data: any) => fetchAPI('/business', { method: 'PATCH', body: JSON.stringify(data) }),
    clearCache: () => fetchAPI('/business/clear-cache', { method: 'POST' }),
  },
  widget: {
    getConfig: (businessId: string) => fetchAPI(`/widget/config/${businessId}`),
    updateConfig: (data: any) => fetchAPI('/widget/config', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  knowledge: {
    list: () => fetchAPI('/knowledge'),
    create: (data: any) => fetchAPI('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/knowledge/${id}`, { method: 'DELETE' }),
    reindex: () => fetchAPI('/knowledge/reindex', { method: 'POST' }),
  },
  chat: {
    conversations: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetchAPI(`/chat/conversations${query}`);
    },
    messages: (conversationId: string) => fetchAPI(`/chat/messages/${conversationId}`),
    send: (data: any) => fetchAPI('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
    handoverRequests: (status?: string) => {
      const query = status ? `?status=${status}` : '';
      return fetchAPI(`/chat/handover-requests${query}`);
    },
    acceptHandover: (id: string) => fetchAPI(`/chat/handover/${id}/accept`, { method: 'POST' }),
  },
  visitor: {
    createSession: (data: any) => fetchAPI('/visitor/session', { method: 'POST', body: JSON.stringify(data) }),
    stats: (businessId: string) => fetchAPI(`/visitor/stats/${businessId}`),
  },
  analytics: {
    dashboard: (days?: number) => {
      const query = days ? `?${days}` : '';
      return fetchAPI(`/analytics/dashboard${query}`);
    },
    realtime: () => fetchAPI('/analytics/realtime'),
  },
  rating: {
    stats: (businessId: string) => fetchAPI(`/rating/stats/${businessId}`),
    submit: (data: any) => fetchAPI('/chat/rate', { method: 'POST', body: JSON.stringify(data) }),
  },
  team: {
    list: () => fetchAPI('/team'),
    create: (data: any) => fetchAPI('/team', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/team/${id}`, { method: 'DELETE' }),
  },
  crm: {
    leads: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetchAPI(`/crm/leads${query}`);
    },
    createLead: (data: any) => fetchAPI('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
    updateLead: (id: string, data: any) => fetchAPI(`/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  tickets: {
    list: () => fetchAPI('/tickets'),
    create: (data: any) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    messages: (ticketId: string) => fetchAPI(`/tickets/${ticketId}/messages`),
    sendMessage: (ticketId: string, message: string) => 
      fetchAPI(`/tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  },
};
