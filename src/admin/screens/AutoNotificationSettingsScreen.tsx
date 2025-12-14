import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import {
  Title,
  Card,
  Button,
  Text,
  ActivityIndicator,
  Chip,
  Switch,
  Divider,
  Surface,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Checkbox,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import {
  AutoNotificationConfig,
  NotificationTiming,
  getAllAutoNotificationConfigs,
  saveAutoNotificationConfig,
  deleteAutoNotificationConfig,
  toggleAutoNotificationConfig,
  initializeDefaultConfigs,
  getBigEvents,
  TIMING_LABELS,
  DEFAULT_TIMINGS_BY_TYPE,
  calculateNotificationDate,
} from '../../services/AutoNotificationService';
import { ChurchEvent, getServiceTypeLabel } from '../../services/ChurchCalendarService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AutoNotificationSettingsScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'AutoNotificationSettings'>;
};

const SERVICE_TYPE_COLORS = {
  LITURGY: '#E57373',
  EVENING_SERVICE: '#81C784',
  CHURCH_OPEN: '#64B5F6',
  PICNIC: '#FFB74D',
} as const;

export const AutoNotificationSettingsScreen: React.FC<AutoNotificationSettingsScreenProps> = ({ navigation }) => {
  const [configs, setConfigs] = useState<AutoNotificationConfig[]>([]);
  const [bigEvents, setBigEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [selectedTimings, setSelectedTimings] = useState<NotificationTiming[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [editingConfig, setEditingConfig] = useState<AutoNotificationConfig | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configsData, eventsData] = await Promise.all([
        getAllAutoNotificationConfigs(),
        Promise.resolve(getBigEvents()),
      ]);
      setConfigs(configsData);
      setBigEvents(eventsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleInitializeDefaults = async () => {
    Alert.alert(
      'Иницијализирај стандардни поставки',
      'Ова ќе креира автоматски известувања за сите големи настани (пикници и празници). Продолжи?',
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Да',
          onPress: async () => {
            setLoading(true);
            try {
              const created = await initializeDefaultConfigs();
              Alert.alert('Успех', `Креирани ${created} нови конфигурации.`);
              await loadData();
            } catch (error) {
              Alert.alert('Грешка', 'Неуспешно иницијализирање.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleConfig = async (config: AutoNotificationConfig) => {
    if (!config.id) return;
    try {
      await toggleAutoNotificationConfig(config.id, !config.isEnabled);
      setConfigs(prev =>
        prev.map(c => (c.id === config.id ? { ...c, isEnabled: !c.isEnabled } : c))
      );
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешна промена на статус.');
    }
  };

  const handleDeleteConfig = (config: AutoNotificationConfig) => {
    Alert.alert(
      'Избриши конфигурација',
      `Дали сигурно сакате да ја избришете автоматската нотификација за "${config.eventName}"?`,
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            if (!config.id) return;
            try {
              await deleteAutoNotificationConfig(config.id);
              setConfigs(prev => prev.filter(c => c.id !== config.id));
            } catch (error) {
              Alert.alert('Грешка', 'Неуспешно бришење.');
            }
          },
        },
      ]
    );
  };

  const openAddDialog = (event: ChurchEvent) => {
    const eventId = `${event.date.toISOString()}_${event.name}`;
    const existingConfig = configs.find(c => c.eventId === eventId);

    if (existingConfig) {
      setEditingConfig(existingConfig);
      setSelectedTimings(existingConfig.timings);
      setCustomMessage(existingConfig.customMessage || '');
    } else {
      setEditingConfig(null);
      setSelectedTimings(DEFAULT_TIMINGS_BY_TYPE[event.serviceType]);
      setCustomMessage('');
    }

    setSelectedEvent(event);
    setDialogVisible(true);
  };

  const toggleTiming = (timing: NotificationTiming) => {
    setSelectedTimings(prev =>
      prev.includes(timing) ? prev.filter(t => t !== timing) : [...prev, timing]
    );
  };

  const handleSaveConfig = async () => {
    if (!selectedEvent || selectedTimings.length === 0) {
      Alert.alert('Грешка', 'Изберете барем еден временски интервал.');
      return;
    }

    const eventId = `${selectedEvent.date.toISOString()}_${selectedEvent.name}`;

    try {
      await saveAutoNotificationConfig({
        id: editingConfig?.id,
        eventId,
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        serviceType: selectedEvent.serviceType,
        timings: selectedTimings,
        isEnabled: true,
        customMessage: customMessage.trim() || undefined,
        createdAt: editingConfig?.createdAt || new Date(),
        updatedAt: new Date(),
      });

      Alert.alert('Успех', 'Конфигурацијата е зачувана.');
      setDialogVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно зачувување.');
    }
  };

  const getConfigForEvent = (event: ChurchEvent): AutoNotificationConfig | undefined => {
    const eventId = `${event.date.toISOString()}_${event.name}`;
    return configs.find(c => c.eventId === eventId);
  };

  const renderConfigCard = (config: AutoNotificationConfig) => {
    const color = SERVICE_TYPE_COLORS[config.serviceType];

    return (
      <Card key={config.id} style={[styles.configCard, { borderLeftColor: color }]}>
        <Card.Content>
          <View style={styles.configHeader}>
            <View style={styles.configTitleRow}>
              <Text style={styles.configTitle} numberOfLines={1}>
                {config.eventName}
              </Text>
              <Switch
                value={config.isEnabled}
                onValueChange={() => handleToggleConfig(config)}
                color={COLORS.PRIMARY}
              />
            </View>
            <Chip
              style={[styles.serviceChip, { backgroundColor: color + '20' }]}
              textStyle={{ color, fontSize: 10 }}
            >
              {getServiceTypeLabel(config.serviceType)}
            </Chip>
          </View>

          <Text style={styles.configDate}>
            {format(config.eventDate, 'dd MMMM yyyy', { locale: mk })}
          </Text>

          <View style={styles.timingsContainer}>
            {config.timings.map(timing => (
              <View key={timing} style={styles.timingRow}>
                <MaterialCommunityIcons name="bell-ring" size={14} color="#666" />
                <Text style={styles.timingText}>{TIMING_LABELS[timing]}</Text>
                <Text style={styles.timingDate}>
                  ({format(calculateNotificationDate(config.eventDate, timing), 'dd.MM HH:mm', { locale: mk })})
                </Text>
              </View>
            ))}
          </View>

          {config.customMessage && (
            <Surface style={styles.customMessageBox}>
              <Text style={styles.customMessageLabel}>Порака:</Text>
              <Text style={styles.customMessageText}>{config.customMessage}</Text>
            </Surface>
          )}

          <View style={styles.configActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setEditingConfig(config);
                const event = bigEvents.find(
                  e => `${e.date.toISOString()}_${e.name}` === config.eventId
                );
                if (event) {
                  setSelectedEvent(event);
                  setSelectedTimings(config.timings);
                  setCustomMessage(config.customMessage || '');
                  setDialogVisible(true);
                }
              }}
              style={styles.editButton}
            >
              Измени
            </Button>
            <Button
              mode="outlined"
              textColor="#F44336"
              onPress={() => handleDeleteConfig(config)}
              style={styles.deleteButton}
            >
              Избриши
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEventCard = (event: ChurchEvent) => {
    const config = getConfigForEvent(event);
    const color = SERVICE_TYPE_COLORS[event.serviceType];
    const hasConfig = !!config;

    return (
      <Card
        key={`${event.date.toISOString()}_${event.name}`}
        style={[styles.eventCard, hasConfig && styles.eventCardConfigured]}
      >
        <Card.Content>
          <View style={styles.eventRow}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName} numberOfLines={1}>
                {event.name}
              </Text>
              <Text style={styles.eventDate}>
                {format(event.date, 'dd.MM.yyyy', { locale: mk })}
              </Text>
            </View>
            <Chip
              style={[styles.eventChip, { backgroundColor: color + '20' }]}
              textStyle={{ color, fontSize: 10 }}
            >
              {getServiceTypeLabel(event.serviceType)}
            </Chip>
            <Button
              mode={hasConfig ? 'outlined' : 'contained'}
              onPress={() => openAddDialog(event)}
              compact
              style={styles.configureButton}
            >
              {hasConfig ? 'Измени' : 'Конфигурирај'}
            </Button>
          </View>
          {hasConfig && config && (
            <View style={styles.configSummary}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.configSummaryText}>
                {config.timings.length} известувања ({config.isEnabled ? 'активно' : 'неактивно'})
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Автоматски известувања</Title>
        <Button
          mode="outlined"
          onPress={handleInitializeDefaults}
          style={styles.initButton}
          icon="auto-fix"
        >
          Иницијализирај
        </Button>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Configured Events Section */}
          {configs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Конфигурирани настани ({configs.length})</Text>
              {configs.map(renderConfigCard)}
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Available Events Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Големи настани за конфигурирање</Text>
            <Text style={styles.sectionSubtitle}>
              Пикници и големи празници кои можат да имаат автоматски известувања
            </Text>
            {bigEvents.map(renderEventCard)}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Автоматските известувања се испраќаат на сите корисници со инсталирана апликација
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Configure Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>
            {editingConfig ? 'Измени конфигурација' : 'Нова конфигурација'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              {selectedEvent && (
                <View style={styles.dialogContent}>
                  <Text style={styles.dialogEventName}>{selectedEvent.name}</Text>
                  <Text style={styles.dialogEventDate}>
                    {format(selectedEvent.date, 'dd MMMM yyyy', { locale: mk })}
                  </Text>

                  <Text style={styles.dialogLabel}>Кога да се испрати известување:</Text>

                  {(['1_WEEK', '3_DAYS', '1_DAY', '12_HOURS'] as NotificationTiming[]).map(timing => (
                    <View key={timing} style={styles.checkboxRow}>
                      <Checkbox
                        status={selectedTimings.includes(timing) ? 'checked' : 'unchecked'}
                        onPress={() => toggleTiming(timing)}
                        color={COLORS.PRIMARY}
                      />
                      <View style={styles.checkboxContent}>
                        <Text style={styles.checkboxLabel}>{TIMING_LABELS[timing]}</Text>
                        <Text style={styles.checkboxDate}>
                          {format(calculateNotificationDate(selectedEvent.date, timing), 'dd.MM.yyyy HH:mm', { locale: mk })}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <TextInput
                    label="Прилагодена порака (опционално)"
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.messageInput}
                    placeholder="Оставете празно за стандардна порака"
                  />
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Откажи</Button>
            <Button onPress={handleSaveConfig} mode="contained">
              Зачувај
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  initButton: {
    borderColor: COLORS.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  configCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  configHeader: {
    marginBottom: 8,
  },
  configTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  serviceChip: {
    height: 22,
    alignSelf: 'flex-start',
  },
  configDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  timingsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timingText: {
    fontSize: 13,
    marginLeft: 8,
    color: '#333',
  },
  timingDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  customMessageBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  customMessageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  customMessageText: {
    fontSize: 13,
    color: '#333',
  },
  configActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    borderColor: COLORS.PRIMARY,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  eventCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  eventCardConfigured: {
    backgroundColor: '#E8F5E9',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  eventChip: {
    height: 22,
  },
  configureButton: {
    marginLeft: 8,
  },
  configSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  configSummaryText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  dialogTitle: {
    color: COLORS.PRIMARY,
  },
  dialogScrollArea: {
    maxHeight: 400,
  },
  dialogContent: {
    padding: 16,
  },
  dialogEventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  dialogEventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  checkboxDate: {
    fontSize: 12,
    color: '#999',
  },
  messageInput: {
    marginTop: 16,
    backgroundColor: '#fff',
  },
});

export default AutoNotificationSettingsScreen;
