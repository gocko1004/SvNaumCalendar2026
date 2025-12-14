import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
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
  Text,
  ActivityIndicator,
  Chip,
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [editedAnnouncement, setEditedAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    type: 'INFO',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    priority: 1,
    isActive: true,
  });

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
    setEditedAnnouncement({
      title: '',
      message: '',
      type: 'INFO',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 1,
      isActive: true,
    });
    setEditDialogVisible(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditedAnnouncement({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      priority: announcement.priority,
      isActive: announcement.isActive,
      imageUrl: announcement.imageUrl,
      linkUrl: announcement.linkUrl,
      linkText: announcement.linkText,
    });
    setEditDialogVisible(true);
  };

  const handleSave = async () => {
    if (!editedAnnouncement.title || !editedAnnouncement.message) {
      Alert.alert('Грешка', 'Наслов и порака се задолжителни');
      return;
    }

    if (editedAnnouncement.startDate && editedAnnouncement.endDate &&
        editedAnnouncement.startDate > editedAnnouncement.endDate) {
      Alert.alert('Грешка', 'Датумот на почеток мора да биде пред датумот на крај');
      return;
    }

    setLoading(true);
    try {
      if (selectedAnnouncement?.id) {
        const success = await updateAnnouncement(selectedAnnouncement.id, editedAnnouncement);
        if (success) {
          Alert.alert('Успех', 'Известувањето е ажурирано');
        } else {
          Alert.alert('Грешка', 'Не можеше да се ажурира известувањето');
        }
      } else {
        const id = await addAnnouncement(editedAnnouncement);
        if (id) {
          Alert.alert('Успех', 'Известувањето е додадено');
        } else {
          Alert.alert('Грешка', 'Не можеше да се додаде известувањето');
        }
      }
      setEditDialogVisible(false);
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
            <Chip
              style={[styles.typeChip, { backgroundColor: typeColor + '20' }]}
              textStyle={{ color: typeColor, fontSize: 11 }}
            >
              {ANNOUNCEMENT_TYPES.find(t => t.value === announcement.type)?.label}
            </Chip>
            {active && (
              <Chip style={styles.activeChip} textStyle={{ color: '#4CAF50', fontSize: 11 }}>
                Активно
              </Chip>
            )}
            {expired && (
              <Chip style={styles.expiredChip} textStyle={{ color: '#F44336', fontSize: 11 }}>
                Истечено
              </Chip>
            )}
            <Chip style={styles.priorityChip} textStyle={{ fontSize: 11 }}>
              Приоритет: {announcement.priority}
            </Chip>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {format(announcement.startDate, 'dd.MM.yyyy', { locale: mk })} - {format(announcement.endDate, 'dd.MM.yyyy', { locale: mk })}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => handleEdit(announcement)}
              style={styles.editButton}
              labelStyle={{ fontSize: 12 }}
            >
              Измени
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDelete(announcement)}
              style={styles.deleteButton}
              textColor="#F44336"
              labelStyle={{ fontSize: 12 }}
            >
              Избриши
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Известувања</Title>
        <Button
          mode="contained"
          onPress={handleAddNew}
          style={styles.addButton}
          buttonColor={COLORS.PRIMARY}
        >
          + Додади
        </Button>
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

      {/* Edit/Add Dialog */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>
            {selectedAnnouncement ? 'Измени известување' : 'Ново известување'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <TextInput
                label="Наслов *"
                value={editedAnnouncement.title}
                onChangeText={(text) => setEditedAnnouncement({ ...editedAnnouncement, title: text })}
                style={styles.input}
                mode="outlined"
                maxLength={100}
              />

              <TextInput
                label="Порака *"
                value={editedAnnouncement.message}
                onChangeText={(text) => setEditedAnnouncement({ ...editedAnnouncement, message: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              <Text style={styles.inputLabel}>Тип на известување</Text>
              <SegmentedButtons
                value={editedAnnouncement.type || 'INFO'}
                onValueChange={(value) => setEditedAnnouncement({ ...editedAnnouncement, type: value as AnnouncementType })}
                buttons={ANNOUNCEMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                style={styles.segmentedButtons}
              />

              <View style={styles.datePickerRow}>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.inputLabel}>Почеток</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowStartDatePicker(true)}
                    style={styles.dateButton}
                  >
                    {editedAnnouncement.startDate
                      ? format(editedAnnouncement.startDate, 'dd.MM.yyyy')
                      : 'Избери датум'}
                  </Button>
                </View>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.inputLabel}>Крај</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowEndDatePicker(true)}
                    style={styles.dateButton}
                  >
                    {editedAnnouncement.endDate
                      ? format(editedAnnouncement.endDate, 'dd.MM.yyyy')
                      : 'Избери датум'}
                  </Button>
                </View>
              </View>

              <Text style={styles.inputLabel}>Приоритет (1-5)</Text>
              <SegmentedButtons
                value={String(editedAnnouncement.priority || 1)}
                onValueChange={(value) => setEditedAnnouncement({ ...editedAnnouncement, priority: parseInt(value) })}
                buttons={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                ]}
                style={styles.segmentedButtons}
              />

              <TextInput
                label="URL на слика (опционално)"
                value={editedAnnouncement.imageUrl || ''}
                onChangeText={(text) => setEditedAnnouncement({ ...editedAnnouncement, imageUrl: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Линк URL (опционално)"
                value={editedAnnouncement.linkUrl || ''}
                onChangeText={(text) => setEditedAnnouncement({ ...editedAnnouncement, linkUrl: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Текст на линк (опционално)"
                value={editedAnnouncement.linkText || ''}
                onChangeText={(text) => setEditedAnnouncement({ ...editedAnnouncement, linkText: text })}
                style={styles.input}
                mode="outlined"
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Откажи</Button>
            <Button onPress={handleSave} loading={loading}>Зачувај</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={editedAnnouncement.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              setEditedAnnouncement({ ...editedAnnouncement, startDate: date });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={editedAnnouncement.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              setEditedAnnouncement({ ...editedAnnouncement, endDate: date });
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
    padding: 16,
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
    borderRadius: 10,
    elevation: 3,
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
    borderRadius: 12,
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
    gap: 4,
  },
  typeChip: {
    height: 26,
  },
  activeChip: {
    backgroundColor: '#4CAF5020',
    height: 26,
  },
  expiredChip: {
    backgroundColor: '#F4433620',
    height: 26,
  },
  priorityChip: {
    backgroundColor: '#9E9E9E20',
    height: 26,
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
  editButton: {
    borderColor: COLORS.PRIMARY,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
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
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  input: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginHorizontal: 16,
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
  },
});

export default ManageAnnouncementsScreen;
