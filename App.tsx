import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/constants/theme';
import NotificationService from './src/services/NotificationService';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize notifications when the app starts
    const initializeApp = async () => {
      try {
        // Initialize notification service using static methods
        await NotificationService.configure();
        await NotificationService.scheduleYearEvents();
      } catch (error) {
        console.warn('Error initializing app services:', error);
        // Continue app loading even if services fail
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeApp();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </LanguageProvider>
  );
} 