import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step3({ onboarding, setOnboarding, onNext, onBack }: any) {
  const [plan, setPlan] = useState(onboarding?.plan || 'free');

  useEffect(() => { setPlan(onboarding?.plan || 'free'); }, [onboarding]);

  const choose = async (p: string) => {
    setPlan(p);
    const newData = { ...onboarding, plan: p };
    setOnboarding(newData);
    await saveOnboarding(newData);
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>اختر الخطة</Text>
      {['free','pro','business'].map(p => (
        <TouchableOpacity key={p} onPress={() => choose(p)} style={{ marginVertical: 8, padding: 14, borderRadius: 10, backgroundColor: plan===p ? '#6D28D9':'#fff' }}>
          <Text style={{ color: plan===p ? '#fff':'#111' }}>{p.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 12 }}><Text>السابق</Text></TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ backgroundColor:'#6D28D9', padding:12, borderRadius:8 }}><Text style={{ color:'#fff' }}>التالي</Text></TouchableOpacity>
      </View>
    </View>
  );
}
