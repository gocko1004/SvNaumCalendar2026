import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Card, Title, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { Linking } from 'react-native';
import { getActiveNews, NewsItem, NEWS_COLOR, NEWS_ICON } from '../services/NewsService';
import { COLORS } from '../constants/theme';

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
  ].filter((url, index, self) => self.indexOf(url) === index);

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

export const NewsScreen = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadNews = async () => {
    try {
      const activeNews = await getActiveNews();
      setNewsItems(activeNews);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/background_app.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name={NEWS_ICON as any} size={28} color={COLORS.TEXT_LIGHT} />
              <Title style={styles.headerTitle}>Новости</Title>
            </View>
          </View>

          {/* News List */}
          <View style={styles.newsList}>
            {newsItems.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Нема новости</Text>
                  <Text style={styles.emptySubtext}>Повлечете надолу за освежување</Text>
                </Card.Content>
              </Card>
            ) : (
              newsItems.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
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
    paddingBottom: 24,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.PRIMARY,
    elevation: 8,
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginLeft: 10,
  },
  newsList: {
    paddingHorizontal: 16,
  },
  newsCard: {
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
    borderWidth: 0.5,
    borderColor: '#D4AF37',
    shadowColor: '#831B26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  newsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NEWS_COLOR + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  newsContent: {
    flex: 1,
  },
  newsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    color: COLORS.PRIMARY,
  },
  newsChip: {
    height: 20,
    marginLeft: 8,
    backgroundColor: NEWS_COLOR + '15',
  },
  newsMessage: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 8,
  },
  newsLink: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.PRIMARY,
  },
  newsDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
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
  emptyCard: {
    marginTop: 40,
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
