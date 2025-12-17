import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Linking,
  ActivityIndicator,
  Platform,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { ChurchEvent, getServiceTypeLabel } from '../services/ChurchCalendarService';
import {
  EventDetails,
  EventCustomField,
  FIELD_TYPE_CONFIG,
  getEventDetails,
  generateEventId,
  EventFieldType,
} from '../services/EventDetailsService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.5;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92;

interface EventDetailSheetProps {
  visible: boolean;
  event: ChurchEvent | null;
  onClose: () => void;
}

const SERVICE_TYPE_COLORS = {
  LITURGY: '#8B1A1A',
  EVENING_SERVICE: '#2C4A6E',
  CHURCH_OPEN: '#8B5A2B',
  PICNIC: '#CD853F',
} as const;

const SERVICE_TYPE_ICONS = {
  LITURGY: 'church' as const,
  EVENING_SERVICE: 'moon-waning-crescent' as const,
  CHURCH_OPEN: 'door-open' as const,
  PICNIC: 'food' as const,
} as const;

export const EventDetailSheet: React.FC<EventDetailSheetProps> = ({
  visible,
  event,
  onClose,
}) => {
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          // Dragging up - expand
          const newHeight = Math.min(SHEET_MAX_HEIGHT, SHEET_MIN_HEIGHT - gestureState.dy);
          sheetHeight.setValue(newHeight);
        } else if (gestureState.dy > 0 && isExpanded) {
          // Dragging down from expanded state
          const newHeight = Math.max(SHEET_MIN_HEIGHT, SHEET_MAX_HEIGHT - gestureState.dy);
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          // Expand to full
          Animated.spring(sheetHeight, {
            toValue: SHEET_MAX_HEIGHT,
            useNativeDriver: false,
            tension: 65,
            friction: 11,
          }).start();
          setIsExpanded(true);
        } else if (gestureState.dy > 100) {
          // Close the sheet
          handleClose();
        } else if (gestureState.dy > 50 && isExpanded) {
          // Collapse back
          Animated.spring(sheetHeight, {
            toValue: SHEET_MIN_HEIGHT,
            useNativeDriver: false,
            tension: 65,
            friction: 11,
          }).start();
          setIsExpanded(false);
        } else {
          // Snap back to current state
          Animated.spring(sheetHeight, {
            toValue: isExpanded ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT,
            useNativeDriver: false,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && event) {
      // Reset to initial state
      sheetHeight.setValue(SHEET_MIN_HEIGHT);
      setIsExpanded(false);
      // Load event details
      loadEventDetails();
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, event]);

  const loadEventDetails = async () => {
    if (!event) return;
    setIsLoading(true);
    const eventId = generateEventId(event.date, event.serviceType);
    const details = await getEventDetails(eventId);
    setEventDetails(details);
    setIsLoading(false);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Group fields by related categories for smart display
  const groupFields = (fields: EventCustomField[]) => {
    const groups: { type: string; fields: EventCustomField[] }[] = [];

    // Group: Saint Info (image + biography)
    const imageFields = fields.filter(f => f.type === 'image');
    const biographyFields = fields.filter(f => f.type === 'biography');
    if (imageFields.length > 0 || biographyFields.length > 0) {
      groups.push({ type: 'saint-info', fields: [...imageFields, ...biographyFields] });
    }

    // Group: Location
    const locationFields = fields.filter(f => f.type === 'location');
    if (locationFields.length > 0) {
      groups.push({ type: 'location', fields: locationFields });
    }

    // Group: Media (video)
    const videoFields = fields.filter(f => f.type === 'video');
    if (videoFields.length > 0) {
      groups.push({ type: 'media', fields: videoFields });
    }

    // Group: Service Info (guest, readings, notes)
    const serviceInfoFields = fields.filter(f =>
      f.type === 'guest' || f.type === 'readings' || f.type === 'note'
    );
    if (serviceInfoFields.length > 0) {
      groups.push({ type: 'service-info', fields: serviceInfoFields });
    }

    return groups;
  };

  const renderGroupedFields = () => {
    if (!eventDetails || eventDetails.customFields.length === 0) return null;

    const sortedFields = [...eventDetails.customFields].sort((a, b) => a.order - b.order);
    const groups = groupFields(sortedFields);

    return groups.map((group, groupIndex) => {
      if (group.type === 'saint-info') {
        return renderSaintInfoGroup(group.fields, groupIndex);
      } else if (group.type === 'location') {
        return renderLocationGroup(group.fields, groupIndex);
      } else if (group.type === 'media') {
        return renderMediaGroup(group.fields, groupIndex);
      } else if (group.type === 'service-info') {
        return renderServiceInfoGroup(group.fields, groupIndex);
      }
      return null;
    });
  };

  const renderSaintInfoGroup = (fields: EventCustomField[], index: number) => {
    const imageField = fields.find(f => f.type === 'image');
    const bioField = fields.find(f => f.type === 'biography');

    return (
      <View key={`saint-info-${index}`} style={styles.saintInfoCard}>
        {/* Image */}
        {imageField && imageField.content && (
          <Image
            source={{ uri: imageField.content }}
            style={styles.saintImage}
            resizeMode="cover"
          />
        )}

        {/* Biography text in same card */}
        {bioField && bioField.content && (
          <View style={styles.biographySection}>
            {bioField.label && (
              <Text style={styles.biographyLabel}>{bioField.label}</Text>
            )}
            <Text style={styles.biographyText}>{bioField.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderLocationGroup = (fields: EventCustomField[], index: number) => {
    return (
      <View key={`location-${index}`} style={[styles.groupContainer, styles.locationGroupContainer]}>
        <View style={[styles.groupHeader, { backgroundColor: '#1a73e8' + '15' }]}>
          <MaterialCommunityIcons name="map-marker" size={22} color="#1a73e8" />
          <Text style={[styles.groupTitle, { color: '#1a73e8' }]}>Локација</Text>
        </View>

        {fields.map((field, idx) => {
          const isGoogleMapsLink = field.content.includes('maps.google') ||
                                   field.content.includes('goo.gl/maps') ||
                                   field.content.startsWith('http');

          return (
            <View key={field.id}>
              {idx > 0 && <View style={styles.groupDivider} />}
              <TouchableOpacity
                onPress={() => {
                  if (isGoogleMapsLink) {
                    Linking.openURL(field.content);
                  }
                }}
                disabled={!isGoogleMapsLink}
                style={styles.locationItem}
              >
                <Text style={styles.locationText}>{field.content}</Text>
                {isGoogleMapsLink && (
                  <View style={styles.mapButton}>
                    <MaterialCommunityIcons name="navigation" size={16} color="#fff" />
                    <Text style={styles.mapButtonText}>Насоки</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMediaGroup = (fields: EventCustomField[], index: number) => {
    return (
      <View key={`media-${index}`} style={[styles.groupContainer, styles.mediaGroupContainer]}>
        <View style={[styles.groupHeader, { backgroundColor: '#FF0000' + '15' }]}>
          <MaterialCommunityIcons name="video" size={22} color="#FF0000" />
          <Text style={[styles.groupTitle, { color: '#CC0000' }]}>Видео</Text>
        </View>

        {fields.map((field, idx) => (
          <View key={field.id}>
            {idx > 0 && <View style={styles.groupDivider} />}
            <TouchableOpacity
              style={styles.videoItem}
              onPress={() => Linking.openURL(field.content)}
            >
              <MaterialCommunityIcons name="play-circle" size={28} color="#FF0000" />
              <Text style={styles.videoItemText}>{field.label || 'Отвори видео'}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderServiceInfoGroup = (fields: EventCustomField[], index: number) => {
    return (
      <View key={`service-info-${index}`} style={styles.groupContainer}>
        <View style={[styles.groupHeader, { backgroundColor: '#2C4A6E' + '15' }]}>
          <MaterialCommunityIcons name="information" size={22} color="#2C4A6E" />
          <Text style={[styles.groupTitle, { color: '#2C4A6E' }]}>Информации</Text>
        </View>

        {fields.map((field, idx) => {
          const config = FIELD_TYPE_CONFIG[field.type];
          return (
            <View key={field.id}>
              {idx > 0 && <View style={styles.groupDivider} />}
              <View style={styles.serviceInfoItem}>
                <View style={styles.serviceInfoLabel}>
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={18}
                    color="#2C4A6E"
                  />
                  <Text style={styles.serviceInfoLabelText}>{field.label || config.label}</Text>
                </View>
                <Text style={styles.serviceInfoContent}>{field.content}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Keep the old renderField for backward compatibility, but we won't use it in the main flow
  const renderField = (field: EventCustomField) => {
    const config = FIELD_TYPE_CONFIG[field.type];

    // Special rendering for images
    if (field.type === 'image' && field.content) {
      return (
        <View key={field.id} style={styles.fieldContainer}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={20}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.fieldLabel}>{field.label || config.label}</Text>
          </View>
          <Image
            source={{ uri: field.content }}
            style={styles.fieldImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    // Special rendering for video links
    if (field.type === 'video' && field.content) {
      return (
        <TouchableOpacity
          key={field.id}
          style={styles.fieldContainer}
          onPress={() => Linking.openURL(field.content)}
        >
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={20}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.fieldLabel}>{field.label || config.label}</Text>
          </View>
          <View style={styles.videoLinkContainer}>
            <MaterialCommunityIcons name="play-circle" size={24} color="#FF0000" />
            <Text style={styles.videoLinkText}>Отвори видео</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      );
    }

    // Special rendering for location
    if (field.type === 'location' && field.content) {
      const isGoogleMapsLink = field.content.includes('maps.google') ||
                               field.content.includes('goo.gl/maps') ||
                               field.content.startsWith('http');

      return (
        <TouchableOpacity
          key={field.id}
          style={styles.fieldContainer}
          onPress={() => {
            if (isGoogleMapsLink) {
              Linking.openURL(field.content);
            }
          }}
          disabled={!isGoogleMapsLink}
        >
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={20}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.fieldLabel}>{field.label || config.label}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.fieldContent}>{field.content}</Text>
            {isGoogleMapsLink && (
              <View style={styles.mapButton}>
                <MaterialCommunityIcons name="navigation" size={16} color="#fff" />
                <Text style={styles.mapButtonText}>Насоки</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Default text rendering
    return (
      <View key={field.id} style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <MaterialCommunityIcons
            name={config.icon as any}
            size={20}
            color={COLORS.PRIMARY}
          />
          <Text style={styles.fieldLabel}>{field.label || config.label}</Text>
        </View>
        <Text style={styles.fieldContent}>{field.content}</Text>
      </View>
    );
  };

  if (!event) return null;

  const serviceColor = SERVICE_TYPE_COLORS[event.serviceType as keyof typeof SERVICE_TYPE_COLORS] || COLORS.PRIMARY;
  const serviceIcon = SERVICE_TYPE_ICONS[event.serviceType as keyof typeof SERVICE_TYPE_ICONS] || 'church';
  const hasCustomContent = eventDetails && eventDetails.customFields.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <Text style={styles.dragHint}>
              {isExpanded ? 'Повлечи надолу за помало' : 'Повлечи нагоре за повеќе'}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              {/* Date Badge */}
              <View style={[styles.dateBadge, { backgroundColor: serviceColor }]}>
                <Text style={styles.dateDay}>
                  {format(event.date, 'dd', { locale: mk })}
                </Text>
                <Text style={styles.dateMonth}>
                  {format(event.date, 'MMM', { locale: mk })}
                </Text>
              </View>

              {/* Title & Info */}
              <View style={styles.headerContent}>
                <Text style={styles.eventTitle}>{event.name}</Text>
                {event.saintName && !event.saintName.toLowerCase().includes('not found') && (
                  <Text style={styles.saintName}>{event.saintName}</Text>
                )}
                <View style={styles.metaRow}>
                  <View style={[styles.serviceChip, { backgroundColor: serviceColor + '20' }]}>
                    <MaterialCommunityIcons
                      name={serviceIcon}
                      size={14}
                      color={serviceColor}
                    />
                    <Text style={[styles.serviceChipText, { color: serviceColor }]}>
                      {getServiceTypeLabel(event.serviceType)}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                    <Text style={styles.timeText}>{event.time}ч</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Се вчитува...</Text>
              </View>
            )}

            {/* Custom Fields - Smart Grouped */}
            {!isLoading && hasCustomContent && (
              <View style={styles.fieldsContainer}>
                {renderGroupedFields()}
              </View>
            )}

            {/* No Content State */}
            {!isLoading && !hasCustomContent && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={48}
                  color="#ccc"
                />
                <Text style={styles.emptyTitle}>Нема дополнителни информации</Text>
                <Text style={styles.emptySubtitle}>
                  За овој настан сè уште нема додадено детали
                </Text>
              </View>
            )}

            {/* Default Event Description */}
            {event.description && (
              <View style={styles.descriptionContainer}>
                <View style={styles.fieldHeader}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.fieldLabel}>Време</Text>
                </View>
                <Text style={styles.fieldContent}>{event.description}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <MaterialCommunityIcons name="church-outline" size={16} color="#999" />
              <Text style={styles.footerText}>Св. Наум Охридски • Триенген</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
  },
  dragHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBadge: {
    width: 65,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    marginTop: 2,
    opacity: 0.9,
  },
  headerContent: {
    flex: 1,
    paddingTop: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    lineHeight: 26,
    marginBottom: 4,
  },
  saintName: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  fieldContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  fieldImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  videoLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  videoLinkText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationContainer: {
    gap: 10,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  // Saint Info Styles (unified card with image and biography)
  saintInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saintImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f5f5f5',
  },
  biographySection: {
    padding: 16,
  },
  biographyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  biographyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 26,
  },
  // Smart Grouped Fields Styles
  groupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginLeft: 10,
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  // Location Group
  locationGroupContainer: {
    borderColor: '#B3D4FC',
    borderWidth: 1,
  },
  locationItem: {
    padding: 16,
    paddingTop: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  // Media Group
  mediaGroupContainer: {
    borderColor: '#FFD4D4',
    borderWidth: 1,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
  },
  videoItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  // Service Info Group
  serviceInfoItem: {
    padding: 16,
    paddingTop: 8,
  },
  serviceInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceInfoLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C4A6E',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceInfoContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
});

export default EventDetailSheet;
