import client from './apiClient';

export async function saveOnboarding(data: any) {
  try {
    const res = await client.post('/api/onboarding', { data });
    return res.data;
  } catch (e: any) {
    return { error: e.response?.data || e.message };
  }
}

export async function getOnboarding() {
  try {
    const res = await client.get('/api/onboarding');
    return res.data;
  } catch (e: any) {
    return { error: e.response?.data || e.message };
  }
}
