import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { login } from '../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const resp = await login(email, password);
      if (resp?.token) {
        // Navigate to chat
        navigation.navigate('Conversations' as any);
      } else {
        Alert.alert('Login failed', resp?.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Login failed', String(error));
    }
  };

  const handleDemoLogin = async () => {
    try {
      const resp = await login('demo', 'demo');
      if (resp?.token) navigation.navigate('Chat' as any);
    } catch (e) { Alert.alert('Demo login failed'); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#011841', marginBottom: 10 }}>تسجيل الدخول</Text>

      <TextInput placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#e6e6e6', padding: 12, borderRadius: 10, marginBottom: 10 }}
        autoCapitalize="none" autoComplete="email"/>
      <TextInput placeholder="كلمة المرور" value={password} onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#e6e6e6', padding: 12, borderRadius: 10, marginBottom: 12 }} secureTextEntry/>

      <Button title="تسجيل دخول" onPress={handleLogin} />

      <View style={{ marginTop: 12 }}>
        <Button title="تجربة" onPress={handleDemoLogin} color="#999" />
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.navigate('Register' as any)}>
          <Text style={{ color: '#011841', fontWeight: 'bold' }}>إنشاء حساب</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Forgot' as any)}>
          <Text style={{ color: '#011841' }}>نسيت كلمة المرور؟</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
