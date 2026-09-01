import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import * as Notifications from 'expo-notifications';

// Screens
import { CalendarScreen } from '../screens/CalendarScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { NotificationDetailScreen } from '../screens/NotificationDetailScreen';
import { NewsDetailScreen } from '../screens/NewsDetailScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { getNewsById } from '../services/NewsService';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../constants/theme';
import { NewsItem } from '../services/NewsService';

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
  PrivacyPolicy: undefined;
};

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Export navigation ref for use outside of React components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

const MainTabs = () => {
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 380;
  const isVerySmallScreen = screenWidth < 340;

  // Responsive font size for tab labels
  const tabLabelFontSize = isVerySmallScreen ? 9 : isSmallScreen ? 10 : 11;

  return (
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
        name="Community"
        component={CommunityScreen}
        options={{
          headerShown: false,
          title: 'Цр. Општина',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" size={size} color={color} />
          ),
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
  );
};

export const AppNavigator = () => {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification tap (when user taps on notification)
    const openFromNotification = async (
      title: string | null,
      body: string | null,
      data: any
    ) => {
      if (!navigationRef.current?.isReady()) return;

      // News deep link: open the actual news post instead of the generic screen
      if (data?.type === 'news' && data?.newsId) {
        const news = await getNewsById(String(data.newsId));
        if (news) {
          navigationRef.current.navigate('NewsDetail', { news });
          return;
        }
      }

      // Event reminder: open the calendar on that event's card
      if (data?.type === 'event' && data?.eventKey) {
        (navigationRef.current as any).navigate('MainTabs', {
          screen: 'Calendar',
          params: { openEventKey: String(data.eventKey), openEventNonce: Date.now() },
        });
        return;
      }

      const fullBody = data?.fullBody || body || '';
      navigationRef.current.navigate('NotificationDetail', {
        title: title || 'Известување',
        body: fullBody,
        data: data || {},
        receivedAt: new Date().toISOString(),
      });
    };

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { title, body, data } = response.notification.request.content;
      // Clear so this tap is not replayed by getLastNotificationResponseAsync on the next cold start
      Notifications.clearLastNotificationResponse();
      openFromNotification(title, body, data);
    });

    // Check if app was opened from a notification. The OS persists the last tapped
    // notification across launches in standalone builds, so clear it after handling -
    // otherwise every cold start replays the old tap and never lands on the calendar.
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        Notifications.clearLastNotificationResponse();
        const { title, body, data } = response.notification.request.content;
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          openFromNotification(title, body, data);
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
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 