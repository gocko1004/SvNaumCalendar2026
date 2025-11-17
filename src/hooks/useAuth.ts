import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

      console.log('=== LOGIN ATTEMPT ===');
      console.log('Original username:', username);
      console.log('Trimmed username:', trimmedUsername);
      console.log('Final email:', email);
      console.log('Password length:', trimmedPassword.length);
      console.log('Auth instance:', auth ? 'OK' : 'NULL');
      console.log('Auth app name:', auth?.app?.name);
      console.log('Auth config:', {
        projectId: auth?.app?.options?.projectId,
        authDomain: auth?.app?.options?.authDomain
      });
      console.log('Firebase API Key (first 10 chars):', auth?.app?.options?.apiKey?.substring(0, 10));

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, trimmedPassword);
      
      if (userCredential.user) {
        setIsAuthenticated(true);
        setUser(userCredential.user);
        return { success: true };
      }
      return { success: false, error: 'Невалидно корисничко име или лозинка' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Невалидно корисничко име или лозинка';
      
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
      
      console.error('=== LOGIN ERROR DETAILS ===');
      console.error('Firebase error code:', error.code);
      console.error('Firebase error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error stack:', error.stack);
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
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
  };
}; 