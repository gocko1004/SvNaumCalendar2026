import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

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

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let storage: firebase.storage.Storage;
let initError: Error | null = null;

try {
  // Initialize app
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  // Initialize services using compat
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();

} catch (error) {
  console.error('Firebase Compat Init Failed:', error);
}

export { app, auth, db, storage, firebaseConfig };

