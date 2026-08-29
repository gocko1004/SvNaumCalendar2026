import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as firebaseAuth from 'firebase/auth';
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

let app;
let auth;
let initError = null;
let authPersistent = false;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  const { initializeAuth, getAuth, getReactNativePersistence } = firebaseAuth;

  // Preferred: React Native persistence so the admin session survives app
  // restarts. Falls back to the default auth instance if that path is
  // unavailable in this SDK/bundler combination - login must always work.
  if (typeof getReactNativePersistence === 'function' && typeof initializeAuth === 'function') {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      authPersistent = true;
    } catch (authError) {
      if (authError?.code === 'auth/already-initialized' && typeof getAuth === 'function') {
        auth = getAuth(app);
        authPersistent = true;
      } else {
        console.warn('[firebase] initializeAuth with RN persistence failed:', authError?.message);
      }
    }
  } else {
    console.warn(
      '[firebase] RN persistence unavailable (getReactNativePersistence=' +
        typeof getReactNativePersistence + ', initializeAuth=' + typeof initializeAuth + ')'
    );
  }

  if (!auth && typeof firebaseAuth.getAuth === 'function') {
    auth = firebaseAuth.getAuth(app);
  }

  if (!auth) {
    throw new Error('Auth instance could not be created');
  }

  console.log(
    '[firebase] initialized; auth persistence:',
    authPersistent ? 'AsyncStorage (persistent)' : 'default (may not persist)'
  );
} catch (error) {
  console.error('[firebase] Init failed:', error?.message, error);
  initError = error;
}

export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export { initError };
export { authPersistent };
