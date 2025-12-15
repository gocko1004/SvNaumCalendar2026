import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Keyboard,
  Linking,
} from 'react-native';
import {
  Title,
  Card,
  Button,
  Text,
  TextInput,
  IconButton,
  Switch,
  Divider,
  Checkbox,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ParkingLocation,
  ParkingRule,
  ParkingSettings,
  getAllParkingLocations,
  addParkingLocation,
  updateParkingLocation,
  deleteParkingLocation,
  getAllParkingRules,
  addParkingRule,
  updateParkingRule,
  deleteParkingRule,
  getParkingSettings,
  updateParkingSettings,
  sendParkingNotification,
} from '../../services/ParkingService';

type ManageParkingScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'ManageParking'>;
};

export const ManageParkingScreen: React.FC<ManageParkingScreenProps> = ({ navigation }) => {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [rules, setRules] = useState<ParkingRule[]>([]);
  const [settings, setSettings] = useState<ParkingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Modal states
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ParkingLocation | null>(null);
  const [editingRule, setEditingRule] = useState<ParkingRule | null>(null);

  // Form states for location
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCapacity, setLocCapacity] = useState('');
  const [locNote, setLocNote] = useState('');
  const [locMapsUrl, setLocMapsUrl] = useState('');

  // Form states for rule
  const [ruleText, setRuleText] = useState('');

  // Form states for notification
  const [notifTitle, setNotifTitle] = useState('Паркинг Информации');
  const [notifMessage, setNotifMessage] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [includeRules, setIncludeRules] = useState(true);
  const [includeMapsLinks, setIncludeMapsLinks] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locs, rls, sets] = await Promise.all([
        getAllParkingLocations(),
        getAllParkingRules(),
        getParkingSettings(),
      ]);
      setLocations(locs);
      setRules(rls);
      setSettings(sets);
      setNotifMessage(sets.defaultMessage);
    } catch (error) {
      console.error('Error loading parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ LOCATION HANDLERS ============

  const openAddLocation = () => {
    setEditingLocation(null);
    setLocName('');
    setLocAddress('');
    setLocCapacity('');
    setLocNote('');
    setLocMapsUrl('');
    setLocationModalVisible(true);
  };

  const openEditLocation = (location: ParkingLocation) => {
    setEditingLocation(location);
    setLocName(location.name);
    setLocAddress(location.address);
    setLocCapacity(location.capacity?.toString() || '');
    setLocNote(location.note || '');
    setLocMapsUrl(location.googleMapsUrl || '');
    setLocationModalVisible(true);
  };

  const saveLocation = async () => {
    if (!locName.trim() || !locAddress.trim()) {
      Alert.alert('Грешка', 'Име и адреса се задолжителни');
      return;
    }

    const locationData = {
      name: locName.trim(),
      address: locAddress.trim(),
      capacity: locCapacity ? parseInt(locCapacity) : undefined,
      note: locNote.trim() || undefined,
      googleMapsUrl: locMapsUrl.trim() || undefined,
      isActive: true,
      order: editingLocation?.order ?? locations.length,
    };

    try {
      if (editingLocation) {
        await updateParkingLocation(editingLocation.id, locationData);
      } else {
        await addParkingLocation(locationData);
      }
      setLocationModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно зачувување');
    }
  };

  const handleDeleteLocation = (location: ParkingLocation) => {
    Alert.alert(
      'Избриши локација',
      `Дали сте сигурни дека сакате да ја избришете "${location.name}"?`,
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            await deleteParkingLocation(location.id);
            await loadData();
          },
        },
      ]
    );
  };

  const toggleLocationActive = async (location: ParkingLocation) => {
    await updateParkingLocation(location.id, { isActive: !location.isActive });
    await loadData();
  };

  // ============ RULE HANDLERS ============

  const openAddRule = () => {
    setEditingRule(null);
    setRuleText('');
    setRuleModalVisible(true);
  };

  const openEditRule = (rule: ParkingRule) => {
    setEditingRule(rule);
    setRuleText(rule.text);
    setRuleModalVisible(true);
  };

  const saveRule = async () => {
    if (!ruleText.trim()) {
      Alert.alert('Грешка', 'Внесете текст за правилото');
      return;
    }

    try {
      if (editingRule) {
        await updateParkingRule(editingRule.id, { text: ruleText.trim() });
      } else {
        await addParkingRule({ text: ruleText.trim(), order: rules.length });
      }
      setRuleModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно зачувување');
    }
  };

  const handleDeleteRule = (rule: ParkingRule) => {
    Alert.alert(
      'Избриши правило',
      'Дали сте сигурни?',
      [
        { text: 'Откажи', style: 'cancel' },
        {
          text: 'Избриши',
          style: 'destructive',
          onPress: async () => {
            await deleteParkingRule(rule.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ============ SETTINGS HANDLERS ============

  const updateAutoNotify = async (value: boolean) => {
    if (settings) {
      await updateParkingSettings({ autoNotifyBeforePicnic: value });
      setSettings({ ...settings, autoNotifyBeforePicnic: value });
    }
  };

  // ============ NOTIFICATION HANDLERS ============

  const openNotificationModal = () => {
    setNotifTitle('Паркинг Информации');
    setNotifMessage(settings?.defaultMessage || '');
    setSelectedLocations(locations.filter(l => l.isActive).map(l => l.id));
    setIncludeRules(true);
    setIncludeMapsLinks(true);
    setNotificationModalVisible(true);
  };

  const toggleLocationSelection = (id: string) => {
    if (selectedLocations.includes(id)) {
      setSelectedLocations(selectedLocations.filter(l => l !== id));
    } else {
      setSelectedLocations([...selectedLocations, id]);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert('Грешка', 'Наслов и порака се задолжителни');
      return;
    }

    if (selectedLocations.length === 0) {
      Alert.alert('Грешка', 'Изберете барем една локација');
      return;
    }

    setSending(true);
    try {
      const result = await sendParkingNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        includeLocations: selectedLocations,
        includeRules,
        includeMapsLinks,
      });

      if (result.success) {
        Alert.alert('Успех', `Нотификацијата е испратена до ${result.sentCount} корисник(и)`);
        setNotificationModalVisible(false);
      } else {
        Alert.alert('Грешка', result.error || 'Неуспешно испраќање');
      }
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно испраќање');
    } finally {
      setSending(false);
    }
  };

  // ============ RENDER ============

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="parking" size={28} color={COLORS.PRIMARY} />
          <Title style={styles.title}>Паркинг</Title>
        </View>

        {/* Send Notification Button */}
        <Button
          mode="contained"
          icon="send"
          onPress={openNotificationModal}
          style={styles.sendButton}
          buttonColor={COLORS.PRIMARY}
        >
          Испрати Паркинг Нотификација
        </Button>

        {/* Locations Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Паркинг Локации</Text>
              <IconButton icon="plus" onPress={openAddLocation} iconColor={COLORS.PRIMARY} />
            </View>

            {locations.length === 0 ? (
              <Text style={styles.emptyText}>Нема додадени локации</Text>
            ) : (
              locations.map((location) => (
                <Surface key={location.id} style={[styles.itemCard, !location.isActive && styles.inactiveItem]}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{location.name}</Text>
                      <Text style={styles.itemAddress}>{location.address}</Text>
                      {location.capacity && (
                        <Text style={styles.itemMeta}>{location.capacity} места</Text>
                      )}
                      {location.note && (
                        <Text style={styles.itemNote}>{location.note}</Text>
                      )}
                      {location.googleMapsUrl && (
                        <TouchableOpacity
                          style={styles.mapsButton}
                          onPress={() => Linking.openURL(location.googleMapsUrl!)}
                        >
                          <MaterialCommunityIcons name="google-maps" size={16} color="#4285F4" />
                          <Text style={styles.mapsButtonText}>Отвори во Maps</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.itemActions}>
                      <Switch
                        value={location.isActive}
                        onValueChange={() => toggleLocationActive(location)}
                        color={COLORS.PRIMARY}
                      />
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditLocation(location)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#F44336"
                        onPress={() => handleDeleteLocation(location)}
                      />
                    </View>
                  </View>
                </Surface>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Rules Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Правила за паркирање</Text>
              <IconButton icon="plus" onPress={openAddRule} iconColor={COLORS.PRIMARY} />
            </View>

            {rules.length === 0 ? (
              <Text style={styles.emptyText}>Нема додадени правила</Text>
            ) : (
              rules.map((rule) => (
                <Surface key={rule.id} style={styles.ruleCard}>
                  <Text style={styles.ruleText}>• {rule.text}</Text>
                  <View style={styles.ruleActions}>
                    <IconButton
                      icon="pencil"
                      size={18}
                      onPress={() => openEditRule(rule)}
                    />
                    <IconButton
                      icon="delete"
                      size={18}
                      iconColor="#F44336"
                      onPress={() => handleDeleteRule(rule)}
                    />
                  </View>
                </Surface>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Settings Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>⚙️ Поставки</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Автоматски пред пикници</Text>
                <Text style={styles.settingDesc}>Испрати паркинг нотификација 1 ден пред пикник</Text>
              </View>
              <Switch
                value={settings?.autoNotifyBeforePicnic || false}
                onValueChange={updateAutoNotify}
                color={COLORS.PRIMARY}
              />
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>
              {editingLocation ? 'Уреди Локација' : 'Нова Локација'}
            </Title>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setLocationModalVisible(false); }}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              label="Име на локација *"
              value={locName}
              onChangeText={setLocName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Адреса *"
              value={locAddress}
              onChangeText={setLocAddress}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Капацитет (број на места)"
              value={locCapacity}
              onChangeText={setLocCapacity}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              label="Напомена (пр. бесплатен, ограничено време)"
              value={locNote}
              onChangeText={setLocNote}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Google Maps URL"
              value={locMapsUrl}
              onChangeText={setLocMapsUrl}
              mode="outlined"
              keyboardType="url"
              autoCapitalize="none"
              style={styles.input}
            />

            <Button mode="contained" onPress={saveLocation} style={styles.saveButton}>
              Зачувај
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Rule Modal */}
      <Modal
        visible={ruleModalVisible}
        animationType="slide"
        onRequestClose={() => setRuleModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>
              {editingRule ? 'Уреди Правило' : 'Ново Правило'}
            </Title>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setRuleModalVisible(false); }}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              label="Текст на правилото"
              value={ruleText}
              onChangeText={setRuleText}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Button mode="contained" onPress={saveRule} style={styles.saveButton}>
              Зачувај
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Испрати Паркинг Нотификација</Title>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setNotificationModalVisible(false); }}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              label="Наслов *"
              value={notifTitle}
              onChangeText={setNotifTitle}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Порака *"
              value={notifMessage}
              onChangeText={setNotifMessage}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <Text style={styles.selectLabel}>Вклучи локации:</Text>
            {locations.filter(l => l.isActive).map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.checkboxRow}
                onPress={() => toggleLocationSelection(location.id)}
              >
                <Checkbox
                  status={selectedLocations.includes(location.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleLocationSelection(location.id)}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.checkboxLabel}>{location.name}</Text>
              </TouchableOpacity>
            ))}

            <Divider style={styles.divider} />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIncludeRules(!includeRules)}
            >
              <Checkbox
                status={includeRules ? 'checked' : 'unchecked'}
                onPress={() => setIncludeRules(!includeRules)}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.checkboxLabel}>Вклучи правила за паркирање</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIncludeMapsLinks(!includeMapsLinks)}
            >
              <Checkbox
                status={includeMapsLinks ? 'checked' : 'unchecked'}
                onPress={() => setIncludeMapsLinks(!includeMapsLinks)}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.checkboxLabel}>Вклучи Google Maps линкови</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleSendNotification}
              loading={sending}
              disabled={sending}
              icon="send"
              style={styles.sendNotifButton}
            >
              {sending ? 'Се испраќа...' : 'Испрати Нотификација'}
            </Button>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginLeft: 10,
  },
  sendButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  itemCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  inactiveItem: {
    opacity: 0.5,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  itemAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemNote: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginTop: 2,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  mapsButtonText: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '600',
    marginLeft: 6,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  ruleActions: {
    flexDirection: 'row',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  modalContent: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sendNotifButton: {
    marginTop: 16,
    backgroundColor: COLORS.PRIMARY,
  },
});

export default ManageParkingScreen;
