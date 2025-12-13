import client from './apiClient';
import { saveToken } from './secureStorage';
import Constants from 'expo-constants';

export async function login(email: string, password: string) {
  try {
    // Demo login shortcut
    if (email === 'demo' && password === 'demo') {
      const demoEmail = (Constants as any)?.manifest?.extra?.DEMO_USER_EMAIL || process.env.DEMO_USER_EMAIL || 'hello@faheemly.com';
      const demoPassword = (Constants as any)?.manifest?.extra?.DEMO_USER_PASSWORD || process.env.DEMO_USER_PASSWORD || 'demo';
      const res = await client.post('/api/auth/demo-login', { email: demoEmail, password: demoPassword });
      const token = res.data?.token;
      if (token) saveToken(token);
      return res.data;
    }

    const res = await client.post('/api/auth/login', { email, password });
    // TODO: store JWT in secure storage
    const token = res.data?.token;
    if (token) saveToken(token);
    return res.data;
  } catch (error: any) {
    return { error: error.response?.data || error.message };
  }
}
