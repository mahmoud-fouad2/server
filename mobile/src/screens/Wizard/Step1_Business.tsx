import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step1({ onboarding, setOnboarding, onNext }: any) {
  const [businessName, setBusinessName] = useState(onboarding?.businessName || '');
  const [website, setWebsite] = useState(onboarding?.website || '');

  useEffect(() => {
    setBusinessName(onboarding?.businessName || '');
    setWebsite(onboarding?.website || '');
  }, [onboarding]);

  const handleNext = async () => {
    const newData = { ...onboarding, businessName, website };
    setOnboarding(newData);
    await saveOnboarding(newData);
    onNext();
  };

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>معلومات النشاط التجاري</Text>
      <TextInput placeholder="اسم النشاط" value={businessName} onChangeText={setBusinessName} style={{ borderWidth:1, padding:12, borderRadius:8, marginBottom:8 }} />
      <TextInput placeholder="الموقع الإلكتروني (اختياري)" value={website} onChangeText={setWebsite} style={{ borderWidth:1, padding:12, borderRadius:8, marginBottom:16 }} />
      <TouchableOpacity onPress={handleNext} style={{ backgroundColor:'#6D28D9', padding:12, borderRadius:8, alignItems:'center' }}>
        <Text style={{ color:'#fff' }}>التالي</Text>
      </TouchableOpacity>
    </View>
  );
}
