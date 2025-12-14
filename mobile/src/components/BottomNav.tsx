import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
  current: string;
  onTab: (tab: string) => void;
}

const tabs = [
  { key: 'home', label: 'الرئيسية', icon: 'home-outline' },
  { key: 'chat', label: 'المحادثة', icon: 'chatbubble-ellipses-outline' },
  { key: 'wizard', label: 'إضافة', icon: 'add-circle-outline' },
  { key: 'support', label: 'الدعم', icon: 'headset-outline' },
  { key: 'profile', label: 'حسابي', icon: 'person-outline' },
];

export default function BottomNav({ current, onTab }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTab(tab.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={tab.icon as any}
            size={28}
            color={current === tab.key ? '#6D28D9' : '#A1A1AA'}
            style={current === tab.key ? styles.activeIcon : undefined}
          />
          <Text style={[styles.label, current === tab.key && styles.activeLabel]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    height: 64,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#6D28D9',
    fontWeight: '700',
  },
  activeIcon: {
    shadowColor: '#6D28D9',
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
});
