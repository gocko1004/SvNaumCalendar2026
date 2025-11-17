import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Portal, 
  Modal, 
  TextInput,
  Button,
  List,
  Chip,
  Divider,
  IconButton
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, SpecialEvent, Location } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../../firebase';

type SpecialEventsScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'SpecialEvents'>;
};

export const SpecialEventsScreen: React.FC<SpecialEventsScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<SpecialEvent>>({
    type: 'PICNIC',
    name: '',
    description: '',
    date: new Date(),
    requirements: []
  });

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.location) {
      // Show error
      return;
    }

    const event: SpecialEvent = selectedEvent
      ? { 
          ...selectedEvent, 
          name: newEvent.name, 
          date: newEvent.date || new Date(), 
          description: newEvent.description || '',
          type: newEvent.type || 'PICNIC',
          location: newEvent.location
        }
      : {
          id: Date.now().toString(),
          name: newEvent.name,
          date: newEvent.date || new Date(),
          description: newEvent.description || '',
          type: newEvent.type || 'PICNIC',
          location: newEvent.location
        };

    if (selectedEvent) {
      setEvents(events.map(evt => 
        evt.id === selectedEvent.id ? event : evt
      ));
    } else {
      setEvents([...events, event]);
    }

    setModalVisible(false);
    setSelectedEvent(null);
    setNewEvent({
      type: 'PICNIC',
      name: '',
      description: '',
      date: new Date(),
      requirements: []
    });
  };

  const pickLocation = () => {
    navigation.navigate('ManageLocations', { eventId: selectedEvent?.id });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>Специјални Настани</Title>

        {events.map((event) => (
          <Card key={event.id} style={styles.eventCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>{event.name}</Title>
                <Chip icon="calendar">{format(event.date, 'dd MMMM yyyy', { locale: mk })}</Chip>
              </View>
              
              <Paragraph>{event.description}</Paragraph>
              
              <View style={styles.locationInfo}>
                <List.Item
                  title={event.location.name}
                  description={event.location.address}
                  left={props => <List.Icon {...props} icon="map-marker" />}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.chipContainer}>
                {event.requirements?.map((req, index) => (
                  <Chip key={index} style={styles.chip} icon="information">
                    {req}
                  </Chip>
                ))}
              </View>

              <View style={styles.actions}>
                <IconButton
                  icon="pencil"
                  onPress={() => {
                    setSelectedEvent(event);
                    setModalVisible(true);
                  }}
                />
                <IconButton
                  icon="bell"
                  onPress={() => navigation.navigate('AdminDashboard')}
                />
                <IconButton
                  icon="map-marker"
                  onPress={() => navigation.navigate('ManageLocations', { eventId: event.id })}
                />
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Title>{selectedEvent ? 'Измени Настан' : 'Нов Специјален Настан'}</Title>
            
            <TextInput
              label="Име на настанот"
              value={newEvent.name}
              onChangeText={name => setNewEvent({ ...newEvent, name })}
              style={styles.input}
            />

            <TextInput
              label="Опис"
              value={newEvent.description}
              onChangeText={description => setNewEvent({ ...newEvent, description })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
            >
              {newEvent.date ? format(newEvent.date, 'dd.MM.yyyy') : 'Избери датум'}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={newEvent.date || new Date()}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setNewEvent({ ...newEvent, date });
                  }
                }}
              />
            )}

            <Button
              mode="outlined"
              onPress={pickLocation}
              style={styles.input}
              icon="map-marker"
            >
              {newEvent.location ? newEvent.location.name : 'Избери локација'}
            </Button>

            <TextInput
              label="Контакт лице"
              value={newEvent.contactPerson?.name}
              onChangeText={name => 
                setNewEvent({ 
                  ...newEvent, 
                  contactPerson: { ...newEvent.contactPerson, name } as any 
                })
              }
              style={styles.input}
            />

            <TextInput
              label="Телефон"
              value={newEvent.contactPerson?.phone}
              onChangeText={phone => 
                setNewEvent({ 
                  ...newEvent, 
                  contactPerson: { ...newEvent.contactPerson, phone } as any 
                })
              }
              style={styles.input}
            />

            <View style={styles.buttonContainer}>
              <Button onPress={() => setModalVisible(false)} style={styles.button}>
                Откажи
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreateEvent}
                style={styles.button}
              >
                {selectedEvent ? 'Зачувај' : 'Креирај'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          setSelectedEvent(null);
          setModalVisible(true);
        }}
        label="Нов Настан"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    margin: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  eventCard: {
    margin: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfo: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
}); 