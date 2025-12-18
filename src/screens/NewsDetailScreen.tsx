import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  Modal,
  FlatList,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NewsItem, NEWS_COLOR, NEWS_ICON } from '../services/NewsService';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  MainTabs: undefined;
  NewsDetail: {
    news: NewsItem;
  };
};

type NewsDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'NewsDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({ route, navigation }) => {
  const { news } = route.params;
  const insets = useSafeAreaInsets();
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<{ [key: number]: AVPlaybackStatus }>({});
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animate icon visibility based on scroll
  const iconOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const iconHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [60, 0],
    extrapolate: 'clamp',
  });

  const iconMargin = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  // Combine legacy imageUrl with imageUrls array
  const allImages = [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.imageUrls || []),
  ].filter((url, index, self) => self.indexOf(url) === index);

  const videos = news.videoUrls || [];

  const handleLinkPress = () => {
    if (news.linkUrl) {
      Linking.openURL(news.linkUrl);
    }
  };

  const openImageGallery = (index: number) => {
    setExpandedImageIndex(index);
  };

  const closeImageGallery = () => {
    setExpandedImageIndex(null);
  };

  const renderGalleryItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.gallerySlide}>
      <Image
        source={{ uri: item }}
        style={styles.galleryImage}
        resizeMode="contain"
      />
      <Text style={styles.galleryCounter}>
        {index + 1} / {allImages.length}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, '#A52A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View>
          {/* Fixed Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              <Text style={styles.backText}>Назад</Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible Icon */}
          <Animated.View style={[styles.iconContainer, { height: iconHeight, marginBottom: iconMargin, opacity: iconOpacity }]}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={NEWS_ICON as any} size={26} color={COLORS.PRIMARY} />
            </View>
          </Animated.View>

          {/* Title and Date - Always Visible */}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>{news.title}</Text>
            <View style={styles.dateChip}>
              <MaterialCommunityIcons name="calendar" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.dateChipText}>
                {format(news.date, 'dd MMMM yyyy', { locale: mk })}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Unified Content Card */}
        <View style={styles.articleCard}>
          {/* Hero Image */}
          {allImages.length > 0 && (
            <TouchableOpacity
              onPress={() => openImageGallery(0)}
              activeOpacity={0.95}
              style={styles.heroImageContainer}
            >
              <Image
                source={{ uri: allImages[0] }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {allImages.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <MaterialCommunityIcons name="image-multiple" size={14} color="#fff" />
                  <Text style={styles.imageCountText}>{allImages.length}</Text>
                </View>
              )}
              <View style={styles.zoomHint}>
                <MaterialCommunityIcons name="magnify-plus" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Multiple Images Thumbnails */}
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailStrip}
              contentContainerStyle={styles.thumbnailStripContent}
            >
              {allImages.map((imageUrl, index) => (
                <TouchableOpacity
                  key={`thumb-${index}`}
                  onPress={() => openImageGallery(index)}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbnailItem,
                    index === 0 && styles.thumbnailItemActive
                  ]}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.thumbnailSmall}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Divider */}
          {allImages.length > 0 && <View style={styles.cardDivider} />}

          {/* Article Content */}
          <View style={styles.articleContent}>
            <Text style={styles.articleText}>{news.content}</Text>

            {/* Link Button */}
            {news.linkUrl && (
              <TouchableOpacity onPress={handleLinkPress} style={styles.linkButton}>
                <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" />
                <Text style={styles.linkText}>
                  {news.linkText || 'Отвори линк'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Videos Section */}
        {videos.length > 0 && (
          <View style={styles.videoSection}>
            {videos.map((videoUrl, index) => (
              <View key={`vid-${index}`} style={styles.videoCard}>
                <View style={styles.videoHeader}>
                  <MaterialCommunityIcons name="play-circle" size={20} color="#FF0000" />
                  <Text style={styles.videoLabel}>Видео {videos.length > 1 ? index + 1 : ''}</Text>
                </View>
                <Video
                  ref={(ref) => { videoRefs.current[index] = ref; }}
                  source={{ uri: videoUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) => {
                    setVideoStatus(prev => ({ ...prev, [index]: status }));
                  }}
                />
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerBox}>
          <MaterialCommunityIcons name="church" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.footerText}>Св. Наум Охридски • Триенген</Text>
        </View>
      </Animated.ScrollView>

      {/* Fullscreen Image Gallery Modal */}
        <Modal
          visible={expandedImageIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageGallery}
        >
          <View style={styles.galleryModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeImageGallery}
            >
              <MaterialCommunityIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <FlatList
              data={allImages}
              renderItem={renderGalleryItem}
              keyExtractor={(_, index) => `gallery-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={expandedImageIndex || 0}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
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
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 16,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  dateChipText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Unified Article Card
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  heroImageContainer: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  thumbnailStrip: {
    backgroundColor: '#f8f8f8',
  },
  thumbnailStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumbnailItem: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailItemActive: {
    borderColor: COLORS.PRIMARY,
  },
  thumbnailSmall: {
    width: 56,
    height: 56,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  articleContent: {
    padding: 20,
  },
  articleText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  // Video Section
  videoSection: {
    marginBottom: 16,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  // Gallery Modal
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    padding: 10,
  },
  gallerySlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
  },
  galleryCounter: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  // Footer
  footerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 12,
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default NewsDetailScreen;
