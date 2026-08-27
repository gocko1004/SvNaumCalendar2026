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
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, right: 6 }}
    >
      <View style={[styles.iconDot, { backgroundColor: config.color }]}>
        <MaterialCommunityIcons name={config.icon as any} size={13} color="#fff" />
      </View>
      <Text style={[styles.label, { color: config.color }]}>{config.shortLabel}</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={config.color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 3,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default FastingBadge;
