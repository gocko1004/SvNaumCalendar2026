import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { 
  Title, 
  Card, 
  Button, 
  Portal, 
  Dialog, 
  TextInput,
  List,
  IconButton,
  Divider,
  Searchbar,
  Menu,
  Text,
  ActivityIndicator
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import { ChurchEvent, CHURCH_EVENTS, ServiceType } from '../../services/ChurchCalendarService';
import { getAllEvents, addEvent, updateEvent, deleteEvent, mergeEvents } from '../../services/FirestoreEventService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getImageForEvent } from '../../services/LocalImageService';
import { sanitizeChurchEvent, rateLimiter } from '../../services/ValidationService';

const CALENDAR_STORAGE_KEY = '@church_calendar';

const SERVICE_TYPE_COLORS = {
  LITURGY: '#8B1A1A',          // Deep burgundy red
  EVENING_SERVICE: '#2C4A6E',  // Softer icon blue
  CHURCH_OPEN: '#8B5A2B',      // Warm burnt sienna
  PICNIC: '#CD853F'            // Peru/tan gold
} as const;

const SERVICE_TYPE_ICONS = {
  LITURGY: 'church' as const,
  EVENING_SERVICE: 'moon-waning-crescent' as const,
  CHURCH_OPEN: 'door-open' as const,
  PICNIC: 'food' as const
} as const;

type ManageCalendarScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'ManageCalendar'>;
};

export const ManageCalendarScreen: React.FC<ManageCalendarScreenProps> = ({ navigation }) => {
  const [events, setEvents] = useState<ChurchEvent[]>(CHURCH_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<ChurchEvent>>({});
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);

  useEffect(() => {
    loadCalendar();
  }, []);

  const [loading, setLoading] = useState(false);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const firestoreEvents = await getAllEvents();
      const merged = mergeEvents(CHURCH_EVENTS, firestoreEvents);
      setEvents(merged);
    } catch (error) {
      console.error('Error loading calendar from Firestore:', error);
      // Fallback to hardcoded events
      setEvents(CHURCH_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    await loadCalendar();
  };

  // Remove old AsyncStorage-based save (no longer needed)
  const saveCalendar = async (updatedEvents: ChurchEvent[]) => {
    try {
      // Deprecated - now using Firestore
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving calendar:', error);
    }
  };

  const handleEditEvent = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setEditedEvent({
      name: event.name,
      date: event.date,
      time: event.time,
      serviceType: event.serviceType,
      description: event.description,
      imageUrl: event.imageUrl,
      saintName: event.saintName
    });
    setEditDialogVisible(true);
  };

  const handleSaveEvent = async () => {
    // Validate required fields
    if (!editedEvent.name || !editedEvent.date || !editedEvent.time) {
      Alert.alert('Грешка', 'Ве молиме пополнете ги сите задолжителни полиња');
      return;
    }

    // Rate limiting - max 10 saves per minute
    if (!rateLimiter.isAllowed('save_event', 10, 60000)) {
      Alert.alert('Грешка', 'Премногу брзо додавате настани. Ве молиме почекајте малку.');
      return;
    }

    // Sanitize and validate the event data
    const sanitizedEvent = sanitizeChurchEvent(editedEvent);

    setLoading(true);
    try {
      if (selectedEvent && selectedEvent.id) {
        // Editing existing Firestore event
        const success = await updateEvent(selectedEvent.id, sanitizedEvent);
        if (success) {
          Alert.alert('Успех', 'Настанот е успешно ажуриран');
          await refreshEvents();
        } else {
          Alert.alert('Грешка', 'Настанот не може да се ажурира');
        }
      } else {
        // Adding new event to Firestore
        const eventId = await addEvent(sanitizedEvent);
        if (eventId) {
          Alert.alert('Успех', 'Настанот е успешно додаден');
          await refreshEvents();
        } else {
          Alert.alert('Грешка', 'Настанот не може да се додаде');
        }
      }
      setEditDialogVisible(false);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Грешка', 'Грешка при зачувување на настанот');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventToDelete: ChurchEvent) => {
    if (!eventToDelete.id) {
      Alert.alert('Грешка', 'Не може да се избрише хардкодиран настан');
      return;
    }

    Alert.alert(
      'Потврда',
      'Дали сте сигурни дека сакате да го избришете овој настан?',
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await deleteEvent(eventToDelete.id!);
              if (success) {
                Alert.alert('Успех', 'Настанот е успешно избришан');
                await refreshEvents();
              } else {
                Alert.alert('Грешка', 'Настанот не може да се избрише');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Грешка', 'Грешка при бришење на настанот');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setEditedEvent({
      name: '',
      date: new Date(),
      time: '09:00',
      serviceType: 'LITURGY',
      description: '',
      imageUrl: '',
      saintName: ''
    });
    setEditDialogVisible(true);
  };

  const filteredEvents = events
    .filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      format(event.date, 'dd MMMM yyyy', { locale: mk }).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const getServiceTypeLabel = (type: ServiceType): string => {
    switch (type) {
      case 'LITURGY':
        return 'Литургија';
      case 'EVENING_SERVICE':
        return 'Вечерна Богослужба';
      case 'CHURCH_OPEN':
        return 'Црквата е отворена / без свештеник';
      case 'PICNIC':
        return 'Пикник';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Годишен Календар 2026</Title>

      <Searchbar
        placeholder="Пребарувај настани"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <Button
        mode="contained"
        icon="plus"
        onPress={handleAddEvent}
        style={styles.addButton}
      >
        Додади Нов Настан
      </Button>

      <ScrollView>
        {filteredEvents.map((event, index) => {
          const localImage = getImageForEvent(event.name, event.date);
          
          return (
            <Card 
              key={index} 
              style={[
                styles.eventCard,
                { borderLeftColor: SERVICE_TYPE_COLORS[event.serviceType] }
              ]}
            >
              <Card.Content>
                <View style={styles.cardContent}>
                  <View style={styles.eventHeader}>
                    <View style={{ flex: 1 }}>
                      <Title style={styles.eventTitle}>{event.name}</Title>
                      {event.saintName && (
                        <Text style={styles.saintNameText}>{event.saintName}</Text>
                      )}
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditEvent(event)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteEvent(event)}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.cardDetails}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateDay}>
                        {format(event.date, 'dd', { locale: mk })}
                      </Text>
                      <Text style={styles.dateMonth}>
                        {format(event.date, 'MMM', { locale: mk })}
                      </Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <View style={styles.serviceTypeContainer}>
                        <MaterialCommunityIcons 
                          name={SERVICE_TYPE_ICONS[event.serviceType]} 
                          size={16} 
                          color={SERVICE_TYPE_COLORS[event.serviceType]} 
                        />
                        <Text style={[
                          styles.serviceType,
                          { color: SERVICE_TYPE_COLORS[event.serviceType] }
                        ]}>
                          {getServiceTypeLabel(event.serviceType)}
                        </Text>
                      </View>
                      <Text style={styles.time}>
                        {event.description || `Време: ${event.time}ч`}
                      </Text>
                    </View>

                    <View style={styles.rightContainer}>
                      <View style={styles.imageContainer}>
                        {localImage ? (
                          <Image
                            source={localImage}
                            style={styles.eventImage}
                            resizeMode="cover"
                          />
                        ) : event.imageUrl ? (
                          <Image
                            source={{ uri: event.imageUrl }}
                            style={styles.eventImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={SERVICE_TYPE_ICONS[event.serviceType]}
                            size={40}
                            color={SERVICE_TYPE_COLORS[event.serviceType]}
                            style={styles.fallbackIcon}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => { Keyboard.dismiss(); setEditDialogVisible(false); }}
          style={styles.dialog}
        >
          <Dialog.Title>
            {selectedEvent ? 'Измени Настан' : 'Нов Настан'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TextInput
              label="Име на настанот"
              value={editedEvent.name}
              onChangeText={name => setEditedEvent({ ...editedEvent, name })}
              style={styles.input}
              maxLength={200}
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
            >
              {editedEvent.date ? format(editedEvent.date, 'dd.MM.yyyy') : 'Избери датум'}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={editedEvent.date || new Date()}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setEditedEvent({ ...editedEvent, date });
                  }
                }}
              />
            )}

            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.input}
            >
              {editedEvent.time || 'Избери време'}
            </Button>

            {showTimePicker && (
              <DateTimePicker
                value={new Date(`2026-01-01T${editedEvent.time || '09:00'}`)}
                mode="time"
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    setEditedEvent({
                      ...editedEvent,
                      time: format(date, 'HH:mm')
                    });
                  }
                }}
              />
            )}

            <Menu
              visible={serviceTypeMenuVisible}
              onDismiss={() => setServiceTypeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setServiceTypeMenuVisible(true)}
                  style={styles.input}
                >
                  {editedEvent.serviceType ? getServiceTypeLabel(editedEvent.serviceType as ServiceType) : 'Избери тип'}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setEditedEvent({ ...editedEvent, serviceType: 'LITURGY' });
                  setServiceTypeMenuVisible(false);
                }}
                title="Литургија"
              />
              <Menu.Item
                onPress={() => {
                  setEditedEvent({ ...editedEvent, serviceType: 'EVENING_SERVICE' });
                  setServiceTypeMenuVisible(false);
                }}
                title="Вечерна Богослужба"
              />
              <Menu.Item
                onPress={() => {
                  setEditedEvent({ ...editedEvent, serviceType: 'CHURCH_OPEN' });
                  setServiceTypeMenuVisible(false);
                }}
                title="Црквата е отворена / без свештеник"
              />
              <Menu.Item
                onPress={() => {
                  setEditedEvent({ ...editedEvent, serviceType: 'PICNIC' });
                  setServiceTypeMenuVisible(false);
                }}
                title="Пикник"
              />
            </Menu>

            <TextInput
              label="Опис (опционално)"
              value={editedEvent.description}
              onChangeText={description => setEditedEvent({ ...editedEvent, description })}
              multiline
              numberOfLines={3}
              style={styles.input}
              maxLength={500}
            />

            <TextInput
              label="URL на слика (опционално)"
              value={editedEvent.imageUrl}
              onChangeText={imageUrl => setEditedEvent({ ...editedEvent, imageUrl })}
              placeholder="https://denovi.mk/synaxarion/..."
              style={styles.input}
              maxLength={500}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              label="Име на светец (опционално)"
              value={editedEvent.saintName}
              onChangeText={saintName => setEditedEvent({ ...editedEvent, saintName })}
              style={styles.input}
              maxLength={200}
            />
            {/* Bottom padding for keyboard */}
            <View style={{ height: 50 }} />
                </ScrollView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => { Keyboard.dismiss(); setEditDialogVisible(false); }}>Откажи</Button>
            <Button onPress={handleSaveEvent}>Зачувај</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
    marginBottom: 16,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 3,
  },
  addButton: {
    marginBottom: 16,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    elevation: 4,
  },
  eventCard: {
    marginBottom: 16,
    padding: 0,
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    paddingBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  saintNameText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    flexWrap: 'wrap',
    width: '100%',
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 60,
    width: 60,
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  dateMonth: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
    paddingRight: 12,
    minWidth: 120,
    flexShrink: 1,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.BACKGROUND,
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    maxWidth: '100%',
  },
  serviceType: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '600',
    color: COLORS.TEXT,
    flexShrink: 1,
    lineHeight: 16,
  },
  time: {
    fontSize: 13,
    color: COLORS.TERTIARY,
    fontWeight: '600',
    marginTop: 4,
    flexShrink: 1,
    lineHeight: 18,
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 4,
    flexShrink: 0,
    width: 120,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  fallbackIcon: {
    opacity: 0.7,
    fontSize: 70,
    color: COLORS.PRIMARY,
  },
  dialog: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
  },
  input: {
    marginBottom: 16,
  },
}); 