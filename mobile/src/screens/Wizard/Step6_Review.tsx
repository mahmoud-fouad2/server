import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Step6({ onBack }: any) {
  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>الملخص & إنهاء</Text>
      <Text style={{ marginVertical: 12 }}>تأكيد البيانات وإنهاء إنشاء الحساب</Text>
      <Button title="إنهاء" onPress={() => { /* Redirect to chat or dashboard */ }} />
      <Button title="السابق" onPress={onBack} />
    </View>
  );
}
