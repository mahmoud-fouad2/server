import { api, fetchAPI } from './api-client';

export const authApi = api.auth;
export const businessApi = api.business;
export const chatApi = api.chat;
export const widgetApi = api.widget;
export const knowledgeApi = api.knowledge;
export const teamApi = api.team;
export const ticketApi = api.ticket;
export const crmApi = api.crm;
export const adminApi = api.admin;
export const notificationsApi = api.notifications;
export const apiKeyApi = api.apiKey;
export const integrationApi = api.integration;
export const telegramApi = api.integration;
export const visitorApi = api.visitor;
export const analyticsApi = api.analytics;

export const apiCall = async (
  endpoint: string,
  options?: Parameters<typeof fetchAPI>[1]
) => {
  return fetchAPI(endpoint, options);
};

export default api;
