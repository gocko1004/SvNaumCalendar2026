import { useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';

const isDevelopment = process.env.NODE_ENV !== 'production';
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const LAST_ACTIVITY_KEY = '@admin_last_activity';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Update last activity timestamp
  const updateLastActivity = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }, []);

  // Check if session has expired - only used for explicit checks, not on auth state change
  const checkSessionExpiry = useCallback(async (): Promise<boolean> => {
    try {
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      // If no activity stored, session is valid (first login or fresh start)
      if (!lastActivity) {
        return false;
      }
      const lastActivityTime = parseInt(lastActivity, 10);
      if (isNaN(lastActivityTime)) {
        // Invalid timestamp, clear it and consider valid
        await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
        return false;
      }
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
        if (isDevelopment) {
          console.log('Session expired after', Math.round(timeSinceLastActivity / 1000 / 60), 'minutes');
        }
        return true; // Session was expired
      }
      return false; // Session is valid
    } catch (error) {
      console.error('Error checking session expiry:', error);
      return false; // On error, assume valid to avoid locking out user
    }
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state changes
    // Note: We don't check expiry here - Firebase handles the auth state
    // Expiry is checked when entering admin panel via updateLastActivity
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        // Update activity on auth state change
        await updateLastActivity();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [updateLastActivity]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        return { success: false, error: 'Внесете корисничко име и лозинка' };
      }

      // Use the input as email if it contains @, otherwise convert to email format
      // This allows users to login with:
      // - Full email: admin@example.com
      // - Username: admin (converts to admin@svnaumkalendar.firebaseapp.com)
      const email = trimmedUsername.includes('@') 
        ? trimmedUsername.toLowerCase().trim() 
        : `${trimmedUsername}@svnaumkalendar.firebaseapp.com`;

      if (isDevelopment) {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Attempting login with email:', email);
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, trimmedPassword);
      
      if (userCredential.user) {
        setIsAuthenticated(true);
        setUser(userCredential.user);
        // Set initial activity timestamp on login
        await updateLastActivity();
        return { success: true };
      }
      return { success: false, error: 'Невалидно корисничко име или лозинка' };
    } catch (error) {
      // Provide more specific error messages
      let errorMessage = 'Невалидно корисничко име или лозинка';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Корисникот не постои. Проверете го email адресот.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Погрешна лозинка. Обидете се повторно.';
        } else if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/invalid-credential') {
          errorMessage = 'Невалиден email или лозинка. Проверете ги податоците или дали Email/Password е овозможено во Firebase.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Невалиден email формат.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Премногу обиди. Обидете се подоцна.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Грешка во мрежата. Проверете ја интернет врската.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Email/Password не е овозможено. Овозможете го во Firebase Console.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (isDevelopment) {
          console.error('=== LOGIN ERROR DETAILS ===');
          console.error('Firebase error code:', error.code);
          console.error('Firebase error message:', error.message);
        }
      } else {
        if (isDevelopment) {
          console.error('Login error:', error);
        }
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    updateLastActivity, // Export to call from admin screens on user interaction
  };
}; 