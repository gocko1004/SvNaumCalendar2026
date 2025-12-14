import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import NotificationService from './NotificationService';
import { logSentNotification } from './NotificationHistoryService';

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
    const q = query(newsCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
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
  } catch (error) {
    console.error('Error getting all news:', error);
    return [];
  }
};

// Get active news items (for calendar display)
export const getActiveNews = async (): Promise<NewsItem[]> => {
  try {
    const q = query(
      newsCollection,
      where('isActive', '==', true),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
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

    const q = query(
      newsCollection,
      where('isActive', '==', true),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth)),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        date: data.date?.toDate() || new Date(),
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        isActive: data.isActive ?? true,
        priority: data.priority || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as NewsItem;
    });
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
    const docRef = await addDoc(newsCollection, {
      title: news.title,
      content: news.content,
      date: Timestamp.fromDate(news.date),
      imageUrl: news.imageUrl || null,
      imageUrls: news.imageUrls || [],
      videoUrls: news.videoUrls || [],
      linkUrl: news.linkUrl || null,
      linkText: news.linkText || null,
      isActive: news.isActive ?? true,
      priority: news.priority || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Send push notification to all users
    if (sendNotification && news.isActive) {
      try {
        const hasMedia = (news.imageUrls?.length || 0) > 0 || (news.videoUrls?.length || 0) > 0;
        const mediaText = hasMedia ? ' 📸' : '';

        const result = await NotificationService.sendPushNotificationToAllUsers({
          title: `Нова објава: ${news.title}`,
          message: news.content.substring(0, 100) + (news.content.length > 100 ? '...' : '') + mediaText,
          urgent: false,
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
    const docRef = doc(newsCollection, id);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (news.title !== undefined) updateData.title = news.title;
    if (news.content !== undefined) updateData.content = news.content;
    if (news.date !== undefined) updateData.date = Timestamp.fromDate(news.date);
    if (news.imageUrl !== undefined) updateData.imageUrl = news.imageUrl || null;
    if (news.imageUrls !== undefined) updateData.imageUrls = news.imageUrls;
    if (news.videoUrls !== undefined) updateData.videoUrls = news.videoUrls;
    if (news.linkUrl !== undefined) updateData.linkUrl = news.linkUrl || null;
    if (news.linkText !== undefined) updateData.linkText = news.linkText || null;
    if (news.isActive !== undefined) updateData.isActive = news.isActive;
    if (news.priority !== undefined) updateData.priority = news.priority;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
};

// Delete news item
export const deleteNews = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(newsCollection, id));
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};

// Toggle news active status
export const toggleNewsActive = async (id: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(newsCollection, id), {
      isActive,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling news status:', error);
    throw error;
  }
};

// News type color and icon for display
export const NEWS_COLOR = '#2196F3'; // Blue
export const NEWS_ICON = 'newspaper-variant-outline';
