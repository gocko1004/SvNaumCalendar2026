import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity, Text as RNText, Modal, SafeAreaView, TextInput as RNTextInput } from 'react-native';
import {
  Title,
  Card,
  Button,
  Text,
  ActivityIndicator,
  Switch,
  Divider,
  Surface,
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
  getAllFutureEvents,
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
  const [allEvents, setAllEvents] = useState<ChurchEvent[]>([]);
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
        Promise.resolve(getAllFutureEvents()),
      ]);
      setConfigs(configsData);
      setAllEvents(eventsData);
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
            <View style={[styles.serviceChipNative, { backgroundColor: color + '20' }]}>
              <RNText style={[styles.serviceChipText, { color }]}>
                {getServiceTypeLabel(config.serviceType)}
              </RNText>
            </View>
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
            <TouchableOpacity
              onPress={() => {
                setEditingConfig(config);
                const event = allEvents.find(
                  e => `${e.date.toISOString()}_${e.name}` === config.eventId
                );
                if (event) {
                  setSelectedEvent(event);
                  setSelectedTimings(config.timings);
                  setCustomMessage(config.customMessage || '');
                  setDialogVisible(true);
                }
              }}
              style={styles.editButtonTouch}
            >
              <RNText style={styles.editButtonText}>Измени</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteConfig(config)}
              style={styles.deleteButtonTouch}
            >
              <RNText style={styles.deleteButtonText}>Избриши</RNText>
            </TouchableOpacity>
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
              <RNText style={styles.eventName} numberOfLines={1}>
                {event.name}
              </RNText>
              <RNText style={styles.eventDate}>
                {format(event.date, 'dd.MM.yyyy', { locale: mk })}
              </RNText>
            </View>
            <View style={[styles.eventChipNative, { backgroundColor: color + '20' }]}>
              <RNText style={[styles.eventChipText, { color }]} numberOfLines={1}>
                {getServiceTypeLabel(event.serviceType)}
              </RNText>
            </View>
            <TouchableOpacity
              onPress={() => openAddDialog(event)}
              style={[
                styles.configureButtonTouch,
                hasConfig ? styles.configureButtonOutlined : styles.configureButtonFilled
              ]}
            >
              <RNText style={[
                styles.configureButtonText,
                hasConfig ? styles.configureButtonTextOutlined : styles.configureButtonTextFilled
              ]}>
                Конфигурирај
              </RNText>
            </TouchableOpacity>
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
            <Text style={styles.sectionTitle}>Сите настани ({allEvents.length})</Text>
            <Text style={styles.sectionSubtitle}>
              Изберете кои настани да имаат автоматски известувања
            </Text>
            {allEvents.map(renderEventCard)}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Автоматските известувања се испраќаат на сите корисници со инсталирана апликација
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Configure Modal */}
      <Modal
        visible={dialogVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>
                {editingConfig ? 'Измени конфигурација' : 'Нова конфигурација'}
              </RNText>
              <TouchableOpacity onPress={() => setDialogVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {selectedEvent && (
                <View style={styles.modalContent}>
                  <RNText style={styles.dialogEventName}>{selectedEvent.name}</RNText>
                  <RNText style={styles.dialogEventDate}>
                    {format(selectedEvent.date, 'dd MMMM yyyy', { locale: mk })}
                  </RNText>

                  <RNText style={styles.dialogLabel}>Кога да се испрати известување:</RNText>

                  {(['1_WEEK', '3_DAYS', '1_DAY', '12_HOURS'] as NotificationTiming[]).map(timing => {
                    const isSelected = selectedTimings.includes(timing);
                    return (
                      <TouchableOpacity
                        key={timing}
                        style={[styles.timingOption, isSelected && styles.timingOptionSelected]}
                        onPress={() => toggleTiming(timing)}
                      >
                        <View style={[styles.customCheckbox, isSelected && styles.customCheckboxChecked]}>
                          {isSelected && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                        </View>
                        <View style={styles.timingOptionContent}>
                          <RNText style={styles.timingOptionLabel}>{TIMING_LABELS[timing]}</RNText>
                          <RNText style={styles.timingOptionDate}>
                            {format(calculateNotificationDate(selectedEvent.date, timing), 'dd.MM.yyyy HH:mm', { locale: mk })}
                          </RNText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <RNText style={styles.messageLabel}>Прилагодена порака (опционално)</RNText>
                  <RNTextInput
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    multiline
                    numberOfLines={3}
                    style={styles.messageInputNative}
                    placeholder="Оставете празно за стандардна порака"
                    placeholderTextColor="#999"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setDialogVisible(false)}
              >
                <RNText style={styles.modalButtonCancelText}>Откажи</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveConfig}
              >
                <RNText style={styles.modalButtonSaveText}>Зачувај</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFDF8',
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  initButton: {
    borderColor: COLORS.PRIMARY,
    borderRadius: 10,
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
  serviceChipNative: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  serviceChipText: {
    fontSize: 10,
    fontWeight: '600',
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
  editButtonTouch: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButtonTouch: {
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '600',
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
    minWidth: 100,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    flexShrink: 0,
  },
  eventChipNative: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 100,
    flexShrink: 1,
  },
  eventChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  configureButtonTouch: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  configureButtonFilled: {
    backgroundColor: COLORS.PRIMARY,
  },
  configureButtonOutlined: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'transparent',
  },
  configureButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  configureButtonTextFilled: {
    color: '#fff',
  },
  configureButtonTextOutlined: {
    color: COLORS.PRIMARY,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalContent: {
    padding: 16,
  },
  dialogEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  dialogEventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  dialogLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timingOptionSelected: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customCheckboxChecked: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  timingOptionContent: {
    flex: 1,
  },
  timingOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  timingOptionDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  messageInputNative: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonSaveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AutoNotificationSettingsScreen;
