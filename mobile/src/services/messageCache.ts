import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVO_PREFIX = 'faheemly_convo_';

export async function saveMessages(conversationId: string, messages: any[]) {
  try {
    await AsyncStorage.setItem(CONVO_PREFIX + conversationId, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save messages', e);
  }
}

export async function getMessagesFromCache(conversationId: string) {
  try {
    const data = await AsyncStorage.getItem(CONVO_PREFIX + conversationId);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to load cached messages', e);
    return null;
  }
}

export async function clearConversationCache(conversationId: string) {
  try {
    await AsyncStorage.removeItem(CONVO_PREFIX + conversationId);
  } catch (e) {
    console.warn('Failed to clear cache', e);
  }
}
