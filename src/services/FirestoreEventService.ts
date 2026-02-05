/**
 * Firestore service for managing church events
 * Allows admins to add, edit, and delete events that sync to all users
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp, setDoc as commonSetDoc } from 'firebase/firestore';
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
  // Create a map of events by ID
  const eventMap = new Map<string, ChurchEvent>();

  // 1. Add all hardcoded events first
  hardcodedEvents.forEach(event => {
    // Ensure hardcoded events have an ID (they should from ChurchCalendarService, but fallback if not)
    // The ID generation logic in ChurchCalendarService guarantees IDs.
    if (event.id) {
      eventMap.set(event.id, event);
    }
  });

  // 2. Override/Add Firestore events
  firestoreEvents.forEach(event => {
    if (event.id) {
      eventMap.set(event.id, event);
    }
  });

  // Convert map back to array and sort
  const allEvents = Array.from(eventMap.values());

  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  return allEvents;
};

/**
 * Save an event (Upsert)
 * Validates ID and uses setDoc to either create or overwrite
 */
export const saveEvent = async (event: ChurchEvent): Promise<boolean> => {
  try {
    if (!event.id) {
      console.error('Cannot save event without ID');
      return false;
    }

    // Check if it's a "custom" event without a proper ID format and generate one if needed?
    // But we expect the ID to be passed in.

    const eventRef = doc(db, EVENTS_COLLECTION, event.id);
    await commonSetDoc(eventRef, eventToFirestore(event), { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving event to Firestore:', error);
    return false;
  }
};



