import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Alert
} from 'react-native';
import { TextInput, Button, Title, Snackbar, Menu, Text, Card } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/theme';
import { addEvent } from '../services/FirestoreEventService';
import { ServiceType } from '../services/ChurchCalendarService';

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'LITURGY', label: 'Литургија' },
  { value: 'EVENING_SERVICE', label: 'Вечерна Богослужба' },
  { value: 'CHURCH_OPEN', label: 'Црквата е отворена / Без свештеник' },
  { value: 'CHURCH_OPEN_PRIEST', label: 'Црквата е отворена / Свештеник присутен' },
  { value: 'PICNIC', label: 'Пикник' },
];

export const EventFormScreen = () => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>('LITURGY');
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Pick image from gallery
  const pickImage = async () => {
    dismissKeyboard();

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Дозвола', 'Потребна е дозвола за пристап до галеријата');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageUri(null);
  };

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
        setImageUri(null);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Title style={styles.title}>{t.addEvent || 'Додади Настан'}</Title>

          <TextInput
            label="Име на настанот"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            maxLength={100}
          />

          <Button
            mode="outlined"
            onPress={() => { dismissKeyboard(); setShowDatePicker(true); }}
            style={styles.input}
          >
            📅 {format(date, 'dd.MM.yyyy')}
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
            onPress={() => { dismissKeyboard(); setShowTimePicker(true); }}
            style={styles.input}
          >
            🕐 {format(time, 'HH:mm')}
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
                onPress={() => { dismissKeyboard(); setServiceTypeMenuVisible(true); }}
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

          {/* Image Picker Section */}
          <Card style={styles.imageCard}>
            <Card.Content>
              <Text style={styles.imageLabel}>Слика (опционално)</Text>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <Button
                    mode="outlined"
                    onPress={removeImage}
                    style={styles.removeImageButton}
                    textColor={COLORS.PRIMARY}
                  >
                    Отстрани
                  </Button>
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  icon="image-plus"
                  style={styles.pickImageButton}
                >
                  Избери од галерија
                </Button>
              )}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Се зачувува...' : (t.saveEvent || 'Зачувај')}
          </Button>

          {/* Extra padding at bottom for keyboard */}
          <View style={styles.bottomPadding} />

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
          >
            {snackbarMessage}
          </Snackbar>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.PRIMARY,
    fontSize: 22,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    borderRadius: 6,
  },
  imageCard: {
    marginBottom: 16,
    borderRadius: 6,
    backgroundColor: '#FFFDF8',
  },
  imageLabel: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginBottom: 12,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 6,
    marginBottom: 12,
  },
  removeImageButton: {
    borderColor: COLORS.PRIMARY,
  },
  pickImageButton: {
    borderStyle: 'dashed',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 6,
    paddingVertical: 4,
  },
  bottomPadding: {
    height: 100,
  },
}); 