import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Image, Animated, TouchableOpacity, Dimensions, ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { Card, Title, Searchbar, Surface, Chip, Button, Dialog, Portal } from 'react-native-paper';
import { CHURCH_EVENTS_2025, ChurchEvent, getServiceTypeLabel, ServiceType, getEventsForDate } from '../services/ChurchCalendarService';
import { COLORS, CARD_STYLES } from '../constants/theme';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SocialMediaService from '../services/SocialMediaService';
import { Linking } from 'react-native';

const SERVICE_TYPE_COLORS = {
  LITURGY: '#E57373',
  EVENING_SERVICE: '#81C784',
  CHURCH_OPEN: '#64B5F6',
  PICNIC: '#FFB74D'
} as const;

const SERVICE_TYPE_ICONS = {
  LITURGY: 'church' as const,
  EVENING_SERVICE: 'moon-waning-crescent' as const,
  CHURCH_OPEN: 'door-open' as const,
  PICNIC: 'food' as const
} as const;

const getEventImage = (event: ChurchEvent) => {
  const date = event.date;

  // January images
  if (event.name === 'Св. Наум Охридски') {
    try {
      return require('../../assets/images/saints/05-Jan.jpg');
    } catch (error) {
      console.warn('Image not found for January 5th, using default');
      return null;
    }
  }

  // Handle all dates with a switch statement
  const dateKey = `${date.getDate()}-${date.getMonth() + 1}`; // +1 to convert from 0-based month
  
  // Create a mapping object for better maintainability
  const imageMap: { [key: string]: any } = {
    // January
    '5-1': () => require('../../assets/images/saints/05-Jan.jpg'),
    '12-1': () => require('../../assets/images/saints/12-Jan.jpg'),
    '19-1': () => require('../../assets/images/saints/19-Jan.jpg'),
    '26-1': () => require('../../assets/images/saints/26-Jan.jpg'),
    
    // February
    '2-2': () => require('../../assets/images/saints/02-Feb.jpg'),
    '9-2': () => require('../../assets/images/saints/09-Feb.jpg'),
    '15-2': () => require('../../assets/images/saints/15-Feb.jpg'),
    '16-2': () => require('../../assets/images/saints/16-Feb.jpg'),
    '22-2': () => require('../../assets/images/saints/22-Feb.jpg'),
    '23-2': () => require('../../assets/images/saints/23-Feb.jpg'),

    // March
    '2-3': () => require('../../assets/images/saints/02-March.jpg'),
    '9-3': () => require('../../assets/images/saints/09-March.jpg'),
    '16-3': () => require('../../assets/images/saints/16-March.jpg'),
    '23-3': () => require('../../assets/images/saints/23-March.jpg'),

    // April
    '6-4': () => require('../../assets/images/saints/06-April.jpg'),
    '12-4': () => require('../../assets/images/saints/12-April.jpg'),
    '13-4': () => require('../../assets/images/saints/13-April.jpg'),
    '17-4': () => require('../../assets/images/saints/17-April.jpg'),
    '18-4': () => require('../../assets/images/saints/18-April.jpg'),
    '19-4': () => require('../../assets/images/saints/19-April.jpg'),
    '20-4': () => require('../../assets/images/saints/20-April.jpg'),
    '27-4': () => require('../../assets/images/saints/27-April.jpg'),

    // May
    '4-5': () => require('../../assets/images/saints/04-May.jpg'),
    '6-5': () => require('../../assets/images/saints/06-May.jpg'),
    '11-5': () => require('../../assets/images/saints/11-may.jpg'),
    '18-5': () => require('../../assets/images/saints/18-May.jpg'),
    '24-5': () => require('../../assets/images/saints/24-May.jpg'),
    '25-5': () => require('../../assets/images/saints/25-May.jpg'),

    // June
    '1-6': () => require('../../assets/images/saints/01-June.jpg'),
    '8-6': () => require('../../assets/images/saints/08-June.jpg'),
    '15-6': () => require('../../assets/images/saints/15-June.jpg'),
    '22-6': () => require('../../assets/images/saints/22-June.jpg'),
    '29-6': () => require('../../assets/images/saints/29-June.jpg'),

    // July
    // '6-7': () => require('../../assets/images/saints/06-July.jpg'), // File doesn't exist
    '12-7': () => require('../../assets/images/saints/12-July.jpg'),
    '13-7': () => require('../../assets/images/saints/13-July.jpg'),
    '20-7': () => require('../../assets/images/saints/20-July.jpg'),
    '27-7': () => require('../../assets/images/saints/27-July.jpg'),

    // August
    '3-8': () => require('../../assets/images/saints/03-Aug.jpg'),
    '10-8': () => require('../../assets/images/saints/10-Aug.jpg'),
    '17-8': () => require('../../assets/images/saints/17-Aug.jpg'),
    '18-8': () => require('../../assets/images/saints/18-Aug.jpg'),
    '24-8': () => require('../../assets/images/saints/24-Aug.jpg'),
    '27-8': () => require('../../assets/images/saints/27-Aug.jpg'),
    '28-8': () => require('../../assets/images/saints/28-Aug.jpg'),
    '31-8': () => require('../../assets/images/saints/31-Aug.jpg'),

    // September
    '7-9': () => require('../../assets/images/saints/07-Sep.jpg'),
    '11-9': () => require('../../assets/images/saints/11-Sep.jpg'),
    '14-9': () => require('../../assets/images/saints/14-Sep.jpg'),
    // '18-9': () => require('../../assets/images/saints/18-Sep.jpg'), // File doesn't exist
    '21-9': () => require('../../assets/images/saints/21-Sep.jpg'),
    '27-9': () => require('../../assets/images/saints/27-Sep.jpg'),
    '28-9': () => require('../../assets/images/saints/28-Sep.jpg'),

    // October
    '5-10': () => require('../../assets/images/saints/05- Oct.jpg'), // Note: filename has a space
    '12-10': () => require('../../assets/images/saints/12-Oct.jpg'),
    '19-10': () => require('../../assets/images/saints/19-Oct.jpg'),
    '26-10': () => require('../../assets/images/saints/26-Oct.jpg'),
    '27-10': () => require('../../assets/images/saints/27-Oct.jpg'),

    // November
    '1-11': () => require('../../assets/images/saints/01-Nov.jpg'),
    '2-11': () => require('../../assets/images/saints/02-Nov.jpg'),
    '8-11': () => require('../../assets/images/saints/08-Nov.jpg'),
    '9-11': () => require('../../assets/images/saints/09-Nov.jpg'),
    '16-11': () => require('../../assets/images/saints/16-Nov.jpg'),
    '20-11': () => require('../../assets/images/saints/20-Nov.jpg'),
    '21-11': () => require('../../assets/images/saints/21-Nov.jpg'),
    '23-11': () => require('../../assets/images/saints/23-Nov.jpg'),
    '30-11': () => require('../../assets/images/saints/30-Nov.jpg'),

    // December
    '7-12': () => require('../../assets/images/saints/07-Dec.jpg'),
    '4-12': () => require('../../assets/images/saints/04-Dec.jpg'),
    '14-12': () => require('../../assets/images/saints/14-Dec.jpg'),
    '18-12': () => require('../../assets/images/saints/18-Dec.jpg'),
    '21-12': () => require('../../assets/images/saints/21-Dec.jpg'),
    '28-12': () => require('../../assets/images/saints/28-Dec.jpg'),
  };

  const imageLoader = imageMap[dateKey];
  if (imageLoader) {
    try {
      return imageLoader();
    } catch (error) {
      console.warn(`Image not found for date ${dateKey}, using default`);
      return null;
    }
  }

  return null;
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

export const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<ChurchEvent[]>(CHURCH_EVENTS_2025);
  const [serviceTypeFilters, setServiceTypeFilters] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Set<ServiceType>>(new Set());
  const [contactDialogVisible, setContactDialogVisible] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Group and filter events
  const filteredAndGroupedEvents = React.useMemo(() => {
    return CHURCH_EVENTS_2025
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
  }, [searchQuery, selectedServiceTypes]);

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
                numberOfLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.75}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
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
          
          {Object.entries(filteredAndGroupedEvents).map(([month, monthEvents]) => (
            <View key={month} style={styles.monthSection}>
              <Surface style={styles.monthHeader}>
                <Title style={styles.monthTitle}>{monthNames[parseInt(month)]}</Title>
              </Surface>
              <View style={styles.eventList}>
                {monthEvents
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((event, index) => (
                    <Card 
                      key={`${month}-${index}`} 
                      style={[
                        styles.eventCard,
                        { borderLeftColor: SERVICE_TYPE_COLORS[event.serviceType] }
                      ]}
                    >
                      <Card.Content>
                        <View style={styles.cardContent}>
                          <Title style={styles.eventTitle}>{event.name}</Title>
                          <View style={styles.cardDetails}>
                            <View style={styles.dateContainer}>
                              <Text style={styles.dateDay}>
                                {format(event.date, 'dd', { locale: mk })}
                              </Text>
                              <Text style={styles.dateMonth}>
                                {format(event.date, 'MMM', { locale: mk })}
                              </Text>
                            </View>
                            <View style={styles.eventInfo}>
                              <View style={styles.serviceTypeContainer}>
                                <MaterialCommunityIcons 
                                  name={SERVICE_TYPE_ICONS[event.serviceType]} 
                                  size={16} 
                                  color={SERVICE_TYPE_COLORS[event.serviceType]} 
                                />
                                <Text style={[
                                  styles.serviceType,
                                  { color: SERVICE_TYPE_COLORS[event.serviceType] }
                                ]}>
                                  {getServiceTypeLabel(event.serviceType)}
                                </Text>
                              </View>
                              <Text style={styles.time}>
                                {event.description || `Време: ${event.time}ч`}
                              </Text>
                            </View>
                            <View style={styles.rightContainer}>
                              <View style={styles.imageContainer}>
                                {(() => {
                                  const eventImage = getEventImage(event);
                                  
                                  if (!eventImage) {
                                    return (
                                      <MaterialCommunityIcons 
                                        name={SERVICE_TYPE_ICONS[event.serviceType]}
                                        size={40}
                                        color={SERVICE_TYPE_COLORS[event.serviceType]}
                                        style={styles.fallbackIcon}
                                      />
                                    );
                                  }
                                  
                                  return (
                                    <Image 
                                      source={eventImage}
                                      style={styles.eventImage}
                                      resizeMode="cover"
                                      onError={() => {
                                        // Silently handle image loading errors - fallback handled by parent
                                        // The error is caught and won't show a notification
                                      }}
                                    />
                                  );
                                })()}
                              </View>
                            </View>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
              </View>
            </View>
          ))}
        </ScrollView>

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
    paddingVertical: 16,
    paddingBottom: 24,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: COLORS.SURFACE,
  },
  monthSection: {
    marginBottom: 20,
  },
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
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    padding: 12,
  },
  eventList: {
    paddingHorizontal: 16,
  },
  eventCard: {
    marginBottom: 16,
    padding: 0,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    backgroundColor: '#F8F4E9', // Warm parchment color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    borderLeftWidth: 4, // Thicker left border for service type
    overflow: 'hidden',
  },
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
  eventTitle: {
    fontSize: Dimensions.get('window').width < 360 ? 15 : 16,
    color: COLORS.PRIMARY,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    flexShrink: 1,
    lineHeight: 22,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: Dimensions.get('window').width < 360 ? 50 : 60,
    width: Dimensions.get('window').width < 360 ? 50 : 60,
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  dateMonth: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
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
    borderColor: COLORS.BORDER,
    flexWrap: 'wrap',
    maxWidth: '100%',
    width: '100%',
  },
  serviceType: {
    fontSize: Dimensions.get('window').width < 360 ? 11 : 13,
    marginLeft: 6,
    fontWeight: '600',
    color: COLORS.TEXT,
    flexShrink: 1,
    flex: 1,
    lineHeight: 16,
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
    borderRadius: 15,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  eventImage: {
    width: '100%',
    height: '100%',
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
});
