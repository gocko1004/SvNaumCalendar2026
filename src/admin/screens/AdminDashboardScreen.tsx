import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
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
  const { logout } = useAuth();
  const [notificationDialogVisible, setNotificationDialogVisible] = useState(false);
  const [automatedSettingsVisible, setAutomatedSettingsVisible] = useState(false);
  const [eventContentDialogVisible, setEventContentDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
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
    if (!notificationMessage.trim()) {
      return;
    }

    setSendingNotification(true);
    setNotificationResult(null);

    try {
      // Send push notification to all users
      const result = await NotificationService.sendPushNotificationToAllUsers({
        title: 'Важно Известување',
        message: notificationMessage,
        urgent: true
      });

      setNotificationResult(result);

      if (result.success) {
        setNotificationMessage('');
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

      <Card style={styles.card} onPress={() => navigation.navigate('AddEvent')}>
        <Card.Content>
          <Title>Додади Настан</Title>
          <Paragraph>Креирај нов настан во календарот</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('ManageCalendar')}>
        <Card.Content>
          <Title>Годишен Календар</Title>
          <Paragraph>Измени ги настаните во годишниот календар</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => setAutomatedSettingsVisible(true)}>
        <Card.Content>
          <Title>Автоматски Известувања</Title>
          <Paragraph>Постави автоматски известувања за сите настани во годината</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('SpecialEvents')}>
        <Card.Content>
          <Title>Специјални Настани</Title>
          <Paragraph>Управувај со пикници и специјални собири</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('ManageLocations', { eventId: undefined })}>
        <Card.Content>
          <Title>Локации</Title>
          <Paragraph>Додади и измени локации за настани</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => setNotificationDialogVisible(true)}>
        <Card.Content>
          <Title>Известувања</Title>
          <Paragraph>Испрати известувања до сите корисници кои го имаат инсталирано апликацијата</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Социјални Мрежи</Title>
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

      <Portal>
        <Dialog
          visible={notificationDialogVisible}
          onDismiss={() => {
            setNotificationDialogVisible(false);
            setNotificationResult(null);
            setNotificationMessage('');
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Испрати Известување до Сите Корисници</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Порака"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={3}
              disabled={sendingNotification}
              placeholder="Внесете ја пораката што сакате да ја испратите до сите корисници..."
            />
            {notificationResult && (
              <View style={styles.resultContainer}>
                {notificationResult.success ? (
                  <Paragraph style={styles.successText}>
                    ✅ Известувањето е успешно испратено до {notificationResult.sentCount} корисник(и)!
                  </Paragraph>
                ) : (
                  <Paragraph style={styles.errorText}>
                    ❌ Грешка: {notificationResult.error || 'Неуспешно испраќање'}
                  </Paragraph>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setNotificationDialogVisible(false);
                setNotificationResult(null);
                setNotificationMessage('');
              }}
              disabled={sendingNotification}
            >
              Откажи
            </Button>
            <Button 
              onPress={handleSendNotification}
              loading={sendingNotification}
              disabled={sendingNotification || !notificationMessage.trim()}
            >
              {sendingNotification ? 'Испраќање...' : 'Испрати до Сите'}
            </Button>
          </Dialog.Actions>
        </Dialog>

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
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 40,
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
    backgroundColor: COLORS.SURFACE,
  },
  successText: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.ERROR,
    fontWeight: 'bold',
  },
}); 