import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Title, Snackbar } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/theme';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const EventFormScreen = () => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    // Comprehensive input validation
    if (!trimmedTitle || !trimmedDescription) {
      setSnackbarMessage('Пополнете ги задолжителните полиња (наслов и опис)');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedTitle.length < 3) {
      setSnackbarMessage('Насловот мора да има барем 3 знаци');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedTitle.length > 100) {
      setSnackbarMessage('Насловот не може да биде подолг од 100 знаци');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedDescription.length < 10) {
      setSnackbarMessage('Описот мора да има барем 10 знаци');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedDescription.length > 500) {
      setSnackbarMessage('Описот не може да биде подолг од 500 знаци');
      setSnackbarVisible(true);
      return;
    }

    try {
      // Combine date and time
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      // Save event to Firestore
      const eventsRef = collection(db, 'customEvents');
      await addDoc(eventsRef, {
        title: trimmedTitle,
        description: trimmedDescription,
        location: trimmedLocation,
        date: eventDateTime.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSnackbarMessage(t.eventSaved || 'Настанот е зачуван успешно');
      setSnackbarVisible(true);

      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setDate(new Date());
      setTime(new Date());
    } catch (error) {
      console.error('Error saving event:', error);
      setSnackbarMessage('Грешка при зачувување на настанот');
      setSnackbarVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{t.addEvent}</Title>

      <TextInput
        label={t.eventTitle}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        label={t.eventDescription}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        {format(date, 'dd.MM.yyyy')}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <Button
        mode="outlined"
        onPress={() => setShowTimePicker(true)}
        style={styles.input}
      >
        {format(time, 'HH:mm')}
      </Button>

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      <TextInput
        label={t.eventLocation}
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
      >
        {t.saveEvent}
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.PRIMARY,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.PRIMARY,
  },
}); 