import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';

export default function WidgetWebView({ route }: any) {
  const { businessId } = route.params || { businessId: null };
  const widgetHtml = `<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><div id='fahimo-root'></div><script src='https://faheemly.com/fahimo-widget.js' data-business-id='${businessId || ''}'></script></body></html>`;

  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ html: widgetHtml }} startInLoadingState renderLoading={() => <ActivityIndicator />} />
    </View>
  );
}
