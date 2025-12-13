import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function Step2({ onNext, onBack }: any) {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Step 2: بيانات المالك</Text>
      <TextInput placeholder="Full Name" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="Email" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="Phone" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <Button title="السابق" onPress={onBack} />
      <Button title="التالي" onPress={onNext} />
    </View>
  );
}
