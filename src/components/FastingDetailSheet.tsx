import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { FastingDayInfo, FASTING_RULE_CONFIG } from '../services/FastingService';
import { COLORS } from '../constants/theme';

interface FastingDetailSheetProps {
  visible: boolean;
  info: FastingDayInfo | null;
  onClose: () => void;
}

// Bottom sheet with the fasting period details. Visually mirrors the existing
// EventDetailSheet (white sheet, 24px top radius, drag handle, X close) so the
// app keeps one design language. New component — nothing existing is modified.
export const FastingDetailSheet: React.FC<FastingDetailSheetProps> = ({
  visible,
  info,
  onClose,
}) => {
  if (!info) return null;

  const config = FASTING_RULE_CONFIG[info.rule];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.dateBadge, { backgroundColor: '#6B4E9B' }]}>
                <MaterialCommunityIcons name={config.icon as any} size={22} color="#fff" />
                <Text style={styles.dateBadgeLabel}>пост</Text>
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>{info.period.name}</Text>
                <Text style={styles.range}>
                  {info.totalDays === 1
                    ? format(info.period.startDate, 'd MMMM yyyy', { locale: mk })
                    : `${format(info.period.startDate, 'd MMMM', { locale: mk })} - ${format(
                        info.period.endDate,
                        'd MMMM yyyy',
                        { locale: mk }
                      )} · ден ${info.dayNumber} од ${info.totalDays}`}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Today's rule — the thing the user came for */}
            <View style={[styles.todayRule, { backgroundColor: config.color + '14' }]}>
              <View style={[styles.todayRuleIcon, { backgroundColor: config.color }]}>
                <MaterialCommunityIcons name={config.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.todayRuleText}>
                <Text style={styles.todayRuleLabel}>
                  {info.isSpecialDay && info.specialDayNote
                    ? `${info.specialDayNote}: ${config.label}`
                    : `Денес: ${config.label}`}
                </Text>
                <Text style={styles.todayRuleDescription}>{config.description}</Text>
              </View>
            </View>

            {/* Eparchy note */}
            {info.period.note ? (
              <View style={styles.noteContainer}>
                <View style={styles.noteHeader}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.noteTitle}>Упатство</Text>
                </View>
                <Text style={styles.noteText}>{info.period.note}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dateBadge: {
    width: 56,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeLabel: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  range: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
  todayRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  todayRuleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRuleText: {
    flex: 1,
  },
  todayRuleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  todayRuleDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  noteContainer: {
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  noteText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
  },
});

export default FastingDetailSheet;
