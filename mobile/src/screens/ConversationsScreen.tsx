
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { getConversations } from '../services/chatService';
import { getProfile } from '../services/profileService';
import BottomNav from '../../components/BottomNav';
import { useNavigation } from '@react-navigation/native';

export default function ConversationsScreen({ navigation }: any) {
  const [convos, setConvos] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<string>('مجاني');
  const [tab, setTab] = useState('home');
  const nav = navigation || useNavigation();

  useEffect(() => {
    (async () => {
      // Use mock data if API unavailable
      try {
        const [pRes, cRes] = await Promise.all([getProfile(), getConversations(1, 50)]);
        if (pRes && !pRes.error) setSubscription(pRes.user?.subscription || pRes.subscription || 'مجاني');
        if (cRes && cRes.data) setConvos(cRes.data);
      } catch (e) {
        setConvos([
          { id: 'conv-1', name: 'Welcome', lastMessage: 'مرحباً! ابدأ محادثة جديدة الآن', unread: 0 },
          { id: 'conv-2', name: 'Billing', lastMessage: 'اشترك في الخطة Pro للحصول على 1000 رسالة', unread: 2 },
        ]);
      }
    })();
  }, []);

  const renderItem = ({ item }: any) => {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Chat', { conversationId: item.id })} style={{ padding: 14, marginVertical: 6, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../../assets/logo2.png')} style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
            <Text numberOfLines={1} style={{ color: '#6B7280' }}>{item.lastMessage || item.last_message || 'بدء محادثة جديدة'}</Text>
          </View>
          {item.unread ? <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: '#fff' }}>{item.unread}</Text></View> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F8FAFC', paddingBottom: 72 }}>
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800' }}>مرحباً بك!</Text>
          <Text style={{ color: '#6B7280', marginTop: 4 }}>هذا مركز محادثاتك — ابدأ محادثة جديدة أو تابع المحادثات السابقة.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)} style={{ alignItems: 'center' }}>
          <Image source={require('../../assets/logo2.png')} style={{ width: 44, height: 44, borderRadius: 10 }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Subscription' as any)} style={{ padding: 12, borderRadius: 12, backgroundColor: '#EEF2FF', marginBottom: 12 }}>
        <Text style={{ color: '#3730A3', fontWeight: '700' }}>أنت على الخطة: {subscription} · ترقي الآن</Text>
        <Text style={{ color: '#6B7280', marginTop: 4 }}>احصل على مزايا متقدمة وكمية رسائل أكبر.</Text>
      </TouchableOpacity>

      <FlatList data={convos} renderItem={renderItem} keyExtractor={(i:any) => i.id} />

      <TouchableOpacity onPress={() => navigation.navigate('Chat' as any)} style={{ position: 'absolute', right: 20, bottom: 30, backgroundColor: '#6D28D9', paddingHorizontal: 16, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, elevation: 6 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>بدء المحادثة</Text>
      </TouchableOpacity>
      <BottomNav
        current={tab}
        onTab={key => {
          setTab(key);
          if (key === 'home') return;
          if (key === 'chat') nav.navigate('Chat');
          if (key === 'wizard') nav.navigate('Wizard');
          if (key === 'support') nav.navigate('Support');
          if (key === 'profile') nav.navigate('Profile');
        }}
      />
    </View>
  );
}
