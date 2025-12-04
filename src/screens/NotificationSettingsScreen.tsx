import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Title, ActivityIndicator, Snackbar, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import { COLORS } from '../constants/theme';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    weekBefore: false,
    dayBefore: true,
    hourBefore: true
  });
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await NotificationService.getNotificationSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await NotificationService.updateNotificationSettings(newSettings);
      
      setSnackbarMessage('Поставките се зачувани');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbarMessage('Грешка при зачувување на поставките');
      setSnackbarVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Поставки за Известувања</Title>
      
      <List.Section>
        <List.Item
          title="Известувања"
          description="Вклучи/исклучи сите известувања"
          right={() => (
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
            />
          )}
        />

        <Divider />
        
        <List.Subheader>Време на известување пред настан</List.Subheader>
        
        <List.Item
          title="1 недела пред"
          description="Добивај известување една недела пред настанот"
          right={() => (
            <Switch
              value={settings.weekBefore}
              onValueChange={(value) => handleSettingChange('weekBefore', value)}
              disabled={!settings.enabled}
            />
          )}
        />

        <List.Item
          title="1 ден пред"
          description="Добивај известување еден ден пред настанот"
          right={() => (
            <Switch
              value={settings.dayBefore}
              onValueChange={(value) => handleSettingChange('dayBefore', value)}
              disabled={!settings.enabled}
            />
          )}
        />

        <List.Item
          title="1 час пред"
          description="Добивај известување еден час пред настанот"
          right={() => (
            <Switch
              value={settings.hourBefore}
              onValueChange={(value) => handleSettingChange('hourBefore', value)}
              disabled={!settings.enabled}
            />
          )}
        />
      </List.Section>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginVertical: 16,
    marginHorizontal: 16,
    color: COLORS.PRIMARY,
  },
  snackbar: {
    backgroundColor: COLORS.PRIMARY,
  },
}); 