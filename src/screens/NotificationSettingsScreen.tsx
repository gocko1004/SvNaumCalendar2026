import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { List, Switch, Title, ActivityIndicator, Snackbar, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

// Test notification data for simulator testing
const TEST_PARKING_NOTIFICATION = {
  title: 'Паркинг Информации',
  body: `Драги браќа и сестри, ве молиме внимавајте на паркирањето за денешниот настан.

📍 Паркинг локации:
• Во црковен двор - Триенген (53 места) (Ве молиме паркирајте соодветно обележаните линии на паркинг плацот)
• Vo industriska Zina - Et (2 места) (4t)

⚠️ Правила за паркирање:
• Не паркирајте на тревник
• Оставете простор за излез
• Следете ги знаците

🗺️ Google Maps:
Црковен двор: https://maps.google.com/maps?q=47.2,8.1`,
  receivedAt: new Date().toISOString(),
};

export const NotificationSettingsScreen = () => {
  const navigation = useNavigation<any>();
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

      {/* Test button for simulator - remove in production */}
      {__DEV__ && (
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>🧪 Тест (само за развој)</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => navigation.navigate('NotificationDetail', TEST_PARKING_NOTIFICATION)}
          >
            <MaterialCommunityIcons name="bell-ring" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Тестирај известување</Text>
          </TouchableOpacity>
        </View>
      )}

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
  testSection: {
    marginTop: 30,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  testLabel: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 12,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 