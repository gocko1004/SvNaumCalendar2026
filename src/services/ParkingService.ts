import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NotificationService from './NotificationService';
import { logSentNotification } from './NotificationHistoryService';

// Types
export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  note?: string;
  googleMapsUrl?: string;
  isActive: boolean;
  order: number;
}

export interface ParkingRule {
  id: string;
  text: string;
  order: number;
}

export interface ParkingSettings {
  autoNotifyBeforePicnic: boolean;
  autoNotifyHoursBefore: number;
  defaultMessage: string;
}

export interface ParkingNotificationData {
  title: string;
  message: string;
  includeLocations: string[]; // location IDs
  includeRules: boolean;
  includeMapsLinks: boolean;
}

// Storage keys
const PARKING_LOCATIONS_KEY = '@parking_locations';
const PARKING_RULES_KEY = '@parking_rules';
const PARKING_SETTINGS_KEY = '@parking_settings';

// Default settings
const DEFAULT_SETTINGS: ParkingSettings = {
  autoNotifyBeforePicnic: false,
  autoNotifyHoursBefore: 24,
  defaultMessage: 'Драги браќа и сестри, ве молиме внимавајте на паркирањето за денешниот настан.',
};

// ============ PARKING LOCATIONS ============

export const getAllParkingLocations = async (): Promise<ParkingLocation[]> => {
  try {
    // Try Firestore first
    const locationsRef = collection(db, 'parkingLocations');
    const snapshot = await getDocs(locationsRef);

    if (!snapshot.empty) {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingLocation[];
      return locations.sort((a, b) => a.order - b.order);
    }

    // Fallback to AsyncStorage
    const stored = await AsyncStorage.getItem(PARKING_LOCATIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  } catch (error) {
    console.error('Error getting parking locations:', error);
    // Fallback to AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(PARKING_LOCATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return [];
  }
};

export const addParkingLocation = async (location: Omit<ParkingLocation, 'id'>): Promise<string | null> => {
  try {
    const locationsRef = collection(db, 'parkingLocations');
    const docRef = await addDoc(locationsRef, location);

    // Also save to AsyncStorage as backup
    const locations = await getAllParkingLocations();
    locations.push({ ...location, id: docRef.id });
    await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(locations));

    return docRef.id;
  } catch (error) {
    console.error('Error adding parking location:', error);
    // Fallback to AsyncStorage only
    try {
      const locations = await getAllParkingLocations();
      const newId = `local_${Date.now()}`;
      locations.push({ ...location, id: newId });
      await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(locations));
      return newId;
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
      return null;
    }
  }
};

export const updateParkingLocation = async (id: string, updates: Partial<ParkingLocation>): Promise<boolean> => {
  try {
    const locationRef = doc(db, 'parkingLocations', id);
    await updateDoc(locationRef, updates);

    // Update AsyncStorage backup
    const locations = await getAllParkingLocations();
    const index = locations.findIndex(l => l.id === id);
    if (index !== -1) {
      locations[index] = { ...locations[index], ...updates };
      await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(locations));
    }

    return true;
  } catch (error) {
    console.error('Error updating parking location:', error);
    // Fallback to AsyncStorage
    try {
      const locations = await getAllParkingLocations();
      const index = locations.findIndex(l => l.id === id);
      if (index !== -1) {
        locations[index] = { ...locations[index], ...updates };
        await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(locations));
        return true;
      }
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return false;
  }
};

export const deleteParkingLocation = async (id: string): Promise<boolean> => {
  try {
    const locationRef = doc(db, 'parkingLocations', id);
    await deleteDoc(locationRef);

    // Update AsyncStorage backup
    const locations = await getAllParkingLocations();
    const filtered = locations.filter(l => l.id !== id);
    await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('Error deleting parking location:', error);
    // Fallback to AsyncStorage
    try {
      const locations = await getAllParkingLocations();
      const filtered = locations.filter(l => l.id !== id);
      await AsyncStorage.setItem(PARKING_LOCATIONS_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return false;
  }
};

// ============ PARKING RULES ============

export const getAllParkingRules = async (): Promise<ParkingRule[]> => {
  try {
    const rulesRef = collection(db, 'parkingRules');
    const snapshot = await getDocs(rulesRef);

    if (!snapshot.empty) {
      const rules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingRule[];
      return rules.sort((a, b) => a.order - b.order);
    }

    // Fallback to AsyncStorage
    const stored = await AsyncStorage.getItem(PARKING_RULES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  } catch (error) {
    console.error('Error getting parking rules:', error);
    try {
      const stored = await AsyncStorage.getItem(PARKING_RULES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return [];
  }
};

export const addParkingRule = async (rule: Omit<ParkingRule, 'id'>): Promise<string | null> => {
  try {
    const rulesRef = collection(db, 'parkingRules');
    const docRef = await addDoc(rulesRef, rule);

    const rules = await getAllParkingRules();
    rules.push({ ...rule, id: docRef.id });
    await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(rules));

    return docRef.id;
  } catch (error) {
    console.error('Error adding parking rule:', error);
    try {
      const rules = await getAllParkingRules();
      const newId = `local_${Date.now()}`;
      rules.push({ ...rule, id: newId });
      await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(rules));
      return newId;
    } catch (e) {
      return null;
    }
  }
};

export const updateParkingRule = async (id: string, updates: Partial<ParkingRule>): Promise<boolean> => {
  try {
    const ruleRef = doc(db, 'parkingRules', id);
    await updateDoc(ruleRef, updates);

    const rules = await getAllParkingRules();
    const index = rules.findIndex(r => r.id === id);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates };
      await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(rules));
    }

    return true;
  } catch (error) {
    console.error('Error updating parking rule:', error);
    try {
      const rules = await getAllParkingRules();
      const index = rules.findIndex(r => r.id === id);
      if (index !== -1) {
        rules[index] = { ...rules[index], ...updates };
        await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(rules));
        return true;
      }
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return false;
  }
};

export const deleteParkingRule = async (id: string): Promise<boolean> => {
  try {
    const ruleRef = doc(db, 'parkingRules', id);
    await deleteDoc(ruleRef);

    const rules = await getAllParkingRules();
    const filtered = rules.filter(r => r.id !== id);
    await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('Error deleting parking rule:', error);
    try {
      const rules = await getAllParkingRules();
      const filtered = rules.filter(r => r.id !== id);
      await AsyncStorage.setItem(PARKING_RULES_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return false;
  }
};

// ============ PARKING SETTINGS ============

export const getParkingSettings = async (): Promise<ParkingSettings> => {
  try {
    const settingsRef = doc(db, 'settings', 'parking');
    const snapshot = await getDoc(settingsRef);

    if (snapshot.exists()) {
      return snapshot.data() as ParkingSettings;
    }

    // Fallback to AsyncStorage
    const stored = await AsyncStorage.getItem(PARKING_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting parking settings:', error);
    try {
      const stored = await AsyncStorage.getItem(PARKING_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return DEFAULT_SETTINGS;
  }
};

export const updateParkingSettings = async (settings: Partial<ParkingSettings>): Promise<boolean> => {
  try {
    const currentSettings = await getParkingSettings();
    const newSettings = { ...currentSettings, ...settings };

    const settingsRef = doc(db, 'settings', 'parking');
    await setDoc(settingsRef, newSettings);

    await AsyncStorage.setItem(PARKING_SETTINGS_KEY, JSON.stringify(newSettings));

    return true;
  } catch (error) {
    console.error('Error updating parking settings:', error);
    try {
      const currentSettings = await getParkingSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(PARKING_SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (e) {
      console.error('AsyncStorage fallback failed:', e);
    }
    return false;
  }
};

// ============ SEND PARKING NOTIFICATION ============

export const sendParkingNotification = async (data: ParkingNotificationData): Promise<{ success: boolean; sentCount: number; error?: string }> => {
  try {
    const locations = await getAllParkingLocations();
    const rules = await getAllParkingRules();

    // Build message
    let fullMessage = data.message;

    // Add selected locations
    const selectedLocations = locations.filter(l => data.includeLocations.includes(l.id) && l.isActive);
    if (selectedLocations.length > 0) {
      fullMessage += '\n\n📍 Паркинг локации:';
      selectedLocations.forEach(loc => {
        fullMessage += `\n• ${loc.name}`;
        if (loc.address) fullMessage += ` - ${loc.address}`;
        if (loc.capacity) fullMessage += ` (${loc.capacity} места)`;
        if (loc.note) fullMessage += ` (${loc.note})`;
      });
    }

    // Add rules
    if (data.includeRules && rules.length > 0) {
      fullMessage += '\n\n⚠️ Правила за Паркирање:';
      rules.forEach(rule => {
        fullMessage += `\n• ${rule.text}`;
      });
    }

    // Add maps links
    if (data.includeMapsLinks) {
      const locationsWithMaps = selectedLocations.filter(l => l.googleMapsUrl);
      if (locationsWithMaps.length > 0) {
        fullMessage += '\n\n🗺️ Google Maps:';
        locationsWithMaps.forEach(loc => {
          fullMessage += `\n${loc.name}: ${loc.googleMapsUrl}`;
        });
      }
    }

    // Send notification
    const result = await NotificationService.sendPushNotificationToAllUsers({
      title: data.title,
      message: fullMessage,
      urgent: false,
    });

    // Log to history
    await logSentNotification(
      data.title,
      fullMessage,
      'INFO',
      result.sentCount,
      result.success ? result.sentCount : 0,
      result.success ? 0 : result.sentCount,
      'admin',
      undefined,
      false,
      result.error ? [result.error] : []
    );

    return result;
  } catch (error: any) {
    console.error('Error sending parking notification:', error);
    return {
      success: false,
      sentCount: 0,
      error: error.message || 'Грешка при испраќање',
    };
  }
};

export default {
  getAllParkingLocations,
  addParkingLocation,
  updateParkingLocation,
  deleteParkingLocation,
  getAllParkingRules,
  addParkingRule,
  updateParkingRule,
  deleteParkingRule,
  getParkingSettings,
  updateParkingSettings,
  sendParkingNotification,
};
