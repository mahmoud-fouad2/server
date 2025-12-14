import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import WebView from 'react-native-webview';

// Change this to your local or deployed web login page
const WEB_LOGIN_URL = Platform.select({
  web: 'http://localhost:3000/login', // for local dev
  default: 'https://faheemly.com/login',
});

export default function WebLoginScreen() {
  if (Platform.OS === 'web') {
    // On web, just redirect the browser to the web login route for exact fidelity
    if (typeof window !== 'undefined') {
      window.location.href = WEB_LOGIN_URL;
      return null;
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: WEB_LOGIN_URL }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator />}
        style={{ flex: 1 }}
      />
    </View>
  );
}
