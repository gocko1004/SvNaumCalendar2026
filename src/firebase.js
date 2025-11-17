import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGRl1kOe1ypzGhEfLTY-BIOGvYR_1iD70",
  authDomain: "svnaumcalendar.firebaseapp.com",
  projectId: "svnaumcalendar",
  storageBucket: "svnaumcalendar.firebasestorage.app",
  messagingSenderId: "46191164294",
  appId: "1:46191164294:web:1eb5dce072ee231f3d0a07",
  measurementId: "G-W87V472GVX"
};

console.log('Firebase initialized');
console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase connected successfully');
  console.log('Firebase app name:', app.name);
} catch (error) {
  console.error('Firebase connection error:', error);
  // Don't re-initialize if already initialized
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    // App might already be initialized
    app = getApps()[0];
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase Auth initialized:', auth ? 'OK' : 'FAILED');
console.log('Firebase Auth app:', auth?.app?.name);
console.log('Firebase Auth settings:', {
  currentUser: auth?.currentUser?.email || 'No user',
  app: auth?.app?.name,
  config: {
    apiKey: auth?.app?.options?.apiKey?.substring(0, 20) + '...',
    projectId: auth?.app?.options?.projectId,
    authDomain: auth?.app?.options?.authDomain,
  }
});

// Firebase configuration is complete