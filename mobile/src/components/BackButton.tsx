import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  onPress: () => void;
  label?: string;
}

export default function BackButton({ onPress, label }: BackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} activeOpacity={0.7}>
      <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#6D28D9" style={{ marginRight: I18nManager.isRTL ? 0 : 4, marginLeft: I18nManager.isRTL ? 4 : 0 }} />
      <Text style={styles.label}>{label || 'عودة'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 2,
  },
  label: {
    color: '#6D28D9',
    fontWeight: '700',
    fontSize: 15,
  },
});
