import { LoginInput, RegisterInput } from '@fahimo/shared/dist/auth.dto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
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

export const api = {
  auth: {
    login: (data: LoginInput) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: RegisterInput) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchAPI('/auth/me'),
  },
  business: {
    get: () => fetchAPI('/business'),
    update: (data: any) => fetchAPI('/business', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  widget: {
    getConfig: (businessId: string) => fetchAPI(`/widget/config/${businessId}`),
  }
};
