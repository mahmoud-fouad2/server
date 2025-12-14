import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, TouchableOpacity, Image } from 'react-native';
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
        navigation.navigate('Conversations' as any);
      } else {
        Alert.alert('فشل تسجيل الدخول', resp?.error || 'حدث خطأ');
      }
    } catch (error) {
      Alert.alert('فشل تسجيل الدخول', String(error));
    }
  };

  const handleDemoLogin = async () => {
    try {
      const resp = await login('demo', 'demo');
      if (resp?.token) navigation.navigate('Chat' as any);
    } catch (e) { Alert.alert('فشل تسجيل الدخول التجريبي'); }
  }

  const openWebLogin = () => navigation.navigate('WebLogin' as any);

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', padding: 20, writingDirection: 'rtl' }}>
      <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 }}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{ backgroundColor: '#EEF2FF', width: 84, height: 84, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Image source={require('../../assets/logo2.png')} style={{ width: 56, height: 56, resizeMode: 'contain', borderRadius: 12 }} accessibilityLabel="Faheemly logo" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4, textAlign: 'center' }}>أهلاً بك</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 18 }}>سجل دخولك لإدارة بوتاتك الذكية</Text>
        </View>

        <Text style={{ color: '#0F172A', textAlign: 'right', marginBottom: 6 }}>البريد الإلكتروني</Text>
        <TextInput placeholder="name@company.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail}
          style={{ backgroundColor: '#0F172A', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 }} autoCapitalize="none" />

        <Text style={{ color: '#0F172A', textAlign: 'right', marginBottom: 6 }}>كلمة المرور</Text>
        <TextInput placeholder="••••••••" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword}
          style={{ backgroundColor: '#0F172A', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 18 }} secureTextEntry />

        <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: '#6D28D9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>تسجيل الدخول</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDemoLogin} style={{ marginTop: 12, backgroundColor: '#E5E7EB', padding: 12, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#111827' }}>بدء المحادثة</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openWebLogin} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ color: '#6D28D9', fontWeight: '600' }}>عرض واجهة الويب</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Register' as any)}>
            <Text style={{ color: '#6B7280' }}>إنشاء حساب</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Forgot' as any)}>
            <Text style={{ color: '#6B7280' }}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
