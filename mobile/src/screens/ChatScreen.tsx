import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { sendMessage, getMessages } from '../services/chatService';
import { getMessagesFromCache, saveMessages } from '../services/messageCache';

export default function ChatScreen({ route }: any) {
  const [messages, setMessages] = useState<Array<{id: string; role: 'user' | 'assistant'; content: string}>>([]);
  const [input, setInput] = useState('');
  const conversationId: string | undefined = route?.params?.conversationId;

  useEffect(() => {
    (async () => {
      if (conversationId) {
        // Try cache first
        const cached = await getMessagesFromCache(conversationId);
        if (cached && cached.length) {
          setMessages(cached.map((m:any) => ({ id: m.id, role: m.role === 'USER' ? 'user' : 'assistant', content: m.content })));
        }
        const resp = await getMessages(conversationId);
        if (resp && resp.data) {
          const formatted = resp.data.map((m:any) => ({ id: m.id, role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }));
          setMessages(formatted);
          await saveMessages(conversationId, formatted);
        }
      } else {
        setMessages([{ id: '1', role: 'assistant', content: 'أهلاً بك! 👋 أنا "فهمي".' }]);
      }
    })();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { id: Date.now().toString(), role: 'user' as const, content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const res = await sendMessage(input, undefined, conversationId);
      const newBotMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: res };
      const updated = [...messages, newBotMessage];
      setMessages(updated);
      if (conversationId) await saveMessages(conversationId, updated);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now()+2).toString(), role: 'assistant', content: 'حدث خطأ، حاول لاحقاً.' }]);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={{ padding: 8, alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', marginVertical: 4, maxWidth: '80%' }}>
      <View style={{ backgroundColor: item.role === 'user' ? '#011841' : '#fff', padding: 10, borderRadius: 10 }}>
        <Text style={{ color: item.role === 'user' ? '#fff' : '#000' }}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f8fb', padding: 12 }}>
      <FlatList data={messages} renderItem={renderItem} keyExtractor={(i)=>i.id} />

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput value={input} onChangeText={setInput} placeholder="اكتب رسالة..." style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 40 }} />
        <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#011841', padding: 10, borderRadius: 40 }}>
          <Text style={{ color: '#fff' }}>إرسال</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
