import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { getConversations } from '../services/chatService';

export default function ConversationsScreen({ navigation }: any) {
  const [convos, setConvos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getConversations(1, 50);
      if (res && res.data) {
        setConvos(res.data);
      }
    })();
  }, []);

  const renderItem = ({ item }: any) => {
    const lastMsg = item.messages?.[0]?.content || 'بدء محادثة جديدة';
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Chat', { conversationId: item.id })} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name || item.business?.name || 'Conversation'}</Text>
        <Text numberOfLines={1} style={{ color: '#666' }}>{lastMsg}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList data={convos} renderItem={renderItem} keyExtractor={(i:any) => i.id} />
    </View>
  );
}
