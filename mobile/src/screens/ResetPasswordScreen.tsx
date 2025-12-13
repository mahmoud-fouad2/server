import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import client from '../services/apiClient';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const [token, setToken] = useState(route.params?.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = async () => {
    if (!token || !password) return Alert.alert('خطأ', 'الرجاء إدخال الرمز وكلمة مرور جديدة');
    if (password !== confirmPassword) return Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');

    try {
      const res = await client.post('/api/password/reset-password', { token, newPassword: password });
      Alert.alert('نجاح', res.data?.message || 'تم إعادة تعيين كلمة المرور');
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>إعادة تعيين كلمة المرور</Text>
      <TextInput placeholder="رمز إعادة التعيين" value={token} onChangeText={setToken} style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 12 }} />
      <TextInput placeholder="كلمة المرور الجديدة" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 12 }} />
      <TextInput placeholder="تأكيد كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 12 }} />
      <Button title="إعادة التعيين" onPress={handleReset} />
    </View>
  );
}
