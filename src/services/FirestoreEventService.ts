/**
 * Firestore service for managing church events
 * Allows admins to add, edit, and delete events that sync to all users
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ChurchEvent, ServiceType } from './ChurchCalendarService';

const EVENTS_COLLECTION = 'churchEvents';

/**
 * Convert Firestore document to ChurchEvent
 */
const firestoreToEvent = (docData: any, docId: string): ChurchEvent => {
  return {
    id: docId,
    date: docData.date.toDate(),
    name: docData.name,
    serviceType: docData.serviceType as ServiceType,
    time: docData.time,
    description: docData.description,
    imageUrl: docData.imageUrl,
    saintName: docData.saintName,
  };
};

/**
 * Convert ChurchEvent to Firestore document
 */
const eventToFirestore = (event: Partial<ChurchEvent>) => {
  return {
    date: event.date ? Timestamp.fromDate(event.date) : Timestamp.now(),
    name: event.name || '',
    serviceType: event.serviceType || 'LITURGY',
    time: event.time || '09:00',
    description: event.description || '',
    imageUrl: event.imageUrl || '',
    saintName: event.saintName || '',
  };
};

/**
 * Get all events from Firestore
 */
export const getAllEvents = async (): Promise<ChurchEvent[]> => {
  try {
    // Simple query without orderBy to avoid index requirement
    const querySnapshot = await getDocs(collection(db, EVENTS_COLLECTION));

    const events: ChurchEvent[] = [];
    querySnapshot.forEach((docSnapshot) => {
      try {
        const data = docSnapshot.data();
        if (data && data.date) {
          events.push(firestoreToEvent(data, docSnapshot.id));
        }
      } catch (parseError) {
        console.warn('Error parsing event document:', docSnapshot.id, parseError);
      }
    });

    // Sort in memory instead of in Firestore query
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log('Loaded', events.length, 'events from Firestore');
    return events;
  } catch (error) {
    console.error('Error fetching events from Firestore:', error);
    return [];
  }
};

/**
 * Add a new event to Firestore
 */
export const addEvent = async (event: Partial<ChurchEvent>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventToFirestore(event));
    return docRef.id;
  } catch (error) {
    console.error('Error adding event to Firestore:', error);
    return null;
  }
};

/**
 * Update an existing event in Firestore
 */
export const updateEvent = async (eventId: string, event: Partial<ChurchEvent>): Promise<boolean> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, eventToFirestore(event));
    return true;
  } catch (error) {
    console.error('Error updating event in Firestore:', error);
    return false;
  }
};

/**
 * Delete an event from Firestore
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventRef);
    return true;
  } catch (error) {
    console.error('Error deleting event from Firestore:', error);
    return false;
  }
};

/**
 * Merge Firestore events with hardcoded events
 * Firestore events take precedence (can override hardcoded ones)
 */
export const mergeEvents = (hardcodedEvents: ChurchEvent[], firestoreEvents: ChurchEvent[]): ChurchEvent[] => {
  // Create a map of Firestore events by date (for quick lookup)
  const firestoreMap = new Map<string, ChurchEvent[]>();
  
  firestoreEvents.forEach(event => {
    const dateKey = event.date.toISOString().split('T')[0];
    if (!firestoreMap.has(dateKey)) {
      firestoreMap.set(dateKey, []);
    }
    firestoreMap.get(dateKey)!.push(event);
  });
  
  // Combine: Start with hardcoded, then add Firestore events
  const allEvents = [...hardcodedEvents];
  
  firestoreEvents.forEach(event => {
    allEvents.push(event);
  });
  
  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return allEvents;
};


/**
 * Overrides for HARDCODED events. Hardcoded events ship inside the app binary,
 * so the only way to edit or cancel one without an app release is an override
 * document keyed by the original event's date + type + time.
 */
const OVERRIDES_COLLECTION = 'eventOverrides';

export interface EventOverride {
  action: 'CANCEL' | 'MODIFY';
  name?: string;
  time?: string;
  serviceType?: ServiceType;
  description?: string;
  saintName?: string;
  reason?: string;
}

export const hardcodedEventKey = (event: ChurchEvent): string => {
  const d = event.date;
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${dateKey}_${event.serviceType}_${event.time}`;
};

export const getEventOverrides = async (): Promise<Map<string, EventOverride>> => {
  const map = new Map<string, EventOverride>();
  try {
    const snapshot = await getDocs(collection(db, OVERRIDES_COLLECTION));
    snapshot.forEach(docSnapshot => {
      map.set(docSnapshot.id, docSnapshot.data() as EventOverride);
    });
  } catch (error) {
    console.error('Error loading event overrides:', error);
  }
  return map;
};

export const saveEventOverride = async (key: string, override: EventOverride): Promise<boolean> => {
  try {
    const clean: Record<string, any> = { action: override.action, updatedAt: Timestamp.now() };
    (['name', 'time', 'serviceType', 'description', 'saintName', 'reason'] as const).forEach(f => {
      if (override[f] !== undefined) clean[f] = override[f];
    });
    await setDoc(doc(db, OVERRIDES_COLLECTION, key), clean);
    return true;
  } catch (error) {
    console.error('Error saving event override:', error);
    return false;
  }
};

export const deleteEventOverride = async (key: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, OVERRIDES_COLLECTION, key));
    return true;
  } catch (error) {
    console.error('Error deleting event override:', error);
    return false;
  }
};

/**
 * Apply overrides to the hardcoded event list: CANCELed events are removed,
 * MODIFYd events are patched. Patched events carry `overrideKey` so the admin
 * screen can keep editing them under their original key.
 */
export const applyEventOverrides = (
  hardcodedEvents: ChurchEvent[],
  overrides: Map<string, EventOverride>
): ChurchEvent[] => {
  if (overrides.size === 0) return hardcodedEvents;

  const result: ChurchEvent[] = [];
  for (const event of hardcodedEvents) {
    const key = hardcodedEventKey(event);
    const override = overrides.get(key);
    if (!override) {
      result.push(event);
      continue;
    }
    if (override.action === 'CANCEL') continue;
    result.push({
      ...event,
      name: override.name ?? event.name,
      time: override.time ?? event.time,
      serviceType: override.serviceType ?? event.serviceType,
      description: override.description ?? event.description,
      saintName: override.saintName ?? event.saintName,
      overrideKey: key,
    });
  }
  return result;
};
