import React, { useEffect, useRef } from 'react';
import { View, Image, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getToken } from '../services/secureStorage';

export default function SplashScreen() {
  const navigation = useNavigation();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

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

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        navigation.navigate('Login' as any);
      }, 1200);

      return () => clearTimeout(timer);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#6D28D9', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require('../../assets/logo2.png')}
        style={{ width: 160, height: 160, opacity, transform: [{ scale }] }}
        resizeMode="contain"
      />
    </View>
  );
}
