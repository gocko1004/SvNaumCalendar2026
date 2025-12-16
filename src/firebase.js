import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getReactNativePersistence, initializeAuth, getAuth } from 'firebase/auth';
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
  // Initialize Firebase App (modular SDK)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialize Auth with React Native persistence using AsyncStorage
  // This ensures auth state persists across app restarts and navigation
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (authError) {
    // Auth might already be initialized, get existing instance
    if (authError.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw authError;
    }
  }

  if (isDevelopment) {
    console.log('Firebase Initialized with AsyncStorage persistence');
  }

} catch (error) {
  console.error('Firebase Init Failed:', error);
  initError = error;
  // Try to salvage app for other services
  try {
    app = getApp();
    auth = getAuth(app);
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
