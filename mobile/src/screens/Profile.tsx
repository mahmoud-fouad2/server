import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Profile({ navigation }: any) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>الحساب</Text>
      <Text style={{ marginVertical: 8 }}>client@faheemly.com</Text>
      <Button title="تسجيل خروج" onPress={() => navigation.navigate('Login' as any)} />
    </View>
  );
}
