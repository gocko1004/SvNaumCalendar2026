import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import {
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BadgeContext } from '../navigation/AppNavigator';
import { COLORS } from '../constants/theme';
import {
    NotificationRecord,
    getUserVisibleNotifications,
    setLastSeenTimestamp,
    hideNotification,
    NOTIFICATION_CATEGORY_ICONS
} from '../services/NotificationHistoryService';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { mk } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type UserNotificationHistoryScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'UserNotificationHistory'>;
};

// Get friendly date label
const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Денес';
    if (isYesterday(date)) return 'Вчера';
    return format(date, 'dd MMMM', { locale: mk });
};

// Get category info
const getCategoryInfo = (category: string): { label: string; color: string; gradient: [string, string] } => {
    switch (category) {
        case 'URGENT':
            return { label: 'Итно', color: '#DC2626', gradient: ['#DC2626', '#B91C1C'] };
        case 'EVENT':
            return { label: 'Настан', color: '#7C3AED', gradient: ['#7C3AED', '#6D28D9'] };
        case 'REMINDER':
            return { label: 'Потсетник', color: '#2563EB', gradient: ['#2563EB', '#1D4ED8'] };
        case 'AUTOMATED':
            return { label: 'Автоматски', color: '#059669', gradient: ['#059669', '#047857'] };
        default:
            return { label: 'Информација', color: COLORS.PRIMARY, gradient: [COLORS.PRIMARY, '#A52A2A'] };
    }
};

export const UserNotificationHistoryScreen: React.FC<UserNotificationHistoryScreenProps> = ({ navigation }) => {
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { refreshBadge } = useContext(BadgeContext);

    useEffect(() => {
        loadData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const markAsSeen = async () => {
                await setLastSeenTimestamp();
                refreshBadge();
            };
            markAsSeen();
        }, [refreshBadge])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const historyData = await getUserVisibleNotifications();
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

    const handleNotificationPress = (notification: NotificationRecord) => {
        if (notification.data?.news) {
            navigation.navigate('NewsDetail', {
                news: notification.data.news,
            });
        } else {
            navigation.navigate('NotificationDetail', {
                title: notification.title,
                body: notification.fullBody || notification.body,
                receivedAt: notification.sentAt.toISOString(),
                data: notification.data,
            });
        }
    };

    const handleDeleteNotification = (notification: NotificationRecord) => {
        Alert.alert(
            'Избриши известување',
            'Дали сте сигурни дека сакате да го избришете ова известување?',
            [
                { text: 'Откажи', style: 'cancel' },
                {
                    text: 'Избриши',
                    style: 'destructive',
                    onPress: async () => {
                        if (notification.id) {
                            await hideNotification(notification.id);
                            // Remove from local state
                            setNotifications(prev => prev.filter(n => n.id !== notification.id));
                        }
                    }
                }
            ]
        );
    };

    const renderNotificationCard = (notification: NotificationRecord, index: number) => {
        const categoryIcon = NOTIFICATION_CATEGORY_ICONS[notification.category];
        const categoryInfo = getCategoryInfo(notification.category);
        const isNews = notification.title.startsWith('Нова објава:');

        return (
            <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.85}
                style={styles.cardWrapper}
            >
                <View style={styles.notificationCard}>
                    <View style={styles.cardContent}>
                        {/* Top row: Icon, Category badge, Time */}
                        <View style={styles.topRow}>
                            <LinearGradient
                                colors={categoryInfo.gradient}
                                style={styles.iconCircle}
                            >
                                <MaterialCommunityIcons
                                    name={isNews ? 'newspaper-variant' : categoryIcon as any}
                                    size={20}
                                    color="#fff"
                                />
                            </LinearGradient>

                            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '15' }]}>
                                <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                                    {isNews ? 'Новост' : categoryInfo.label}
                                </Text>
                            </View>

                            <View style={styles.timeContainer}>
                                <Text style={styles.timeText}>
                                    {getDateLabel(notification.sentAt)}
                                </Text>
                                <Text style={styles.timeTextSmall}>
                                    {format(notification.sentAt, 'HH:mm', { locale: mk })}
                                </Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {notification.title.replace('Нова објава: ', '')}
                        </Text>

                        {/* Body preview */}
                        <Text style={styles.cardBody} numberOfLines={2}>
                            {notification.body}
                        </Text>

                        {/* Bottom row: Relative time + Actions */}
                        <View style={styles.bottomRow}>
                            <View style={styles.relativeTimeContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
                                <Text style={styles.relativeTime}>
                                    {formatDistanceToNow(notification.sentAt, { addSuffix: true, locale: mk })}
                                </Text>
                            </View>

                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNotification(notification);
                                    }}
                                    style={styles.deleteButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#999" />
                                </TouchableOpacity>

                                <View style={styles.readMoreContainer}>
                                    <Text style={styles.readMoreText}>Прочитај</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.PRIMARY} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.PRIMARY, '#A52A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerIconContainer}>
                    <View style={styles.headerIconOuter}>
                        <View style={styles.headerIconInner}>
                            <MaterialCommunityIcons name="bell-ring" size={32} color={COLORS.PRIMARY} />
                        </View>
                    </View>
                </View>

                <Text style={styles.headerTitle}>Известувања</Text>
                <Text style={styles.headerSubtitle}>
                    {notifications.length > 0
                        ? `${notifications.length} известувања во последните 30 дена`
                        : 'Нема нови известувања'
                    }
                </Text>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text style={styles.loadingText}>Се вчитува...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.PRIMARY}
                            colors={[COLORS.PRIMARY]}
                        />
                    }
                >
                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['rgba(131, 27, 38, 0.1)', 'rgba(131, 27, 38, 0.05)']}
                                    style={styles.emptyIconBackground}
                                >
                                    <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={COLORS.PRIMARY} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.emptyTitle}>Нема известувања</Text>
                            <Text style={styles.emptySubtitle}>
                                Кога ќе испратиме известување, ќе се појави тука. Повлечи надолу за освежување.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {notifications.map((notification, index) =>
                                renderNotificationCard(notification, index)
                            )}

                            {/* Footer */}
                            <View style={styles.footer}>
                                <MaterialCommunityIcons name="information-outline" size={16} color="#999" />
                                <Text style={styles.footerText}>
                                    Известувањата се чуваат 30 дена
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F3',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    headerIconContainer: {
        marginBottom: 12,
    },
    headerIconOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIconInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#888',
    },
    cardWrapper: {
        marginBottom: 14,
    },
    notificationCard: {
        backgroundColor: '#FFFDF8',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 0.5,
        borderColor: '#D4AF37',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeContainer: {
        marginLeft: 'auto',
        alignItems: 'flex-end',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    timeTextSmall: {
        fontSize: 11,
        color: '#999',
        marginTop: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 6,
        lineHeight: 23,
    },
    cardBody: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 14,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    relativeTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    relativeTime: {
        fontSize: 12,
        color: '#999',
        marginLeft: 5,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 6,
        marginRight: 12,
    },
    readMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readMoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.PRIMARY,
        marginRight: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyIconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 6,
    },
});

export default UserNotificationHistoryScreen;
