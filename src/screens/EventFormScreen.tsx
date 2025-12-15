import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Title, Snackbar, Menu } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/theme';
import { addEvent } from '../services/FirestoreEventService';
import { ServiceType } from '../services/ChurchCalendarService';

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'LITURGY', label: 'Литургија' },
  { value: 'EVENING_SERVICE', label: 'Вечерна Богослужба' },
  { value: 'CHURCH_OPEN', label: 'Црквата е отворена' },
  { value: 'PICNIC', label: 'Пикник' },
];

export const EventFormScreen = () => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('LITURGY');
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Comprehensive input validation
    if (!trimmedTitle) {
      setSnackbarMessage('Внесете име на настанот');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedTitle.length < 3) {
      setSnackbarMessage('Името мора да има барем 3 знаци');
      setSnackbarVisible(true);
      return;
    }

    if (trimmedTitle.length > 100) {
      setSnackbarMessage('Името не може да биде подолго од 100 знаци');
      setSnackbarVisible(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Combine date and time
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      // Save event to Firestore using the shared service
      const eventId = await addEvent({
        name: trimmedTitle,
        date: eventDateTime,
        time: format(time, 'HH:mm'),
        serviceType: serviceType,
        description: trimmedDescription || undefined,
      });

      if (eventId) {
        setSnackbarMessage(t.eventSaved || 'Настанот е зачуван успешно');
        setSnackbarVisible(true);

        // Reset form
        setTitle('');
        setDescription('');
        setLocation('');
        setDate(new Date());
        setTime(new Date());
        setServiceType('LITURGY');
      } else {
        setSnackbarMessage('Грешка при зачувување на настанот');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setSnackbarMessage('Грешка при зачувување на настанот');
      setSnackbarVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{t.addEvent}</Title>

      <TextInput
        label="Име на настанот"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        maxLength={100}
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

      <Menu
        visible={serviceTypeMenuVisible}
        onDismiss={() => setServiceTypeMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setServiceTypeMenuVisible(true)}
            style={styles.input}
          >
            {SERVICE_TYPES.find(st => st.value === serviceType)?.label || 'Избери тип'}
          </Button>
        }
      >
        {SERVICE_TYPES.map((st) => (
          <Menu.Item
            key={st.value}
            onPress={() => {
              setServiceType(st.value);
              setServiceTypeMenuVisible(false);
            }}
            title={st.label}
          />
        ))}
      </Menu>

      <TextInput
        label="Опис (опционално)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Се зачувува...' : (t.saveEvent || 'Зачувај')}
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