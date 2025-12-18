import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { ChurchEvent, getServiceTypeLabel } from '../../services/ChurchCalendarService';
import {
  EventCustomField,
  EventFieldType,
  FIELD_TYPE_CONFIG,
  getEventDetails,
  saveEventDetails,
  generateEventId,
  generateFieldId,
} from '../../services/EventDetailsService';
import {
  pickSingleImage,
  pickVideo,
  uploadMedia,
  MediaAsset,
} from '../../services/MediaUploadService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';

interface EventDetailsEditorProps {
  visible: boolean;
  event: ChurchEvent | null;
  onClose: () => void;
  onSave: () => void;
}

const AVAILABLE_FIELD_TYPES: EventFieldType[] = [
  'biography',
  'guest',
  'readings',
  'note',
  'image',
  'video',
  'location',
];

export const EventDetailsEditor: React.FC<EventDetailsEditorProps> = ({
  visible,
  event,
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState<EventCustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (visible && event) {
      loadEventDetails();
    }
  }, [visible, event]);

  const loadEventDetails = async () => {
    if (!event) return;
    setIsLoading(true);
    const eventId = generateEventId(event.date, event.serviceType);
    const details = await getEventDetails(eventId);
    setFields(details?.customFields || []);
    setIsLoading(false);
  };

  const handleAddField = (fieldType: EventFieldType) => {
    const config = FIELD_TYPE_CONFIG[fieldType];
    const newField: EventCustomField = {
      id: generateFieldId(),
      type: fieldType,
      label: config.label,
      content: '',
      order: fields.length,
    };
    setFields([...fields, newField]);
    setShowAddFieldMenu(false);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<EventCustomField>) => {
    setFields(fields.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    ));
  };

  const handleRemoveField = (fieldId: string) => {
    Alert.alert(
      'Избриши поле',
      'Дали сте сигурни дека сакате да го избришете ова поле?',
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: () => {
            setFields(fields.filter(f => f.id !== fieldId));
          },
        },
      ]
    );
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    // Update order values
    newFields.forEach((f, i) => {
      f.order = i;
    });

    setFields(newFields);
  };

  const handleMediaUpload = async (fieldId: string, fieldType: EventFieldType) => {
    if (!event) return;

    try {
      let asset: MediaAsset | null = null;

      if (fieldType === 'image') {
        asset = await pickSingleImage();
      } else if (fieldType === 'video') {
        asset = await pickVideo();
      }

      if (!asset) return;

      setUploadingFieldId(fieldId);
      setUploadProgress(0);

      const eventId = generateEventId(event.date, event.serviceType);
      const url = await uploadMedia(asset, `event-details/${eventId}`, (progress) => {
        setUploadProgress(progress);
      });

      handleUpdateField(fieldId, { content: url });
      Alert.alert('Успешно', 'Датотеката е прикачена');
    } catch (error: any) {
      Alert.alert('Грешка', error.message || 'Не можеше да се прикачи датотеката');
    } finally {
      setUploadingFieldId(null);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!event) return;

    // Validate fields
    const emptyFields = fields.filter(f => !f.content.trim());
    if (emptyFields.length > 0) {
      Alert.alert(
        'Празни полиња',
        'Некои полиња се празни. Дали сакате да ги зачувате без содржина?',
        [
          { text: 'Откажи', style: 'cancel' },
          {
            text: 'Зачувај',
            onPress: () => saveFields(),
          },
        ]
      );
      return;
    }

    await saveFields();
  };

  const saveFields = async () => {
    if (!event) return;
    setIsSaving(true);

    const eventId = generateEventId(event.date, event.serviceType);
    const nonEmptyFields = fields.filter(f => f.content.trim());

    const success = await saveEventDetails(eventId, nonEmptyFields);

    setIsSaving(false);

    if (success) {
      Alert.alert('Успешно', 'Деталите се зачувани', [
        { text: 'OK', onPress: () => { onSave(); onClose(); } }
      ]);
    } else {
      Alert.alert('Грешка', 'Не можеше да се зачуваат деталите');
    }
  };

  const renderFieldEditor = (field: EventCustomField, index: number) => {
    const config = FIELD_TYPE_CONFIG[field.type];

    return (
      <View key={field.id} style={styles.fieldEditorContainer}>
        {/* Field Header */}
        <View style={styles.fieldEditorHeader}>
          <View style={styles.fieldTypeIndicator}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={18}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.fieldTypeName}>{config.label}</Text>
          </View>

          <View style={styles.fieldActions}>
            <TouchableOpacity
              style={styles.fieldActionButton}
              onPress={() => handleMoveField(field.id, 'up')}
              disabled={index === 0}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={20}
                color={index === 0 ? '#ccc' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fieldActionButton}
              onPress={() => handleMoveField(field.id, 'down')}
              disabled={index === fields.length - 1}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={index === fields.length - 1 ? '#ccc' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fieldActionButton, styles.deleteButton]}
              onPress={() => handleRemoveField(field.id)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Label Input */}
        <TextInput
          style={styles.labelInput}
          value={field.label}
          onChangeText={(text) => handleUpdateField(field.id, { label: text })}
          placeholder="Наслов на полето"
          placeholderTextColor="#999"
        />

        {/* Media Upload for image/video fields */}
        {(field.type === 'image' || field.type === 'video') ? (
          <View style={styles.mediaUploadContainer}>
            {/* Preview */}
            {field.content ? (
              <View style={styles.mediaPreviewContainer}>
                {field.type === 'image' ? (
                  <Image source={{ uri: field.content }} style={styles.mediaPreview} />
                ) : (
                  <View style={styles.videoPreviewPlaceholder}>
                    <MaterialCommunityIcons name="video" size={40} color={COLORS.PRIMARY} />
                    <Text style={styles.videoPreviewText}>Видео прикачено</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => handleUpdateField(field.id, { content: '' })}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Upload Button */}
            {uploadingFieldId === field.id ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.uploadingText}>
                  Се прикачува... {Math.round(uploadProgress)}%
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleMediaUpload(field.id, field.type)}
              >
                <MaterialCommunityIcons
                  name={field.type === 'image' ? 'image-plus' : 'video-plus'}
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.uploadButtonText}>
                  {field.content ? 'Замени' : 'Прикачи'} {field.type === 'image' ? 'слика' : 'видео'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Optional URL input */}
            <Text style={styles.orText}>или внесете URL:</Text>
            <TextInput
              style={styles.contentInput}
              value={field.content}
              onChangeText={(text) => handleUpdateField(field.id, { content: text })}
              placeholder={config.placeholder}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : (
          /* Content Input for other field types */
          <TextInput
            style={[
              styles.contentInput,
              config.multiline && styles.contentInputMultiline,
            ]}
            value={field.content}
            onChangeText={(text) => handleUpdateField(field.id, { content: text })}
            placeholder={config.placeholder}
            placeholderTextColor="#999"
            multiline={config.multiline}
            numberOfLines={config.multiline ? 4 : 1}
            textAlignVertical={config.multiline ? 'top' : 'center'}
          />
        )}
      </View>
    );
  };

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Уреди Детали</Text>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Зачувај</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.eventMeta}>
            <MaterialCommunityIcons name="calendar" size={14} color="#666" />
            <Text style={styles.eventMetaText}>
              {format(event.date, 'dd MMMM yyyy', { locale: mk })}
            </Text>
            <Text style={styles.eventMetaDot}>•</Text>
            <Text style={styles.eventMetaText}>
              {getServiceTypeLabel(event.serviceType)}
            </Text>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Се вчитува...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Fields List */}
            {fields.length > 0 ? (
              <View style={styles.fieldsList}>
                {fields.map((field, index) => renderFieldEditor(field, index))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="text-box-plus-outline"
                  size={48}
                  color="#ccc"
                />
                <Text style={styles.emptyTitle}>Нема додадени полиња</Text>
                <Text style={styles.emptySubtitle}>
                  Притиснете "Додај поле" за да додадете информации
                </Text>
              </View>
            )}

            {/* Add Field Button */}
            <TouchableOpacity
              style={styles.addFieldButton}
              onPress={() => setShowAddFieldMenu(true)}
            >
              <MaterialCommunityIcons name="plus" size={22} color={COLORS.PRIMARY} />
              <Text style={styles.addFieldButtonText}>Додај поле</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Add Field Menu Modal */}
        <Modal
          visible={showAddFieldMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddFieldMenu(false)}
        >
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddFieldMenu(false)}
          >
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Избери тип на поле</Text>
              {AVAILABLE_FIELD_TYPES.map((fieldType) => {
                const config = FIELD_TYPE_CONFIG[fieldType];
                return (
                  <TouchableOpacity
                    key={fieldType}
                    style={styles.menuItem}
                    onPress={() => handleAddField(fieldType)}
                  >
                    <View style={styles.menuItemIcon}>
                      <MaterialCommunityIcons
                        name={config.icon as any}
                        size={22}
                        color={COLORS.PRIMARY}
                      />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{config.label}</Text>
                      <Text style={styles.menuItemDescription}>
                        {config.placeholder}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#ccc"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  eventInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  eventMetaDot: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldsList: {
    gap: 16,
  },
  fieldEditorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fieldTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 6,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  labelInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  contentInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addFieldButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  // Add Field Menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 8,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Media Upload Styles
  mediaUploadContainer: {
    gap: 12,
  },
  mediaPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPreviewPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY + '15',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  orText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default EventDetailsEditor;
