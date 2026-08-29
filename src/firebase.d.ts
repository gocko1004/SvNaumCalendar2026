import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

// All bindings can be undefined if Firebase initialization fails at startup;
// consumers must tolerate that (see initError).
export const app: FirebaseApp | undefined;
export const auth: Auth | undefined;
export const db: Firestore;
export const storage: FirebaseStorage;
export const initError: Error | null;
export const authPersistent: boolean;
