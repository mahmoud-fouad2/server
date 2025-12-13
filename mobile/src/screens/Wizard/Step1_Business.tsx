import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function Step1({ onNext }: any) {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Step 1: بيانات النشاط</Text>
      <TextInput placeholder="Business Name" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <TextInput placeholder="Activity Type" style={{ borderWidth: 1, padding: 10, marginTop: 8, borderRadius: 8 }} />
      <Button title="التالي" onPress={onNext} />
    </View>
  );
}
