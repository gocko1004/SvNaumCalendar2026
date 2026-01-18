import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Dimensions, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

// Screens
import { CalendarScreen } from '../screens/CalendarScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { NotificationDetailScreen } from '../screens/NotificationDetailScreen';
import { NewsDetailScreen } from '../screens/NewsDetailScreen';
import { UserNotificationHistoryScreen } from '../screens/UserNotificationHistoryScreen';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../constants/theme';
import { NewsItem } from '../services/NewsService';
import { getUnseenNotificationCount } from '../services/NotificationHistoryService';

// Context for badge refresh
type BadgeContextType = {
  refreshBadge: () => void;
};
export const BadgeContext = createContext<BadgeContextType>({ refreshBadge: () => {} });

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  AdminPanel: undefined;
  NotificationDetail: {
    title: string;
    body: string;
    data?: any;
    receivedAt?: string;
  };
  NewsDetail: {
    news: NewsItem;
  };
  UserNotificationHistory: undefined;
};

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Export navigation ref for use outside of React components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

const MainTabs = () => {
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 380;
  const isVerySmallScreen = screenWidth < 340;
  const [badgeCount, setBadgeCount] = useState<number | undefined>(undefined);

  // Load badge count
  const loadBadgeCount = useCallback(async () => {
    try {
      const count = await getUnseenNotificationCount();
      setBadgeCount(count > 0 ? count : undefined);
    } catch (error) {
      console.error('Error loading badge count:', error);
    }
  }, []);

  // Refresh badge (called from UserNotificationHistoryScreen)
  const refreshBadge = useCallback(() => {
    loadBadgeCount();
  }, [loadBadgeCount]);

  // Load badge on mount and when app comes to foreground
  useEffect(() => {
    loadBadgeCount();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadBadgeCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadBadgeCount]);

  // Responsive font size for tab labels
  const tabLabelFontSize = isVerySmallScreen ? 9 : isSmallScreen ? 10 : 11;

  return (
    <BadgeContext.Provider value={{ refreshBadge }}>
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: tabLabelFontSize,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFDF8',
          borderTopWidth: 1,
          borderTopColor: '#D4AF37',
          paddingTop: 8,
          paddingBottom: 20,
          height: isVerySmallScreen ? 70 : 80,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 10,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: false,
          title: 'Календар',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          headerShown: false,
          title: 'Новости',
          tabBarIcon: ({ color, size }) => (
            <Icon name="newspaper-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={UserNotificationHistoryScreen}
        options={{
          headerShown: false,
          title: 'Известувања',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
          tabBarBadge: badgeCount,
          tabBarBadgeStyle: {
            backgroundColor: '#F44336',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Поставки',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    </BadgeContext.Provider>
  );
};

export const AppNavigator = () => {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification received in foreground - handled by notification handler
    });

    // Handle notification tap (when user taps on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { title, body, data } = response.notification.request.content;
      const notificationData = data as any;

      // Use fullBody from data if available (in case body was truncated)
      const fullBody = notificationData?.fullBody || body || '';

      // Check if this is a news notification with news data
      if (notificationData?.news && navigationRef.current?.isReady()) {
        // Navigate directly to NewsDetail
        navigationRef.current.navigate('NewsDetail', {
          news: notificationData.news,
        });
        return;
      }

      // For other notifications, navigate to NotificationDetail screen
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate('NotificationDetail', {
          title: title || 'Известување',
          body: fullBody,
          data: data || {},
          receivedAt: new Date().toISOString(),
        });
      }
    });

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const { title, body, data } = response.notification.request.content;
        const notificationData = data as any;
        // Use fullBody from data if available (in case body was truncated)
        const fullBody = notificationData?.fullBody || body || '';
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          if (navigationRef.current?.isReady()) {
            // Check if this is a news notification with news data
            if (notificationData?.news) {
              navigationRef.current.navigate('NewsDetail', {
                news: notificationData.news,
              });
              return;
            }
            // For other notifications
            navigationRef.current.navigate('NotificationDetail', {
              title: title || 'Известување',
              body: fullBody,
              data: data || {},
              receivedAt: new Date().toISOString(),
            });
          }
        }, 500);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="AdminPanel"
          component={AdminNavigator}
          options={{
            presentation: 'modal',
          }}
        />
        <RootStack.Screen
          name="NotificationDetail"
          component={NotificationDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen
          name="NewsDetail"
          component={NewsDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen
          name="UserNotificationHistory"
          component={UserNotificationHistoryScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 