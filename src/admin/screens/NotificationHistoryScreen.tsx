import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Title,
  Card,
  Button,
  Text,
  ActivityIndicator,
  Chip,
  Divider,
  Surface
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/theme';
import {
  NotificationRecord,
  NotificationCategory,
  getRecentNotificationHistory,
  getNotificationStats,
  cleanupExpiredNotifications,
  deleteNotificationRecord,
  NOTIFICATION_CATEGORY_COLORS,
  NOTIFICATION_CATEGORY_ICONS
} from '../../services/NotificationHistoryService';
import { format, formatDistanceToNow } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type NotificationHistoryScreenProps = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'NotificationHistory'>;
};

interface NotificationStats {
  totalSent: number;
  totalRecipients: number;
  successRate: number;
  byCategory: Record<NotificationCategory, number>;
  last7Days: number;
  last30Days: number;
}

export const NotificationHistoryScreen: React.FC<NotificationHistoryScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Clean up expired notifications first
      await cleanupExpiredNotifications();

      const [historyData, statsData] = await Promise.all([
        getRecentNotificationHistory(),
        getNotificationStats()
      ]);

      setNotifications(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return '#4CAF50';
      case 'FAILED': return '#F44336';
      case 'PARTIAL': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Испратено';
      case 'FAILED': return 'Неуспешно';
      case 'PARTIAL': return 'Делумно';
      default: return status;
    }
  };

  const getCategoryLabel = (category: NotificationCategory) => {
    switch (category) {
      case 'REMINDER': return 'Потсетник';
      case 'URGENT': return 'Итно';
      case 'INFO': return 'Информација';
      case 'EVENT': return 'Настан';
      case 'AUTOMATED': return 'Автоматско';
      default: return category;
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>Статистика (последни 30 дена)</Title>

          <View style={styles.statsGrid}>
            <Surface style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalSent}</Text>
              <Text style={styles.statLabel}>Вкупно испратени</Text>
            </Surface>

            <Surface style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalRecipients}</Text>
              <Text style={styles.statLabel}>Вкупно примачи</Text>
            </Surface>

            <Surface style={styles.statBox}>
              <Text style={[styles.statNumber, { color: stats.successRate >= 90 ? '#4CAF50' : '#FF9800' }]}>
                {stats.successRate}%
              </Text>
              <Text style={styles.statLabel}>Успешност</Text>
            </Surface>

            <Surface style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.last7Days}</Text>
              <Text style={styles.statLabel}>Последни 7 дена</Text>
            </Surface>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.categoryTitle}>По категорија:</Text>
          <View style={styles.categoryRow}>
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <Chip
                key={category}
                style={[styles.categoryChip, { backgroundColor: NOTIFICATION_CATEGORY_COLORS[category as NotificationCategory] + '20' }]}
                textStyle={{ color: NOTIFICATION_CATEGORY_COLORS[category as NotificationCategory], fontSize: 11 }}
              >
                {getCategoryLabel(category as NotificationCategory)}: {count}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderNotificationCard = (notification: NotificationRecord) => {
    const categoryColor = NOTIFICATION_CATEGORY_COLORS[notification.category];
    const categoryIcon = NOTIFICATION_CATEGORY_ICONS[notification.category];
    const statusColor = getStatusColor(notification.status);

    return (
      <Card key={notification.id} style={[styles.notificationCard, { borderLeftColor: categoryColor }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name={categoryIcon as any} size={20} color={categoryColor} />
              <Text style={styles.cardTitle} numberOfLines={1}>{notification.title}</Text>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
              textStyle={{ color: statusColor, fontSize: 10 }}
            >
              {getStatusLabel(notification.status)}
            </Chip>
          </View>

          <Text style={styles.cardBody} numberOfLines={2}>{notification.body}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="account-group" size={14} color="#999" />
              <Text style={styles.metaText}>
                {notification.successCount}/{notification.recipientCount} примачи
              </Text>
            </View>

            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
              <Text style={styles.metaText}>
                {formatDistanceToNow(notification.sentAt, { addSuffix: true, locale: mk })}
              </Text>
            </View>

            {notification.isAutomated && (
              <Chip style={styles.automatedChip} textStyle={{ fontSize: 10 }}>
                <MaterialCommunityIcons name="robot" size={10} /> Автоматско
              </Chip>
            )}
          </View>

          <Text style={styles.dateText}>
            {format(notification.sentAt, 'dd.MM.yyyy HH:mm', { locale: mk })}
          </Text>

          {notification.errors && notification.errors.length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>Грешки:</Text>
              {notification.errors.slice(0, 3).map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
              {notification.errors.length > 3 && (
                <Text style={styles.errorText}>... и уште {notification.errors.length - 3}</Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Историја на известувања</Title>
        <Button
          mode="outlined"
          onPress={onRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        >
          Освежи
        </Button>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderStatsCard()}

          <Text style={styles.sectionTitle}>Последни известувања</Text>

          {notifications.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <MaterialCommunityIcons name="bell-off" size={48} color="#ccc" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Нема испратени известувања</Text>
                <Text style={styles.emptySubtext}>
                  Историјата се чува 30 дена
                </Text>
              </Card.Content>
            </Card>
          ) : (
            notifications.map(renderNotificationCard)
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Известувањата се бришат автоматски по 30 дена
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFDF8',
    borderBottomWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  refreshButton: {
    borderColor: COLORS.PRIMARY,
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.PRIMARY,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryChip: {
    height: 24,
    marginRight: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  notificationCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  statusChip: {
    height: 22,
  },
  cardBody: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  automatedChip: {
    height: 20,
    backgroundColor: '#4CAF5020',
  },
  dateText: {
    fontSize: 11,
    color: '#bbb',
  },
  errorsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#E65100',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default NotificationHistoryScreen;
