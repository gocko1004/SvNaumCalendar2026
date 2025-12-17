import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import NotificationService from './NotificationService';
import { logSentNotification } from './NotificationHistoryService';
import { sanitizeString, sanitizeNotificationContent, sanitizeExternalUrl } from './ValidationService';

// News item type
export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  date: Date;
  imageUrl?: string; // Legacy single image (kept for backward compatibility)
  imageUrls?: string[]; // Multiple images
  videoUrls?: string[]; // Multiple videos
  linkUrl?: string;
  linkText?: string;
  isActive: boolean;
  priority: number; // Higher = appears first on same date
  sendNotification?: boolean; // Whether to send push notification
  createdAt: Date;
  updatedAt: Date;
}

// Firestore collection reference
const newsCollection = collection(db, 'news');

// Get all news items (for admin)
export const getAllNews = async (): Promise<NewsItem[]> => {
  try {
    // Simple query without orderBy to avoid index requirement
    const querySnapshot = await getDocs(newsCollection);

    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        date: data.date?.toDate() || new Date(),
        imageUrl: data.imageUrl,
        imageUrls: data.imageUrls || [],
        videoUrls: data.videoUrls || [],
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        isActive: data.isActive ?? true,
        priority: data.priority || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as NewsItem;
    });

    // Sort in memory by date descending
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    return items;
  } catch (error) {
    console.error('Error getting all news:', error);
    return [];
  }
};

// Get active news items (for calendar display)
export const getActiveNews = async (): Promise<NewsItem[]> => {
  try {
    // Simple query without orderBy to avoid index requirement
    const querySnapshot = await getDocs(newsCollection);

    const items = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          date: data.date?.toDate() || new Date(),
          imageUrl: data.imageUrl,
          imageUrls: data.imageUrls || [],
          videoUrls: data.videoUrls || [],
          linkUrl: data.linkUrl,
          linkText: data.linkText,
          isActive: data.isActive ?? true,
          priority: data.priority || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as NewsItem;
      })
      .filter(item => item.isActive); // Filter active items

    // Sort in memory by date descending
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    return items;
  } catch (error) {
    console.error('Error getting active news:', error);
    return [];
  }
};

// Get news for a specific month
export const getNewsForMonth = async (year: number, month: number): Promise<NewsItem[]> => {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    // Simple query without orderBy to avoid index requirement
    const querySnapshot = await getDocs(newsCollection);

    const items = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          date: data.date?.toDate() || new Date(),
          imageUrl: data.imageUrl,
          imageUrls: data.imageUrls || [],
          videoUrls: data.videoUrls || [],
          linkUrl: data.linkUrl,
          linkText: data.linkText,
          isActive: data.isActive ?? true,
          priority: data.priority || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as NewsItem;
      })
      .filter(item => {
        if (!item.isActive) return false;
        const itemDate = item.date;
        return itemDate >= startOfMonth && itemDate <= endOfMonth;
      });

    // Sort by date ascending
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    return items;
  } catch (error) {
    console.error('Error getting news for month:', error);
    return [];
  }
};

// Add new news item
export const addNews = async (
  news: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>,
  sendNotification: boolean = true
): Promise<string> => {
  try {
    // Sanitize all input before storing
    const sanitizedTitle = sanitizeString(news.title, 200);
    const sanitizedContent = sanitizeNotificationContent(news.content, 5000);
    const sanitizedLinkUrl = news.linkUrl ? sanitizeExternalUrl(news.linkUrl) : null;
    const sanitizedLinkText = news.linkText ? sanitizeString(news.linkText, 100) : null;

    // Validate required fields
    if (!sanitizedTitle) {
      throw new Error('Title is required');
    }

    const docRef = await addDoc(newsCollection, {
      title: sanitizedTitle,
      content: sanitizedContent,
      date: Timestamp.fromDate(news.date),
      imageUrl: news.imageUrl || null,
      imageUrls: news.imageUrls || [],
      videoUrls: news.videoUrls || [],
      linkUrl: sanitizedLinkUrl,
      linkText: sanitizedLinkText,
      isActive: news.isActive ?? true,
      priority: Math.min(Math.max(0, news.priority || 0), 10), // Limit priority 0-10
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Send push notification to all users
    if (sendNotification && news.isActive) {
      try {
        const hasMedia = (news.imageUrls?.length || 0) > 0 || (news.videoUrls?.length || 0) > 0;
        const mediaText = hasMedia ? ' 📸' : '';

        // Create news object for notification data (so user can navigate directly to news)
        const newsForNotification: NewsItem = {
          id: docRef.id,
          title: news.title,
          content: news.content,
          date: news.date,
          imageUrl: news.imageUrl,
          imageUrls: news.imageUrls || [],
          videoUrls: news.videoUrls || [],
          linkUrl: sanitizedLinkUrl || undefined,
          linkText: sanitizedLinkText || undefined,
          isActive: news.isActive ?? true,
          priority: news.priority || 0,
          createdAt: news.date,
          updatedAt: news.date,
        };

        const result = await NotificationService.sendPushNotificationToAllUsers({
          title: `Нова објава: ${news.title}`,
          message: news.content.substring(0, 100) + (news.content.length > 100 ? '...' : '') + mediaText,
          urgent: false,
          data: { news: newsForNotification, type: 'news', newsId: docRef.id },
        });

        // Log to notification history
        await logSentNotification(
          `Нова објава: ${news.title}`,
          news.content.substring(0, 100) + (news.content.length > 100 ? '...' : ''),
          'INFO',
          result.sentCount,
          result.success ? result.sentCount : 0,
          result.success ? 0 : result.sentCount,
          'news-auto',
          undefined,
          true, // isAutomated
          result.error ? [result.error] : []
        );
      } catch (notifError) {
        console.error('Error sending news notification:', notifError);
        // Don't throw - news was saved successfully
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding news:', error);
    throw error;
  }
};

// Update news item
export const updateNews = async (id: string, news: Partial<NewsItem>): Promise<void> => {
  try {
    // Validate document ID format to prevent path traversal
    if (!id || typeof id !== 'string' || id.includes('/') || id.includes('..')) {
      throw new Error('Invalid document ID');
    }

    const docRef = doc(newsCollection, id);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Sanitize all input before updating
    if (news.title !== undefined) updateData.title = sanitizeString(news.title, 200);
    if (news.content !== undefined) updateData.content = sanitizeNotificationContent(news.content, 5000);
    if (news.date !== undefined) updateData.date = Timestamp.fromDate(news.date);
    if (news.imageUrl !== undefined) updateData.imageUrl = news.imageUrl || null;
    if (news.imageUrls !== undefined) updateData.imageUrls = news.imageUrls;
    if (news.videoUrls !== undefined) updateData.videoUrls = news.videoUrls;
    if (news.linkUrl !== undefined) updateData.linkUrl = news.linkUrl ? sanitizeExternalUrl(news.linkUrl) : null;
    if (news.linkText !== undefined) updateData.linkText = news.linkText ? sanitizeString(news.linkText, 100) : null;
    if (news.isActive !== undefined) updateData.isActive = news.isActive;
    if (news.priority !== undefined) updateData.priority = Math.min(Math.max(0, news.priority), 10);

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating news');
    throw error;
  }
};

// Delete news item
export const deleteNews = async (id: string): Promise<void> => {
  try {
    // Validate document ID format to prevent path traversal
    if (!id || typeof id !== 'string' || id.includes('/') || id.includes('..')) {
      throw new Error('Invalid document ID');
    }
    await deleteDoc(doc(newsCollection, id));
  } catch (error) {
    console.error('Error deleting news');
    throw error;
  }
};

// Toggle news active status
export const toggleNewsActive = async (id: string, isActive: boolean): Promise<void> => {
  try {
    // Validate document ID format to prevent path traversal
    if (!id || typeof id !== 'string' || id.includes('/') || id.includes('..')) {
      throw new Error('Invalid document ID');
    }
    await updateDoc(doc(newsCollection, id), {
      isActive: Boolean(isActive),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling news status');
    throw error;
  }
};

// News type color and icon for display
export const NEWS_COLOR = '#2196F3'; // Blue
export const NEWS_ICON = 'newspaper-variant-outline';
