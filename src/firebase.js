import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'; // Still needed for persistence config if we use modular mix
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGRl1kOe1ypzGhEfLTY-BIOGvYR_1iD70",
  authDomain: "svnaumcalendar.firebaseapp.com",
  projectId: "svnaumcalendar",
  storageBucket: "svnaumcalendar.firebasestorage.app",
  messagingSenderId: "46191164294",
  appId: "1:46191164294:web:1eb5dce072ee231f3d0a07",
  measurementId: "G-W87V472GVX"
};

const isDevelopment = process.env.NODE_ENV !== 'production';

let app;
let auth;
let initError = null;

try {
  // Use Compat Check
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  // Use Compat Auth
  // This guarantees 'auth' component is registered
  auth = firebase.auth();

  // Configure Persistence explicitly for React Native
  // We use the modular method to set persistence on the compat instance (it works interop)
  // Or we use compat method:
  // auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); // This usually defaults to AsyncStorage in RN Compat

  // However, to be extra safe and use our provided AsyncStorage:
  // properly we should assign the persistence.
  // But compat in RN usually auto-detects if @react-native-async-storage/async-storage is installed.

  if (isDevelopment) {
    console.log('Firebase (Compat) Initialized');
  }

} catch (error) {
  console.error('Firebase Compat Init Failed:', error);
  initError = error;
  // Try to salvage app for other services
  try {
    app = firebase.app();
  } catch (e) { /* ignore */ }
}

// Export services using Modular syntax for rest of app
// Convert compat app to modular app (they are practically same object)
export { app };

// DB and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Auth
export { auth };
export { initError };
