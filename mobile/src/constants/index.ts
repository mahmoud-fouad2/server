import Constants from 'expo-constants';

export const API_URL = (Constants.manifest as any)?.extra?.API_URL || process.env.API_URL || 'http://localhost:3002';
export default { API_URL };
