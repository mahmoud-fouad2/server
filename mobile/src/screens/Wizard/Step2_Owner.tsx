import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step2({ onboarding, setOnboarding, onNext, onBack }: any) {
  const [ownerName, setOwnerName] = useState(onboarding?.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(onboarding?.ownerEmail || '');
  const [phone, setPhone] = useState(onboarding?.phone || '');

  useEffect(() => {
    setOwnerName(onboarding?.ownerName || '');
    setOwnerEmail(onboarding?.ownerEmail || '');
    setPhone(onboarding?.phone || '');
  }, [onboarding]);

  const handleNext = async () => {
    const newData = { ...onboarding, ownerName, ownerEmail, phone };
    setOnboarding(newData);
    await saveOnboarding(newData);
    onNext();
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>معلومات المالك</Text>
      <TextInput placeholder="الاسم الكامل" value={ownerName} onChangeText={setOwnerName} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="البريد الإلكتروني" value={ownerEmail} onChangeText={setOwnerEmail} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="رقم الهاتف" value={phone} onChangeText={setPhone} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 12 }}><Text>السابق</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={{ backgroundColor:'#6D28D9', padding:12, borderRadius:8 }}><Text style={{ color:'#fff' }}>التالي</Text></TouchableOpacity>
      </View>
    </View>
  );
}
