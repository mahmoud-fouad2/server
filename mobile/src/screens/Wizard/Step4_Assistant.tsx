import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function Step4({ onNext, onBack }: any) {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Step 4: تخصيص المساعد</Text>
      <TextInput placeholder="Assistant Name" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="Language" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="Tone" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <Button title="السابق" onPress={onBack} />
      <Button title="التالي" onPress={onNext} />
    </View>
  );
}
