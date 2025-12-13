import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { register } from '../services/registerService';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  const handleRegister = async () => {
    try {
      const res = await register({ name, email, password, businessName });
      if (res?.token) {
        Alert.alert('نجاح', 'تم إنشاء الحساب');
        navigation.navigate('Chat' as any);
      } else {
        Alert.alert('Error', res?.error || 'Registration failed');
      }
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>إنشاء حساب</Text>
      <TextInput placeholder="الاسم الكامل" style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 8 }} value={name} onChangeText={setName} />
      <TextInput placeholder="البريد الإلكتروني" style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 8 }} value={email} onChangeText={setEmail} autoCapitalize='none' />
      <TextInput placeholder="كلمة المرور" style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 8 }} value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput placeholder="اسم النشاط التجاري" style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 16 }} value={businessName} onChangeText={setBusinessName} />
      <Button title="إنشاء حساب" onPress={handleRegister} />
    </View>
  );
}
