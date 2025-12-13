import * as SecureStore from 'expo-secure-store';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync('faheemly_token', token);
}
export async function getToken() {
  return SecureStore.getItemAsync('faheemly_token');
}
export async function removeToken() {
  return SecureStore.deleteItemAsync('faheemly_token');
}
