import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { saveOnboarding } from '../../services/onboardingService';

export default function Step5({ onboarding, setOnboarding, onNext, onBack }: any) {
  const [widgetEnabled, setWidgetEnabled] = useState(onboarding?.channels?.widget || false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(onboarding?.channels?.whatsapp || false);

  useEffect(() => {
    setWidgetEnabled(onboarding?.channels?.widget || false);
    setWhatsappEnabled(onboarding?.channels?.whatsapp || false);
  }, [onboarding]);

  const handleNext = async () => {
    const newData = { ...onboarding, channels: { widget: widgetEnabled, whatsapp: whatsappEnabled } };
    setOnboarding(newData);
    await saveOnboarding(newData);
    onNext();
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>دمج القنوات</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ flex: 1 }}>Widget</Text>
        <Switch value={widgetEnabled} onValueChange={setWidgetEnabled} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ flex: 1 }}>Whatsapp (coming soon)</Text>
        <Switch value={whatsappEnabled} onValueChange={setWhatsappEnabled} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 12 }}><Text>السابق</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={{ backgroundColor:'#6D28D9', padding:12, borderRadius:8 }}><Text style={{ color:'#fff' }}>التالي</Text></TouchableOpacity>
      </View>
    </View>
  );
}
