import { useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import from JS file with proper typing
const firebaseModule = require('../firebase');
const auth: Auth | null = firebaseModule.auth;
const initError: Error | null = firebaseModule.initError;

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes default
const EXTENDED_SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LAST_ACTIVITY_KEY = '@admin_last_activity';
const KEEP_LOGGED_IN_KEY = '@admin_keep_logged_in';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const updateLastActivity = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }, []);

  const checkSessionExpiry = useCallback(async (): Promise<boolean> => {
    try {
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) return false;

      const lastActivityTime = parseInt(lastActivity, 10);
      if (isNaN(lastActivityTime)) {
        await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
        return false;
      }

      // Check if "keep me logged in" is enabled
      const keepLoggedIn = await AsyncStorage.getItem(KEEP_LOGGED_IN_KEY);
      const timeout = keepLoggedIn === 'true' ? EXTENDED_SESSION_TIMEOUT_MS : SESSION_TIMEOUT_MS;

      if (Date.now() - lastActivityTime > timeout) {
        // Clear keep logged in on expiry
        await AsyncStorage.removeItem(KEEP_LOGGED_IN_KEY);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    // Safety check: if auth failed to initialize, do nothing (user will be treated as logged out)
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isExpired = await checkSessionExpiry();
        if (isExpired) {
          await firebaseSignOut(auth);
          await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(firebaseUser);
          setIsAuthenticated(true);
          await updateLastActivity();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [updateLastActivity, checkSessionExpiry]);

  const login = async (username: string, password: string, keepLoggedIn: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!auth) {
        const errorDetail = initError ? (initError as any).message || JSON.stringify(initError) : 'Unknown Error';
        return { success: false, error: `Системот за најава не е достапен.\nГрешка: ${errorDetail}` };
      }

      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        return { success: false, error: 'Внесете корисничко име и лозинка' };
      }

      const email = trimmedUsername.includes('@')
        ? trimmedUsername
        : `${trimmedUsername}@svnaumcalendar.firebaseapp.com`;

      const userCredential = await signInWithEmailAndPassword(auth, email, trimmedPassword);

      if (userCredential.user) {
        setIsAuthenticated(true);
        setUser(userCredential.user);
        await updateLastActivity();
        // Store keep logged in preference
        await AsyncStorage.setItem(KEEP_LOGGED_IN_KEY, keepLoggedIn ? 'true' : 'false');
        return { success: true };
      }
      return { success: false, error: 'Невалидно корисничко име или лозинка' };
    } catch (error) {
      let errorMessage = 'Невалидно корисничко име или лозинка';

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Корисникот не постои.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Погрешна лозинка.';
            break;
          case 'auth/invalid-login-credentials':
          case 'auth/invalid-credential':
            errorMessage = 'Невалиден email или лозинка.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Премногу обиди. Обидете се подоцна.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Грешка во мрежата.';
            break;
        }
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      if (!auth) return;
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
      await AsyncStorage.removeItem(KEEP_LOGGED_IN_KEY);
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
    updateLastActivity,
    checkSessionExpiry
  };
};
