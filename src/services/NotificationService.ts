import { ChurchEvent, CHURCH_EVENTS } from './ChurchCalendarService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { addMinutes, isBefore, addYears, isAfter } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocialMediaService from './SocialMediaService';
import { getReminderText, ReminderTiming } from './NotificationTextService';
import { getEventOverrides, applyEventOverrides, hardcodedEventKey, getAllEvents, mergeEvents } from './FirestoreEventService';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const LAST_SCHEDULE_CHECK = '@last_schedule_check';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  constructor() {
    // Constructor kept empty to avoid side effects
  }

  initializeService = async () => {
    try {
      await this.configure();
      await this.setupYearlyScheduling();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  };

  setupYearlyScheduling = async () => {
    try {
      // Reschedule on EVERY launch: picks up admin overrides and new Firestore
      // events, and keeps the pending list within iOS's 64-notification cap by
      // always scheduling only the nearest upcoming reminders.
      await this.scheduleYearEvents();
      await AsyncStorage.setItem(LAST_SCHEDULE_CHECK, new Date().toISOString());

      // Set up daily check for next year's events
      this.setupDailyCheck();
    } catch (error) {
      console.error('Error setting up yearly scheduling:', error);
    }
  };

  setupDailyCheck = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule the first check
    setTimeout(async () => {
      await this.checkAndScheduleNextYear();
      // Then set up daily checks
      setInterval(this.checkAndScheduleNextYear, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  };

  checkAndScheduleNextYear = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // If we're in December, schedule next year's events
    if (now.getMonth() === 11) {
      const events = this.generateNextYearEvents(currentYear + 1);
      await this.scheduleEventsForYear(events);
      await AsyncStorage.setItem(LAST_SCHEDULE_CHECK, now.toISOString());
    }
  };

  generateNextYearEvents = (year: number): ChurchEvent[] => {
    // Create next year's events based on this year's dates
    return CHURCH_EVENTS.map((event: ChurchEvent) => {
      const newDate = new Date(event.date);
      newDate.setFullYear(year);
      return {
        ...event,
        date: newDate
      };
    });
  };

  // iOS silently keeps only the 64 soonest pending local notifications, so we
  // schedule at most this many and refresh the window on every app launch.
  static MAX_PENDING_REMINDERS = 60;

  scheduleYearEvents = async () => {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings.enabled) return;

      // Cancel existing notifications to avoid duplicates
      await this.cancelAllNotifications();

      const now = new Date();
      const nextYear = addYears(now, 1);

      // Apply admin overrides (canceled/edited hardcoded events) and include
      // events the admin created in Firestore - they deserve reminders too.
      let effectiveEvents: ChurchEvent[] = CHURCH_EVENTS;
      try {
        const [overrides, firestoreEvents] = await Promise.all([
          getEventOverrides(),
          getAllEvents(),
        ]);
        effectiveEvents = mergeEvents(
          applyEventOverrides(CHURCH_EVENTS, overrides),
          firestoreEvents
        );
      } catch (e) { /* offline: fall back to hardcoded */ }

      const upcomingEvents = effectiveEvents.filter((event: ChurchEvent) => {
        const eventDate = new Date(event.date);
        return isAfter(eventDate, now) && isBefore(eventDate, nextYear);
      });

      // Build every (event, reminder-offset) pair, sort by fire time, and
      // schedule only the nearest ones so nothing falls off the iOS cap.
      const offsets: number[] = [];
      if (settings.weekBefore) offsets.push(7 * 24 * 60);
      if (settings.dayBefore) offsets.push(24 * 60);
      if (settings.hourBefore) offsets.push(60);

      const pending: { event: ChurchEvent; minutesBefore: number; fireAt: number }[] = [];
      for (const event of upcomingEvents) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventDate = new Date(event.date);
        eventDate.setHours(hours, minutes);
        for (const minutesBefore of offsets) {
          const fireAt = eventDate.getTime() - minutesBefore * 60 * 1000;
          if (fireAt > now.getTime()) {
            pending.push({ event, minutesBefore, fireAt });
          }
        }
      }
      pending.sort((a, b) => a.fireAt - b.fireAt);

      for (const item of pending.slice(0, NotificationService.MAX_PENDING_REMINDERS)) {
        await this.scheduleEventReminder(item.event, item.minutesBefore);
      }
    } catch (error) {
      console.error('Error scheduling yearly events:', error);
    }
  };

  scheduleEventsForYear = async (events: ChurchEvent[]) => {
    const settings = await this.getNotificationSettings();

    for (const event of events) {
      if (settings.weekBefore) {
        await this.scheduleEventReminder(event, 7 * 24 * 60); // Week before
      }
      if (settings.dayBefore) {
        await this.scheduleEventReminder(event, 24 * 60); // Day before
      }
      if (settings.hourBefore) {
        await this.scheduleEventReminder(event, 60); // Hour before
      }
    }
  };

  scheduleEventReminder = async (event: ChurchEvent, minutesBefore: number) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventDate = new Date(event.date);
    eventDate.setHours(hours, minutes);

    const notificationTime = addMinutes(eventDate, -minutesBefore);
    const identifier = `${event.date.getTime()}-${event.serviceType}-${minutesBefore}`;

    // Don't schedule if the notification time is in the past
    if (isBefore(notificationTime, new Date())) return;

    let notificationType: 'week' | 'day' | 'hour' | null = null;

    if (minutesBefore === 60) {
      notificationType = 'hour';
    } else if (minutesBefore === 24 * 60) {
      notificationType = 'day';
    } else if (minutesBefore === 7 * 24 * 60) {
      notificationType = 'week';
    }

    const timing: ReminderTiming =
      notificationType === 'hour' ? 'HOUR' : notificationType === 'week' ? 'WEEK' : 'DAY';
    const { title, body } = getReminderText(event, timing);

    // Schedule the notification; tapping it opens the event card in the calendar
    await this.scheduleNotification({
      title,
      message: body,
      date: notificationTime,
      identifier,
      urgent: event.serviceType === 'PICNIC',
      data: { type: 'event', eventKey: hardcodedEventKey(event) },
    });

    // Post to social media if it's a notification type we want to share
    if (notificationType) {
      try {
        await SocialMediaService.postEventToSocialMedia(event, notificationType);
      } catch (error) {
        console.error('Error posting to social media:', error);
      }
    }
  };

  configure = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('church-events', {
        name: 'Church Events',
        description: 'Church calendar events and reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#831B26',
      });

      await Notifications.setNotificationChannelAsync('urgent-updates', {
        name: 'Urgent Updates',
        description: 'Important church updates and announcements',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }

      // Register device for push notifications
      await this.registerDeviceForPushNotifications();
    }
  };

  registerDeviceForPushNotifications = async () => {
    try {
      // Get Expo push token
      // Use the project ID from app.json
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        throw new Error('EAS project ID not found in app.json configuration');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Store token in Firestore using token hash as document ID to prevent duplicates
      // This ensures each unique push token only has one entry
      const tokensRef = collection(db, 'pushTokens');
      const tokenId = this.hashToken(token.data);

      await setDoc(doc(tokensRef, tokenId), {
        token: token.data,
        platform: Platform.OS,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      return token.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      return null;
    }
  };

  // Create a simple hash from token to use as document ID
  hashToken = (token: string): string => {
    // Create a simple hash from the token string
    // This ensures the same token always gets the same document ID
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `token_${Math.abs(hash).toString(36)}`;
  };

  getDeviceId = async (): Promise<string> => {
    try {
      let deviceId = await AsyncStorage.getItem('@device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('@device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `device_${Date.now()}`;
    }
  };

  getNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        enabled: true,
        dayBefore: true,
        hourBefore: true,
        weekBefore: false,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        enabled: true,
        dayBefore: true,
        hourBefore: true,
        weekBefore: false,
      };
    }
  };

  updateNotificationSettings = async (settings: {
    enabled: boolean;
    dayBefore: boolean;
    hourBefore: boolean;
    weekBefore: boolean;
  }) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      if (settings.enabled) {
        await this.scheduleYearEvents();
      } else {
        await this.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  scheduleNotification = async (reminder: {
    title: string;
    message: string;
    date: Date;
    identifier?: string;
    urgent?: boolean;
    data?: Record<string, any>;
  }) => {
    const { title, message, date, identifier, urgent, data } = reminder;

    // Calculate seconds until notification
    const secondsUntilNotification = Math.floor((date.getTime() - Date.now()) / 1000);

    // Don't schedule if less than 60 seconds in the future
    if (secondsUntilNotification < 60) {
      console.log(`Skipping notification "${title}" - scheduled time is too soon or in the past`);
      return;
    }

    const channelId = urgent ? 'urgent-updates' : 'church-events';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: true,
        data: data || {},
        priority: urgent ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date,
        channelId: Platform.OS === 'android' ? channelId : undefined,
      },
      identifier,
    });
  };

  sendCustomNotification = async (notification: {
    title: string;
    message: string;
    date?: Date;
    urgent?: boolean;
  }) => {
    const { title, message, date = new Date(), urgent = true } = notification;

    // Send local notification immediately
    await this.scheduleNotification({
      title,
      message,
      date,
      urgent,
      identifier: `custom-${Date.now()}`,
    });
  };

  sendPushNotificationToAllUsers = async (notification: {
    title: string;
    message: string;
    urgent?: boolean;
    data?: Record<string, any>;
  }): Promise<{ success: boolean; sentCount: number; error?: string }> => {
    try {
      const { title, message, urgent = true, data = {} } = notification;

      // Get all push tokens from Firestore
      const tokensRef = collection(db, 'pushTokens');
      const tokensSnapshot = await getDocs(tokensRef);

      if (tokensSnapshot.empty) {
        return { success: false, sentCount: 0, error: 'No devices registered for push notifications' };
      }

      // IMPORTANT: Deduplicate tokens to prevent sending multiple notifications to same device
      const allTokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
      const uniqueTokens = [...new Set(allTokens)];

      console.log(`Found ${allTokens.length} tokens, ${uniqueTokens.length} unique`);

      if (uniqueTokens.length === 0) {
        return { success: false, sentCount: 0, error: 'No valid push tokens found' };
      }

      // Send push notifications via Expo Push Notification API
      // Include fullBody in data as backup in case body gets truncated
      const messages = uniqueTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body: message,
        data: { fullBody: message, ...data },
        priority: urgent ? 'high' : 'normal',
        channelId: urgent ? 'urgent-updates' : 'church-events',
      }));

      // Expo's push API accepts at most 100 messages per request - send in chunks
      const CHUNK_SIZE = 100;
      let successCount = 0;
      let failedCount = 0;
      let lastError: string | undefined;

      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error sending push chunk:', errorText);
            failedCount += chunk.length;
            lastError = errorText;
            continue;
          }

          const result = await response.json();
          const okInChunk = result.data?.filter((r: any) => r.status === 'ok').length || 0;
          successCount += okInChunk;
          failedCount += chunk.length - okInChunk;
        } catch (chunkError: any) {
          console.error('Error sending push chunk:', chunkError);
          failedCount += chunk.length;
          lastError = chunkError?.message;
        }
      }

      return {
        success: successCount > 0,
        sentCount: successCount,
        error:
          failedCount > 0
            ? `${failedCount} пораки не беа испратени${lastError ? `: ${lastError}` : ''}`
            : undefined,
      };
    } catch (error: any) {
      console.error('Error sending push notifications to all users:', error);
      return { success: false, sentCount: 0, error: error.message || 'Unknown error' };
    }
  };

  cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  cancelNotification = async (identifier: string) => {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  };
}

export default new NotificationService(); 