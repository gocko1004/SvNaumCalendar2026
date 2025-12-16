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
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

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
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && event) {
      // Load event details
      loadEventDetails();
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
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
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
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

            {/* Custom Fields */}
            {!isLoading && hasCustomContent && (
              <View style={styles.fieldsContainer}>
                {eventDetails.customFields
                  .sort((a, b) => a.order - b.order)
                  .map(renderField)}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SHEET_HEIGHT,
    minHeight: SHEET_HEIGHT * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
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
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
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
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
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
});

export default EventDetailSheet;
