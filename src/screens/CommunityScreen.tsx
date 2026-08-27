import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Surface, Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';
import {
  ContactMessageType,
  CONTACT_TYPE_LABELS,
  sendContactMessage,
  sendMembershipApplication,
} from '../services/CommunityService';

type ActiveForm = 'none' | 'contact' | 'membership';

const CONTACT_TYPES: ContactMessageType[] = ['QUESTION', 'REMARK', 'COMPLAINT', 'PRAISE'];

export const CommunityScreen = () => {
  const [activeForm, setActiveForm] = useState<ActiveForm>('none');
  const [sending, setSending] = useState(false);

  // Contact form
  const [messageType, setMessageType] = useState<ContactMessageType>('QUESTION');
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Membership form
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [note, setNote] = useState('');

  const resetForms = () => {
    setMessageType('QUESTION');
    setMessage('');
    setContactName('');
    setContactInfo('');
    setFullName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setFamilyMembers('');
    setNote('');
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Грешка', 'Напишете ја вашата порака');
      return;
    }
    setSending(true);
    try {
      await sendContactMessage({
        type: messageType,
        message,
        name: contactName || undefined,
        contact: contactInfo || undefined,
      });
      Keyboard.dismiss();
      resetForms();
      setActiveForm('none');
      Alert.alert('Испратено', 'Ви благодариме! Вашата порака е примена.');
    } catch (error: any) {
      Alert.alert('Грешка', error?.message || 'Пораката не е испратена. Обидете се повторно.');
    } finally {
      setSending(false);
    }
  };

  const handleSendApplication = async () => {
    if (!fullName.trim()) {
      Alert.alert('Грешка', 'Внесете име и презиме');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      Alert.alert('Грешка', 'Внесете телефон или email за да можеме да ве контактираме');
      return;
    }
    setSending(true);
    try {
      await sendMembershipApplication({
        fullName,
        address,
        phone,
        email,
        familyMembers: familyMembers || undefined,
        note: note || undefined,
      });
      Keyboard.dismiss();
      resetForms();
      setActiveForm('none');
      Alert.alert(
        'Испратено',
        'Ви благодариме за пријавата! Ќе ве контактираме наскоро.'
      );
    } catch (error: any) {
      Alert.alert('Грешка', error?.message || 'Пријавата не е испратена. Обидете се повторно.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.header}>
            <MaterialCommunityIcons name="account-group" size={40} color={COLORS.PRIMARY} />
            <Text style={styles.title}>Црковна Општина</Text>
            <Text style={styles.subtitle}>
              Пишете ни или зачленете се во црковната општина
            </Text>
          </View>

          {/* Entry cards */}
          {activeForm === 'none' && (
            <>
              <TouchableOpacity onPress={() => setActiveForm('contact')} activeOpacity={0.85}>
                <Surface style={styles.entryCard}>
                  <View style={styles.entryIcon}>
                    <MaterialCommunityIcons name="email-outline" size={26} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.entryText}>
                    <Text style={styles.entryTitle}>Пишете ни</Text>
                    <Text style={styles.entrySubtitle}>
                      Прашање, забелешка, поплака или пофалба до црковната општина
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                </Surface>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveForm('membership')} activeOpacity={0.85}>
                <Surface style={styles.entryCard}>
                  <View style={styles.entryIcon}>
                    <MaterialCommunityIcons name="account-plus-outline" size={26} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.entryText}>
                    <Text style={styles.entryTitle}>Зачленување</Text>
                    <Text style={styles.entrySubtitle}>
                      Пријавете се за членство во црковната општина
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                </Surface>
              </TouchableOpacity>
            </>
          )}

          {/* Contact form */}
          {activeForm === 'contact' && (
            <Surface style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Пишете ни</Text>
                <TouchableOpacity onPress={() => { setActiveForm('none'); Keyboard.dismiss(); }}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.typeRow}>
                {CONTACT_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setMessageType(type)}
                    style={[
                      styles.typeChip,
                      messageType === type && styles.typeChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        messageType === type && styles.typeChipTextSelected,
                      ]}
                    >
                      {CONTACT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                label="Вашата порака *"
                value={message}
                onChangeText={setMessage}
                mode="outlined"
                multiline
                numberOfLines={5}
                maxLength={3000}
                style={styles.input}
              />
              <TextInput
                label="Име (по избор)"
                value={contactName}
                onChangeText={setContactName}
                mode="outlined"
                maxLength={120}
                style={styles.input}
              />
              <TextInput
                label="Телефон или email (по избор)"
                value={contactInfo}
                onChangeText={setContactInfo}
                mode="outlined"
                maxLength={160}
                autoCapitalize="none"
                style={styles.input}
              />
              <Text style={styles.privacyNote}>
                Пораката ја гледа само црковната администрација. Поплаките може да се испратат анонимно.
              </Text>
              <Button
                mode="contained"
                onPress={handleSendMessage}
                loading={sending}
                disabled={sending}
                buttonColor={COLORS.PRIMARY}
                style={styles.sendButton}
              >
                Испрати
              </Button>
            </Surface>
          )}

          {/* Membership form */}
          {activeForm === 'membership' && (
            <Surface style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Зачленување</Text>
                <TouchableOpacity onPress={() => { setActiveForm('none'); Keyboard.dismiss(); }}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                label="Име и презиме *"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                maxLength={160}
                style={styles.input}
              />
              <TextInput
                label="Адреса"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                maxLength={300}
                style={styles.input}
              />
              <TextInput
                label="Телефон"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                maxLength={40}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                maxLength={160}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Членови на семејство (по избор)"
                value={familyMembers}
                onChangeText={setFamilyMembers}
                mode="outlined"
                multiline
                numberOfLines={2}
                maxLength={1000}
                style={styles.input}
              />
              <TextInput
                label="Белешка (по избор)"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                multiline
                numberOfLines={2}
                maxLength={2000}
                style={styles.input}
              />
              <Text style={styles.privacyNote}>
                Податоците ги гледа само црковната администрација и служат исклучиво за контакт околу членството.
              </Text>
              <Button
                mode="contained"
                onPress={handleSendApplication}
                loading={sending}
                disabled={sending}
                buttonColor={COLORS.PRIMARY}
                style={styles.sendButton}
              >
                Испрати пријава
              </Button>
            </Surface>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3E8',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8a7a6a',
    textAlign: 'center',
    marginTop: 4,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFDF8',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    padding: 16,
    marginBottom: 12,
  },
  entryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  entrySubtitle: {
    fontSize: 12.5,
    color: '#8a7a6a',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  typeChipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  typeChipTextSelected: {
    color: '#fff',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    lineHeight: 17,
  },
  sendButton: {
    borderRadius: 8,
  },
});

export default CommunityScreen;
