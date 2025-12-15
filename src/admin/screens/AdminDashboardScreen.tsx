import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Linking, KeyboardAvoidingView, Platform, Modal, Keyboard, Text, TextInput as NativeTextInput } from 'react-native';
import { Card, Title, Paragraph, Button, Portal, Dialog, TextInput, List, Switch, Divider, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import NotificationService from '../../services/NotificationService';
import { ChurchEvent, CHURCH_EVENTS } from '../../services/ChurchCalendarService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import SocialMediaService from '../../services/SocialMediaService';
import { logSentNotification } from '../../services/NotificationHistoryService';

type AdminDashboardScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;
};

type EventNotificationContent = {
  eventId: string;
  weekBeforeMessage?: string;
  dayBeforeMessage?: string;
  hourBeforeMessage?: string;
};

export const AdminDashboardScreen = ({ navigation }: AdminDashboardScreenProps) => {
  const { logout, updateLastActivity } = useAuth();

  // Update activity timestamp when navigating
  const handleNavigation = (screen: keyof AdminStackParamList, params?: any) => {
    updateLastActivity();
    navigation.navigate(screen as any, params);
  };
  const [notificationDialogVisible, setNotificationDialogVisible] = useState(false);
  const [automatedSettingsVisible, setAutomatedSettingsVisible] = useState(false);
  const [eventContentDialogVisible, setEventContentDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationMessageRef = useRef('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<{ success: boolean; sentCount: number; error?: string } | null>(null);
  const [automatedSettings, setAutomatedSettings] = useState({
    weekBefore: true,
    dayBefore: true,
    hourBefore: true
  });
  const [eventNotifications, setEventNotifications] = useState<EventNotificationContent[]>([]);
  const [customMessages, setCustomMessages] = useState({
    weekBefore: '',
    dayBefore: '',
    hourBefore: ''
  });

  useEffect(() => {
    loadEventNotifications();
  }, []);

  const loadEventNotifications = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('@event_notifications');
      if (savedNotifications) {
        setEventNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading event notifications:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('AdminLogin');
  };

  const handleSendNotification = async () => {
    const message = notificationMessageRef.current || notificationMessage;
    if (!message.trim()) {
      return;
    }

    setSendingNotification(true);
    setNotificationResult(null);

    try {
      // Send push notification to all users
      const result = await NotificationService.sendPushNotificationToAllUsers({
        title: 'Важно Известување',
        message: message,
        urgent: true
      });

      setNotificationResult(result);

      // Log to notification history
      await logSentNotification(
        'Важно Известување',
        message,
        'INFO',
        result.sentCount,
        result.success ? result.sentCount : 0,
        result.success ? 0 : result.sentCount,
        'admin',
        undefined,
        false,
        result.error ? [result.error] : []
      );

      if (result.success) {
        setNotificationMessage('');
        notificationMessageRef.current = '';
        // Keep dialog open to show success message
        setTimeout(() => {
          setNotificationDialogVisible(false);
          setNotificationResult(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setNotificationResult({
        success: false,
        sentCount: 0,
        error: error.message || 'Грешка при испраќање на известување'
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleAutomatedSettingsUpdate = async () => {
    try {
      await NotificationService.updateNotificationSettings({
        enabled: true,
        ...automatedSettings
      });
      await NotificationService.scheduleYearEvents();
      setAutomatedSettingsVisible(false);
    } catch (error) {
      console.error('Error updating automated settings:', error);
    }
  };

  const handleEventSelect = (event: ChurchEvent) => {
    setSelectedEvent(event);
    const existingContent = eventNotifications.find(n => n.eventId === event.date.toISOString());
    if (existingContent) {
      setCustomMessages({
        weekBefore: existingContent.weekBeforeMessage || '',
        dayBefore: existingContent.dayBeforeMessage || '',
        hourBefore: existingContent.hourBeforeMessage || ''
      });
    } else {
      setCustomMessages({
        weekBefore: '',
        dayBefore: '',
        hourBefore: ''
      });
    }
    setEventContentDialogVisible(true);
  };

  const saveEventContent = async () => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.date.toISOString();
    const updatedNotifications = eventNotifications.filter(n => n.eventId !== eventId);
    updatedNotifications.push({
      eventId,
      weekBeforeMessage: customMessages.weekBefore,
      dayBeforeMessage: customMessages.dayBefore,
      hourBeforeMessage: customMessages.hourBefore
    });

    try {
      await AsyncStorage.setItem('@event_notifications', JSON.stringify(updatedNotifications));
      setEventNotifications(updatedNotifications);
      setEventContentDialogVisible(false);
    } catch (error) {
      console.error('Error saving event content:', error);
    }
  };

  const renderEventContentDialog = () => (
    <Dialog
      visible={eventContentDialogVisible}
      onDismiss={() => setEventContentDialogVisible(false)}
      style={styles.dialog}
    >
      <Dialog.Title>
        {selectedEvent ? format(selectedEvent.date, 'dd MMMM yyyy', { locale: mk }) : ''}
      </Dialog.Title>
      <Dialog.Content>
        <Title style={styles.eventTitle}>{selectedEvent?.name}</Title>
        
        {automatedSettings.weekBefore && (
          <View style={styles.messageInput}>
            <Title style={styles.messageTitle}>Порака 1 недела пред</Title>
            <TextInput
              value={customMessages.weekBefore}
              onChangeText={text => setCustomMessages({...customMessages, weekBefore: text})}
              multiline
              numberOfLines={2}
              placeholder="Пример: Следната недела во {време} ќе се одржи {настан}"
            />
          </View>
        )}

        {automatedSettings.dayBefore && (
          <View style={styles.messageInput}>
            <Title style={styles.messageTitle}>Порака 1 ден пред</Title>
            <TextInput
              value={customMessages.dayBefore}
              onChangeText={text => setCustomMessages({...customMessages, dayBefore: text})}
              multiline
              numberOfLines={2}
              placeholder="Пример: Утре во {време} ќе се одржи {настан}"
            />
          </View>
        )}

        {automatedSettings.hourBefore && (
          <View style={styles.messageInput}>
            <Title style={styles.messageTitle}>Порака 1 час пред</Title>
            <TextInput
              value={customMessages.hourBefore}
              onChangeText={text => setCustomMessages({...customMessages, hourBefore: text})}
              multiline
              numberOfLines={2}
              placeholder="Пример: За 1 час започнува {настан}"
            />
          </View>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setEventContentDialogVisible(false)}>Откажи</Button>
        <Button onPress={saveEventContent}>Зачувај</Button>
      </Dialog.Actions>
    </Dialog>
  );

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Администраторски Панел</Title>

      {/* ======= CONTENT MANAGEMENT ======= */}
      <Title style={styles.sectionHeader}>Содржина</Title>

      <Card style={styles.card} onPress={() => handleNavigation('ManageCalendar')}>
        <Card.Content>
          <Title>📅 Годишен Календар 2026</Title>
          <Paragraph>Преглед и управување со сите настани во годината</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => handleNavigation('ManageAnnouncements')}>
        <Card.Content>
          <Title>📢 Огласи во Календар</Title>
          <Paragraph>Огласи кои се прикажуваат во календарот со временски период</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => handleNavigation('ManageNews')}>
        <Card.Content>
          <Title>📰 Новости</Title>
          <Paragraph>Новости во секцијата „Новости" (слики, видеа, линкови)</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => handleNavigation('ManageParking')}>
        <Card.Content>
          <Title>🅿️ Паркинг</Title>
          <Paragraph>Управувај со паркинг локации, правила и испраќај известувања</Paragraph>
        </Card.Content>
      </Card>

      {/* ======= NOTIFICATIONS ======= */}
      <Title style={styles.sectionHeader}>Нотификации</Title>

      <Card style={styles.card} onPress={() => handleNavigation('AutoNotificationSettings')}>
        <Card.Content>
          <Title>⚙️ Автоматски Известувања</Title>
          <Paragraph>Поставки за автоматски известувања пред настани</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => { updateLastActivity(); setNotificationDialogVisible(true); }}>
        <Card.Content>
          <Title>🚨 Итна Нотификација</Title>
          <Paragraph>Испрати push нотификација до сите корисници веднаш</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => handleNavigation('NotificationHistory')}>
        <Card.Content>
          <Title>📋 Историја на Нотификации</Title>
          <Paragraph>Преглед на испратени нотификации (последни 30 дена)</Paragraph>
        </Card.Content>
      </Card>

      {/* ======= SOCIAL MEDIA ======= */}
      <Title style={styles.sectionHeader}>Социјални Мрежи</Title>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.socialButtons}>
            <Button 
              mode="contained" 
              icon="facebook"
              onPress={SocialMediaService.openFacebookGroup}
              style={[styles.socialButton, { backgroundColor: '#4267B2' }]}
            >
              Facebook Група
            </Button>
            <Button 
              mode="contained"
              icon="web"
              onPress={SocialMediaService.openWebsite}
              style={[styles.socialButton, { backgroundColor: COLORS.PRIMARY }]}
            >
              Веб-страница
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Одјави се
      </Button>

      {/* Custom Modal for Notification */}
      <Modal
        visible={notificationDialogVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setNotificationDialogVisible(false);
          setNotificationResult(null);
          setNotificationMessage('');
          notificationMessageRef.current = '';
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Title style={styles.modalTitle}>Испрати Известување до Сите Корисници</Title>

              <Text style={styles.inputLabel}>Порака</Text>
              <NativeTextInput
                defaultValue={notificationMessage}
                onChangeText={(text) => { notificationMessageRef.current = text; }}
                multiline
                numberOfLines={6}
                editable={!sendingNotification}
                placeholder="Внесете ја пораката што сакате да ја испратите до сите корисници..."
                style={styles.notificationInput}
                textAlignVertical="top"
              />

              {notificationResult && (
                <View style={styles.resultContainer}>
                  {notificationResult.success ? (
                    <Text style={styles.successText}>
                      Известувањето е успешно испратено до {notificationResult.sentCount} корисник(и)!
                    </Text>
                  ) : (
                    <Text style={styles.errorText}>
                      Грешка: {notificationResult.error || 'Неуспешно испраќање'}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    Keyboard.dismiss();
                    setNotificationDialogVisible(false);
                    setNotificationResult(null);
                    setNotificationMessage('');
                    notificationMessageRef.current = '';
                  }}
                  disabled={sendingNotification}
                  style={styles.modalButton}
                >
                  Откажи
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    Keyboard.dismiss();
                    handleSendNotification();
                  }}
                  loading={sendingNotification}
                  disabled={sendingNotification}
                  style={styles.modalButton}
                >
                  {sendingNotification ? 'Испраќање...' : 'Испрати'}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Portal>

        <Dialog
          visible={automatedSettingsVisible}
          onDismiss={() => setAutomatedSettingsVisible(false)}
          style={[styles.dialog, styles.largeDialog]}
        >
          <Dialog.Title>Автоматски Известувања за Настани</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.settingsSection}>
                <Title style={styles.sectionTitle}>Време на Известувања</Title>
                <List.Item
                  title="1 недела пред настан"
                  right={props => (
                    <Switch
                      {...props}
                      value={automatedSettings.weekBefore}
                      onValueChange={value => 
                        setAutomatedSettings({...automatedSettings, weekBefore: value})
                      }
                    />
                  )}
                />
                <List.Item
                  title="1 ден пред настан"
                  right={props => (
                    <Switch
                      {...props}
                      value={automatedSettings.dayBefore}
                      onValueChange={value => 
                        setAutomatedSettings({...automatedSettings, dayBefore: value})
                      }
                    />
                  )}
                />
                <List.Item
                  title="1 час пред настан"
                  right={props => (
                    <Switch
                      {...props}
                      value={automatedSettings.hourBefore}
                      onValueChange={value => 
                        setAutomatedSettings({...automatedSettings, hourBefore: value})
                      }
                    />
                  )}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingsSection}>
                <Title style={styles.sectionTitle}>Настани и Содржина</Title>
                {CHURCH_EVENTS.map((event: ChurchEvent, index: number) => (
                  <List.Item
                    key={index}
                    title={event.name}
                    description={format(event.date, 'dd MMMM yyyy', { locale: mk })}
                    right={props => (
                      <IconButton
                        {...props}
                        icon="pencil"
                        onPress={() => handleEventSelect(event)}
                      />
                    )}
                  />
                ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAutomatedSettingsVisible(false)}>Откажи</Button>
            <Button onPress={handleAutomatedSettingsUpdate}>Зачувај и Постави</Button>
          </Dialog.Actions>
        </Dialog>

        {renderEventContentDialog()}
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F0',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 40,
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
    borderRadius: 10,
  },
  dialog: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
  },
  largeDialog: {
    maxHeight: '80%',
  },
  divider: {
    marginVertical: 16,
  },
  settingsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: COLORS.PRIMARY,
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  messageInput: {
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  socialButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal styles for notification
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  notificationInput: {
    minHeight: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
  },
}); 