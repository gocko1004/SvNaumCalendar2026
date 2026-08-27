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
      style={[
        styles.chip,
        { backgroundColor: config.color + '12', borderColor: config.color + '55' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <View style={[styles.iconDot, { backgroundColor: config.color }]}>
        <MaterialCommunityIcons name={config.icon as any} size={12} color="#fff" />
      </View>
      <Text style={[styles.label, { color: config.color }]} numberOfLines={1}>
        {info.period.name} · {config.shortLabel}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={config.color} />
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
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default FastingBadge;
