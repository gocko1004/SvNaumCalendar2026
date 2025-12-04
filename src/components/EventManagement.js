import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Button, 
  Portal, 
  Modal, 
  TextInput,
  List,
  Card,
  Title,
  Paragraph,
  FAB
} from 'react-native-paper';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    description: ''
  });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsList = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsList);
    };
    fetchEvents();
  }, []);

  // Add new event
  const handleAddEvent = async () => {
    try {
      await addDoc(collection(db, 'events'), newEvent);
      setOpen(false);
      // Refresh events list
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsList = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => setOpen(true)} style={styles.addButton}>
        Add Event
      </Button>
      
      <Portal>
        <Modal visible={open} onDismiss={() => setOpen(false)} contentContainerStyle={styles.modal}>
          <Card>
            <Card.Content>
              <Title>Add New Event</Title>
              <TextInput
                label="Title"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({...newEvent, title: text})}
                style={styles.input}
              />
              <TextInput
                label="Date"
                value={newEvent.date}
                onChangeText={(text) => setNewEvent({...newEvent, date: text})}
                style={styles.input}
              />
              <TextInput
                label="Description"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent({...newEvent, description: text})}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setOpen(false)}>Cancel</Button>
              <Button onPress={handleAddEvent}>Add Event</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
      
      <List.Section>
        {events.map((event) => (
          <List.Item
            key={event.id}
            title={event.title}
            description={event.date}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
        ))}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    marginBottom: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
});

export default EventManagement; 