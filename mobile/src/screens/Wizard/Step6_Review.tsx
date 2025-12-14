import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step6({ onboarding, setOnboarding, onBack, navigation }: any) {
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async () => {
    setSubmitting(true);
    const res = await saveOnboarding(onboarding || {});
    setSubmitting(false);
    if (res && !res.error) {
      Alert.alert('تم', 'اكتمل الإعداد');
      // If selected plan is not free, route to subscription checkout
      const plan = onboarding?.plan || 'free';
      if (plan && plan !== 'free') {
        navigation.navigate('SubscriptionCheckout', { plan });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Conversations' } as any] });
      }
    } else {
      Alert.alert('خطأ', res?.error || 'فشل الحفظ');
    }
  };

  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>الملخص & إنهاء</Text>
      <Text style={{ marginVertical: 12 }}>تأكيد البيانات وإنهاء إنشاء الحساب</Text>
      <TouchableOpacity onPress={handleFinish} disabled={submitting} style={{ backgroundColor: '#6D28D9', padding: 12, borderRadius: 8, marginBottom: 8 }}>
        <Text style={{ color: '#fff' }}>{submitting ? 'جاري الحفظ...' : 'إنهاء'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={{ padding: 12 }}>
        <Text>السابق</Text>
      </TouchableOpacity>
    </View>
  );
}
