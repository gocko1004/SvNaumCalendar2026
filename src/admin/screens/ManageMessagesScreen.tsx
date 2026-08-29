import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { mk } from 'date-fns/locale';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { CONTACT_TYPE_LABELS, ContactMessageType } from '../../services/CommunityService';
import { COLORS } from '../../constants/theme';

interface ContactMessage {
  id: string;
  type: ContactMessageType;
  message: string;
  name?: string;
  contact?: string;
  status: 'NEW' | 'PROCESSED';
  createdAt: Date;
}

interface MembershipApplication {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  email: string;
  familyMembers?: string;
  note?: string;
  status: 'NEW' | 'APPROVED' | 'CONTACTED';
  createdAt: Date;
}

type Tab = 'messages' | 'applications';

const TYPE_COLORS: Record<ContactMessageType, string> = {
  QUESTION: '#1B3661',
  REMARK: '#7B8A3E',
  COMPLAINT: '#8B0000',
  PRAISE: '#2E7D32',
};

export const ManageMessagesScreen = () => {
  const [tab, setTab] = useState<Tab>('messages');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [msgSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'membershipApplications'), orderBy('createdAt', 'desc'))),
      ]);
      setMessages(
        msgSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            type: (data.type || 'QUESTION') as ContactMessageType,
            message: data.message || '',
            name: data.name || undefined,
            contact: data.contact || undefined,
            status: data.status === 'PROCESSED' ? 'PROCESSED' : 'NEW',
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
      );
      setApplications(
        appSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            fullName: data.fullName || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            familyMembers: data.familyMembers || undefined,
            note: data.note || undefined,
            status: data.status || 'NEW',
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
      );
    } catch (error) {
      console.error('Error loading community messages:', error);
      Alert.alert('Грешка', 'Неуспешно вчитување на пораките');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (col: string, id: string, status: string) => {
    try {
      await updateDoc(doc(db, col, id), { status });
      await load();
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешна промена на статус');
    }
  };

  const removeDoc = (col: string, id: string, label: string) => {
    Alert.alert('Избриши', `Дали сте сигурни дека сакате да ја избришете ${label}?`, [
      { text: 'Откажи', style: 'cancel' },
      {
        text: 'Избриши',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, col, id));
            await load();
          } catch (error) {
            Alert.alert('Грешка', 'Неуспешно бришење');
          }
        },
      },
    ]);
  };

  const newMessages = messages.filter(m => m.status === 'NEW').length;
  const newApplications = applications.filter(a => a.status === 'NEW').length;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'messages' && styles.tabButtonActive]}
          onPress={() => setTab('messages')}
        >
          <Text style={[styles.tabText, tab === 'messages' && styles.tabTextActive]}>
            Пораки{newMessages > 0 ? ` (${newMessages})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'applications' && styles.tabButtonActive]}
          onPress={() => setTab('applications')}
        >
          <Text style={[styles.tabText, tab === 'applications' && styles.tabTextActive]}>
            Зачленувања{newApplications > 0 ? ` (${newApplications})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.PRIMARY} />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {!loading && tab === 'messages' && messages.length === 0 && (
          <Text style={styles.empty}>Нема пораки</Text>
        )}
        {!loading && tab === 'applications' && applications.length === 0 && (
          <Text style={styles.empty}>Нема пријави за зачленување</Text>
        )}

        {tab === 'messages' &&
          messages.map(msg => (
            <Card key={msg.id} style={[styles.card, msg.status === 'NEW' && styles.cardNew]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={[styles.typeTag, { backgroundColor: TYPE_COLORS[msg.type] }]}>
                    <Text style={styles.typeTagText}>{CONTACT_TYPE_LABELS[msg.type]}</Text>
                  </View>
                  {msg.status === 'NEW' && (
                    <View style={styles.newDot}>
                      <Text style={styles.newDotText}>НОВО</Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>
                    {format(msg.createdAt, 'd MMM yyyy, HH:mm', { locale: mk })}
                  </Text>
                </View>
                {/* Plain text only - never render sender content as links */}
                <Text style={styles.messageText} selectable>
                  {msg.message}
                </Text>
                {(msg.name || msg.contact) && (
                  <Text style={styles.senderText} selectable>
                    {[msg.name, msg.contact].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <View style={styles.actions}>
                  {msg.status === 'NEW' ? (
                    <Button
                      mode="outlined"
                      compact
                      textColor={COLORS.SUCCESS}
                      onPress={() => setStatus('contactMessages', msg.id, 'PROCESSED')}
                    >
                      Обработено
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      compact
                      textColor="#999"
                      onPress={() => setStatus('contactMessages', msg.id, 'NEW')}
                    >
                      Врати во ново
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    compact
                    textColor="#B3261E"
                    onPress={() => removeDoc('contactMessages', msg.id, 'пораката')}
                  >
                    Избриши
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}

        {tab === 'applications' &&
          applications.map(app => (
            <Card key={app.id} style={[styles.card, app.status === 'NEW' && styles.cardNew]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account-plus" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.applicantName} selectable>
                    {app.fullName}
                  </Text>
                  {app.status === 'NEW' && (
                    <View style={styles.newDot}>
                      <Text style={styles.newDotText}>НОВО</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dateText}>
                  {format(app.createdAt, 'd MMM yyyy, HH:mm', { locale: mk })}
                </Text>
                {app.address ? (
                  <Text style={styles.detailText} selectable>📍 {app.address}</Text>
                ) : null}
                {app.phone ? (
                  <Text style={styles.detailText} selectable>📞 {app.phone}</Text>
                ) : null}
                {app.email ? (
                  <Text style={styles.detailText} selectable>✉️ {app.email}</Text>
                ) : null}
                {app.familyMembers ? (
                  <Text style={styles.detailText} selectable>👪 {app.familyMembers}</Text>
                ) : null}
                {app.note ? (
                  <Text style={styles.detailText} selectable>📝 {app.note}</Text>
                ) : null}
                <View style={styles.actions}>
                  {app.status !== 'CONTACTED' && (
                    <Button
                      mode="outlined"
                      compact
                      textColor={COLORS.SUCCESS}
                      onPress={() => setStatus('membershipApplications', app.id, 'CONTACTED')}
                    >
                      Контактирано
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    compact
                    textColor="#B3261E"
                    onPress={() => removeDoc('membershipApplications', app.id, 'пријавата')}
                  >
                    Избриши
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#EFE9DA',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 15,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFDF8',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4D9C2',
  },
  cardNew: {
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeTag: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  typeTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  newDot: {
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  newDotText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 21,
    marginTop: 4,
  },
  senderText: {
    fontSize: 12.5,
    color: '#8a7a6a',
    marginTop: 6,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});

export default ManageMessagesScreen;
