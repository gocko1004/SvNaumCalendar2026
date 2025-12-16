import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  SafeAreaView,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NewsItem, NEWS_COLOR, NEWS_ICON } from '../services/NewsService';
import { COLORS } from '../constants/theme';

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
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<{ [key: number]: AVPlaybackStatus }>({});
  const videoRefs = useRef<{ [key: number]: Video | null }>({});

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            icon="arrow-left"
            mode="text"
            onPress={() => navigation.goBack()}
            textColor={COLORS.PRIMARY}
          >
            Назад
          </Button>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* News Header Card */}
          <Surface style={styles.headerCard}>
            <View style={styles.newsIconContainer}>
              <MaterialCommunityIcons name={NEWS_ICON as any} size={32} color={NEWS_COLOR} />
            </View>
            <Text style={styles.title}>{news.title}</Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#999" />
              <Text style={styles.dateText}>
                {format(news.date, 'dd MMMM yyyy', { locale: mk })}
              </Text>
            </View>
          </Surface>

          {/* Main Image Gallery */}
          {allImages.length > 0 && (
            <View style={styles.imageSection}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name={allImages.length === 1 ? "image" : "image-multiple"} size={18} color={COLORS.PRIMARY} />
                {'  '}Слики ({allImages.length})
              </Text>
              {allImages.length === 1 ? (
                // Single image - full width display
                <TouchableOpacity
                  onPress={() => openImageGallery(0)}
                  activeOpacity={0.9}
                  style={styles.singleImageContainer}
                >
                  <Image
                    source={{ uri: allImages[0] }}
                    style={styles.singleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.singleImageOverlay}>
                    <MaterialCommunityIcons name="magnify-plus" size={28} color="#fff" />
                    <Text style={styles.tapToExpandText}>Притисни за зголемување</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                // Multiple images - horizontal scroll
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  {allImages.map((imageUrl, index) => (
                    <TouchableOpacity
                      key={`img-${index}`}
                      onPress={() => openImageGallery(index)}
                      activeOpacity={0.9}
                      style={styles.imageTouchable}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <MaterialCommunityIcons name="magnify-plus" size={24} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Content */}
          <Surface style={styles.contentCard}>
            <Text style={styles.content}>{news.content}</Text>

            {/* Link */}
            {news.linkUrl && (
              <TouchableOpacity onPress={handleLinkPress} style={styles.linkButton}>
                <MaterialCommunityIcons name="link" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.linkText}>
                  {news.linkText || 'Отвори линк'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            )}
          </Surface>

          {/* Videos Section */}
          {videos.length > 0 && (
            <View style={styles.videoSection}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="video" size={18} color={COLORS.PRIMARY} />
                {'  '}Видеа ({videos.length})
              </Text>
              {videos.map((videoUrl, index) => (
                <Surface key={`vid-${index}`} style={styles.videoCard}>
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
                </Surface>
              ))}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFDF8',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 16,
  },
  newsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: NEWS_COLOR + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageScrollContent: {
    paddingRight: 16,
  },
  imageTouchable: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  singleImageContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  singleImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  singleImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToExpandText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 6,
  },
  contentCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '10',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: 10,
  },
  videoSection: {
    marginBottom: 16,
  },
  videoCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 4,
  },
  video: {
    width: '100%',
    height: 220,
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
  },
  gallerySlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.7,
  },
  galleryCounter: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
});

export default NewsDetailScreen;
