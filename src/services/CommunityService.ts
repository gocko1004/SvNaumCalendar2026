import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeString, rateLimiter } from './ValidationService';

// Community tab (Заедница): public users write messages and membership
// applications. SECURITY MODEL: these collections are CREATE-ONLY for the
// public and readable only by a signed-in admin — enforced by Firestore
// rules with schema validation, never by this client code.

export type ContactMessageType = 'QUESTION' | 'REMARK' | 'COMPLAINT' | 'PRAISE';

export const CONTACT_TYPE_LABELS: Record<ContactMessageType, string> = {
  QUESTION: 'Прашање',
  REMARK: 'Забелешка',
  COMPLAINT: 'Поплака',
  PRAISE: 'Пофалба',
};

const contactCollection = collection(db, 'contactMessages');
const membershipCollection = collection(db, 'membershipApplications');

export class RateLimitedError extends Error {
  constructor() {
    super('Премногу пораки за кратко време. Обидете се повторно за неколку минути.');
    this.name = 'RateLimitedError';
  }
}

export const sendContactMessage = async (input: {
  type: ContactMessageType;
  message: string;
  name?: string;
  contact?: string;
}): Promise<void> => {
  if (!rateLimiter.isAllowed('community_submit', 3, 10 * 60 * 1000)) {
    throw new RateLimitedError();
  }

  const message = sanitizeString(input.message, 3000);
  if (!message.trim()) {
    throw new Error('Пораката е задолжителна');
  }

  const data: Record<string, any> = {
    type: input.type,
    message: message.trim(),
    status: 'NEW',
    createdAt: serverTimestamp(),
  };
  const name = input.name && sanitizeString(input.name, 120).trim();
  const contact = input.contact && sanitizeString(input.contact, 160).trim();
  if (name) data.name = name;
  if (contact) data.contact = contact;

  await addDoc(contactCollection, data);
};

export const sendMembershipApplication = async (input: {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  familyMembers?: string;
  note?: string;
}): Promise<void> => {
  if (!rateLimiter.isAllowed('community_submit', 3, 10 * 60 * 1000)) {
    throw new RateLimitedError();
  }

  const fullName = sanitizeString(input.fullName, 160).trim();
  const address = sanitizeString(input.address, 300).trim();
  const phone = sanitizeString(input.phone, 40).trim();
  const email = sanitizeString(input.email, 160).trim();

  if (!fullName) throw new Error('Името е задолжително');
  if (!phone && !email) throw new Error('Внесете телефон или email за контакт');

  const data: Record<string, any> = {
    fullName,
    address,
    phone,
    email,
    status: 'NEW',
    createdAt: serverTimestamp(),
  };
  const familyMembers = input.familyMembers && sanitizeString(input.familyMembers, 1000).trim();
  const note = input.note && sanitizeString(input.note, 2000).trim();
  if (familyMembers) data.familyMembers = familyMembers;
  if (note) data.note = note;

  await addDoc(membershipCollection, data);
};
