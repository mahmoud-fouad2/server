import client from './apiClient';
import { getToken, removeToken } from './secureStorage';

export async function getProfile() {
  try {
    const res = await client.get('/api/auth/profile');
    return res.data;
  } catch (e: any) {
    return { error: e?.response?.data || e.message };
  }
}

export async function updateProfile(data: any) {
  try {
    const res = await client.put('/api/auth/profile', data);
    return res.data;
  } catch (e: any) {
    return { error: e?.response?.data || e.message };
  }
}

export async function logout() {
  try {
    await removeToken();
    return { success: true };
  } catch (e) {
    return { error: String(e) };
  }
}
