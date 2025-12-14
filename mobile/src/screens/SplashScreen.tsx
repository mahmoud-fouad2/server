import React, { useEffect } from 'react';
import { View, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getToken } from '../services/secureStorage';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          navigation.reset({ index: 0, routes: [{ name: 'Conversations' as any }] });
          return;
        }
      } catch (e) {
        // ignore
      }

      const timer = setTimeout(() => {
        navigation.navigate('Login' as any);
      }, 1200);

      return () => clearTimeout(timer);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#011841', alignItems: 'center', justifyContent: 'center' }}>
      <Image source={require('../../assets/logo2.png')} style={{ width: 180, height: 180, resizeMode: 'contain' }} />
      <Text style={{ color: '#fff', marginTop: 10, fontSize: 22, fontWeight: '700' }}>فهمي</Text>
      <Text style={{ color: '#c6d3e8', marginTop: 6, fontSize: 12 }}>Smart Customer Assistant</Text>
    </View>
  );
}
