import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/constants/theme';
import NotificationService from './src/services/NotificationService';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize notifications in background - don't block app loading
    const initializeApp = async () => {
      try {
        // Initialize notification service using smart logic (checks if already scheduled)
        await NotificationService.initializeService();
        // await NotificationService.scheduleYearEvents(); // <-- REMOVED: This was causing spam on every launch
      } catch (error) {
        console.warn('Error initializing app services:', error);
      }
    };

    // Run in background without blocking
    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
        </PaperProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
} 