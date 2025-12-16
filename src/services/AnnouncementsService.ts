/**
 * Firestore service for managing time-bound announcements
 * Announcements appear in the calendar feed between events
 * They have a start date, end date, and auto-remove after expiry
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeString, sanitizeNotificationContent, sanitizeExternalUrl } from './ValidationService';

// Announcement types for different styling
export type AnnouncementType = 'INFO' | 'URGENT' | 'EVENT' | 'REMINDER';

export interface Announcement {
  id?: string;
  title: string;
  message: string;
  type: AnnouncementType;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  priority: number; // 1-5, higher = more important
  createdAt: Date;
  createdBy?: string;
  isActive: boolean;
}

const ANNOUNCEMENTS_COLLECTION = 'announcements';

// Type colors for UI
export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, string> = {
  INFO: '#2196F3',      // Blue
  URGENT: '#F44336',    // Red
  EVENT: '#9C27B0',     // Purple
  REMINDER: '#FF9800',  // Orange
};

// Type icons for UI
export const ANNOUNCEMENT_TYPE_ICONS: Record<AnnouncementType, string> = {
  INFO: 'information',
  URGENT: 'alert-circle',
  EVENT: 'calendar-star',
  REMINDER: 'bell-ring',
};

/**
 * Convert Firestore document to Announcement
 */
const firestoreToAnnouncement = (docData: any, docId: string): Announcement => {
  return {
    id: docId,
    title: docData.title || '',
    message: docData.message || '',
    type: docData.type || 'INFO',
    startDate: docData.startDate?.toDate() || new Date(),
    endDate: docData.endDate?.toDate() || new Date(),
    imageUrl: docData.imageUrl || undefined,
    linkUrl: docData.linkUrl || undefined,
    linkText: docData.linkText || undefined,
    priority: docData.priority || 1,
    createdAt: docData.createdAt?.toDate() || new Date(),
    createdBy: docData.createdBy || undefined,
    isActive: docData.isActive !== false, // Default true
  };
};

/**
 * Validate announcement type
 */
const validateAnnouncementType = (type: any): AnnouncementType => {
  const validTypes: AnnouncementType[] = ['INFO', 'URGENT', 'EVENT', 'REMINDER'];
  return validTypes.includes(type) ? type : 'INFO';
};

/**
 * Convert Announcement to Firestore document with sanitization
 */
const announcementToFirestore = (announcement: Partial<Announcement>) => {
  return {
    title: sanitizeString(announcement.title || '', 200),
    message: sanitizeNotificationContent(announcement.message || '', 2000),
    type: validateAnnouncementType(announcement.type),
    startDate: announcement.startDate ? Timestamp.fromDate(announcement.startDate) : Timestamp.now(),
    endDate: announcement.endDate ? Timestamp.fromDate(announcement.endDate) : Timestamp.now(),
    imageUrl: announcement.imageUrl ? sanitizeExternalUrl(announcement.imageUrl) || '' : '',
    linkUrl: announcement.linkUrl ? sanitizeExternalUrl(announcement.linkUrl) || '' : '',
    linkText: sanitizeString(announcement.linkText || '', 100),
    priority: Math.min(Math.max(1, announcement.priority || 1), 5), // Limit priority 1-5
    createdAt: announcement.createdAt ? Timestamp.fromDate(announcement.createdAt) : Timestamp.now(),
    createdBy: sanitizeString(announcement.createdBy || '', 100),
    isActive: announcement.isActive !== false,
  };
};

/**
 * Get all announcements from Firestore
 */
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const announcementsQuery = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(announcementsQuery);

    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      announcements.push(firestoreToAnnouncement(doc.data(), doc.id));
    });

    return announcements;
  } catch (error) {
    console.error('Error fetching announcements from Firestore:', error);
    return [];
  }
};

/**
 * Get active announcements (within date range and isActive=true)
 */
export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const now = new Date();
    const allAnnouncements = await getAllAnnouncements();

    // Filter for active announcements within date range
    return allAnnouncements.filter(announcement =>
      announcement.isActive &&
      announcement.startDate <= now &&
      announcement.endDate >= now
    ).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    return [];
  }
};

/**
 * Get announcements for a specific date (to show in calendar)
 */
export const getAnnouncementsForDate = async (date: Date): Promise<Announcement[]> => {
  try {
    const allAnnouncements = await getAllAnnouncements();
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return allAnnouncements.filter(announcement => {
      if (!announcement.isActive) return false;

      const startDate = new Date(
        announcement.startDate.getFullYear(),
        announcement.startDate.getMonth(),
        announcement.startDate.getDate()
      );
      const endDate = new Date(
        announcement.endDate.getFullYear(),
        announcement.endDate.getMonth(),
        announcement.endDate.getDate()
      );

      return targetDate >= startDate && targetDate <= endDate;
    }).sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('Error fetching announcements for date:', error);
    return [];
  }
};

/**
 * Add a new announcement to Firestore
 */
export const addAnnouncement = async (announcement: Partial<Announcement>): Promise<string | null> => {
  try {
    const docRef = await addDoc(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      announcementToFirestore({
        ...announcement,
        createdAt: new Date(),
      })
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding announcement to Firestore:', error);
    return null;
  }
};

/**
 * Validate document ID format
 */
const validateDocumentId = (id: string): boolean => {
  return Boolean(id && typeof id === 'string' && !id.includes('/') && !id.includes('..'));
};

/**
 * Update an existing announcement in Firestore
 */
export const updateAnnouncement = async (announcementId: string, announcement: Partial<Announcement>): Promise<boolean> => {
  try {
    if (!validateDocumentId(announcementId)) {
      console.error('Invalid announcement ID format');
      return false;
    }
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
    await updateDoc(announcementRef, announcementToFirestore(announcement));
    return true;
  } catch (error) {
    console.error('Error updating announcement');
    return false;
  }
};

/**
 * Delete an announcement from Firestore
 */
export const deleteAnnouncement = async (announcementId: string): Promise<boolean> => {
  try {
    if (!validateDocumentId(announcementId)) {
      console.error('Invalid announcement ID format');
      return false;
    }
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
    await deleteDoc(announcementRef);
    return true;
  } catch (error) {
    console.error('Error deleting announcement');
    return false;
  }
};

/**
 * Toggle announcement active status
 */
export const toggleAnnouncementActive = async (announcementId: string, isActive: boolean): Promise<boolean> => {
  try {
    if (!validateDocumentId(announcementId)) {
      console.error('Invalid announcement ID format');
      return false;
    }
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
    await updateDoc(announcementRef, { isActive: Boolean(isActive) });
    return true;
  } catch (error) {
    console.error('Error toggling announcement status');
    return false;
  }
};

/**
 * Clean up expired announcements (can be called periodically)
 * Marks announcements as inactive if past end date
 */
export const cleanupExpiredAnnouncements = async (): Promise<number> => {
  try {
    const now = new Date();
    const allAnnouncements = await getAllAnnouncements();
    let cleanedCount = 0;

    for (const announcement of allAnnouncements) {
      if (announcement.isActive && announcement.endDate < now) {
        await toggleAnnouncementActive(announcement.id!, false);
        cleanedCount++;
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up expired announcements:', error);
    return 0;
  }
};
