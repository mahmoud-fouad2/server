import client from './apiClient';
import { saveToken } from './secureStorage';

export async function register({ name, email, password, businessName, activityType }: any) {
  try {
    const payload = { name, email, password, businessName, activityType };
    const res = await client.post('/api/auth/register', payload);
    const token = res.data?.token;
    if (token) saveToken(token);
    return res.data;
  } catch (error: any) {
    return { error: error.response?.data || error.message };
  }
}
