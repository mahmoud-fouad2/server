import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import client from '../services/apiClient';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleRequest = async () => {
    try {
      const res = await client.post('/api/password/forgot-password', { email });
      Alert.alert('تم', res.data?.message || 'Email sent (if user exists)');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>استعادة كلمة المرور</Text>
      <Text style={{ marginBottom: 8 }}>أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور</Text>
      <TextInput placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 }} />
      <Button title="أرسل" onPress={handleRequest} />
    </View>
  );
}
