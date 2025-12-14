import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { subscribeToPlan } from '../services/subscriptionService';

export default function SubscriptionCheckout({ navigation, route }: any) {
  const { plan } = route.params || { plan: 'free' };
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const res = await subscribeToPlan(plan);
    setLoading(false);
    if (res && !res.error) {
      Alert.alert('تم الاشتراك', `تم تفعيل الخطة ${plan}`);
      // Navigate to Conversations (logged-in area)
      navigation.reset({ index: 0, routes: [{ name: 'Conversations' } as any] });
    } else {
      Alert.alert('خطأ', res?.error || 'فشل الاشتراك');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#fff', writingDirection: 'rtl' }}>
      <BackButton onPress={() => navigation.goBack()} label="رجوع" />
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>الاشتراك - {plan}</Text>
      <Text style={{ color: '#6B7280', marginBottom: 18 }}>ستتم محاكاة الدفع الآن. هذه نسخة اختبارية فقط.</Text>

      <TouchableOpacity onPress={handleConfirm} disabled={loading} style={{ backgroundColor: '#6D28D9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>تأكيد وبدء الاستخدام</Text>}
      </TouchableOpacity>
    </View>
  );
}
