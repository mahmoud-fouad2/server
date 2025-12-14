import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import BackButton from '../components/BackButton';
import { WEB_URL } from '../constants';

const PAGES = [
  { key: 'examples', title: 'أمثلة', path: '/examples' },
  { key: 'solutions', title: 'الحلول', path: '/solutions' },
  { key: 'services', title: 'الخدمات', path: '/services' },
  { key: 'docs', title: 'التوثيق', path: '/docs' },
  { key: 'about', title: 'من نحن', path: '/about' },
];

export default function ResourcesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const openWeb = (path: string) => {
    setCurrentUrl(`${WEB_URL}${path}`);
  };

  if (currentUrl) {
    return (
      <View style={{ flex: 1 }}>
        <BackButton onPress={() => setCurrentUrl(null)} label="رجوع" />
        <WebView source={{ uri: currentUrl }} startInLoadingState renderLoading={() => <ActivityIndicator color="#6D28D9" size="large" />} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#F8FAFC' }}>
      <BackButton onPress={() => navigation.goBack()} label="العودة" />
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>الموارد</Text>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>صفحات الموقع الهامة مُنسقة لتناسب التطبيق — اضغط لعرضها أو فتحها داخل التطبيق.</Text>

      {PAGES.map(p => (
        <TouchableOpacity key={p.key} onPress={() => openWeb(p.path)} style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
          <Text style={{ fontWeight: '700', color: '#111827' }}>{p.title}</Text>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>عرض المحتوى من: {WEB_URL}{p.path}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
