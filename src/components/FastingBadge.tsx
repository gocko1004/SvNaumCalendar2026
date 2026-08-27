import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FastingDayInfo, FASTING_RULE_CONFIG } from '../services/FastingService';

interface FastingBadgeProps {
  info: FastingDayInfo;
  onPress: () => void;
}

// Fasting chip rendered inside the card's content column, directly under the
// time row - same width as the event text. Styled like the app's other chips:
// soft tint, fine colored border, rounded corners.
export const FastingBadge: React.FC<FastingBadgeProps> = ({ info, onPress }) => {
  const config = FASTING_RULE_CONFIG[info.rule];

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: config.color }]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <View style={styles.iconDot}>
        <MaterialCommunityIcons name={config.icon as any} size={13} color={config.color} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {info.period.name} · {config.shortLabel}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'stretch',
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});

export default FastingBadge;
