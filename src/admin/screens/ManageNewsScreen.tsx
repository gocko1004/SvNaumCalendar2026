import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, Platform, Image, TouchableOpacity } from 'react-native';
import {
  Title,
  Card,
  Button,
  Text,
  ActivityIndicator,
  Switch,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Checkbox,
  ProgressBar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import {
  NewsItem,
  getAllNews,
  addNews,
  updateNews,
  deleteNews,
  toggleNewsActive,
  NEWS_COLOR,
  NEWS_ICON,
} from '../../services/NewsService';
import {
  pickImages,
  pickVideo,
  uploadMultipleMedia,
  MediaAsset,
  requestMediaPermissions,
  formatFileSize,
  formatDuration,
} from '../../services/MediaUploadService';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ManageNewsScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'ManageNews'>;
};

export const ManageNewsScreen: React.FC<ManageNewsScreenProps> = ({ navigation }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date());
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [priority, setPriority] = useState('0');
  const [sendNotification, setSendNotification] = useState(true);

  // Media state
  const [selectedImages, setSelectedImages] = useState<MediaAsset[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<MediaAsset[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadNews();
    requestMediaPermissions();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getAllNews();
      setNewsItems(data);
    } catch (error) {
      console.error('Error loading news:', error);
      Alert.alert('Грешка', 'Неуспешно вчитување на новости');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDate(new Date());
    setLinkUrl('');
    setLinkText('');
    setPriority('0');
    setSendNotification(true);
    setSelectedImages([]);
    setSelectedVideos([]);
    setExistingImageUrls([]);
    setExistingVideoUrls([]);
    setEditingNews(null);
    setUploadProgress(0);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (news: NewsItem) => {
    setEditingNews(news);
    setTitle(news.title);
    setContent(news.content);
    setDate(news.date);
    setLinkUrl(news.linkUrl || '');
    setLinkText(news.linkText || '');
    setPriority(String(news.priority || 0));
    setSendNotification(false); // Don't send notification on edit
    setSelectedImages([]);
    setSelectedVideos([]);
    setExistingImageUrls(news.imageUrls || []);
    setExistingVideoUrls(news.videoUrls || []);
    setDialogVisible(true);
  };

  const handlePickImages = async () => {
    try {
      const images = await pickImages(10);
      if (images.length > 0) {
        setSelectedImages(prev => [...prev, ...images]);
      }
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно избирање на слики');
    }
  };

  const handlePickVideo = async () => {
    try {
      const video = await pickVideo();
      if (video) {
        setSelectedVideos(prev => [...prev, video]);
      }
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно избирање на видео');
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Грешка', 'Наслов и содржина се задолжителни');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload new images
      let newImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        newImageUrls = await uploadMultipleMedia(
          selectedImages,
          'news/images',
          (progress) => setUploadProgress(progress * 0.5) // First 50% for images
        );
      }

      // Upload new videos
      let newVideoUrls: string[] = [];
      if (selectedVideos.length > 0) {
        newVideoUrls = await uploadMultipleMedia(
          selectedVideos,
          'news/videos',
          (progress) => setUploadProgress(50 + progress * 0.5) // Last 50% for videos
        );
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls];
      const allVideoUrls = [...existingVideoUrls, ...newVideoUrls];

      const newsData = {
        title: title.trim(),
        content: content.trim(),
        date,
        imageUrls: allImageUrls,
        videoUrls: allVideoUrls,
        linkUrl: linkUrl.trim() || undefined,
        linkText: linkText.trim() || undefined,
        isActive: true,
        priority: parseInt(priority) || 0,
      };

      if (editingNews?.id) {
        await updateNews(editingNews.id, newsData);
        Alert.alert('Успех', 'Новоста е ажурирана');
      } else {
        await addNews(newsData, sendNotification);
        Alert.alert(
          'Успех',
          sendNotification
            ? 'Новоста е додадена и известувањето е испратено!'
            : 'Новоста е додадена'
        );
      }

      setDialogVisible(false);
      resetForm();
      await loadNews();
    } catch (error) {
      console.error('Error saving news:', error);
      Alert.alert('Грешка', 'Неуспешно зачувување');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (news: NewsItem) => {
    Alert.alert(
      'Избриши новост',
      `Дали сигурно сакате да ја избришете "${news.title}"?`,
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            if (!news.id) return;
            try {
              await deleteNews(news.id);
              setNewsItems(prev => prev.filter(n => n.id !== news.id));
            } catch (error) {
              Alert.alert('Грешка', 'Неуспешно бришење');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (news: NewsItem) => {
    if (!news.id) return;
    try {
      await toggleNewsActive(news.id, !news.isActive);
      setNewsItems(prev =>
        prev.map(n => (n.id === news.id ? { ...n, isActive: !n.isActive } : n))
      );
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешна промена на статус');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const renderNewsCard = (news: NewsItem) => {
    const imageCount = (news.imageUrls?.length || 0);
    const videoCount = (news.videoUrls?.length || 0);

    return (
      <Card key={news.id} style={[styles.newsCard, !news.isActive && styles.inactiveCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name={NEWS_ICON as any} size={20} color={NEWS_COLOR} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {news.title}
              </Text>
            </View>
            <Switch
              value={news.isActive}
              onValueChange={() => handleToggleActive(news)}
              color={COLORS.PRIMARY}
            />
          </View>

          <Text style={styles.cardDate}>
            {format(news.date, 'dd MMMM yyyy', { locale: mk })}
          </Text>

          <Text style={styles.cardContent} numberOfLines={3}>
            {news.content}
          </Text>

          {/* Media indicators */}
          <View style={styles.mediaIndicators}>
            {imageCount > 0 && (
              <View style={styles.mediaIndicator}>
                <MaterialCommunityIcons name="image-multiple" size={14} color="#4CAF50" />
                <Text style={styles.mediaIndicatorText}>{imageCount} слики</Text>
              </View>
            )}
            {videoCount > 0 && (
              <View style={styles.mediaIndicator}>
                <MaterialCommunityIcons name="video" size={14} color="#F44336" />
                <Text style={styles.mediaIndicatorText}>{videoCount} видеа</Text>
              </View>
            )}
          </View>

          {news.linkUrl && (
            <Text style={styles.hasLinkText}>
              <MaterialCommunityIcons name="link" size={12} /> {news.linkText || news.linkUrl}
            </Text>
          )}

          <View style={styles.cardActions}>
            <Button
              mode="outlined"
              onPress={() => openEditDialog(news)}
              style={styles.editButton}
              compact
            >
              Измени
            </Button>
            <Button
              mode="outlined"
              textColor="#F44336"
              onPress={() => handleDelete(news)}
              style={styles.deleteButton}
              compact
            >
              Избриши
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMediaPreview = () => (
    <View style={styles.mediaSection}>
      {/* Existing Images */}
      {existingImageUrls.length > 0 && (
        <View style={styles.mediaSectionGroup}>
          <Text style={styles.mediaSectionTitle}>Постоечки слики:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {existingImageUrls.map((url, index) => (
              <View key={`existing-img-${index}`} style={styles.mediaPreviewItem}>
                <Image source={{ uri: url }} style={styles.mediaPreviewImage} />
                <TouchableOpacity
                  style={styles.mediaRemoveButton}
                  onPress={() => removeExistingImage(index)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* New Images */}
      {selectedImages.length > 0 && (
        <View style={styles.mediaSectionGroup}>
          <Text style={styles.mediaSectionTitle}>Нови слики:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedImages.map((asset, index) => (
              <View key={`new-img-${index}`} style={styles.mediaPreviewItem}>
                <Image source={{ uri: asset.uri }} style={styles.mediaPreviewImage} />
                <TouchableOpacity
                  style={styles.mediaRemoveButton}
                  onPress={() => removeSelectedImage(index)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
                {asset.fileSize && (
                  <Text style={styles.mediaSize}>{formatFileSize(asset.fileSize)}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Existing Videos */}
      {existingVideoUrls.length > 0 && (
        <View style={styles.mediaSectionGroup}>
          <Text style={styles.mediaSectionTitle}>Постоечки видеа:</Text>
          {existingVideoUrls.map((url, index) => (
            <View key={`existing-vid-${index}`} style={styles.videoPreviewItem}>
              <MaterialCommunityIcons name="video" size={24} color="#F44336" />
              <Text style={styles.videoText} numberOfLines={1}>Видео {index + 1}</Text>
              <TouchableOpacity onPress={() => removeExistingVideo(index)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* New Videos */}
      {selectedVideos.length > 0 && (
        <View style={styles.mediaSectionGroup}>
          <Text style={styles.mediaSectionTitle}>Нови видеа:</Text>
          {selectedVideos.map((asset, index) => (
            <View key={`new-vid-${index}`} style={styles.videoPreviewItem}>
              <MaterialCommunityIcons name="video" size={24} color="#F44336" />
              <View style={styles.videoInfo}>
                <Text style={styles.videoText} numberOfLines={1}>
                  {asset.fileName || `Видео ${index + 1}`}
                </Text>
                {asset.duration && (
                  <Text style={styles.videoDuration}>{formatDuration(asset.duration)}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => removeSelectedVideo(index)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Новости</Title>
        <Text style={styles.subtitle}>
          {newsItems.filter(n => n.isActive).length} активни од {newsItems.length} вкупно
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {newsItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Нема новости</Text>
                <Text style={styles.emptySubtext}>
                  Додадете новост за да се прикаже во календарот
                </Text>
              </Card.Content>
            </Card>
          ) : (
            newsItems.map(renderNewsCard)
          )}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        color="#fff"
      />

      {/* Add/Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => !uploading && setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            {editingNews ? 'Измени новост' : 'Додади новост'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Наслов *"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  style={styles.input}
                  disabled={uploading}
                />

                <TextInput
                  label="Содржина *"
                  value={content}
                  onChangeText={setContent}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  disabled={uploading}
                />

                <Text style={styles.dateLabel}>Датум:</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                  icon="calendar"
                  disabled={uploading}
                >
                  {format(date, 'dd MMMM yyyy', { locale: mk })}
                </Button>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                )}

                {/* Media Buttons */}
                <View style={styles.mediaButtons}>
                  <Button
                    mode="outlined"
                    onPress={handlePickImages}
                    icon="image-multiple"
                    style={styles.mediaButton}
                    disabled={uploading}
                  >
                    Додади слики
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handlePickVideo}
                    icon="video"
                    style={styles.mediaButton}
                    disabled={uploading}
                  >
                    Додади видео
                  </Button>
                </View>

                {/* Media Preview */}
                {renderMediaPreview()}

                <TextInput
                  label="URL на линк (опционално)"
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://..."
                  disabled={uploading}
                />

                <TextInput
                  label="Текст за линк (опционално)"
                  value={linkText}
                  onChangeText={setLinkText}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Прочитај повеќе"
                  disabled={uploading}
                />

                {/* Notification checkbox - only for new posts */}
                {!editingNews && (
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={sendNotification ? 'checked' : 'unchecked'}
                      onPress={() => setSendNotification(!sendNotification)}
                      color={COLORS.PRIMARY}
                      disabled={uploading}
                    />
                    <Text style={styles.checkboxLabel}>
                      Испрати известување до сите корисници
                    </Text>
                  </View>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <View style={styles.uploadProgress}>
                    <Text style={styles.uploadText}>
                      Се прикачува... {Math.round(uploadProgress)}%
                    </Text>
                    <ProgressBar progress={uploadProgress / 100} color={COLORS.PRIMARY} />
                  </View>
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={uploading}>
              Откажи
            </Button>
            <Button onPress={handleSave} mode="contained" loading={uploading} disabled={uploading}>
              {uploading ? 'Се прикачува...' : 'Зачувај'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  newsCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: NEWS_COLOR,
  },
  inactiveCard: {
    opacity: 0.6,
    borderLeftColor: '#999',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#333',
  },
  cardDate: {
    fontSize: 13,
    color: NEWS_COLOR,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaIndicators: {
    flexDirection: 'row',
    marginBottom: 8,
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
  hasLinkText: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    borderColor: COLORS.PRIMARY,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.PRIMARY,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
  },
  dialogTitle: {
    color: COLORS.PRIMARY,
  },
  dialogScrollArea: {
    maxHeight: 500,
  },
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 12,
    borderColor: COLORS.PRIMARY,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  mediaButton: {
    flex: 1,
    borderColor: COLORS.PRIMARY,
  },
  mediaSection: {
    marginBottom: 12,
  },
  mediaSectionGroup: {
    marginBottom: 12,
  },
  mediaSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  mediaPreviewItem: {
    marginRight: 8,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  mediaSize: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  videoPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 8,
  },
  videoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  videoDuration: {
    fontSize: 12,
    color: '#666',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  uploadProgress: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default ManageNewsScreen;
