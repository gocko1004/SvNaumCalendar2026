import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FastingDayInfo, FASTING_RULE_CONFIG } from '../services/FastingService';

interface FastingBadgeProps {
  info: FastingDayInfo;
  onPress: () => void;
}

// Small chip shown above a day's first event card. Tapping opens the fasting
// detail sheet. Purely additive — existing cards are untouched.
export const FastingBadge: React.FC<FastingBadgeProps> = ({ info, onPress }) => {
  const config = FASTING_RULE_CONFIG[info.rule];

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: config.color }]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialCommunityIcons name={config.icon as any} size={12} color="#fff" />
      <Text style={styles.label}>{config.shortLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 5,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FastingBadge;
