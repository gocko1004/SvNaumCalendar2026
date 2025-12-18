import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text as RNText, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Switch, ActivityIndicator, Snackbar } from 'react-native-paper';
import NotificationService from '../services/NotificationService';
import { COLORS } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const NotificationSettingsScreen = () => {
  const insets = useSafeAreaInsets();
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
      console.error('Error loading settings');
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
      console.error('Error saving settings');
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

  const SettingItem = ({
    icon,
    title,
    description,
    value,
    onValueChange,
    disabled = false,
    iconColor = COLORS.PRIMARY
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <RNText style={[styles.settingTitle, disabled && styles.textDisabled]}>{title}</RNText>
        <RNText style={[styles.settingDescription, disabled && styles.textDisabled]}>{description}</RNText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        color={COLORS.PRIMARY}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, '#A52A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bell-cog" size={32} color={COLORS.PRIMARY} />
          </View>
          <RNText style={styles.headerTitle}>Поставки за Известувања</RNText>
          <RNText style={styles.headerSubtitle}>Прилагодете ги вашите преференци</RNText>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main Toggle Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <MaterialCommunityIcons name="bell-ring" size={24} color={settings.enabled ? '#4CAF50' : '#9E9E9E'} />
            <RNText style={styles.mainCardTitle}>Известувања</RNText>
            <View style={[styles.statusBadge, settings.enabled ? styles.statusActive : styles.statusInactive]}>
              <RNText style={styles.statusText}>{settings.enabled ? 'Вклучено' : 'Исклучено'}</RNText>
            </View>
          </View>
          <RNText style={styles.mainCardDescription}>
            Вклучете за да добивате потсетници за црковни настани
          </RNText>
          <View style={styles.mainToggleContainer}>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
              color={COLORS.PRIMARY}
              style={styles.mainSwitch}
            />
          </View>
        </View>

        {/* Timing Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.PRIMARY} />
            <RNText style={styles.sectionTitle}>Време на известување</RNText>
          </View>
          <RNText style={styles.sectionDescription}>
            Изберете кога да добивате потсетници пред настаните
          </RNText>

          <View style={styles.settingsContainer}>
            <SettingItem
              icon="calendar-week"
              title="1 недела пред"
              description="Известување една недела пред настанот"
              value={settings.weekBefore}
              onValueChange={(value) => handleSettingChange('weekBefore', value)}
              disabled={!settings.enabled}
              iconColor="#9C27B0"
            />

            <View style={styles.settingDivider} />

            <SettingItem
              icon="calendar-today"
              title="1 ден пред"
              description="Известување еден ден пред настанот"
              value={settings.dayBefore}
              onValueChange={(value) => handleSettingChange('dayBefore', value)}
              disabled={!settings.enabled}
              iconColor="#2196F3"
            />

            <View style={styles.settingDivider} />

            <SettingItem
              icon="clock-fast"
              title="1 час пред"
              description="Известување еден час пред настанот"
              value={settings.hourBefore}
              onValueChange={(value) => handleSettingChange('hourBefore', value)}
              disabled={!settings.enabled}
              iconColor="#FF9800"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
          <RNText style={styles.infoText}>
            Известувањата за паркинг и специјални настани се испраќаат директно од црквата и не зависат од овие поставки.
          </RNText>
        </View>

      </ScrollView>

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
    backgroundColor: '#F5F5F0',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#EEEEEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  mainCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  mainToggleContainer: {
    alignItems: 'flex-end',
  },
  mainSwitch: {
    transform: [{ scale: 1.1 }],
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  settingsContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  textDisabled: {
    color: '#999',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
  },
  snackbar: {
    backgroundColor: COLORS.PRIMARY,
  },
}); 