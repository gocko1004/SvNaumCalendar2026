import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
  Text
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import { ChurchEvent, CHURCH_EVENTS, ServiceType } from '../../services/ChurchCalendarService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_STORAGE_KEY = '@church_calendar';

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

  const loadCalendar = async () => {
    try {
      const savedCalendar = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
      if (savedCalendar) {
        const parsedCalendar = JSON.parse(savedCalendar);
        // Convert string dates back to Date objects
        const eventsWithDates = parsedCalendar.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(eventsWithDates);
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  const saveCalendar = async (updatedEvents: ChurchEvent[]) => {
    try {
      await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updatedEvents));
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
      description: event.description
    });
    setEditDialogVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent || !editedEvent.name || !editedEvent.date || !editedEvent.time) return;

    const updatedEvents = events.map(event => 
      event === selectedEvent ? { ...event, ...editedEvent } as ChurchEvent : event
    );

    await saveCalendar(updatedEvents);
    setEditDialogVisible(false);
  };

  const handleDeleteEvent = async (eventToDelete: ChurchEvent) => {
    const updatedEvents = events.filter(event => event !== eventToDelete);
    await saveCalendar(updatedEvents);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setEditedEvent({
      name: '',
      date: new Date(),
      time: '09:00',
      serviceType: 'LITURGY',
      description: ''
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
      <Title style={styles.title}>Годишен Календар</Title>

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
        {filteredEvents.map((event, index) => (
          <Card key={index} style={styles.eventCard}>
            <Card.Content>
              <View style={styles.eventHeader}>
                <View>
                  <Title>{event.name}</Title>
                  <Text>{format(event.date, 'dd MMMM yyyy', { locale: mk })}</Text>
                  <Text>Време: {event.time}</Text>
                  <Text>Тип: {getServiceTypeLabel(event.serviceType)}</Text>
                </View>
                <View style={styles.actions}>
                  <IconButton
                    icon="pencil"
                    onPress={() => handleEditEvent(event)}
                  />
                  <IconButton
                    icon="delete"
                    onPress={() => handleDeleteEvent(event)}
                  />
                </View>
              </View>
              {event.description && (
                <Text style={styles.description}>{event.description}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>
            {selectedEvent ? 'Измени Настан' : 'Нов Настан'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Име на настанот"
              value={editedEvent.name}
              onChangeText={name => setEditedEvent({ ...editedEvent, name })}
              style={styles.input}
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
                value={new Date(`2025-01-01T${editedEvent.time || '09:00'}`)}
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
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Откажи</Button>
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
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 16,
  },
  addButton: {
    marginBottom: 16,
    backgroundColor: COLORS.PRIMARY,
  },
  eventCard: {
    marginBottom: 12,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
  },
  description: {
    marginTop: 8,
    color: COLORS.TEXT,
  },
  dialog: {
    backgroundColor: COLORS.SURFACE,
  },
  input: {
    marginBottom: 16,
  },
}); 