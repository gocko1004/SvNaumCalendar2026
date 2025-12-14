import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase client configuration
// Note: These keys are safe to expose in client-side code as they identify your Firebase project.
// Security is enforced through Firebase Security Rules, not by hiding these values.
// For production, consider moving to environment variables for easier management across environments.
const firebaseConfig = {
  apiKey: "AIzaSyAGRl1kOe1ypzGhEfLTY-BIOGvYR_1iD70",
  authDomain: "svnaumcalendar.firebaseapp.com",
  projectId: "svnaumcalendar",
  storageBucket: "svnaumcalendar.firebasestorage.app",
  messagingSenderId: "46191164294",
  appId: "1:46191164294:web:1eb5dce072ee231f3d0a07",
  measurementId: "G-W87V472GVX"
};

// Conditional logging for development only
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  console.log('Firebase initializing...');
}

let app;
try {
  app = initializeApp(firebaseConfig);
  if (isDevelopment) {
    console.log('Firebase connected successfully');
  }
} catch (error) {
  if (isDevelopment) {
    console.error('Firebase connection error:', error);
  }
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
export const storage = getStorage(app);

if (isDevelopment && !auth) {
  console.error('Firebase Auth failed to initialize');
}

// Firebase configuration is complete
