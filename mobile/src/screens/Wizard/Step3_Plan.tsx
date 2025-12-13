import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Step3({ onNext, onBack }: any) {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Step 3: اختر الخطة</Text>
      <View style={{ marginVertical: 8 }}>
        <Button title="Free" onPress={() => {}} />
      </View>
      <View style={{ marginVertical: 8 }}>
        <Button title="Pro" onPress={() => {}} />
      </View>
      <View style={{ marginVertical: 8 }}>
        <Button title="Business" onPress={() => {}} />
      </View>
      <Button title="السابق" onPress={onBack} />
      <Button title="التالي" onPress={onNext} />
    </View>
  );
}
