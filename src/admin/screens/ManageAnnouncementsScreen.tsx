import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Title,
  Card,
  Portal,
  Dialog,
  TextInput,
  Text,
  ActivityIndicator,
  Switch,
  SegmentedButtons
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import {
  Announcement,
  AnnouncementType,
  getAllAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  cleanupExpiredAnnouncements,
  ANNOUNCEMENT_TYPE_COLORS,
  ANNOUNCEMENT_TYPE_ICONS
} from '../../services/AnnouncementsService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type ManageAnnouncementsScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'ManageAnnouncements'>;
};

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'INFO', label: 'Информација' },
  { value: 'URGENT', label: 'Итно' },
  { value: 'EVENT', label: 'Настан' },
  { value: 'REMINDER', label: 'Потсетник' },
];

export const ManageAnnouncementsScreen: React.FC<ManageAnnouncementsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Separate state for each form field to prevent flickering
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<AnnouncementType>('INFO');
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [formPriority, setFormPriority] = useState(1);
  const [formImageUri, setFormImageUri] = useState<string | null>(null);
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formLinkText, setFormLinkText] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Pick image from gallery
  const pickImage = async () => {
    dismissKeyboard();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Дозвола', 'Потребна е дозвола за пристап до галеријата');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setFormImageUri(null);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormType('INFO');
    setFormStartDate(new Date());
    setFormEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setFormPriority(1);
    setFormImageUri(null);
    setFormLinkUrl('');
    setFormLinkText('');
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      // Clean up expired announcements first
      await cleanupExpiredAnnouncements();
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert('Грешка', 'Не можеше да се вчитаат известувањата');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedAnnouncement(null);
    resetForm();
    setEditDialogVisible(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormMessage(announcement.message);
    setFormType(announcement.type);
    setFormStartDate(announcement.startDate);
    setFormEndDate(announcement.endDate);
    setFormPriority(announcement.priority);
    setFormImageUri(announcement.imageUrl || null);
    setFormLinkUrl(announcement.linkUrl || '');
    setFormLinkText(announcement.linkText || '');
    setEditDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      Alert.alert('Грешка', 'Наслов и порака се задолжителни');
      return;
    }

    if (formStartDate > formEndDate) {
      Alert.alert('Грешка', 'Датумот на почеток мора да биде пред датумот на крај');
      return;
    }

    const announcementData: Partial<Announcement> = {
      title: formTitle.trim(),
      message: formMessage.trim(),
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate,
      priority: formPriority,
      isActive: true,
      imageUrl: formImageUri || undefined,
      linkUrl: formLinkUrl.trim() || undefined,
      linkText: formLinkText.trim() || undefined,
    };

    setLoading(true);
    try {
      if (selectedAnnouncement?.id) {
        const success = await updateAnnouncement(selectedAnnouncement.id, announcementData);
        if (success) {
          Alert.alert('Успех', 'Известувањето е ажурирано');
        } else {
          Alert.alert('Грешка', 'Не можеше да се ажурира известувањето');
        }
      } else {
        const id = await addAnnouncement(announcementData);
        if (id) {
          Alert.alert('Успех', 'Известувањето е додадено');
        } else {
          Alert.alert('Грешка', 'Не можеше да се додаде известувањето');
        }
      }
      setEditDialogVisible(false);
      resetForm();
      await loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Грешка', 'Грешка при зачувување');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    Alert.alert(
      'Избриши известување',
      `Дали сте сигурни дека сакате да го избришете "${announcement.title}"?`,
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await deleteAnnouncement(announcement.id!);
              if (success) {
                Alert.alert('Успех', 'Известувањето е избришано');
                await loadAnnouncements();
              } else {
                Alert.alert('Грешка', 'Не можеше да се избрише известувањето');
              }
            } catch (error) {
              console.error('Error deleting announcement:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (announcement: Announcement) => {
    setLoading(true);
    try {
      const success = await toggleAnnouncementActive(announcement.id!, !announcement.isActive);
      if (success) {
        await loadAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (announcement: Announcement) => {
    return new Date() > announcement.endDate;
  };

  const isActive = (announcement: Announcement) => {
    const now = new Date();
    return announcement.isActive && announcement.startDate <= now && announcement.endDate >= now;
  };

  const renderAnnouncementCard = (announcement: Announcement) => {
    const expired = isExpired(announcement);
    const active = isActive(announcement);
    const typeColor = ANNOUNCEMENT_TYPE_COLORS[announcement.type];
    const typeIcon = ANNOUNCEMENT_TYPE_ICONS[announcement.type];

    return (
      <Card
        key={announcement.id}
        style={[
          styles.announcementCard,
          { borderLeftColor: typeColor, opacity: expired ? 0.5 : 1 }
        ]}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name={typeIcon as any} size={24} color={typeColor} />
              <Text style={styles.cardTitle} numberOfLines={1}>{announcement.title}</Text>
            </View>
            <View style={styles.cardActions}>
              <Switch
                value={announcement.isActive}
                onValueChange={() => handleToggleActive(announcement)}
                color={COLORS.PRIMARY}
              />
            </View>
          </View>

          <Text style={styles.cardMessage} numberOfLines={2}>{announcement.message}</Text>

          <View style={styles.chipRow}>
            <View style={[styles.chipNative, { backgroundColor: typeColor + '20' }]}>
              <Text style={[styles.chipTextNative, { color: typeColor }]}>
                {ANNOUNCEMENT_TYPES.find(t => t.value === announcement.type)?.label}
              </Text>
            </View>
            {active && (
              <View style={[styles.chipNative, { backgroundColor: '#4CAF5020' }]}>
                <Text style={[styles.chipTextNative, { color: '#4CAF50' }]}>Активно</Text>
              </View>
            )}
            {expired && (
              <View style={[styles.chipNative, { backgroundColor: '#F4433620' }]}>
                <Text style={[styles.chipTextNative, { color: '#F44336' }]}>Истечено</Text>
              </View>
            )}
            <View style={[styles.chipNative, { backgroundColor: '#9E9E9E20' }]}>
              <Text style={[styles.chipTextNative, { color: '#666' }]}>
                Приоритет: {announcement.priority}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {format(announcement.startDate, 'dd.MM.yyyy', { locale: mk })} - {format(announcement.endDate, 'dd.MM.yyyy', { locale: mk })}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleEdit(announcement)}
              style={styles.editButtonTouch}
            >
              <Text style={styles.editButtonText}>Измени</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(announcement)}
              style={styles.deleteButtonTouch}
            >
              <Text style={styles.deleteButtonText}>Избриши</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Известувања</Title>
        <TouchableOpacity
          onPress={handleAddNew}
          style={styles.addButtonNative}
        >
          <Text style={styles.addButtonText}>+ Додади</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {announcements.length === 0 && !loading ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>Нема известувања</Text>
              <Text style={styles.emptySubtext}>
                Додадете ново известување кое ќе се прикажува во календарот
              </Text>
            </Card.Content>
          </Card>
        ) : (
          announcements.map(renderAnnouncementCard)
        )}
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal
        visible={editDialogVisible}
        animationType="slide"
        onRequestClose={() => { dismissKeyboard(); setEditDialogVisible(false); setShowStartDatePicker(false); setShowEndDatePicker(false); }}
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <Title style={styles.dialogTitle}>
                {selectedAnnouncement ? 'Измени известување' : 'Ново известување'}
              </Title>
              <TouchableOpacity onPress={() => { dismissKeyboard(); setEditDialogVisible(false); setShowStartDatePicker(false); setShowEndDatePicker(false); }}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                label="Наслов *"
                value={formTitle}
                onChangeText={setFormTitle}
                style={styles.input}
                mode="outlined"
                maxLength={100}
                outlineStyle={styles.inputOutline}
              />

              <TextInput
                label="Порака *"
                value={formMessage}
                onChangeText={setFormMessage}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={6}
                maxLength={500}
                outlineStyle={styles.inputOutline}
              />

              <Text style={styles.inputLabel}>Тип на известување</Text>
              <SegmentedButtons
                value={formType}
                onValueChange={(value) => setFormType(value as AnnouncementType)}
                buttons={ANNOUNCEMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                style={styles.segmentedButtons}
              />

              <View style={styles.datePickerRow}>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.inputLabel}>Почеток</Text>
                  <TouchableOpacity
                    onPress={() => { dismissKeyboard(); setShowStartDatePicker(!showStartDatePicker); setShowEndDatePicker(false); }}
                    style={styles.dateButtonNative}
                  >
                    <Text style={styles.dateButtonText}>📅 {format(formStartDate, 'dd.MM.yyyy')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.inputLabel}>Крај</Text>
                  <TouchableOpacity
                    onPress={() => { dismissKeyboard(); setShowEndDatePicker(!showEndDatePicker); setShowStartDatePicker(false); }}
                    style={styles.dateButtonNative}
                  >
                    <Text style={styles.dateButtonText}>📅 {format(formEndDate, 'dd.MM.yyyy')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* iOS Inline Date Pickers */}
              {Platform.OS === 'ios' && showStartDatePicker && (
                <View style={styles.iosDatePickerContainer}>
                  <Text style={styles.datePickerLabel}>Избери датум на почеток:</Text>
                  <DateTimePicker
                    value={formStartDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) setFormStartDate(date);
                    }}
                    style={styles.iosDatePicker}
                  />
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)} style={styles.datePickerDoneButtonNative}>
                    <Text style={styles.datePickerDoneText}>Готово</Text>
                  </TouchableOpacity>
                </View>
              )}

              {Platform.OS === 'ios' && showEndDatePicker && (
                <View style={styles.iosDatePickerContainer}>
                  <Text style={styles.datePickerLabel}>Избери датум на крај:</Text>
                  <DateTimePicker
                    value={formEndDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) setFormEndDate(date);
                    }}
                    style={styles.iosDatePicker}
                  />
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)} style={styles.datePickerDoneButtonNative}>
                    <Text style={styles.datePickerDoneText}>Готово</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.inputLabel}>Приоритет (1-5)</Text>
              <SegmentedButtons
                value={String(formPriority)}
                onValueChange={(value) => setFormPriority(parseInt(value))}
                buttons={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                ]}
                style={styles.segmentedButtons}
              />

              {/* Image Picker */}
              <Text style={styles.inputLabel}>Слика (опционално)</Text>
              <View style={styles.imageSection}>
                {formImageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: formImageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      onPress={removeImage}
                      style={styles.removeImageButtonNative}
                    >
                      <Text style={styles.removeImageButtonText}>Отстрани</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.pickImageButtonNative}
                  >
                    <MaterialCommunityIcons name="image-plus" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.pickImageButtonText}>Избери од галерија</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                label="Линк URL (опционално)"
                value={formLinkUrl}
                onChangeText={setFormLinkUrl}
                style={styles.input}
                mode="outlined"
                keyboardType="url"
                autoCapitalize="none"
                outlineStyle={styles.inputOutline}
              />

              <TextInput
                label="Текст на линк (опционално)"
                value={formLinkText}
                onChangeText={setFormLinkText}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
              />

              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveButtonNative}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Зачувувам...' : 'Зачувај'}
                </Text>
              </TouchableOpacity>

              {/* Bottom padding for keyboard */}
              <View style={{ height: 50 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Android Date Pickers */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={formStartDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              setFormStartDate(date);
            }
          }}
        />
      )}

      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={formEndDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              setFormEndDate(date);
            }
          }}
        />
      )}
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
    paddingHorizontal: 16,
    paddingTop: 23,
    paddingBottom: 16,
    backgroundColor: '#FFFDF8',
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  addButton: {
    borderRadius: 6,
    elevation: 3,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  addButtonNative: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  announcementCard: {
    marginBottom: 14,
    borderLeftWidth: 4,
    borderRadius: 6,
    backgroundColor: '#FFFDF8',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  chipNative: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chipTextNative: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateRow: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 6,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  dialog: {
    maxHeight: Dimensions.get('window').height * 0.85,
    borderRadius: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  input: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  inputOutline: {
    borderRadius: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  datePickerContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateButton: {
    marginTop: 4,
    borderRadius: 6,
  },
  dateButtonNative: {
    marginTop: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#333',
    fontSize: 14,
  },
  saveButtonNative: {
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  iosDatePicker: {
    width: '100%',
    height: 320,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    padding: 12,
    paddingBottom: 0,
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    marginRight: 8,
    marginBottom: 8,
  },
  datePickerDoneButtonNative: {
    alignSelf: 'flex-end',
    marginRight: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerDoneText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  removeImageButton: {
    borderColor: COLORS.PRIMARY,
    borderRadius: 6,
  },
  removeImageButtonNative: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  removeImageButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  pickImageButton: {
    borderRadius: 6,
  },
  pickImageButtonNative: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  pickImageButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
});

export default ManageAnnouncementsScreen;
