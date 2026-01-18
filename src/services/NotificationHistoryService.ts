/**
 * Firestore service for managing notification history
 * Stores sent notifications for 30 days with auto-cleanup
 * Provides delivery stats and history viewing
 */

import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_KEY = '@notification_last_seen';

// Notification status
export type NotificationStatus = 'SENT' | 'FAILED' | 'PARTIAL';

// Notification category for styling
export type NotificationCategory = 'REMINDER' | 'URGENT' | 'INFO' | 'EVENT' | 'AUTOMATED';

export interface NotificationRecord {
  id?: string;
  title: string;
  body: string;
  fullBody?: string; // Full body text (body may be truncated for push notification)
  category: NotificationCategory;
  sentAt: Date;
  expiresAt: Date; // 30 days from sentAt
  status: NotificationStatus;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentBy?: string; // Admin who sent it
  eventId?: string; // Related event if applicable
  isAutomated: boolean;
  errors?: string[];
  data?: any; // Custom data for navigation (e.g., news object)
}

const NOTIFICATION_HISTORY_COLLECTION = 'notificationHistory';
const RETENTION_DAYS = 30;

// Category colors for UI
export const NOTIFICATION_CATEGORY_COLORS: Record<NotificationCategory, string> = {
  REMINDER: '#2196F3',   // Blue
  URGENT: '#F44336',     // Red
  INFO: '#9E9E9E',       // Gray
  EVENT: '#9C27B0',      // Purple
  AUTOMATED: '#4CAF50',  // Green
};

// Category icons for UI
export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> = {
  REMINDER: 'bell',
  URGENT: 'alert',
  INFO: 'information',
  EVENT: 'calendar',
  AUTOMATED: 'robot',
};

/**
 * Convert Firestore document to NotificationRecord
 */
const firestoreToNotificationRecord = (docData: any, docId: string): NotificationRecord => {
  return {
    id: docId,
    title: docData.title || '',
    body: docData.body || '',
    fullBody: docData.fullBody || undefined,
    category: docData.category || 'INFO',
    sentAt: docData.sentAt?.toDate() || new Date(),
    expiresAt: docData.expiresAt?.toDate() || new Date(),
    status: docData.status || 'SENT',
    recipientCount: docData.recipientCount || 0,
    successCount: docData.successCount || 0,
    failureCount: docData.failureCount || 0,
    sentBy: docData.sentBy || undefined,
    eventId: docData.eventId || undefined,
    isAutomated: docData.isAutomated || false,
    errors: docData.errors || [],
    data: docData.data || null,
  };
};

/**
 * Convert NotificationRecord to Firestore document
 */
const notificationRecordToFirestore = (record: Partial<NotificationRecord>) => {
  const sentAt = record.sentAt || new Date();
  const expiresAt = new Date(sentAt);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

  return {
    title: record.title || '',
    body: record.body || '',
    fullBody: record.fullBody || '',
    category: record.category || 'INFO',
    sentAt: Timestamp.fromDate(sentAt),
    expiresAt: Timestamp.fromDate(expiresAt),
    status: record.status || 'SENT',
    recipientCount: record.recipientCount || 0,
    successCount: record.successCount || 0,
    failureCount: record.failureCount || 0,
    sentBy: record.sentBy || '',
    eventId: record.eventId || '',
    isAutomated: record.isAutomated || false,
    errors: record.errors || [],
    data: record.data || null,
  };
};

/**
 * Get all notification history from Firestore
 */
export const getAllNotificationHistory = async (): Promise<NotificationRecord[]> => {
  try {
    const historyQuery = query(
      collection(db, NOTIFICATION_HISTORY_COLLECTION),
      orderBy('sentAt', 'desc')
    );
    const querySnapshot = await getDocs(historyQuery);

    const records: NotificationRecord[] = [];
    querySnapshot.forEach((doc) => {
      records.push(firestoreToNotificationRecord(doc.data(), doc.id));
    });

    return records;
  } catch (error) {
    console.error('Error fetching notification history from Firestore:', error);
    return [];
  }
};

/**
 * Get recent notification history (last 30 days)
 */
export const getRecentNotificationHistory = async (): Promise<NotificationRecord[]> => {
  try {
    const allRecords = await getAllNotificationHistory();
    const now = new Date();

    return allRecords.filter(record => record.expiresAt > now);
  } catch (error) {
    console.error('Error fetching recent notification history:', error);
    return [];
  }
};

/**
 * Add a notification record to history
 */
export const addNotificationRecord = async (record: Partial<NotificationRecord>): Promise<string | null> => {
  try {
    const docRef = await addDoc(
      collection(db, NOTIFICATION_HISTORY_COLLECTION),
      notificationRecordToFirestore(record)
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification record to Firestore:', error);
    return null;
  }
};

/**
 * Delete a notification record from Firestore
 */
export const deleteNotificationRecord = async (recordId: string): Promise<boolean> => {
  try {
    const recordRef = doc(db, NOTIFICATION_HISTORY_COLLECTION, recordId);
    await deleteDoc(recordRef);
    return true;
  } catch (error) {
    console.error('Error deleting notification record from Firestore:', error);
    return false;
  }
};

/**
 * Clean up expired notification records (older than 30 days)
 * This should be called periodically (e.g., on app start or admin login)
 */
export const cleanupExpiredNotifications = async (): Promise<number> => {
  try {
    const now = new Date();
    const allRecords = await getAllNotificationHistory();
    let deletedCount = 0;

    for (const record of allRecords) {
      if (record.expiresAt < now) {
        await deleteNotificationRecord(record.id!);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<{
  totalSent: number;
  totalRecipients: number;
  successRate: number;
  byCategory: Record<NotificationCategory, number>;
  last7Days: number;
  last30Days: number;
}> => {
  try {
    const records = await getRecentNotificationHistory();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalSent: records.length,
      totalRecipients: records.reduce((sum, r) => sum + r.recipientCount, 0),
      successRate: 0,
      byCategory: {
        REMINDER: 0,
        URGENT: 0,
        INFO: 0,
        EVENT: 0,
        AUTOMATED: 0,
      } as Record<NotificationCategory, number>,
      last7Days: 0,
      last30Days: records.length,
    };

    let totalSuccess = 0;
    let totalAttempts = 0;

    records.forEach(record => {
      stats.byCategory[record.category]++;
      totalSuccess += record.successCount;
      totalAttempts += record.recipientCount;

      if (record.sentAt >= sevenDaysAgo) {
        stats.last7Days++;
      }
    });

    stats.successRate = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 100;

    return stats;
  } catch (error) {
    console.error('Error calculating notification stats:', error);
    return {
      totalSent: 0,
      totalRecipients: 0,
      successRate: 0,
      byCategory: { REMINDER: 0, URGENT: 0, INFO: 0, EVENT: 0, AUTOMATED: 0 },
      last7Days: 0,
      last30Days: 0,
    };
  }
};

/**
 * Log a sent notification (helper for NotificationService)
 */
export const logSentNotification = async (
  title: string,
  body: string,
  category: NotificationCategory,
  recipientCount: number,
  successCount: number,
  failureCount: number,
  sentBy?: string,
  eventId?: string,
  isAutomated: boolean = false,
  errors: string[] = [],
  fullBody?: string,
  data?: any
): Promise<string | null> => {
  const status: NotificationStatus =
    failureCount === 0 ? 'SENT' :
      successCount === 0 ? 'FAILED' : 'PARTIAL';

  return addNotificationRecord({
    title,
    body,
    fullBody: fullBody || body, // Use fullBody if provided, otherwise use body
    category,
    sentAt: new Date(),
    status,
    recipientCount,
    successCount,
    failureCount,
    sentBy,
    eventId,
    isAutomated,
    errors,
    data,
  });
};

/**
 * Get the timestamp when user last viewed notifications
 */
export const getLastSeenTimestamp = async (): Promise<Date | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SEEN_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last seen timestamp:', error);
    return null;
  }
};

/**
 * Update the timestamp when user views notifications
 */
export const setLastSeenTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error setting last seen timestamp:', error);
  }
};

/**
 * Get count of unseen notifications (for badge)
 */
export const getUnseenNotificationCount = async (): Promise<number> => {
  try {
    const lastSeen = await getLastSeenTimestamp();
    const records = await getRecentNotificationHistory();

    // Filter out failed notifications (users don't see those)
    const visibleRecords = records.filter(r => r.status !== 'FAILED');

    if (!lastSeen) {
      // If user never viewed, show count of all recent notifications
      return visibleRecords.length;
    }

    // Count notifications newer than last seen
    const unseenCount = visibleRecords.filter(r => r.sentAt > lastSeen).length;
    return unseenCount;
  } catch (error) {
    console.error('Error getting unseen notification count:', error);
    return 0;
  }
};
