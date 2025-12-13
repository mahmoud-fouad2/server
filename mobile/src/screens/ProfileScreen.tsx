import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { getProfile, updateProfile, logout } from '../services/profileService';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const res = await getProfile();
      if (res?.user) {
        setUser(res.user);
        setName(res.user.name);
        setEmail(res.user.email);
      }
    })();
  }, []);

  const handleSave = async () => {
    const res = await updateProfile({ name, email });
    if (res?.user) {
      Alert.alert('تم', 'تحديث الملف الشخصي');
      setUser(res.user);
    } else {
      Alert.alert('Error', res?.error || 'Failed to update');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login' as any);
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>الحساب</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8 }} />
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8 }} />
      <Button title="حفظ" onPress={handleSave} />
      <View style={{ marginTop: 12 }}>
        <Button title="تسجيل خروج" color="#c00" onPress={handleLogout} />
      </View>
    </View>
  );
}
