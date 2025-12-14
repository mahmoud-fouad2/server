import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step4({ onboarding, setOnboarding, onNext, onBack }: any) {
  const [assistantName, setAssistantName] = useState(onboarding?.assistantName || '');
  const [language, setLanguage] = useState(onboarding?.language || '');
  const [tone, setTone] = useState(onboarding?.tone || '');

  useEffect(() => {
    setAssistantName(onboarding?.assistantName || '');
    setLanguage(onboarding?.language || '');
    setTone(onboarding?.tone || '');
  }, [onboarding]);

  const handleNext = async () => {
    const newData = { ...onboarding, assistantName, language, tone };
    setOnboarding(newData);
    await saveOnboarding(newData);
    onNext();
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>تخصيص المساعد</Text>
      <TextInput placeholder="اسم المساعد" value={assistantName} onChangeText={setAssistantName} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="اللغة" value={language} onChangeText={setLanguage} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="نبرة المساعد" value={tone} onChangeText={setTone} style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 12 }}><Text>السابق</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={{ backgroundColor:'#6D28D9', padding:12, borderRadius:8 }}><Text style={{ color:'#fff' }}>التالي</Text></TouchableOpacity>
      </View>
    </View>
  );
}
