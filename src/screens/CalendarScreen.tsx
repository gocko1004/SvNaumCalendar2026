import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, Image, Animated, TouchableOpacity, Dimensions, ActivityIndicator, SafeAreaView, Text, Linking as RNLinking, RefreshControl } from 'react-native';
import { Card, Title, Searchbar, Surface, Chip, Button, Dialog, Portal, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Triodion_400Regular } from '@expo-google-fonts/triodion';
import { CHURCH_EVENTS, ChurchEvent, SPECIAL_FEAST_URLS, getServiceTypeLabel, ServiceType, getEventsForDate } from '../services/ChurchCalendarService';
import { getImageForEvent } from '../services/LocalImageService';
import { getDenoviImageUrl } from '../services/DenoviImageService';
import { getAllEvents, mergeEvents } from '../services/FirestoreEventService';
import { getActiveAnnouncements, Announcement, ANNOUNCEMENT_TYPE_COLORS, ANNOUNCEMENT_TYPE_ICONS } from '../services/AnnouncementsService';
import { getActiveNews, NewsItem, NEWS_COLOR, NEWS_ICON } from '../services/NewsService';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, CARD_STYLES } from '../constants/theme';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SocialMediaService from '../services/SocialMediaService';
import { Linking } from 'react-native';

const SERVICE_TYPE_COLORS = {
  LITURGY: '#922B3E',          // Byzantine red - liturgical vestments
  EVENING_SERVICE: '#1E3A5F',  // Deep icon blue - evening sky, Mary's robe
  CHURCH_OPEN: '#4A6741',      // Orthodox green - life, Holy Spirit
  PICNIC: '#B8860B'            // Dark gold - iconography, warmth
} as const;

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
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  const typeColor = ANNOUNCEMENT_TYPE_COLORS[announcement.type];
  const typeIcon = ANNOUNCEMENT_TYPE_ICONS[announcement.type];

  const handleLinkPress = () => {
    if (announcement.linkUrl) {
      Linking.openURL(announcement.linkUrl);
    }
  };

  return (
    <Card style={[styles.announcementCard, { borderLeftColor: typeColor }]}>
      <Card.Content>
        <View style={styles.announcementHeader}>
          <View style={styles.announcementIconContainer}>
            <MaterialCommunityIcons name={typeIcon as any} size={24} color={typeColor} />
          </View>
          <View style={styles.announcementContent}>
            <View style={styles.announcementTitleRow}>
              <Text style={[styles.announcementTitle, { color: typeColor }]}>{announcement.title}</Text>
              <Chip style={[styles.announcementChip, { backgroundColor: typeColor + '20' }]} textStyle={{ color: typeColor, fontSize: 10 }}>
                {announcement.type === 'INFO' ? 'Информација' :
                 announcement.type === 'URGENT' ? 'Итно' :
                 announcement.type === 'EVENT' ? 'Настан' : 'Потсетник'}
              </Chip>
            </View>
            <Text style={styles.announcementMessage}>{announcement.message}</Text>
            {announcement.linkUrl && announcement.linkText && (
              <TouchableOpacity onPress={handleLinkPress}>
                <Text style={[styles.announcementLink, { color: typeColor }]}>{announcement.linkText} →</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.announcementDate}>
              {format(announcement.startDate, 'dd.MM', { locale: mk })} - {format(announcement.endDate, 'dd.MM.yyyy', { locale: mk })}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

// News Card Component with Gallery and Video Support
const NewsCard = ({ news }: { news: NewsItem }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const handleLinkPress = () => {
    if (news.linkUrl) {
      Linking.openURL(news.linkUrl);
    }
  };

  // Combine legacy imageUrl with imageUrls array
  const allImages = [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.imageUrls || []),
  ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

  const videos = news.videoUrls || [];

  return (
    <Card style={styles.newsCard}>
      <Card.Content>
        <View style={styles.newsHeader}>
          <View style={styles.newsIconContainer}>
            <MaterialCommunityIcons name={NEWS_ICON as any} size={24} color={NEWS_COLOR} />
          </View>
          <View style={styles.newsContent}>
            <View style={styles.newsTitleRow}>
              <Text style={styles.newsTitle}>{news.title}</Text>
              <Chip style={styles.newsChip} textStyle={{ color: NEWS_COLOR, fontSize: 10 }}>
                Новост
              </Chip>
            </View>
            <Text style={styles.newsMessage} numberOfLines={6}>{news.content}</Text>
            {news.linkUrl && news.linkText && (
              <TouchableOpacity onPress={handleLinkPress}>
                <Text style={styles.newsLink}>{news.linkText} →</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.newsDate}>
              {format(news.date, 'dd MMMM yyyy', { locale: mk })}
            </Text>
          </View>
        </View>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <View style={styles.newsGallery}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allImages.map((imageUrl, index) => (
                <TouchableOpacity
                  key={`img-${index}`}
                  onPress={() => setExpandedImage(imageUrl)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={[
                      styles.newsGalleryImage,
                      allImages.length === 1 && styles.newsGallerySingleImage,
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {allImages.length > 1 && (
              <Text style={styles.newsGalleryCount}>{allImages.length} слики</Text>
            )}
          </View>
        )}

        {/* Video Players */}
        {videos.length > 0 && (
          <View style={styles.newsVideos}>
            {videos.map((videoUrl, index) => (
              <View key={`vid-${index}`} style={styles.newsVideoContainer}>
                <Video
                  source={{ uri: videoUrl }}
                  style={styles.newsVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                />
              </View>
            ))}
          </View>
        )}

        {/* Expanded Image Modal */}
        {expandedImage && (
          <TouchableOpacity
            style={styles.expandedImageOverlay}
            onPress={() => setExpandedImage(null)}
            activeOpacity={1}
          >
            <Image
              source={{ uri: expandedImage }}
              style={styles.expandedImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeExpandedButton}
              onPress={() => setExpandedImage(null)}
            >
              <MaterialCommunityIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
};

export const CalendarScreen = () => {
  const [fontsLoaded] = useFonts({
    Triodion_400Regular,
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<ChurchEvent[]>(CHURCH_EVENTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [serviceTypeFilters, setServiceTypeFilters] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Set<ServiceType>>(new Set());
  const [showNewsOnly, setShowNewsOnly] = useState(false);
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTodayButton, setShowTodayButton] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const scrollViewRef = useRef<ScrollView>(null);
  const monthPositions = useRef<Record<number, number>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

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
        const merged = mergeEvents(CHURCH_EVENTS, firestoreEvents);
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

    // Load news items
    const loadNews = async () => {
      try {
        const activeNews = await getActiveNews();
        setNewsItems(activeNews);
      } catch (error) {
        console.error('Error loading news:', error);
      }
    };
    loadNews();

    return () => clearTimeout(timer);
  }, []);

  // Pull-to-refresh handler
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
      const [firestoreEvents, activeAnnouncements, activeNews] = await Promise.all([
        getAllEvents(),
        getActiveAnnouncements(),
        getActiveNews(),
      ]);

      const merged = mergeEvents(CHURCH_EVENTS, firestoreEvents);
      const enriched = enrichEventsWithImages(merged);
      setEvents(enriched);
      setAnnouncements(activeAnnouncements);
      setNewsItems(activeNews);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }

    setRefreshing(false);
  }, []);

  // Scroll to specific month
  const scrollToMonth = useCallback((monthIndex: number) => {
    setSelectedMonth(monthIndex);
    const position = monthPositions.current[monthIndex];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: position - 100, animated: true });
    }
  }, []);

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
      setShowNewsOnly(false);
      setSelectedServiceTypes(new Set());
    }
  }, [events, scrollToMonth]);

  // Handle scroll events to show/hide Today button
  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    setShowTodayButton(scrollPosition > 300);

    // Update selected month based on scroll position
    const positions = Object.entries(monthPositions.current);
    for (let i = positions.length - 1; i >= 0; i--) {
      const [month, pos] = positions[i];
      if (scrollPosition >= (pos as number) - 150) {
        setSelectedMonth(parseInt(month));
        break;
      }
    }
  }, []);

  // Group and filter events
  const filteredAndGroupedEvents = React.useMemo(() => {
    return events
      .filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedServiceTypes.size === 0 || selectedServiceTypes.has(event.serviceType);
        return matchesSearch && matchesType;
      })
      .reduce((acc, event) => {
        const month = event.date.getMonth();
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(event);
        return acc;
      }, {} as Record<number, ChurchEvent[]>);
  }, [searchQuery, selectedServiceTypes, events]);

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

  // Month names in Macedonian
  const monthNames = [
    'Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
    'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ];

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

        {/* News Filter Button */}
        <TouchableOpacity
          onPress={() => {
            setShowNewsOnly(!showNewsOnly);
            if (!showNewsOnly) {
              setSelectedServiceTypes(new Set()); // Clear other filters when showing news
            }
          }}
          style={[
            styles.filterChipTouchable,
            {
              backgroundColor: showNewsOnly ? NEWS_COLOR : COLORS.SURFACE,
              width: isVerySmall ? 90 : 110,
              minHeight: isVerySmall ? 36 : 40,
              borderColor: showNewsOnly ? NEWS_COLOR : COLORS.BORDER,
            }
          ]}
        >
          <MaterialCommunityIcons
            name={NEWS_ICON as any}
            size={isVerySmall ? 14 : isSmall ? 15 : 16}
            color={showNewsOnly ? COLORS.TEXT_LIGHT : COLORS.TEXT}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color: showNewsOnly ? COLORS.TEXT_LIGHT : COLORS.TEXT,
                fontSize: isVerySmall ? 9 : isSmall ? 10 : 11,
                flex: 1,
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.65}
          >
            Новости
          </Text>
        </TouchableOpacity>
    </ScrollView>
  );
  };

  // Month Quick-Jump component
  const renderMonthQuickJump = () => {
    const shortMonthNames = ['Јан', 'Фев', 'Мар', 'Апр', 'Мај', 'Јун', 'Јул', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
    const currentMonth = new Date().getMonth();
    const availableMonths = Object.keys(filteredAndGroupedEvents).map(m => parseInt(m));

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
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
        >
          {/* Church Branding Header */}
          <View style={styles.brandingHeader}>
            <LinearGradient
              colors={['#831B26', '#5C1219', '#831B26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.brandingGradient}
            >
              <View style={styles.brandingContent}>
                <MaterialCommunityIcons name="cross" size={28} color="#D4AF37" />
                <View style={styles.brandingTextContainer}>
                  <Text style={styles.brandingTitle}>Св. Наум Охридски</Text>
                  <Text style={styles.brandingSubtitle}>Годишен План 2026</Text>
                </View>
                <MaterialCommunityIcons name="cross" size={28} color="#D4AF37" />
              </View>
            </LinearGradient>
          </View>

          <Searchbar
            placeholder="Пребарувај настани"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {(() => {
            const screenWidth = Dimensions.get('window').width;
            const containerPadding = 32; // 16px on each side
            const buttonSpacing = 24; // 12px between each button
            const availableWidth = screenWidth - containerPadding - (buttonSpacing * 2); // space for 3 buttons with 2 gaps
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
          {!showNewsOnly && renderMonthQuickJump()}

          {/* Active Announcements Section */}
          {announcements.length > 0 && !showNewsOnly && (
            <View style={styles.announcementsSection}>
              <Surface style={styles.announcementsSectionHeader}>
                <MaterialCommunityIcons name="bullhorn" size={20} color={COLORS.PRIMARY} />
                <Title style={styles.announcementsSectionTitle}>Огласи</Title>
              </Surface>
              <View style={styles.announcementsList}>
                {announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </View>
            </View>
          )}

          {/* News Section - Shows when News filter is active */}
          {showNewsOnly && (
            <View style={styles.newsSection}>
              <Surface style={styles.newsSectionHeader}>
                <MaterialCommunityIcons name={NEWS_ICON as any} size={20} color={NEWS_COLOR} />
                <Title style={styles.newsSectionTitle}>Новости</Title>
              </Surface>
              {newsItems.length === 0 ? (
                <Card style={styles.emptyNewsCard}>
                  <Card.Content style={styles.emptyNewsContent}>
                    <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyNewsText}>Нема новости</Text>
                  </Card.Content>
                </Card>
              ) : (
                <View style={styles.newsList}>
                  {newsItems.map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Calendar Events - Hidden when News filter is active */}
          {!showNewsOnly && Object.entries(filteredAndGroupedEvents).map(([month, monthEvents]) => (
            <View
              key={month}
              style={styles.monthSection}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                monthPositions.current[parseInt(month)] = y;
              }}
            >
              <View style={styles.monthHeaderContainer}>
                <LinearGradient
                  colors={['#831B26', '#5C1219', '#831B26']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.monthHeaderGradient}
                >
                  <View style={styles.monthHeaderContent}>
                    <Text
                      style={[
                        styles.monthTitle,
                        fontsLoaded && { fontFamily: 'Triodion_400Regular' }
                      ]}
                    >
                      {monthNames[parseInt(month)]}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.eventList}>
                {monthEvents
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((event, index) => (
                    <Card
                      key={`${month}-${index}`}
                      style={styles.eventCardIntegrated}
                    >
                      <View style={styles.integratedCardRow}>
                        {/* Date Section */}
                        <View style={[
                          styles.integratedDateSection,
                          { backgroundColor: SERVICE_TYPE_COLORS[event.serviceType] }
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
                          <Text style={[
                            styles.integratedEventType,
                            { color: SERVICE_TYPE_COLORS[event.serviceType] }
                          ]}>
                            {getServiceTypeLabel(event.serviceType)}
                          </Text>
                          <Text style={styles.integratedTime}>
                            {event.description || `${event.time}ч`}
                          </Text>
                          <Text style={styles.integratedTitle} numberOfLines={3}>
                            {event.name}
                          </Text>
                          {event.saintName && !event.saintName.toLowerCase().includes('not found') && event.saintName.trim() !== '' && (
                            <Text style={styles.integratedSaintName} numberOfLines={2}>
                              {event.saintName}
                            </Text>
                          )}
                        </View>

                        {/* Image Section */}
                        <View style={styles.integratedImageSection}>
                          <EventImage event={event} />
                        </View>
                      </View>
                    </Card>
                  ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Next Event FAB Button */}
        {showTodayButton && !showNewsOnly && (
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
  brandingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  brandingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingTextContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  brandingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandingSubtitle: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
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
    elevation: 6,
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  monthHeaderGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  monthHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 22,
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
  integratedCardRow: {
    flexDirection: 'row',
    height: 140,
  },
  integratedDateSection: {
    width: 70,
    height: 140,
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
    height: 140,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  integratedEventType: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  integratedTime: {
    fontSize: 13,
    color: COLORS.TERTIARY,
    fontWeight: '600',
    marginBottom: 5,
  },
  integratedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    lineHeight: 19,
    flexWrap: 'wrap',
  },
  integratedSaintName: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 3,
  },
  integratedImageSection: {
    width: 100,
    height: 140,
    backgroundColor: '#F5F5F0',
    overflow: 'hidden',
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
  announcementChip: {
    height: 22,
    marginLeft: 8,
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
  announcementDate: {
    fontSize: 11,
    color: '#999',
  },
  // News styles
  newsSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: NEWS_COLOR + '15',
  },
  newsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: NEWS_COLOR,
    marginLeft: 8,
  },
  newsList: {
    gap: 12,
  },
  newsCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: NEWS_COLOR,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  newsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEWS_COLOR + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: NEWS_COLOR,
  },
  newsChip: {
    height: 22,
    marginLeft: 8,
    backgroundColor: NEWS_COLOR + '20',
  },
  newsMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  newsLink: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: NEWS_COLOR,
  },
  newsDate: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  newsImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  newsGallery: {
    marginTop: 12,
  },
  newsGalleryImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  newsGallerySingleImage: {
    width: Dimensions.get('window').width - 80,
    height: 200,
  },
  newsGalleryCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  newsVideos: {
    marginTop: 12,
  },
  newsVideoContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  newsVideo: {
    width: '100%',
    height: 200,
  },
  expandedImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  expandedImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.7,
  },
  closeExpandedButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  emptyNewsCard: {
    marginTop: 20,
  },
  emptyNewsContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyNewsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
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
