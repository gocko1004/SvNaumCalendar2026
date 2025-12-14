import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

// Screens
import { CalendarScreen } from '../screens/CalendarScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

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
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="AdminPanel"
          component={AdminNavigator}
          options={{
            presentation: 'modal',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 