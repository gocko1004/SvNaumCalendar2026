import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
    Title,
    Card,
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../constants/theme';
import {
    NotificationRecord,
    getRecentNotificationHistory,
    NOTIFICATION_CATEGORY_COLORS,
    NOTIFICATION_CATEGORY_ICONS
} from '../services/NotificationHistoryService';
import { format, formatDistanceToNow } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type UserNotificationHistoryScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'UserNotificationHistory'>;
};

export const UserNotificationHistoryScreen: React.FC<UserNotificationHistoryScreenProps> = ({ navigation }) => {
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const historyData = await getRecentNotificationHistory();
            // Filter out only SENT or PARTIAL notifications, hide FAILED ones from users
            const visibleNotifications = historyData.filter(n => n.status !== 'FAILED');
            setNotifications(visibleNotifications);
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

    const renderNotificationCard = (notification: NotificationRecord) => {
        const categoryColor = NOTIFICATION_CATEGORY_COLORS[notification.category];
        const categoryIcon = NOTIFICATION_CATEGORY_ICONS[notification.category];

        return (
            <Card key={notification.id} style={[styles.notificationCard, { borderLeftColor: categoryColor }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '15' }]}>
                                <MaterialCommunityIcons name={categoryIcon as any} size={20} color={categoryColor} />
                            </View>
                            <View style={styles.titleContainer}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{notification.title}</Text>
                                <Text style={styles.dateText}>
                                    {formatDistanceToNow(notification.sentAt, { addSuffix: true, locale: mk })}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.cardBody} numberOfLines={3}>{notification.body}</Text>

                    <View style={styles.cardFooter}>
                        <Text style={styles.fullDateText}>
                            {format(notification.sentAt, 'dd MMMM yyyy • HH:mm', { locale: mk })}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.PRIMARY, '#A52A2A']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Title style={styles.headerTitle}>Историја на Известувања</Title>
                    <Text style={styles.headerSubtitle}>Последни 30 дена</Text>
                </View>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />
                    }
                >
                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bell-sleep" size={64} color="#ccc" style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>Нема нови известувања</Text>
                            <Text style={styles.emptySubtext}>
                                Тука ќе ги видите сите известувања што сме ги испратиле во последните 30 дена.
                            </Text>
                        </View>
                    ) : (
                        notifications.map(renderNotificationCard)
                    )}
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCard: {
        marginBottom: 16,
        borderLeftWidth: 4,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeader: {
        marginBottom: 8,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#888',
    },
    cardBody: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    fullDateText: {
        fontSize: 11,
        color: '#aaa',
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default UserNotificationHistoryScreen;
