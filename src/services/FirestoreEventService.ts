/**
 * Firestore service for managing church events
 * Allows admins to add, edit, and delete events that sync to all users
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(eventsQuery);
    
    const events: ChurchEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push(firestoreToEvent(doc.data(), doc.id));
    });
    
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

