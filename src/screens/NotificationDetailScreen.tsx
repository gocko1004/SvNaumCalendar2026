import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, Linking, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  MainTabs: undefined;
  AdminPanel: undefined;
  NotificationDetail: {
    title: string;
    body: string;
    data?: any;
    receivedAt?: string;
  };
};

type NotificationDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

export const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({ route, navigation }) => {
  const { title, body, data, receivedAt } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animate icon visibility based on scroll
  const iconOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const iconHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [72, 0],
    extrapolate: 'clamp',
  });

  const iconMargin = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [12, 0],
    extrapolate: 'clamp',
  });

  const formattedDate = receivedAt
    ? format(new Date(receivedAt), 'dd MMMM yyyy, HH:mm', { locale: mk })
    : format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: mk });

  // Helper function to detect and render clickable URLs
  const renderTextWithLinks = (text: string, key: string) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    if (parts.length === 1) {
      // No URLs found
      return <RNText style={styles.bodyText}>{text}</RNText>;
    }

    return (
      <RNText key={key} style={styles.bodyText}>
        {parts.map((part, idx) => {
          if (urlRegex.test(part)) {
            // Reset regex lastIndex
            urlRegex.lastIndex = 0;
            return (
              <RNText
                key={idx}
                style={styles.linkText}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </RNText>
            );
          }
          return part;
        })}
      </RNText>
    );
  };

  // Parse body to detect sections (locations, rules, Google Maps links, etc.)
  const renderFormattedBody = () => {
    // Handle different line ending styles and clean up the body
    const cleanBody = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanBody.split('\n');
    const elements: React.ReactNode[] = [];
    let currentSection: string | null = null;
    let currentSectionEmoji: string | null = null;
    let sectionItems: string[] = [];
    let googleMapsLinks: { name: string; url: string }[] = [];

    // Helper to check if URL is a Google Maps link
    const isGoogleMapsUrl = (url: string) => {
      return url.includes('maps.google') ||
             url.includes('goo.gl/maps') ||
             url.includes('maps.app.goo') ||
             url.includes('google.com/maps');
    };

    // Pre-scan body for any Google Maps URLs that might be inline (but NOT in a dedicated section)
    // We'll add these later only if not already found in a named section
    const inlineGoogleMapsUrls: string[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    while ((match = urlRegex.exec(cleanBody)) !== null) {
      const url = match[1];
      if (isGoogleMapsUrl(url)) {
        inlineGoogleMapsUrls.push(url);
      }
    }

    const flushSection = () => {
      if (currentSection && currentSection !== 'GOOGLE_MAPS' && currentSection !== 'LINK_SECTION') {
        // Determine icon and colors based on section content
        let iconName: any = 'information';
        let iconColor = COLORS.PRIMARY;
        let sectionStyle = styles.section;
        let headerStyle = styles.sectionHeader;
        let titleStyle = styles.sectionTitle;
        let bulletStyle = styles.bulletPoint;

        const isLocationSection = currentSection.toLowerCase().includes('локаци') ||
                                  currentSection.toLowerCase().includes('паркинг') ||
                                  currentSectionEmoji === '📍';
        const isRulesSection = currentSection.toLowerCase().includes('правила') || currentSectionEmoji === '⚠️';

        if (isLocationSection) {
          iconName = 'map-marker';
          iconColor = '#1a73e8';
          sectionStyle = styles.locationSection;
          headerStyle = styles.locationSectionHeader;
          titleStyle = styles.locationSectionTitle;
          bulletStyle = styles.locationBulletPoint;
        } else if (isRulesSection) {
          iconName = 'alert-circle';
          iconColor = '#E65100';
          sectionStyle = styles.rulesSection;
          headerStyle = styles.rulesSectionHeader;
          titleStyle = styles.rulesSectionTitle;
          bulletStyle = styles.rulesBulletPoint;
        }

        elements.push(
          <View key={`section-${elements.length}`} style={sectionStyle}>
            <View style={headerStyle}>
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={iconColor}
              />
              <RNText style={titleStyle}>{currentSection}</RNText>
            </View>
            {sectionItems.length > 0 ? (
              sectionItems.map((item, idx) => (
                <View key={idx} style={styles.sectionItem}>
                  <View style={bulletStyle} />
                  <RNText style={styles.sectionItemText}>{item.replace(/^[•\-]\s*/, '')}</RNText>
                </View>
              ))
            ) : (
              <RNText style={styles.sectionItemText}>Нема дополнителни информации</RNText>
            )}
          </View>
        );
        sectionItems = [];
        currentSection = null;
        currentSectionEmoji = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushSection();
        return;
      }

      // Check for Google Maps section header
      if (trimmedLine.includes('🗺️') && trimmedLine.includes('Google Maps')) {
        flushSection();
        currentSection = 'GOOGLE_MAPS';
        return;
      }

      // Check for Link section header
      if (trimmedLine.includes('🔗') && trimmedLine.includes('Линк')) {
        flushSection();
        currentSection = 'LINK_SECTION';
        return;
      }

      // If in Google Maps section, parse the links
      if (currentSection === 'GOOGLE_MAPS') {
        // Format: "Location Name: https://..."
        const urlMatch = trimmedLine.match(/^(.+?):\s*(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[2];
          // Only add if not already in list
          if (!googleMapsLinks.some(link => link.url === url)) {
            googleMapsLinks.push({ name: urlMatch[1].trim(), url });
          }
        } else if (trimmedLine.match(/https?:\/\//)) {
          // Just a URL without label - only add if not already in list
          const url = trimmedLine.match(/(https?:\/\/[^\s]+)/)?.[1];
          if (url && !googleMapsLinks.some(link => link.url === url)) {
            googleMapsLinks.push({ name: 'Отвори карта', url });
          }
        }
        return;
      }

      // If in Link section, parse the links
      if (currentSection === 'LINK_SECTION') {
        // Format: "Link Text: https://..."
        const urlMatch = trimmedLine.match(/^(.+?):\s*(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          googleMapsLinks.push({ name: urlMatch[1].trim(), url: urlMatch[2] });
        } else if (trimmedLine.match(/https?:\/\//)) {
          // Just a URL without label
          googleMapsLinks.push({ name: 'Отвори линк', url: trimmedLine });
        }
        return;
      }

      // Check if it's a section header (starts with or contains emoji like 📍 or ⚠️)
      // More robust detection - check for emoji followed by text that looks like a header
      // Handle both emoji with and without variation selector
      const hasWarningEmoji = trimmedLine.includes('⚠️') || trimmedLine.includes('⚠') ||
                               trimmedLine.charCodeAt(0) === 0x26A0;
      const hasLocationEmoji = trimmedLine.includes('📍') || trimmedLine.charCodeAt(0) === 0x1F4CD;

      // Check for keywords in various forms (case insensitive for Cyrillic)
      const lowerLine = trimmedLine.toLowerCase();
      const hasRulesKeyword = lowerLine.includes('правила') || lowerLine.includes('правило') || lowerLine.includes('упатства');
      const hasLocationKeyword = lowerLine.includes('локаци') || lowerLine.includes('паркинг') || lowerLine.includes('место') || lowerLine.includes('адреса');
      const endsWithColon = trimmedLine.endsWith(':');

      // Also check if line STARTS with an emoji that indicates a section (more lenient)
      const startsWithSectionEmoji = /^[📍⚠️🗺️⚠]/.test(trimmedLine) ||
                                     trimmedLine.charCodeAt(0) === 0x26A0 ||
                                     trimmedLine.charCodeAt(0) === 0x1F4CD;

      const isLocationHeader = hasLocationEmoji && (hasLocationKeyword || endsWithColon);
      const isRulesHeader = hasWarningEmoji && (hasRulesKeyword || endsWithColon);

      // Fallback: if line starts with section emoji and ends with colon, treat as header
      const isFallbackHeader = startsWithSectionEmoji && endsWithColon;

      if (isLocationHeader || isRulesHeader || isFallbackHeader) {
        flushSection();
        // Extract emoji for icon determination
        currentSectionEmoji = hasLocationEmoji ? '📍' : '⚠️';
        // Clean up the section title - remove emojis (including variation selectors) and trailing colon
        currentSection = trimmedLine
          .replace(/[\u{1F4CD}\u{26A0}\u{FE0F}\u{1F5FA}📍⚠️🗺️⚠]/gu, '')
          .replace(/:$/, '')
          .trim() + ':';
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('—') ||
                 trimmedLine.startsWith('·') || /^[\u2022\u2023\u2043\u2219]/.test(trimmedLine)) {
        // Bullet points belong to current section (handle various bullet characters)
        if (currentSection && currentSection !== 'GOOGLE_MAPS' && currentSection !== 'LINK_SECTION') {
          sectionItems.push(trimmedLine);
        } else {
          // Standalone bullet point outside a section
          elements.push(
            <View key={`bullet-${index}`} style={styles.sectionItem}>
              <View style={styles.bulletPoint} />
              <RNText style={styles.sectionItemText}>{trimmedLine.replace(/^[•\-—·\u2022\u2023\u2043\u2219]\s*/, '')}</RNText>
            </View>
          );
        }
      } else if (currentSection && currentSection !== 'GOOGLE_MAPS' && currentSection !== 'LINK_SECTION') {
        // Non-bullet text in a section - treat as item
        sectionItems.push(trimmedLine);
      } else {
        // Regular text paragraph - check for URLs
        flushSection();
        const hasUrl = /https?:\/\/[^\s]+/.test(trimmedLine);
        if (hasUrl) {
          elements.push(renderTextWithLinks(trimmedLine, `text-${index}`));
        } else {
          elements.push(
            <RNText key={`text-${index}`} style={styles.bodyText}>{trimmedLine}</RNText>
          );
        }
      }
    });

    flushSection();

    // Add any inline Google Maps URLs that weren't found in a named section
    inlineGoogleMapsUrls.forEach(url => {
      if (!googleMapsLinks.some(link => link.url === url)) {
        googleMapsLinks.push({ name: 'Отвори во Google Maps', url });
      }
    });

    // Render links as buttons
    if (googleMapsLinks.length > 0) {
      // Check if any links are Google Maps
      const hasGoogleMaps = googleMapsLinks.some(link => isGoogleMapsUrl(link.url));

      elements.push(
        <View key="maps-section" style={styles.mapsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name={hasGoogleMaps ? "google-maps" : "link-variant"}
              size={20}
              color="#4285F4"
            />
            <RNText style={styles.mapsSectionTitle}>
              {hasGoogleMaps ? "Google Maps" : "Линкови"}
            </RNText>
          </View>
          {googleMapsLinks.map((link, idx) => {
            const isMapLink = isGoogleMapsUrl(link.url);
            return (
              <TouchableOpacity
                key={idx}
                style={styles.mapsButton}
                onPress={() => Linking.openURL(link.url)}
              >
                <MaterialCommunityIcons
                  name={isMapLink ? "google-maps" : "open-in-new"}
                  size={18}
                  color="#fff"
                />
                <RNText style={styles.mapsButtonText}>{link.name}</RNText>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return elements;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, '#A52A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Fixed Top Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            <RNText style={styles.backText}>Назад</RNText>
          </TouchableOpacity>
        </View>

        {/* Collapsible Icon */}
        <Animated.View style={[styles.iconContainer, { height: iconHeight, marginBottom: iconMargin, opacity: iconOpacity }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bell-ring" size={32} color={COLORS.PRIMARY} />
          </View>
        </Animated.View>

        {/* Title and Date - Always Visible */}
        <View style={styles.headerContent}>
          <RNText style={styles.headerTitle} numberOfLines={2}>{title}</RNText>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
            <RNText style={styles.dateText}>{formattedDate}</RNText>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Main content card */}
        <View style={styles.contentCard}>
          {renderFormattedBody()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {data?.eventId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <MaterialCommunityIcons name="calendar" size={22} color="#fff" />
              <RNText style={styles.actionButtonText}>Отвори Календар</RNText>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {(data?.newsId || data?.type === 'news' || title.toLowerCase().includes('новост')) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.newsActionButton]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <MaterialCommunityIcons name="newspaper-variant" size={22} color="#fff" />
              <RNText style={styles.actionButtonText}>Отвори Новости</RNText>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Info footer */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="church" size={22} color={COLORS.PRIMARY} />
          <RNText style={styles.infoText}>
            Св. Наум Охридски • Триенген
          </RNText>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  bodyText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 16,
    fontWeight: '400',
  },
  section: {
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingLeft: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingRight: 12,
  },
  bulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
    marginTop: 6,
    marginRight: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionItemText: {
    flex: 1,
    fontSize: 15,
    color: '#2a2a2a',
    lineHeight: 24,
    fontWeight: '500',
  },
  linkText: {
    color: '#4285F4',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  mapsSection: {
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  mapsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a73e8',
    marginLeft: 10,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mapsButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionButtonsContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newsActionButton: {
    backgroundColor: '#2C4A6E',
    shadowColor: '#2C4A6E',
  },
  actionButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Location section styles (blue theme)
  locationSection: {
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  locationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
  },
  locationSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a73e8',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  locationBulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a73e8',
    marginTop: 6,
    marginRight: 14,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  // Rules section styles (orange/warning theme)
  rulesSection: {
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  rulesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#fff3e0',
  },
  rulesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E65100',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  rulesBulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E65100',
    marginTop: 6,
    marginRight: 14,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default NotificationDetailScreen;
