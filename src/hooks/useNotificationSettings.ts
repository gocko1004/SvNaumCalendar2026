import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

interface NotificationSettings {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    loading: true,
    error: null,
  });

  const toggleNotifications = async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true, error: null }));
      
      if (!settings.enabled) {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        const isEnabled = status === 'granted';
        setSettings(prev => ({ ...prev, enabled: isEnabled, loading: false }));
      } else {
        // You might want to implement logic to disable notifications here
        setSettings(prev => ({ ...prev, enabled: false, loading: false }));
      }
    } catch (error) {
      setSettings(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to update notification settings'
      }));
    }
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setSettings(prev => ({
          ...prev,
          enabled: status === 'granted',
          loading: false
        }));
      } catch (error) {
        setSettings(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to check notification permissions'
        }));
      }
    };

    checkPermissions();
  }, []);

  return {
    ...settings,
    toggleNotifications,
  };
}; 