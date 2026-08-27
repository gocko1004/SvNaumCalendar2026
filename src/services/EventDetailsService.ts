import {
  collection,
  doc as docRefFn,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Field types available for dynamic content
export type EventFieldType =
  | 'biography'      // Saint biography
  | 'guest'          // Guest priest
  | 'readings'       // Scripture readings
  | 'note'           // Custom note
  | 'image'          // Custom image URL
  | 'video'          // Video link
  | 'location';      // Different location

export interface EventCustomField {
  id: string;
  type: EventFieldType;
  label: string;
  content: string;
  order: number;
}

export interface EventDetails {
  eventId: string;           // Unique ID based on date + serviceType
  customFields: EventCustomField[];
  updatedAt: Date;
  createdAt: Date;
}

// Field type configuration
export const FIELD_TYPE_CONFIG: Record<EventFieldType, {
  icon: string;
  label: string;
  placeholder: string;
  multiline: boolean;
}> = {
  biography: {
    icon: 'book-open-variant',
    label: 'Биографија',
    placeholder: 'Внесете биографија на светецот...',
    multiline: true,
  },
  guest: {
    icon: 'account-tie',
    label: 'Гостин свештеник',
    placeholder: 'Име на гостин свештеник...',
    multiline: false,
  },
  readings: {
    icon: 'script-text',
    label: 'Читања',
    placeholder: 'Евангелие, Апостол...',
    multiline: true,
  },
  note: {
    icon: 'note-text',
    label: 'Забелешка',
    placeholder: 'Дополнителни информации...',
    multiline: true,
  },
  image: {
    icon: 'image',
    label: 'Слика',
    placeholder: 'URL на слика...',
    multiline: false,
  },
  video: {
    icon: 'video',
    label: 'Видео линк',
    placeholder: 'YouTube или друг линк...',
    multiline: false,
  },
  location: {
    icon: 'map-marker',
    label: 'Локација',
    placeholder: 'Адреса или опис на локација...',
    multiline: false,
  },
};

// Generate unique event ID from date and service type
export const generateEventId = (date: Date, serviceType: string): string => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${dateStr}_${serviceType}`;
};

// Get event details from Firestore
export const getEventDetails = async (eventId: string): Promise<EventDetails | null> => {
  try {
    const snap = await getDoc(docRefFn(db, 'eventDetails', eventId));
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      eventId: snap.id,
      customFields: data?.customFields || [],
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching event details:', error);
    return null;
  }
};

// Save event details to Firestore
export const saveEventDetails = async (eventId: string, customFields: EventCustomField[]): Promise<boolean> => {
  try {
    const ref = docRefFn(db, 'eventDetails', eventId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        customFields,
        updatedAt: Timestamp.now(),
      });
    } else {
      await setDoc(ref, {
        eventId,
        customFields,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving event details:', error);
    return false;
  }
};

// Delete event details from Firestore
export const deleteEventDetails = async (eventId: string): Promise<boolean> => {
  try {
    await deleteDoc(docRefFn(db, 'eventDetails', eventId));
    return true;
  } catch (error) {
    console.error('Error deleting event details:', error);
    return false;
  }
};

// Get all events that have custom details
export const getAllEventDetails = async (): Promise<EventDetails[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'eventDetails'));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        eventId: doc.id,
        customFields: data.customFields || [],
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching all event details:', error);
    return [];
  }
};

// Generate unique field ID
export const generateFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};
