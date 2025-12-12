import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/constants/theme';
import NotificationService from './src/services/NotificationService';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize notifications in background - don't block app loading
    const initializeApp = async () => {
      try {
        // Initialize notification service using static methods
        await NotificationService.configure();
        await NotificationService.scheduleYearEvents();
      } catch (error) {
        console.warn('Error initializing app services:', error);
      }
    };

    // Run in background without blocking
    initializeApp();
  }, []);

  return (
    <LanguageProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </LanguageProvider>
  );
} 