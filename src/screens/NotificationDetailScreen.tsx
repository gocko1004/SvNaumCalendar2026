import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, Linking } from 'react-native';
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
    const lines = body.split('\n');
    const elements: React.ReactNode[] = [];
    let currentSection: string | null = null;
    let currentSectionEmoji: string | null = null;
    let sectionItems: string[] = [];
    let googleMapsLinks: { name: string; url: string }[] = [];

    const flushSection = () => {
      if (currentSection && currentSection !== 'GOOGLE_MAPS' && currentSection !== 'LINK_SECTION') {
        // Determine icon based on section content
        let iconName: any = 'information';
        if (currentSection.toLowerCase().includes('локаци') || currentSectionEmoji === '📍') {
          iconName = 'map-marker';
        } else if (currentSection.toLowerCase().includes('правила') || currentSectionEmoji === '⚠️') {
          iconName = 'alert-circle';
        }

        elements.push(
          <View key={`section-${elements.length}`} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name={iconName}
                size={20}
                color={COLORS.PRIMARY}
              />
              <RNText style={styles.sectionTitle}>{currentSection}</RNText>
            </View>
            {sectionItems.length > 0 ? (
              sectionItems.map((item, idx) => (
                <View key={idx} style={styles.sectionItem}>
                  <View style={styles.bulletPoint} />
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
          googleMapsLinks.push({ name: urlMatch[1].trim(), url: urlMatch[2] });
        } else if (trimmedLine.match(/https?:\/\//)) {
          // Just a URL without label
          googleMapsLinks.push({ name: 'Отвори карта', url: trimmedLine });
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
      const isLocationHeader = trimmedLine.includes('📍') && (trimmedLine.includes('локаци') || trimmedLine.endsWith(':'));
      const isRulesHeader = trimmedLine.includes('⚠️') && (trimmedLine.includes('Правила') || trimmedLine.includes('правила') || trimmedLine.endsWith(':'));

      if (isLocationHeader || isRulesHeader) {
        flushSection();
        // Extract emoji for icon determination
        currentSectionEmoji = isLocationHeader ? '📍' : '⚠️';
        // Clean up the section title - remove emojis and trailing colon
        currentSection = trimmedLine
          .replace(/[📍⚠️🗺️]/g, '')
          .replace(/:$/, '')
          .trim() + ':';
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('—')) {
        // Bullet points belong to current section
        if (currentSection && currentSection !== 'GOOGLE_MAPS' && currentSection !== 'LINK_SECTION') {
          sectionItems.push(trimmedLine);
        } else {
          // Standalone bullet point outside a section
          elements.push(
            <View key={`bullet-${index}`} style={styles.sectionItem}>
              <View style={styles.bulletPoint} />
              <RNText style={styles.sectionItemText}>{trimmedLine.replace(/^[•\-—]\s*/, '')}</RNText>
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

    // Render links as buttons
    if (googleMapsLinks.length > 0) {
      // Check if any links are Google Maps
      const hasGoogleMaps = googleMapsLinks.some(link =>
        link.url.includes('maps.google') || link.url.includes('goo.gl/maps') || link.url.includes('maps.app.goo')
      );

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
            const isMapLink = link.url.includes('maps.google') || link.url.includes('goo.gl/maps') || link.url.includes('maps.app.goo');
            return (
              <TouchableOpacity
                key={idx}
                style={styles.mapsButton}
                onPress={() => Linking.openURL(link.url)}
              >
                <MaterialCommunityIcons
                  name={isMapLink ? "map-marker" : "open-in-new"}
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
      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.PRIMARY, '#A52A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <RNText style={styles.backText}>Назад</RNText>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bell-ring" size={32} color={COLORS.PRIMARY} />
          </View>
          <RNText style={styles.headerTitle}>{title}</RNText>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
            <RNText style={styles.dateText}>{formattedDate}</RNText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main content card */}
        <View style={styles.contentCard}>
          {renderFormattedBody()}

          {data?.eventId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
              <RNText style={styles.actionButtonText}>Погледни во календар</RNText>
            </TouchableOpacity>
          )}

          {data?.newsId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <MaterialCommunityIcons name="newspaper" size={20} color="#fff" />
              <RNText style={styles.actionButtonText}>Погледни во новости</RNText>
            </TouchableOpacity>
          )}
        </View>

        {/* Info footer */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="church" size={20} color={COLORS.PRIMARY} />
          <RNText style={styles.infoText}>
            Св. Наум Охридски • Триенген, Швајцарија
          </RNText>
        </View>
      </ScrollView>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
    marginTop: -12,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    marginBottom: 12,
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
    marginTop: 8,
    marginRight: 12,
  },
  sectionItemText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  linkText: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
  mapsSection: {
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mapsSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4285F4',
    marginLeft: 8,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  mapsButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default NotificationDetailScreen;
