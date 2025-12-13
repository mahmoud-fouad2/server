import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Step5({ onNext, onBack }: any) {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Step 5: دمج القنوات</Text>
      <Text style={{ marginVertical: 6 }}>Widget</Text>
      <Button title="Enable Widget" onPress={() => {}} />
      <Text style={{ marginVertical: 6 }}>Whatsapp (coming soon)</Text>
      <Button title="التالي" onPress={onNext} />
      <Button title="السابق" onPress={onBack} />
    </View>
  );
}
