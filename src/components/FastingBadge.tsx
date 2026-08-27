import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FastingDayInfo, FASTING_RULE_CONFIG } from '../services/FastingService';

interface FastingBadgeProps {
  info: FastingDayInfo;
  onPress: () => void;
}

// Fasting row shown INSIDE the event card, under the main content (Goce's
// chosen design): period name + today's rule. Tapping opens the detail sheet.
export const FastingBadge: React.FC<FastingBadgeProps> = ({ info, onPress }) => {
  const config = FASTING_RULE_CONFIG[info.rule];

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: config.color + '14' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconDot, { backgroundColor: config.color }]}>
        <MaterialCommunityIcons name={config.icon as any} size={13} color="#fff" />
      </View>
      <Text style={[styles.label, { color: config.color }]}>
        {info.period.name} · {config.shortLabel}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={config.color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default FastingBadge;
