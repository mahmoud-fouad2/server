import Constants from 'expo-constants';

export const API_URL = (Constants.manifest as any)?.extra?.API_URL || process.env.API_URL || 'http://localhost:3002';
export const WEB_URL = (Constants.manifest as any)?.extra?.WEB_URL || process.env.WEB_URL || 'http://localhost:3000';
export const USE_MOCK = Boolean((Constants.manifest as any)?.extra?.USE_MOCK);
export default { API_URL, WEB_URL };
