import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { getProfile, updateProfile, logout as apiLogout } from '../services/profileService';
import BottomNav from '../../components/BottomNav';
import BackButton from '../../components/BackButton';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
  const nav = navigation || useNavigation();
  const [user, setUser] = useState<any>({ name: '', email: '', subscription: 'مجاني' });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const res = await getProfile();
      if (res && !res.error) {
        const u = res.user || res;
        setUser(u);
        setName(u.name || '');
      }
    })();
  }, []);

  const handleSave = async () => {
    const res = await updateProfile({ name });
    if (res && !res.error) {
      Alert.alert('تم', 'تحديث الملف الشخصي');
      setUser(res.user || res);
      setEditing(false);
    } else {
      Alert.alert('خطأ', res?.error || 'فشل التحديث');
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' as any }] });
  };

  const [tab, setTab] = useState('profile');
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#F8FAFC', paddingBottom: 72 }}>
      <BackButton onPress={() => nav.goBack()} label="العودة" />
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <View style={{ backgroundColor: '#EEF2FF', width: 96, height: 96, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/logo2.png')} style={{ width: 72, height: 72, resizeMode: 'contain' }} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 12 }}>{user.name || 'مستخدم'}</Text>
        <Text style={{ color: '#6B7280', marginTop: 6 }}>{user.email || ''}</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>التفاصيل</Text>
        {editing ? (
          <>
            <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 12, borderRadius: 8, backgroundColor: '#fff' }} />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#6D28D9', padding: 12, borderRadius: 8, marginRight: 8 }}>
                <Text style={{ color: '#fff' }}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(false)} style={{ padding: 12, borderRadius: 8, backgroundColor: '#E5E7EB' }}>
                <Text>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 6 }}>{user.name}</Text>
            <TouchableOpacity onPress={() => setEditing(true)} style={{ padding: 8 }}>
              <Text style={{ color: '#6D28D9' }}>تعديل الملف</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>الاشتراك</Text>
        <Text style={{ color: '#6B7280' }}>{user.subscription || 'مجاني'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Subscription' as any)} style={{ marginTop: 8 }}>
          <Text style={{ color: '#6D28D9' }}>الترقية إلى خطة مدفوعة</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 8, alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>تسجيل خروج</Text>
      </TouchableOpacity>
      <BottomNav
        current={tab}
        onTab={key => {
          setTab(key);
          if (key === 'home') nav.navigate('Conversations');
          if (key === 'chat') nav.navigate('Chat');
          if (key === 'wizard') nav.navigate('Wizard');
          if (key === 'support') nav.navigate('Support');
          if (key === 'profile') return;
        }}
      />
    </View>
  );
}
