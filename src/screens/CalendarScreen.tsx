import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, Animated, TouchableOpacity, Dimensions, ActivityIndicator, SafeAreaView, Text, RefreshControl, SectionList, Vibration, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Title, Searchbar, Surface, Button, Dialog, Portal, FAB } from 'react-native-paper';
import { useFonts, Triodion_400Regular } from '@expo-google-fonts/triodion';
import { CHURCH_EVENTS, ChurchEvent, SPECIAL_FEAST_URLS, getServiceTypeLabel, ServiceType } from '../services/ChurchCalendarService';
import { getImageForEvent } from '../services/LocalImageService';
import { getDenoviImageUrl } from '../services/DenoviImageService';
import { getAllEvents, mergeEvents, getEventOverrides, applyEventOverrides, hardcodedEventKey } from '../services/FirestoreEventService';
import { getActiveAnnouncements, Announcement, ANNOUNCEMENT_TYPE_COLORS, ANNOUNCEMENT_TYPE_ICONS } from '../services/AnnouncementsService';
import { COLORS } from '../constants/theme';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SocialMediaService from '../services/SocialMediaService';
import { Linking } from 'react-native';
import { EventDetailSheet } from '../components/EventDetailSheet';
import { FastingBadge } from '../components/FastingBadge';
import { FastingDetailSheet } from '../components/FastingDetailSheet';
import {
  getAllFastingPeriods,
  getFastingInfoForDate,
  FastingPeriod,
  FastingDayInfo,
  FASTING_RULE_CONFIG,
} from '../services/FastingService';
import { useAuth } from '../hooks/useAuth';

const SERVICE_TYPE_COLORS = {
  LITURGY: '#8B1A1A',          // Deep burgundy red
  EVENING_SERVICE: '#2C4A6E',  // Softer icon blue
  CHURCH_OPEN: '#8B5A2B',      // Warm burnt sienna - orange/brown mix
  PICNIC: '#CD853F'            // Peru/tan gold
} as const;

// Animated icon component with fade in/out
const AnimatedIcon = ({ visible, color }: { visible: boolean; color: string }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  return (
    <Animated.View style={[styles.moreButtonCircleContainer, { opacity: fadeAnim }]}>
      <View style={[styles.moreButtonCircle, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name="book-open-page-variant-outline"
          size={16}
          color="#fff"
        />
      </View>
    </Animated.View>
  );
};

const SERVICE_TYPE_ICONS = {
  LITURGY: 'church' as const,
  EVENING_SERVICE: 'moon-waning-crescent' as const,
  CHURCH_OPEN: 'door-open' as const,
  PICNIC: 'food' as const
} as const;

// Special image URLs (not in standard synaxarion path)
const SPECIAL_DATE_IMAGES: Record<string, string> = {
  // January
  '2026-01-05': 'https://denovi.mk/synaxarion/januari/05-010.jpg',   // Sv. Naum Ohridski
  // February
  '2026-02-08': 'https://denovi.mk/img/bludniot_sin.png',          // Prodigal Son
  // Lent period
  '2026-03-01': 'https://denovi.mk/pasha/torzestvo.jpg',           // Orthodoxy Sunday
  '2026-03-08': 'https://denovi.mk/img/palama.png',                // St. Gregory Palamas
  '2026-03-15': 'https://denovi.mk/pasha/krstopoklona_nedela.jpg', // Cross Veneration
  '2026-03-22': 'https://denovi.mk/synaxarion/mart/22-030.jpg',    // John Climacus
  '2026-03-29': 'https://denovi.mk/synaxarion/mart/29-030.jpg',    // Mary of Egypt
  '2026-04-04': 'https://denovi.mk/img/lazar.png',                 // Lazarus Saturday
  '2026-04-09': 'https://denovi.mk/synaxarion/april/09-041.jpg',   // Holy Thursday - Last Supper
  '2026-04-10': 'https://denovi.mk/img/velik_petok.png',           // Good Friday
  // Post-Easter (Pentecostarion)
  '2026-04-19': 'https://denovi.mk/synaxarion/april/19-040.jpg',   // April 19
  '2026-04-26': 'https://denovi.mk/synaxarion/april/26-040.jpg',   // April 26
  '2026-04-29': 'https://denovi.mk/synaxarion/april/29-040.jpg',   // April 29
  '2026-05-03': 'https://denovi.mk/img/raslabeniot.png',           // Paralytic Sunday
  '2026-05-05': 'https://denovi.mk/pasha/prepolovenie.jpg',        // Mid-Pentecost (same as May 6)
  '2026-05-06': 'https://denovi.mk/pasha/prepolovenie.jpg',        // Mid-Pentecost
  '2026-05-10': 'https://denovi.mk/img/samarjankata.png',          // Samaritan Woman
  '2026-05-17': 'https://denovi.mk/img/slepiot.png',               // Blind Man
  '2026-05-21': 'https://denovi.mk/img/voznesenie.png',            // Ascension
  '2026-05-20': 'https://denovi.mk/img/voznesenie.png',            // Eve of Ascension
  // June
  '2026-06-02': 'https://denovi.mk/synaxarion/juni/02-060.jpg',    // June 2
  '2026-06-07': 'https://denovi.mk/pasha/site_sveti.jpg',          // All Saints
  '2026-06-14': 'https://denovi.mk/synaxarion/juni/14-060.jpg',    // June 14
  // July
  '2026-07-02': 'https://denovi.mk/synaxarion/juli/02-070.jpg',    // Sv. Naum Ohridski (eve)
  '2026-07-03': 'https://denovi.mk/synaxarion/juli/03-070.jpg',    // Sv. Naum Ohridski
  '2026-07-12': 'https://denovi.mk/img/apostoli.png',              // Peter & Paul
  '2026-07-26': 'https://denovi.mk/pasha/vi_vs_sobori.jpg',        // Ecumenical Councils
  // August - missing images
  '2026-08-02': 'https://denovi.mk/synaxarion/avgust/02-080.jpg',  // Prophet Elijah
  '2026-08-09': 'https://denovi.mk/synaxarion/avgust/09-080.jpg',  // St. Clement Ohridski
  '2026-08-16': 'https://denovi.mk/synaxarion/avgust/16-080.jpg',  // Isaac, Dalmat, Faust
  '2026-08-23': 'https://denovi.mk/synaxarion/avgust/23-080.jpg',  // Archdeacon Lawrence
  // September
  '2026-09-06': 'https://denovi.mk/synaxarion/septemvri/06-090.jpg', // Martyr Eutychius
  '2026-09-10': 'https://denovi.mk/synaxarion/septemvri/11-090.jpg', // John the Baptist beheading
  // October - missing images
  '2026-10-04': 'https://denovi.mk/synaxarion/oktomvri/04-100.jpg',  // Apostle Codrat
  '2026-10-11': 'https://denovi.mk/synaxarion/oktomvri/11-100.jpg',  // Hariton Confessor
  // November - missing images
  '2026-11-01': 'https://denovi.mk/synaxarion/noemvri/01-110.jpg',   // Prophet Joel
  '2026-11-15': 'https://denovi.mk/synaxarion/noemvri/15-110.jpg',   // Martyrs Akindyn etc.
  '2026-11-29': 'https://denovi.mk/synaxarion/noemvri/29-110.jpg',   // Apostle Matthew
  // December
  '2026-12-06': 'https://denovi.mk/synaxarion/dekemvri/06-120.jpg',  // Sunday Liturgy
  '2026-12-13': 'https://denovi.mk/synaxarion/dekemvri/13-120.jpg',  // Sunday Liturgy
  '2026-12-19': 'https://denovi.mk/synaxarion/dekemvri/19-120.jpg',  // St. Nicholas
  '2026-12-20': 'https://denovi.mk/synaxarion/dekemvri/20-122.jpg',  // Sunday Liturgy
  '2026-12-27': 'https://denovi.mk/synaxarion/dekemvri/27-120.jpg',  // Church Open
};

// Helper function to get special image URL for a date
const getSpecialImageUrl = (date: Date): string | null => {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return SPECIAL_DATE_IMAGES[dateKey] || null;
};

// Helper function to get image positioning based on date
// NOTE: Use top: 0 to show head, negative top to shift image down (show more of top)
// height controls how much of the image is visible
const getImagePositionForDate = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // February 1 - show top of image (head)
  if (month === 2 && day === 1) return { height: 160, top: 0 };
  // March 22 - John Climacus - show top of image (head)
  if (month === 3 && day === 22) return { height: 160, top: 0 };
  // March 29 - Mary of Egypt - show top of image (head)
  if (month === 3 && day === 29) return { height: 160, top: 0 };
  // April 19 - centered
  if (month === 4 && day === 19) return { height: 160, top: 0, left: 0 };
  // August 16 - show top of image (head)
  if (month === 8 && day === 16) return { height: 160, top: 0 };
  // September 10 - John the Baptist - show top of image (head)
  if (month === 9 && day === 10) return { height: 160, top: 0 };
  // October 4 - show top of image (head)
  if (month === 10 && day === 4) return { height: 160, top: 0 };
  // October 18 - show top of image (head)
  if (month === 10 && day === 18) return { height: 160, top: 0 };
  // December 20 - show top of image (head)
  if (month === 12 && day === 20) return { height: 160, top: 0 };

  return {};
};

// Bulletproof EventImage - tries special URLs, then multiple sequences
const EventImage = ({ event }: { event: ChurchEvent }) => {
  const [localFailed, setLocalFailed] = useState(false);
  const [specialFailed, setSpecialFailed] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // For PICNIC events, show icon directly instead of trying to load images
  if (event.serviceType === 'PICNIC') {
    return (
      <View style={styles.iconFallbackContainer}>
        <MaterialCommunityIcons
          name="food"
          size={50}
          color={SERVICE_TYPE_COLORS.PICNIC}
        />
      </View>
    );
  }

  const localImage = getImageForEvent(event.name, event.date);
  const imagePosition = getImagePositionForDate(event.date);
  const specialUrl = getSpecialImageUrl(event.date);

  // Build month-specific sequences first, then fallback sequences
  // Images on denovi.mk use month-based sequences (e.g., 010-019 for January, 120-129 for December)
  const month = event.date.getMonth() + 1;
  const monthPrefix = month.toString().padStart(2, '0');

  // Month-specific sequences first (e.g., for December: 120, 121, 122...)
  const monthSequences = Array.from({ length: 10 }, (_, i) => `${monthPrefix}${i}`);

  // Fallback: try all other months' sequences
  const allMonthSequences = Array.from({ length: 12 }, (_, m) => {
    const mp = (m + 1).toString().padStart(2, '0');
    return Array.from({ length: 6 }, (_, i) => `${mp}${i}`);
  }).flat().filter(seq => !seq.startsWith(monthPrefix));

  // Low number fallbacks
  const lowNumberFallbacks = ['000', '001', '002', '003'];

  const sequences = [...monthSequences, ...lowNumberFallbacks, ...allMonthSequences];

  // Current URL based on sequence index
  const currentUrl = sequenceIndex < sequences.length
    ? getDenoviImageUrl(event.date, sequences[sequenceIndex])
    : null;

  // STATE 1: Try Local Image (for major feasts)
  if (localImage && !localFailed) {
    return (
      <View style={styles.imageWrapper}>
        <Image
          source={localImage}
          style={[styles.eventImageFixed, imagePosition]}
          resizeMode="cover"
          onError={() => setLocalFailed(true)}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
    );
  }

  // STATE 2: Try Special URL (for Lent/Pasha period)
  if (specialUrl && !specialFailed) {
    return (
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: specialUrl }}
          style={[styles.eventImageFixed, imagePosition]}
          resizeMode="cover"
          onError={() => setSpecialFailed(true)}
          onLoad={() => setIsLoading(false)}
          onLoadStart={() => setIsLoading(true)}
        />
        {isLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
    );
  }

  // STATE 3: Try Remote Images - cycle through sequences
  if (currentUrl) {
    return (
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: currentUrl }}
          style={[styles.eventImageFixed, imagePosition]}
          resizeMode="cover"
          onError={() => {
            // Try next sequence
            setSequenceIndex(prev => prev + 1);
          }}
          onLoad={() => setIsLoading(false)}
          onLoadStart={() => setIsLoading(true)}
        />
        {isLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
    );
  }

  // STATE 4: All sources exhausted - show icon
  return (
    <View style={styles.iconFallbackContainer}>
      <MaterialCommunityIcons
        name={SERVICE_TYPE_ICONS[event.serviceType]}
        size={50}
        color={SERVICE_TYPE_COLORS[event.serviceType]}
      />
    </View>
  );
};

const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require('../../assets/images/Loading screen.jpg')}
        style={styles.loadingBackground}
        resizeMode="cover"
        onError={(error) => {
          // Silently handle loading screen image error
          console.warn('Loading screen image failed to load');
        }}
      />
      <View style={[styles.dimOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />
      <View style={styles.loadingContent}>
        <View style={styles.churchInfoContainer}>
          <Text style={styles.churchName}>Македонска Православна Црковна Општина</Text>
          <Text style={styles.churchName}>Св. Наум Охридски, Швајцарија</Text>
          <Text style={styles.churchAddress}>CH – 6234 Триенген</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.TEXT_LIGHT} />
        <Text style={styles.loadingText}>Се вчитува...</Text>
      </View>
    </View>
  );
};

// Announcement Card Component
const AnnouncementCard = ({ announcement, onPress }: { announcement: Announcement; onPress: () => void }) => {
  const typeColor = ANNOUNCEMENT_TYPE_COLORS[announcement.type];
  const typeIcon = ANNOUNCEMENT_TYPE_ICONS[announcement.type];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.announcementCard, { borderLeftColor: typeColor }]}>
        <Card.Content>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementIconContainer}>
              <MaterialCommunityIcons name={typeIcon as any} size={24} color={typeColor} />
            </View>
            <View style={styles.announcementContent}>
              <View style={styles.announcementTitleRow}>
                <Text style={[styles.announcementTitle, { color: typeColor }]}>{announcement.title}</Text>
                <View style={[styles.announcementTypeChip, { backgroundColor: typeColor + '20' }]}>
                  <Text style={[styles.announcementTypeChipText, { color: typeColor }]}>
                    {announcement.type === 'INFO' ? 'Информација' :
                      announcement.type === 'URGENT' ? 'Итно' :
                        announcement.type === 'EVENT' ? 'Настан' : 'Потсетник'}
                  </Text>
                </View>
              </View>
              <Text style={styles.announcementMessage} numberOfLines={2}>{announcement.message}</Text>
              <View style={styles.announcementFooter}>
                <Text style={styles.announcementDate}>
                  {format(announcement.startDate, 'dd.MM', { locale: mk })} - {format(announcement.endDate, 'dd.MM.yyyy', { locale: mk })}
                </Text>
                <View style={styles.readMoreContainer}>
                  <Text style={[styles.readMoreText, { color: typeColor }]}>Прочитај повеќе</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={typeColor} />
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [fontsLoaded] = useFonts({
    Triodion_400Regular,
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<ChurchEvent[]>(CHURCH_EVENTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [serviceTypeFilters, setServiceTypeFilters] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Set<ServiceType>>(new Set());
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTodayButton, setShowTodayButton] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [fastingPeriods, setFastingPeriods] = useState<FastingPeriod[]>([]);
  const [fastingFilter, setFastingFilter] = useState(false);
  const [fastingDetail, setFastingDetail] = useState<FastingDayInfo | null>(null);
  const [showFastingDetail, setShowFastingDetail] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  // Hidden admin access - tap header 5 times within 3 seconds OR long press 2 sec if logged in
  const [adminTapCount, setAdminTapCount] = useState(0);
  const adminTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleHeaderTap = useCallback(() => {
    // Clear previous timeout
    if (adminTapTimeoutRef.current) {
      clearTimeout(adminTapTimeoutRef.current);
    }

    const newCount = adminTapCount + 1;

    if (newCount >= 5) {
      // Navigate to admin panel
      setAdminTapCount(0);
      navigation.navigate('AdminPanel');
    } else {
      setAdminTapCount(newCount);
      // Reset counter after 3 seconds of inactivity
      adminTapTimeoutRef.current = setTimeout(() => {
        setAdminTapCount(0);
      }, 3000);
    }
  }, [adminTapCount, navigation]);

  // Long press handlers for quick admin access (only when logged in)
  const handleHeaderPressIn = useCallback(() => {
    if (isAuthenticated) {
      setIsLongPressing(true);
      longPressTimeoutRef.current = setTimeout(() => {
        // Vibrate to indicate success
        Vibration.vibrate(50);
        setIsLongPressing(false);
        navigation.navigate('AdminPanel');
      }, 2000); // 2 seconds
    }
  }, [isAuthenticated, navigation]);

  const handleHeaderPressOut = useCallback(() => {
    setIsLongPressing(false);
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const sectionListRef = useRef<SectionList>(null);
  const monthPositions = useRef<Record<number, number>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  // Track visible items for showing icons - only middle 2 cards
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const validItems = viewableItems
      .filter((item: any) => item.isViewable && item.item && item.item.date);

    // Get only the middle 2 items
    let middleItems: string[] = [];
    if (validItems.length <= 2) {
      middleItems = validItems.map((item: any) => item.item.date.toISOString() + item.item.serviceType);
    } else {
      // Find the middle 2
      const midIndex = Math.floor(validItems.length / 2);
      const startIndex = midIndex - 1;
      middleItems = validItems
        .slice(startIndex, startIndex + 2)
        .map((item: any) => item.item.date.toISOString() + item.item.serviceType);
    }
    setVisibleItems(middleItems);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
  }).current;

  useEffect(() => {
    // Brief splash screen - just 800ms for branding
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Function to enrich ALL events with image URLs - SIMPLE AND CONSISTENT
    const enrichEventsWithImages = (evts: ChurchEvent[]) => {
      return evts.map(evt => {
        const dateKey = `${evt.date.getFullYear()}-${String(evt.date.getMonth() + 1).padStart(2, '0')}-${String(evt.date.getDate()).padStart(2, '0')}`;
        const specialImage = SPECIAL_FEAST_URLS[dateKey];

        // ALWAYS add imageUrl for ALL events (prefer special feast URLs)
        // getDenoviImageUrl now uses month-based default sequence (e.g., 010 for January, 120 for December)
        const imageUrl = specialImage || getDenoviImageUrl(evt.date);
        return { ...evt, imageUrl };
      });
    };

    // Load events from Firestore and merge with hardcoded events
    const loadAndEnrichEvents = async () => {
      try {
        const firestoreEvents = await getAllEvents();
        const overrides = await getEventOverrides();
        const merged = mergeEvents(applyEventOverrides(CHURCH_EVENTS, overrides), firestoreEvents);
        const enriched = enrichEventsWithImages(merged);
        setEvents(enriched);
      } catch (error) {
        console.error('Error loading Firestore events:', error);
        // If Firestore fails, enrich hardcoded events
        const enriched = enrichEventsWithImages(CHURCH_EVENTS);
        setEvents(enriched);
      }
    };

    // Load and enrich events
    loadAndEnrichEvents();

    // Load fasting periods (admin-managed, additive feature)
    getAllFastingPeriods().then(setFastingPeriods).catch(() => {});

    // Load active announcements
    const loadAnnouncements = async () => {
      try {
        const activeAnnouncements = await getActiveAnnouncements();
        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    };
    loadAnnouncements();

    return () => clearTimeout(timer);
  }, []);

  // Pull-to-refresh handler
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getAllFastingPeriods().then(setFastingPeriods).catch(() => {});
      Promise.all([getAllEvents(), getEventOverrides()])
        .then(([firestoreEvents, overrides]) => {
          setEvents(prev => {
            const merged = mergeEvents(applyEventOverrides(CHURCH_EVENTS, overrides), firestoreEvents);
            // Keep the enriched image URLs from the initial load pattern
            return merged.map(evt => {
              const match = prev.find(
                p => p.date.getTime() === evt.date.getTime() && p.serviceType === evt.serviceType
              );
              return match?.imageUrl ? { ...evt, imageUrl: match.imageUrl } : evt;
            });
          });
        })
        .catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  // Deep link from a tapped reminder: open that event's card
  useEffect(() => {
    const key = route.params?.openEventKey;
    if (!key || events.length === 0) return;
    const match = events.find(e => hardcodedEventKey(e) === key || e.overrideKey === key);
    if (match) {
      scrollToMonth(match.date.getMonth());
      setSelectedEvent(match);
      setShowEventDetail(true);
    }
    navigation.setParams({ openEventKey: undefined, openEventNonce: undefined });
  }, [route.params?.openEventNonce, events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Reload all data
    const enrichEventsWithImages = (evts: ChurchEvent[]) => {
      return evts.map(evt => {
        const dateKey = `${evt.date.getFullYear()}-${String(evt.date.getMonth() + 1).padStart(2, '0')}-${String(evt.date.getDate()).padStart(2, '0')}`;
        const specialImage = SPECIAL_FEAST_URLS[dateKey];
        const imageUrl = specialImage || getDenoviImageUrl(evt.date);
        return { ...evt, imageUrl };
      });
    };

    try {
      const [firestoreEvents, activeAnnouncements, overrides, periods] = await Promise.all([
        getAllEvents(),
        getActiveAnnouncements(),
        getEventOverrides(),
        getAllFastingPeriods(),
      ]);

      const merged = mergeEvents(applyEventOverrides(CHURCH_EVENTS, overrides), firestoreEvents);
      const enriched = enrichEventsWithImages(merged);
      setEvents(enriched);
      setAnnouncements(activeAnnouncements);
      setFastingPeriods(periods);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }

    setRefreshing(false);
  }, []);

  // Month names in Macedonian
  const monthNames = [
    'Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
    'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ];

  // Group and filter events for SectionList
  const sections = React.useMemo(() => {
    const filteredEvents = events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedServiceTypes.size === 0 || selectedServiceTypes.has(event.serviceType);
      const matchesFasting =
        !fastingFilter || getFastingInfoForDate(event.date, fastingPeriods) !== null;
      return matchesSearch && matchesType && matchesFasting;
    });

    // Compact fasting-day items: every day inside an active fast that has no
    // service card gets its own small card (Goce's design).
    const eventDayKeys = new Set(
      events.map(e => `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`)
    );
    const addedFastKeys = new Set<string>();
    const fastingDayItems: any[] = [];
    if (selectedServiceTypes.size === 0 || fastingFilter) {
      for (const period of fastingPeriods) {
        if (!period.isActive) continue;
        if (!period.name.toLowerCase().includes(searchQuery.toLowerCase())) continue;
        const d = new Date(period.startDate);
        d.setHours(0, 0, 0, 0);
        const end = new Date(period.endDate);
        end.setHours(0, 0, 0, 0);
        let guard = 0;
        while (d <= end && guard++ < 400) {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (!eventDayKeys.has(key) && !addedFastKeys.has(key)) {
            const info = getFastingInfoForDate(d, fastingPeriods);
            if (info) {
              addedFastKeys.add(key);
              fastingDayItems.push({
                date: new Date(d),
                name: info.period.name,
                serviceType: 'FASTING_DAY',
                time: '',
                __fasting: info,
              });
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    const grouped = ([...filteredEvents, ...fastingDayItems] as ChurchEvent[])
      .reduce((acc, event) => {
        const month = event.date.getMonth();
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(event);
        return acc;
      }, {} as Record<number, ChurchEvent[]>);

    return Object.entries(grouped)
      .map(([monthStr, events]) => ({
        monthIndex: parseInt(monthStr),
        title: monthNames[parseInt(monthStr)],
        data: events.sort((a, b) => a.date.getTime() - b.date.getTime())
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [searchQuery, selectedServiceTypes, events, fastingFilter, fastingPeriods]);

  // Scroll to specific month
  const pendingScrollSection = useRef<number | null>(null);
  const scrollToMonth = useCallback((monthIndex: number) => {
    setSelectedMonth(monthIndex);

    // Find section index for this month
    const sectionIndex = sections.findIndex(s => s.monthIndex === monthIndex);

    if (sectionIndex !== -1 && sectionListRef.current) {
      pendingScrollSection.current = sectionIndex;
      try {
        sectionListRef.current.scrollToLocation({
          sectionIndex: sectionIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      } catch (e) {
        // Far-offscreen sections are handled by onScrollToIndexFailed below
      }
    }
  }, [sections]);

  // Find and scroll to the next upcoming event
  const scrollToNextEvent = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the next event after today
    const upcomingEvents = events
      .filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      const nextEventMonth = nextEvent.date.getMonth();
      scrollToMonth(nextEventMonth);
      setSelectedServiceTypes(new Set());
    }
  }, [events, scrollToMonth]);

  // Handle scroll events to show/hide Today button
  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    setShowTodayButton(scrollPosition > 300);

    // Show icons once user starts scrolling
    if (scrollPosition > 50 && !hasScrolled) {
      setHasScrolled(true);
    }

    // Update selected month based on scroll position
    const positions = Object.entries(monthPositions.current);
    for (let i = positions.length - 1; i >= 0; i--) {
      const [month, pos] = positions[i];
      if (scrollPosition >= (pos as number) - 150) {
        setSelectedMonth(parseInt(month));
        break;
      }
    }
  }, [hasScrolled]);



  if (isLoading) {
    return <LoadingScreen />;
  }

  const toggleServiceTypeFilter = (serviceType: ServiceType) => {
    const newSelectedTypes = new Set(selectedServiceTypes);
    if (newSelectedTypes.has(serviceType)) {
      newSelectedTypes.delete(serviceType);
    } else {
      newSelectedTypes.add(serviceType);
    }
    setSelectedServiceTypes(newSelectedTypes);
  };



  const renderServiceTypeFilters = () => {
    const screenWidth = Dimensions.get('window').width;
    const isVerySmall = screenWidth < 340;
    const isSmall = screenWidth < 380;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContentContainer}
      >
        {Object.entries(SERVICE_TYPE_COLORS).map(([type, color]) => {
          const label = getServiceTypeLabel(type as ServiceType);
          const isSelected = selectedServiceTypes.has(type as ServiceType);

          // Calculate chip width based on label length and screen size
          const baseWidth = isVerySmall ? 6 : isSmall ? 7 : 8;
          const iconSpace = isVerySmall ? 30 : 40;
          const padding = isVerySmall ? 20 : 24;
          const labelLength = label.length;
          const chipWidth = Math.min(
            Math.max(labelLength * baseWidth + iconSpace + padding, isVerySmall ? 90 : 110),
            screenWidth * 0.48
          );

          const iconSize = isVerySmall ? 14 : isSmall ? 15 : 16;
          const fontSize = isVerySmall ? 9 : isSmall ? 10 : 11;

          return (
            <TouchableOpacity
              key={type}
              onPress={() => toggleServiceTypeFilter(type as ServiceType)}
              style={[
                styles.filterChipTouchable,
                {
                  backgroundColor: isSelected ? color : COLORS.SURFACE,
                  width: chipWidth,
                  minHeight: isVerySmall ? 36 : 40,
                  borderColor: isSelected ? color : COLORS.BORDER,
                }
              ]}
            >
              <MaterialCommunityIcons
                name={SERVICE_TYPE_ICONS[type as ServiceType]}
                size={iconSize}
                color={isSelected ? COLORS.TEXT_LIGHT : COLORS.TEXT}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? COLORS.TEXT_LIGHT : COLORS.TEXT,
                    fontSize: fontSize,
                    flex: 1,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.65}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Additive „Пости" chip: toggles fasting badges on the calendar */}
        <TouchableOpacity
          onPress={() => setFastingFilter(prev => !prev)}
          style={[
            styles.filterChipTouchable,
            {
              backgroundColor: fastingFilter ? '#6B4E9B' : COLORS.SURFACE,
              width: isVerySmall ? 90 : 110,
              minHeight: isVerySmall ? 36 : 40,
              borderColor: fastingFilter ? '#6B4E9B' : COLORS.BORDER,
            }
          ]}
        >
          <MaterialCommunityIcons
            name="sprout"
            size={isVerySmall ? 14 : isSmall ? 15 : 16}
            color={fastingFilter ? COLORS.TEXT_LIGHT : COLORS.TEXT}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color: fastingFilter ? COLORS.TEXT_LIGHT : COLORS.TEXT,
                fontSize: isVerySmall ? 9 : isSmall ? 10 : 11,
                flex: 1,
              }
            ]}
            numberOfLines={1}
          >
            Пости
          </Text>
        </TouchableOpacity>

      </ScrollView>
    );
  };

  // Month Quick-Jump component
  const renderMonthQuickJump = () => {
    const shortMonthNames = ['Јан', 'Фев', 'Мар', 'Апр', 'Мај', 'Јун', 'Јул', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
    const currentMonth = new Date().getMonth();
    const availableMonths = sections.map(s => s.monthIndex);

    return (
      <View style={styles.monthQuickJumpContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthQuickJumpContent}
        >
          {shortMonthNames.map((name, index) => {
            const isCurrentMonth = index === currentMonth;
            const isSelected = index === selectedMonth;
            const hasEvents = availableMonths.includes(index);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => hasEvents && scrollToMonth(index)}
                disabled={!hasEvents}
                style={[
                  styles.monthQuickJumpItem,
                  isSelected && styles.monthQuickJumpItemSelected,
                  isCurrentMonth && styles.monthQuickJumpItemCurrent,
                  !hasEvents && styles.monthQuickJumpItemDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.monthQuickJumpText,
                    isSelected && styles.monthQuickJumpTextSelected,
                    !hasEvents && styles.monthQuickJumpTextDisabled,
                  ]}
                >
                  {name}
                </Text>
                {isCurrentMonth && <View style={styles.currentMonthDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const showContactInfo = () => {
    setContactDialogVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Image
          source={require('../../assets/images/background_app.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        <SectionList
          ref={sectionListRef}
          sections={sections}
          onScrollToIndexFailed={(info) => {
            // Target not rendered yet: jump near it, let it render, then retry precisely
            const responder = (sectionListRef.current as any)?.getScrollResponder?.();
            responder?.scrollTo?.({ y: info.averageItemLength * info.index, animated: false });
            setTimeout(() => {
              const target = pendingScrollSection.current;
              if (target !== null && sectionListRef.current) {
                try {
                  sectionListRef.current.scrollToLocation({
                    sectionIndex: target,
                    itemIndex: 0,
                    animated: true,
                    viewOffset: 0,
                  });
                } catch (e) { /* give up quietly rather than crash */ }
              }
            }, 300);
          }}
          keyExtractor={(item, index) => (item?.date?.toISOString() || 'item') + index}
          renderSectionHeader={({ section: { title, monthIndex } }) => (
            <View
              style={styles.monthSection}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                monthPositions.current[monthIndex] = y;
              }}
            >
              <View style={styles.monthHeaderContainer}>
                <View style={styles.monthHeaderSolid}>
                  <Text
                    style={[
                      styles.monthTitle,
                      fontsLoaded && { fontFamily: 'Triodion_400Regular' }
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              </View>
            </View>
          )}
          renderItem={({ item: event, index, section }) => {
            const fastingItem = (event as any).__fasting as FastingDayInfo | undefined;
            if (fastingItem) {
              const ruleConfig = FASTING_RULE_CONFIG[fastingItem.rule];
              return (
                <View style={styles.eventList}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setFastingDetail(fastingItem);
                      setShowFastingDetail(true);
                    }}
                  >
                    <Card style={styles.fastingDayCard}>
                      <View style={styles.fastingDayRow}>
                        <View style={styles.fastingDayDate}>
                          <Text style={styles.fastingDayDateDay}>
                            {format(event.date, 'dd', { locale: mk })}
                          </Text>
                          <Text style={styles.fastingDayDateMonth}>
                            {format(event.date, 'MMM', { locale: mk })}
                          </Text>
                        </View>
                        <View style={styles.fastingDayContent}>
                          <Text style={styles.fastingDayTitle}>{fastingItem.period.name}</Text>
                          <View style={styles.fastingDayRuleRow}>
                            <View
                              style={[styles.fastingDayRuleDot, { backgroundColor: ruleConfig.color }]}
                            >
                              <MaterialCommunityIcons
                                name={ruleConfig.icon as any}
                                size={11}
                                color="#fff"
                              />
                            </View>
                            <Text style={[styles.fastingDayRuleText, { color: ruleConfig.color }]}>
                              {ruleConfig.shortLabel}
                            </Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#B8A88E" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
            <View style={styles.eventList}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedEvent(event);
                  setShowEventDetail(true);
                }}
              >
              <Card
                style={styles.eventCardIntegrated}
              >
                <View style={styles.integratedCardRow}>
                  {/* Date Section */}
                  <View style={[
                    styles.integratedDateSection,
                    { backgroundColor: SERVICE_TYPE_COLORS[event.serviceType as ServiceType] }
                  ]}>
                    <Text style={styles.integratedDateDay}>
                      {format(event.date, 'dd', { locale: mk })}
                    </Text>
                    <Text style={styles.integratedDateMonth}>
                      {format(event.date, 'MMM', { locale: mk })}
                    </Text>
                  </View>

                  {/* Content Section */}
                  <View style={styles.integratedContentSection}>
                    <Text style={styles.integratedTitle}>
                      {event.name}
                    </Text>
                    {event.saintName && !event.saintName.toLowerCase().includes('not found') && event.saintName.trim() !== '' && (
                      <Text style={styles.integratedSaintName}>
                        {event.saintName}
                      </Text>
                    )}
                    <View style={styles.integratedInfoRow}>
                      <MaterialCommunityIcons
                        name={SERVICE_TYPE_ICONS[event.serviceType as ServiceType]}
                        size={14}
                        color={SERVICE_TYPE_COLORS[event.serviceType as ServiceType]}
                      />
                      <Text style={[
                        styles.integratedEventType,
                        { color: SERVICE_TYPE_COLORS[event.serviceType as ServiceType] }
                      ]}>
                        {getServiceTypeLabel(event.serviceType)}
                      </Text>
                    </View>
                    <View style={styles.integratedInfoRow}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color="#555555"
                      />
                      <Text style={styles.integratedTime}>
                        {event.description || `${event.time}ч`}
                      </Text>
                    </View>

                    {/* Fasting line under the time - always shown on fasting days */}
                    {(() => {
                      const info = getFastingInfoForDate(event.date, fastingPeriods);
                      if (!info) return null;
                      return (
                        <FastingBadge
                          info={info}
                          onPress={() => {
                            setFastingDetail(info);
                            setShowFastingDetail(true);
                          }}
                        />
                      );
                    })()}
                  </View>

                  {/* Image Section */}
                  <View style={styles.integratedImageSection}>
                    <EventImage event={event} />
                  </View>
                </View>

                {/* Circular More Button - Fades in/out for middle 2 cards */}
                {hasScrolled && (
                  <AnimatedIcon
                    visible={visibleItems.includes(event.date.toISOString() + event.serviceType)}
                    color={SERVICE_TYPE_COLORS[event.serviceType as ServiceType]}
                  />
                )}
              </Card>
              </TouchableOpacity>
            </View>
            );
          }}
          stickySectionHeadersEnabled={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
              title="Се освежува..."
              titleColor={COLORS.PRIMARY}
            />
          }
          ListHeaderComponent={
            <>
              {/* Church Branding Header - Hidden admin access: tap 5 times OR hold 2 sec if logged in */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleHeaderTap}
                onPressIn={handleHeaderPressIn}
                onPressOut={handleHeaderPressOut}
                delayLongPress={2000}
              >
                <View style={[styles.brandingHeader, isLongPressing && styles.brandingHeaderPressed]}>
                  <View style={styles.brandingSolid}>
                    <View style={styles.brandingContent}>
                      <View style={styles.brandingTitleRow}>
                        <Text style={styles.brandingTitle}>Св. Наум Охридски</Text>
                        <Text style={styles.brandingSeparator}>•</Text>
                        <Text style={styles.brandingLocation}>Триенген, CH</Text>
                      </View>
                      <Text style={styles.brandingSubtitle}>Годишен План 2026</Text>
                      {isLongPressing && (
                        <View style={styles.longPressIndicator}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.longPressText}>Отварање админ...</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <Searchbar
                placeholder="Пребарувај настани"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />

              {(() => {
                const screenWidth = Dimensions.get('window').width;
                const containerPadding = 32;
                const buttonSpacing = 24;
                const availableWidth = screenWidth - containerPadding - (buttonSpacing * 2);
                const buttonWidth = availableWidth / 3;
                const isVerySmall = screenWidth < 340;
                const iconSize = isVerySmall ? 18 : screenWidth < 380 ? 20 : 22;
                const fontSize = isVerySmall ? 10 : screenWidth < 380 ? 11 : 12;

                return (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.socialButton,
                        {
                          backgroundColor: '#4267B2',
                          width: buttonWidth,
                          marginRight: 12,
                        }
                      ]}
                      onPress={() => SocialMediaService.openFacebookGroup()}
                    >
                      <MaterialCommunityIcons name="facebook" size={iconSize} color={COLORS.TEXT_LIGHT} />
                      <Text style={[styles.buttonText, { fontSize }]} numberOfLines={1} ellipsizeMode="tail">Facebook</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.socialButton,
                        {
                          backgroundColor: COLORS.PRIMARY,
                          width: buttonWidth,
                          marginHorizontal: 6,
                        }
                      ]}
                      onPress={showContactInfo}
                    >
                      <MaterialCommunityIcons name="phone" size={iconSize} color={COLORS.TEXT_LIGHT} />
                      <Text style={[styles.buttonText, { fontSize }]} numberOfLines={1} ellipsizeMode="tail">Контакт</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.socialButton,
                        {
                          backgroundColor: COLORS.TERTIARY,
                          width: buttonWidth,
                          marginLeft: 12,
                        }
                      ]}
                      onPress={() => SocialMediaService.openWebsite()}
                    >
                      <MaterialCommunityIcons name="web" size={iconSize} color={COLORS.TEXT_LIGHT} />
                      <Text style={[styles.buttonText, { fontSize }]} numberOfLines={1} ellipsizeMode="tail">
                        {isVerySmall ? 'Веб' : 'Веб-страна'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {renderServiceTypeFilters()}

              {/* Month Quick-Jump Bar */}
              {renderMonthQuickJump()}

              {/* Active Announcements Section */}
              {announcements.length > 0 && (
                <View style={styles.announcementsSection}>
                  <Surface style={styles.announcementsSectionHeader}>
                    <MaterialCommunityIcons name="bullhorn" size={20} color={COLORS.PRIMARY} />
                    <Title style={styles.announcementsSectionTitle}>Огласи</Title>
                  </Surface>
                  <View style={styles.announcementsList}>
                    {announcements.map((announcement) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onPress={() => navigation.navigate('NotificationDetail', {
                          title: announcement.title,
                          body: announcement.message + (announcement.linkUrl ? `\n\n🔗 Линк:\n${announcement.linkText || 'Отвори линк'}: ${announcement.linkUrl}` : ''),
                          receivedAt: announcement.startDate.toISOString(),
                        })}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          }
        />

        {/* Next Event FAB Button */}
        {showTodayButton && (
          <FAB
            icon="calendar-arrow-right"
            label="Следен"
            onPress={scrollToNextEvent}
            style={styles.todayFab}
            color={COLORS.TEXT_LIGHT}
            small
          />
        )}

        <Portal>
          <Dialog
            visible={contactDialogVisible}
            onDismiss={() => setContactDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={{ color: COLORS.PRIMARY, fontSize: 20, fontWeight: 'bold' }}>
              Контакт Информации
            </Dialog.Title>
            <Dialog.Content>
              <Text style={{
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 16,
                color: COLORS.TEXT,
              }}>
                Браќа и Сестри, со Благослов на Неговото високопреосвештенство Митрополит Европски Пимен, Празниците кои според календарот паѓаат во работни денови, светите Богослужби се отслужуваат пред денот на празникот со почеток во 19.00 ч, според годишниот план за Богослужби.
              </Text>
              <Text style={{
                fontSize: 16,
                lineHeight: 24,
                marginTop: 8,
                fontWeight: 'bold',
                color: COLORS.PRIMARY,
              }}>
                Свештеник: Протoпрезвитер о. Горан Мантароски: 078 646 83 07
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setContactDialogVisible(false)}>Затвори</Button>
              <Button onPress={() => Linking.openURL('tel:+38978646837')}>Повикај</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Event Detail Bottom Sheet */}
        <EventDetailSheet
          visible={showEventDetail}
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
        />

        {/* Fasting Detail Bottom Sheet (additive) */}
        <FastingDetailSheet
          visible={showFastingDetail}
          info={fastingDetail}
          onClose={() => {
            setShowFastingDetail(false);
            setFastingDetail(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fastingDayCard: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
    borderWidth: 0.5,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  fastingDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  fastingDayDate: {
    width: 70,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4E9B', // lenten violet - the fasting identity color
  },
  fastingDayDateDay: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 19,
  },
  fastingDayDateMonth: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  fastingDayContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  fastingDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  fastingDayRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  fastingDayRuleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastingDayRuleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  mainContainer: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  // Church Branding Header styles
  brandingHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  brandingHeaderPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  longPressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  longPressText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  brandingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  brandingSolid: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  brandingContent: {
    alignItems: 'center',
  },
  brandingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingTextContainer: {
    alignItems: 'flex-start',
  },
  brandingTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
  },
  brandingSubtitle: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  brandingSeparator: {
    fontSize: 17,
    color: '#D4AF37',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  brandingLocation: {
    fontSize: 17,
    color: COLORS.TEXT_LIGHT,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: COLORS.SURFACE,
  },
  monthSection: {
    marginBottom: 24,
  },
  // Church-style month header
  monthHeaderContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  monthHeaderGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  monthHeaderSolid: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 26,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Legacy monthHeader (kept for compatibility)
  monthHeader: {
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  eventList: {
    paddingHorizontal: 16,
  },
  eventCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFDF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderTopWidth: 4,
  },
  // Integrated Horizontal Card Layout
  eventCardIntegrated: {
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
    // Subtle gold border
    borderWidth: 0.5,
    borderColor: '#D4AF37',
    // Elegant shadow
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  eventCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
    borderColor: '#831B26',
    borderWidth: 1,
  },
  integratedCardRow: {
    flexDirection: 'row',
    height: 160,
  },
  integratedDateSection: {
    width: 70,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  integratedDateDay: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  integratedDateMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    marginTop: 4,
    opacity: 0.9,
  },
  integratedContentSection: {
    flex: 1,
    height: 160,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  integratedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    lineHeight: 20,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  integratedSaintName: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  integratedInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  integratedEventType: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
    flex: 1,
    flexWrap: 'wrap',
  },
  integratedTime: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '600',
    marginLeft: 5,
  },
  integratedImageSection: {
    width: 100,
    height: 160,
    backgroundColor: '#F5F5F0',
    overflow: 'hidden',
  },
  moreButtonCircleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 19, // Centered under 70px date section: (70 - 32) / 2
    zIndex: 10,
  },
  moreButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  // New Modern Card Layout Styles
  cardImageSection: {
    position: 'relative',
    height: 160,
    backgroundColor: '#F5F5F0',
  },
  cardImageWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  dateBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dateBadgeDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    lineHeight: 26,
  },
  dateBadgeMonth: {
    fontSize: 11,
    color: '#D4AF37',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serviceTypeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  cardContentSection: {
    padding: 14,
  },
  eventTitle: {
    fontSize: 17,
    color: COLORS.PRIMARY,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
    lineHeight: 22,
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 3,
  },
  serviceTypeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.TERTIARY,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Legacy styles kept for compatibility
  cardContent: {
    flex: 1,
    paddingBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    minWidth: 64,
    width: 64,
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateMonth: {
    fontSize: 11,
    color: '#D4AF37',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  eventInfo: {
    flex: 1,
    paddingRight: 12,
    minWidth: Dimensions.get('window').width < 360 ? 100 : 120,
    flexShrink: 1,
    maxWidth: Dimensions.get('window').width < 360 ? '60%' : '70%',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.BACKGROUND,
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexWrap: 'wrap',
    borderColor: COLORS.BORDER,
    maxWidth: '100%',
  },
  serviceType: {
    fontSize: Dimensions.get('window').width < 360 ? 10 : 11,
    marginLeft: 6,
    fontWeight: '600',
    color: COLORS.TEXT,
    flexShrink: 1,
    lineHeight: 14,
    flex: 1,
  },
  time: {
    fontSize: 13,
    color: COLORS.TERTIARY,
    fontWeight: '600',
    marginTop: 4,
    flexShrink: 1,
    lineHeight: 18,
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 4,
    flexShrink: 0,
    width: Dimensions.get('window').width < 360 ? 100 : 120,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F5F5F0',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    // Gold accent border
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    // Soft inner shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: '100%',
    height: '130%',
    top: 0,
  },
  // Bulletproof image styles for card layouts
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  eventImageFixed: {
    width: '100%',
    height: '100%',
    minHeight: 110,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  iconFallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    opacity: 0.7,
    fontSize: 70,
    color: COLORS.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  loadingBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  dimOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    color: COLORS.TEXT_LIGHT,
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  filterContentContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterChipTouchable: {
    borderWidth: 1.5,
    elevation: 3,
    marginHorizontal: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
  dialog: {
    backgroundColor: COLORS.SURFACE,
    margin: 20,
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    marginLeft: 6,
    fontWeight: 'bold',
    flexShrink: 1,
    textAlign: 'center',
  },
  churchInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  churchName: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  churchAddress: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    marginTop: 4,
  },
  saintNameText: {
    fontSize: 11,
    color: COLORS.TEXT,
    fontStyle: 'italic',
    marginBottom: 8,
    marginTop: -4,
  },
  // Announcement styles
  announcementsSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  announcementsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  announcementsList: {
    gap: 0,
  },
  announcementsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  announcementCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 5,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  announcementTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementTypeChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  announcementMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  announcementLink: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  announcementDate: {
    fontSize: 11,
    color: '#999',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Month Quick-Jump styles
  monthQuickJumpContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthQuickJumpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  monthQuickJumpItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  monthQuickJumpItemSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  monthQuickJumpItemCurrent: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  monthQuickJumpItemDisabled: {
    opacity: 0.3,
  },
  monthQuickJumpText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  monthQuickJumpTextSelected: {
    color: COLORS.TEXT_LIGHT,
  },
  monthQuickJumpTextDisabled: {
    color: '#999',
  },
  currentMonthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginTop: 2,
  },
  // Today FAB Button styles
  todayFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
