import { collection, doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CHURCH_EVENTS, ChurchEvent, ServiceType } from './ChurchCalendarService';
import { logSentNotification } from './NotificationHistoryService';
import * as Notifications from 'expo-notifications';

// Auto-notification configuration types
export type NotificationTiming = '1_WEEK' | '3_DAYS' | '1_DAY' | '12_HOURS';

export interface AutoNotificationConfig {
  id?: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  serviceType: ServiceType;
  timings: NotificationTiming[];
  isEnabled: boolean;
  customMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoNotificationLog {
  id?: string;
  configId: string;
  eventId: string;
  timing: NotificationTiming;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  error?: string;
}

// Default notification timings for different service types
export const DEFAULT_TIMINGS_BY_TYPE: Record<ServiceType, NotificationTiming[]> = {
  PICNIC: ['1_WEEK', '3_DAYS', '1_DAY'],
  LITURGY: ['1_DAY'],
  EVENING_SERVICE: ['1_DAY'],
  CHURCH_OPEN: ['1_DAY'],
};

// Labels for display
export const TIMING_LABELS: Record<NotificationTiming, string> = {
  '1_WEEK': '1 недела пред',
  '3_DAYS': '3 дена пред',
  '1_DAY': '1 ден пред',
  '12_HOURS': '12 часа пред',
};

// Calculate notification time based on event date and timing
export const calculateNotificationDate = (eventDate: Date, timing: NotificationTiming): Date => {
  const notifyDate = new Date(eventDate);

  switch (timing) {
    case '1_WEEK':
      notifyDate.setDate(notifyDate.getDate() - 7);
      notifyDate.setHours(10, 0, 0, 0); // 10:00 AM
      break;
    case '3_DAYS':
      notifyDate.setDate(notifyDate.getDate() - 3);
      notifyDate.setHours(10, 0, 0, 0); // 10:00 AM
      break;
    case '1_DAY':
      notifyDate.setDate(notifyDate.getDate() - 1);
      notifyDate.setHours(18, 0, 0, 0); // 6:00 PM (evening reminder)
      break;
    case '12_HOURS':
      notifyDate.setTime(notifyDate.getTime() - (12 * 60 * 60 * 1000));
      break;
  }

  return notifyDate;
};

// Get notification message based on timing
export const getNotificationMessage = (event: ChurchEvent, timing: NotificationTiming, customMessage?: string): { title: string; body: string } => {
  if (customMessage) {
    return {
      title: event.name,
      body: customMessage,
    };
  }

  const serviceTypeLabel = {
    LITURGY: 'Литургија',
    EVENING_SERVICE: 'Вечерна служба',
    CHURCH_OPEN: 'Отворена црква',
    PICNIC: 'Пикник',
  }[event.serviceType];

  switch (timing) {
    case '1_WEEK':
      return {
        title: `${event.name} - за 1 недела!`,
        body: `Потсетник: ${serviceTypeLabel} на ${event.date.toLocaleDateString('mk-MK')}. Не заборавајте да се подготвите!`,
      };
    case '3_DAYS':
      return {
        title: `${event.name} - за 3 дена!`,
        body: `${serviceTypeLabel} е наскоро. Резервирајте го денот!`,
      };
    case '1_DAY':
      return {
        title: `${event.name} - утре!`,
        body: `Утре е ${serviceTypeLabel} во ${event.time}ч. Ве очекуваме!`,
      };
    case '12_HOURS':
      return {
        title: `${event.name} - денес!`,
        body: `${serviceTypeLabel} започнува во ${event.time}ч. Ве очекуваме!`,
      };
  }
};

// Firestore collection reference
const autoNotifyConfigCollection = collection(db, 'autoNotifyConfig');
const autoNotifyLogCollection = collection(db, 'autoNotifyLog');

// Get all auto-notification configs
export const getAllAutoNotificationConfigs = async (): Promise<AutoNotificationConfig[]> => {
  try {
    const querySnapshot = await getDocs(autoNotifyConfigCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate?.toDate() || new Date(),
        serviceType: data.serviceType,
        timings: data.timings || [],
        isEnabled: data.isEnabled ?? true,
        customMessage: data.customMessage,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as AutoNotificationConfig;
    });
  } catch (error) {
    console.error('Error getting auto notification configs:', error);
    return [];
  }
};

// Get config for a specific event
export const getAutoNotificationConfig = async (eventId: string): Promise<AutoNotificationConfig | null> => {
  try {
    const q = query(autoNotifyConfigCollection, where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      eventId: data.eventId,
      eventName: data.eventName,
      eventDate: data.eventDate?.toDate() || new Date(),
      serviceType: data.serviceType,
      timings: data.timings || [],
      isEnabled: data.isEnabled ?? true,
      customMessage: data.customMessage,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as AutoNotificationConfig;
  } catch (error) {
    console.error('Error getting auto notification config:', error);
    return null;
  }
};

// Save or update auto-notification config
export const saveAutoNotificationConfig = async (config: AutoNotificationConfig): Promise<string> => {
  try {
    const docRef = config.id ? doc(autoNotifyConfigCollection, config.id) : doc(autoNotifyConfigCollection);

    const docData = {
      eventId: config.eventId,
      eventName: config.eventName,
      eventDate: Timestamp.fromDate(config.eventDate),
      serviceType: config.serviceType,
      timings: config.timings,
      isEnabled: config.isEnabled,
      customMessage: config.customMessage || null,
      updatedAt: Timestamp.now(),
      ...(config.id ? {} : { createdAt: Timestamp.now() }),
    };

    await setDoc(docRef, docData, { merge: true });
    return docRef.id;
  } catch (error) {
    console.error('Error saving auto notification config:', error);
    throw error;
  }
};

// Delete auto-notification config
export const deleteAutoNotificationConfig = async (configId: string): Promise<void> => {
  try {
    await deleteDoc(doc(autoNotifyConfigCollection, configId));
  } catch (error) {
    console.error('Error deleting auto notification config:', error);
    throw error;
  }
};

// Toggle config enabled status
export const toggleAutoNotificationConfig = async (configId: string, isEnabled: boolean): Promise<void> => {
  try {
    await updateDoc(doc(autoNotifyConfigCollection, configId), {
      isEnabled,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling auto notification config:', error);
    throw error;
  }
};

// Get big events (picnics and major feasts) that could benefit from auto-notifications
export const getBigEvents = (): ChurchEvent[] => {
  const now = new Date();

  return CHURCH_EVENTS.filter(event => {
    // Only future events
    if (event.date < now) return false;

    // Picnics are always "big events"
    if (event.serviceType === 'PICNIC') return true;

    // Major feasts (check by name)
    const majorFeasts = [
      'Богојавление',
      'Велигден',
      'Велики Петок',
      'Духови',
      'Успение Богородично',
      'Раѓање Христово',
      'Свети Наум',
      'Свети Климент',
      'Петровден',
    ];

    return majorFeasts.some(feast => event.name.includes(feast));
  });
};

// Get ALL future events for auto-notification configuration
export const getAllFutureEvents = (): ChurchEvent[] => {
  const now = new Date();
  return CHURCH_EVENTS
    .filter(event => event.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Initialize default auto-notification configs for big events
export const initializeDefaultConfigs = async (): Promise<number> => {
  try {
    const bigEvents = getBigEvents();
    let created = 0;

    for (const event of bigEvents) {
      const eventId = `${event.date.toISOString()}_${event.name}`;
      const existing = await getAutoNotificationConfig(eventId);

      if (!existing) {
        await saveAutoNotificationConfig({
          eventId,
          eventName: event.name,
          eventDate: event.date,
          serviceType: event.serviceType,
          timings: DEFAULT_TIMINGS_BY_TYPE[event.serviceType],
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        created++;
      }
    }

    return created;
  } catch (error) {
    console.error('Error initializing default configs:', error);
    return 0;
  }
};

// Check and schedule pending notifications
export const checkAndScheduleNotifications = async (): Promise<void> => {
  try {
    const configs = await getAllAutoNotificationConfigs();
    const now = new Date();

    for (const config of configs) {
      if (!config.isEnabled) continue;
      if (config.eventDate < now) continue; // Skip past events

      for (const timing of config.timings) {
        const notifyDate = calculateNotificationDate(config.eventDate, timing);

        // If notification time is in the past but event is still upcoming, skip
        if (notifyDate < now) continue;

        // Check if already scheduled
        const logId = `${config.id}_${timing}`;
        const logRef = doc(autoNotifyLogCollection, logId);
        const logSnap = await getDoc(logRef);

        if (!logSnap.exists()) {
          // Schedule notification
          const event = CHURCH_EVENTS.find(e =>
            e.date.toISOString() === config.eventDate.toISOString() &&
            e.name === config.eventName
          );

          if (event) {
            const { title, body } = getNotificationMessage(event, timing, config.customMessage);

            // Schedule with Expo - SDK 54 requires trigger object with type
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { eventId: config.eventId, timing },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notifyDate,
              },
            });

            // Log the schedule
            await setDoc(logRef, {
              configId: config.id,
              eventId: config.eventId,
              timing,
              scheduledFor: Timestamp.fromDate(notifyDate),
              status: 'PENDING',
              createdAt: Timestamp.now(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking and scheduling notifications:', error);
  }
};

// Get scheduled notifications for an event
export const getScheduledNotificationsForEvent = async (eventId: string): Promise<AutoNotificationLog[]> => {
  try {
    const q = query(autoNotifyLogCollection, where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        configId: data.configId,
        eventId: data.eventId,
        timing: data.timing,
        scheduledFor: data.scheduledFor?.toDate() || new Date(),
        sentAt: data.sentAt?.toDate(),
        status: data.status,
        error: data.error,
      } as AutoNotificationLog;
    });
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Get all pending scheduled notifications
export const getPendingScheduledNotifications = async (): Promise<AutoNotificationLog[]> => {
  try {
    const q = query(autoNotifyLogCollection, where('status', '==', 'PENDING'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        configId: data.configId,
        eventId: data.eventId,
        timing: data.timing,
        scheduledFor: data.scheduledFor?.toDate() || new Date(),
        sentAt: data.sentAt?.toDate(),
        status: data.status,
        error: data.error,
      } as AutoNotificationLog;
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
};
