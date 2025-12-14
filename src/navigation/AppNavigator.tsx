import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Screens
import { CalendarScreen } from '../screens/CalendarScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { AdminNavigator } from './AdminNavigator';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: false,
          title: 'Годишен План 2026 година',
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