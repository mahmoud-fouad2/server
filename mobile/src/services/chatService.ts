import client from './apiClient';
import { USE_MOCK } from '../constants';
import mockApi from '../mock/mockApi';

export async function sendMessage(message: string, businessId?: string, conversationId?: string, sessionId?: string) {
  try {
    const payload: any = { message };
    if (businessId) payload.businessId = businessId;
    if (conversationId) payload.conversationId = conversationId;
    if (sessionId) payload.sessionId = sessionId;
    if (USE_MOCK) {
      return await mockApi.sendMessage(message, businessId, conversationId);
    }

    const res = await client.post('/api/chat/message', payload);
    // Return full response so callers can access conversationId and metadata.
    return res.data;
  } catch (error: any) {
    console.error('Chat sendMessage error:', error?.response?.data || error?.message);
    throw error;
  }
}

export async function getConversations(page = 1, limit = 20) {
  try {
    if (USE_MOCK) return await mockApi.getConversations();
    const res = await client.get(`/api/chat/conversations?page=${page}&limit=${limit}`);
    return res.data;
  } catch (e: any) {
    console.error('getConversations error', e?.response?.data || e.message);
    return { data: [] };
  }
}

export async function getMessages(conversationId: string, limit = 50, cursor?: string) {
  try {
    if (USE_MOCK) return await mockApi.getMessages(conversationId);
    const url = `/api/chat/${conversationId}/messages?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await client.get(url);
    return res.data;
  } catch (e: any) {
    console.error('getMessages error', e?.response?.data || e.message);
    return { data: [] };
  }
}
