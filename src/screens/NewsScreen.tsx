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
import { Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getActiveNews, NewsItem, NEWS_COLOR, NEWS_ICON } from '../services/NewsService';
import { COLORS } from '../constants/theme';

type RootStackParamList = {
  MainTabs: undefined;
  NewsDetail: { news: NewsItem };
};

// News Card Component - Preview with tap to open detail
type NewsCardProps = {
  news: NewsItem;
  onPress: () => void;
};

const NewsCard = ({ news, onPress }: NewsCardProps) => {
  // Combine legacy imageUrl with imageUrls array
  const allImages = [
    ...(news.imageUrl ? [news.imageUrl] : []),
    ...(news.imageUrls || []),
  ].filter((url, index, self) => self.indexOf(url) === index);

  const videos = news.videoUrls || [];
  const hasMedia = allImages.length > 0 || videos.length > 0;

  // Get time badge info based on when news was created
  const getTimeBadge = (): { text: string; color: string } | null => {
    const now = new Date();
    const createdDate = new Date(news.createdAt || news.date);

    // Reset times to start of day for accurate day comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const createdDateStart = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

    const daysDiff = Math.floor((todayStart.getTime() - createdDateStart.getTime()) / (1000 * 60 * 60 * 24));
    const monthsDiff = Math.floor(daysDiff / 30);

    // Future or today = new
    if (daysDiff <= 0) {
      return { text: 'Ново', color: '#4CAF50' }; // Green - today or future
    } else if (daysDiff === 1) {
      return { text: 'Вчера', color: '#FF9800' }; // Orange - yesterday
    } else if (daysDiff >= 2 && daysDiff <= 6) {
      return { text: `пред ${daysDiff} дена`, color: '#9E9E9E' }; // Gray - 2-6 days
    } else if (daysDiff >= 7 && daysDiff < 14) {
      return { text: 'пред 1 недела', color: '#9E9E9E' }; // 1 week
    } else if (daysDiff >= 14 && daysDiff < 21) {
      return { text: 'пред 2 недели', color: '#9E9E9E' }; // 2 weeks
    } else if (daysDiff >= 21 && daysDiff < 30) {
      return { text: 'пред 3 недели', color: '#9E9E9E' }; // 3 weeks
    } else if (monthsDiff === 1) {
      return { text: 'пред 1 месец', color: '#BDBDBD' }; // 1 month
    } else if (monthsDiff === 2) {
      return { text: 'пред 2 месеци', color: '#BDBDBD' }; // 2 months
    } else if (monthsDiff >= 3 && monthsDiff < 12) {
      return { text: `пред ${monthsDiff} месеци`, color: '#BDBDBD' }; // 3-11 months
    }
    return null; // More than a year - no badge (calendar changes yearly)
  };

  const timeBadge = getTimeBadge();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.newsCard}>
        <Card.Content>
          <View style={styles.newsHeader}>
            <View style={styles.newsIconContainer}>
              <MaterialCommunityIcons name={NEWS_ICON as any} size={24} color={NEWS_COLOR} />
            </View>
            <View style={styles.newsContent}>
              <View style={styles.titleRow}>
                <Text style={styles.newsTitle}>{news.title}</Text>
                {timeBadge && (
                  <View style={[styles.timeBadge, { backgroundColor: timeBadge.color }]}>
                    <Text style={styles.timeBadgeText}>{timeBadge.text}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.newsMessage} numberOfLines={3}>{news.content}</Text>
              <Text style={styles.newsDate}>
                {format(news.date, 'dd MMMM yyyy', { locale: mk })}
              </Text>
            </View>
          </View>

          {/* Preview Image */}
          {allImages.length > 0 && (
            <View style={styles.newsGallery}>
              <Image
                source={{ uri: allImages[0] }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              {allImages.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <MaterialCommunityIcons name="image-multiple" size={14} color="#fff" />
                  <Text style={styles.imageCountText}>+{allImages.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          {/* Media indicators and tap hint */}
          <View style={styles.cardFooter}>
            <View style={styles.mediaIndicators}>
              {allImages.length > 0 && (
                <View style={styles.mediaIndicator}>
                  <MaterialCommunityIcons name="image-multiple" size={14} color="#666" />
                  <Text style={styles.mediaIndicatorText}>{allImages.length}</Text>
                </View>
              )}
              {videos.length > 0 && (
                <View style={styles.mediaIndicator}>
                  <MaterialCommunityIcons name="video" size={14} color="#666" />
                  <Text style={styles.mediaIndicatorText}>{videos.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Отвори</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.PRIMARY} />
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export const NewsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleNewsPress = (news: NewsItem) => {
    navigation.navigate('NewsDetail', { news });
  };

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
                <NewsCard
                  key={news.id}
                  news={news}
                  onPress={() => handleNewsPress(news)}
                />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mediaIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIndicatorText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
