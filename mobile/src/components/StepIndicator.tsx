import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  total: number;
  current: number;
}

export default function StepIndicator({ total, current }: Props) {
  const dots = [];
  for (let i = 1; i <= total; i++) {
    const active = i === current;
    dots.push(
      <View key={i} style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>{dots}</View>
      <Text style={styles.label}>خطوة {current} من {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 6, marginHorizontal: 4 },
  dotActive: { backgroundColor: '#6D28D9' },
  dotInactive: { backgroundColor: '#E5E7EB' },
  label: { color: '#6B7280', marginTop: 8, fontSize: 13 },
});
