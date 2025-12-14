import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

const PLANS = [
  { id: 'free', name: 'مجاني', price: '0$/شهر', features: ['ما يصل إلى 100 رسالة', 'دعم أساسي'] },
  { id: 'pro', name: 'Pro', price: '19$/شهر', features: ['1,000 رسالة شهريًا', 'دعم بريد إلكتروني', 'ميزات متقدمة'] },
  { id: 'business', name: 'Business', price: '99$/شهر', features: ['غير محدود من الرسائل', 'دعم أولي', 'تكاملات متقدمة'] },
];

export default function SubscriptionScreen({ navigation, route }: any) {
  const [selected, setSelected] = useState<string>('free');

  React.useEffect(() => {
    (async () => {
      try {
        const { default: profileService } = await import('../services/profileService');
        const res = await profileService.getProfile();
        if (res && !res.error) {
          setSelected(res.user?.subscription || res.subscription || 'free');
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const renderPlan = ({ item }: any) => {
    const active = item.id === selected;
    return (
      <TouchableOpacity
        onPress={() => setSelected(item.id)}
        style={{
          padding: 18,
          marginVertical: 8,
          borderRadius: 12,
          backgroundColor: active ? '#6D28D9' : '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          elevation: 2,
        }}
      >
        <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '700', fontSize: 18 }}>{item.name}</Text>
        <Text style={{ color: active ? '#EDE9FE' : '#6B7280', marginTop: 6 }}>{item.price}</Text>
        <View style={{ marginTop: 8 }}>
          {item.features.map((f: string, idx: number) => (
            <Text key={idx} style={{ color: active ? '#F3E8FF' : '#6B7280' }}>• {f}</Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#F8FAFC', writingDirection: 'rtl' }}>
      <BackButton onPress={() => navigation.goBack()} label="رجوع" />
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>اختر خطتك</Text>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>ابدأ الآن مع خطة تناسب احتياجاتك. يمكنك الترقية في أي وقت.</Text>

      <FlatList data={PLANS} renderItem={renderPlan} keyExtractor={(i:any) => i.id} />

      <TouchableOpacity onPress={() => navigation.navigate('SubscriptionCheckout', { plan: selected })} style={{ marginTop: 16, backgroundColor: '#6D28D9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>تابع للاشتراك</Text>
      </TouchableOpacity>
    </View>
  );
}
