import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { WEB_URL } from '../constants';

export default function SupportScreen() {
  const url = `${WEB_URL}/support`;

  return (
    <View style={styles.container}>
      <WebView source={{ uri: url }} startInLoadingState renderLoading={() => <ActivityIndicator size="large" color="#6D28D9" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
