import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { CHURCH_EVENTS, ChurchEvent, getServiceTypeLabel } from '../../services/ChurchCalendarService';
import {
  getAllEvents,
  mergeEvents,
  getEventOverrides,
  applyEventOverrides,
} from '../../services/FirestoreEventService';
import { getReminderText, ReminderTiming } from '../../services/NotificationTextService';
import { COLORS } from '../../constants/theme';

// Admin-only preview: shows the EXACT reminder texts users will receive and
// can fire them as a LOCAL notification on THIS device only. Never touches
// push tokens - no other user can ever receive a preview.

const TIMINGS: { key: ReminderTiming; label: string }[] = [
  { key: 'DAY', label: '1 ден пред' },
  { key: 'HOUR', label: '1 час пред' },
];

export const NotificationPreviewScreen = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChurchEvent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [firestoreEvents, overrides] = await Promise.all([
          getAllEvents(),
          getEventOverrides(),
        ]);
        const merged = mergeEvents(applyEventOverrides(CHURCH_EVENTS, overrides), firestoreEvents);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setEvents(merged.filter(e => e.date >= today).slice(0, 25));
      } catch (error) {
        setEvents(CHURCH_EVENTS.slice(0, 25));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendLocalPreview = async (event: ChurchEvent, timing: ReminderTiming) => {
    const { title, body } = getReminderText(event, timing);
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: { seconds: 3, channelId: 'church-events' } as any,
      });
      Alert.alert(
        'Тестот е закажан',
        'Известувањето ќе се појави на ОВОЈ телефон за 3 секунди. Никој друг не го добива.'
      );
    } catch (error) {
      Alert.alert(
        'Грешка',
        'Локалното известување не можеше да се закаже. Во Expo Go некои функции за известувања се ограничени - во финалната апликација работи нормално.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check" size={18} color={COLORS.SUCCESS} />
          <Text style={styles.infoText}>
            Тестот се прикажува само на овој телефон. Корисниците не добиваат ништо.
          </Text>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.PRIMARY} />}

        {!loading &&
          events.map((event, idx) => {
            const isSelected =
              selected &&
              selected.date.getTime() === event.date.getTime() &&
              selected.serviceType === event.serviceType;
            return (
              <Card
                key={`${event.date.toISOString()}-${event.serviceType}-${idx}`}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(isSelected ? null : event)}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.eventDate}>
                      {format(event.date, 'd MMM', { locale: mk })}
                    </Text>
                    <View style={styles.cardTitleBox}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      <Text style={styles.eventMeta}>
                        {getServiceTypeLabel(event.serviceType)} · {event.time}ч
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isSelected ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#999"
                    />
                  </View>

                  {isSelected &&
                    TIMINGS.map(t => {
                      const { title, body } = getReminderText(event, t.key);
                      return (
                        <View key={t.key} style={styles.previewBox}>
                          <Text style={styles.previewTiming}>{t.label}</Text>
                          <View style={styles.previewBubble}>
                            <Text style={styles.previewTitle}>{title}</Text>
                            <Text style={styles.previewBody}>{body}</Text>
                          </View>
                          <Button
                            mode="outlined"
                            compact
                            icon="bell-ring-outline"
                            textColor={COLORS.PRIMARY}
                            onPress={() => sendLocalPreview(event, t.key)}
                          >
                            Тест на овој телефон
                          </Button>
                        </View>
                      );
                    })}
                </Card.Content>
              </Card>
            );
          })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: '#2E7D32',
    lineHeight: 17,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#FFFDF8',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4D9C2',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    width: 52,
  },
  cardTitleBox: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  eventMeta: {
    fontSize: 11.5,
    color: '#8a7a6a',
    marginTop: 1,
  },
  previewBox: {
    marginTop: 12,
  },
  previewTiming: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8a7a6a',
    marginBottom: 5,
  },
  previewBubble: {
    backgroundColor: '#F2EDE2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  previewBody: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
    lineHeight: 19,
  },
});

export default NotificationPreviewScreen;
