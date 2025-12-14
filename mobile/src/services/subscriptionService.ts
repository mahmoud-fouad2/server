import client from './apiClient';

export async function subscribeToPlan(plan: string) {
  try {
    const res = await client.post('/api/subscription/subscribe', { plan });
    return res.data;
  } catch (e: any) {
    return { error: e.response?.data || e.message };
  }
}
