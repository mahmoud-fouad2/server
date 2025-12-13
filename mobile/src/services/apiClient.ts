import axios from 'axios';
import Constants from 'expo-constants';
import { API_URL } from '../constants';
import { getToken } from './secureStorage';

// Use centralized API_URL - can be configured via `app.json` extra/API_URL or via env
const BASE_URL = API_URL || 'http://localhost:3002';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptors for token adding can be added here
client.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // no-op
  }
  return config;
});

export default client;
