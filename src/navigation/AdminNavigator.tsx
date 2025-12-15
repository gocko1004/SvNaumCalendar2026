import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AdminStackParamList } from './types';
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  ManageCalendarScreen,
  ManageLocationsScreen,
  SpecialEventsScreen,
  AutoNotificationSettingsScreen,
  ManageNewsScreen
} from '../admin/screens';
import { ManageAnnouncementsScreen } from '../admin/screens/ManageAnnouncementsScreen';
import { NotificationHistoryScreen } from '../admin/screens/NotificationHistoryScreen';
import { EventFormScreen } from '../screens/EventFormScreen';
import { COLORS, theme } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show login screen if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <PaperProvider theme={theme}>
        <AdminStack.Navigator screenOptions={{ headerShown: false }}>
          <AdminStack.Screen
            name="AdminLogin"
            component={AdminLoginScreen}
            options={{ headerShown: false }}
          />
        </AdminStack.Navigator>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AdminStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
      initialRouteName={isAuthenticated ? "AdminDashboard" : "AdminLogin"}
    >
      <AdminStack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Админ Панел' }}
      />
      <AdminStack.Screen
        name="ManageCalendar"
        component={ManageCalendarScreen}
        options={{ title: 'Годишен Календар 2026' }}
      />
      <AdminStack.Screen
        name="AddEvent"
        component={EventFormScreen}
        options={{ title: 'Додади Настан' }}
      />
      <AdminStack.Screen
        name="ManageLocations"
        component={ManageLocationsScreen}
        options={{ title: 'Локации' }}
      />
      <AdminStack.Screen
        name="SpecialEvents"
        component={SpecialEventsScreen}
        options={{ title: 'Специјални Настани' }}
      />
      <AdminStack.Screen
        name="ManageAnnouncements"
        component={ManageAnnouncementsScreen}
        options={{ title: 'Известувања' }}
      />
      <AdminStack.Screen
        name="ManageNews"
        component={ManageNewsScreen}
        options={{ title: 'Новости' }}
      />
      <AdminStack.Screen
        name="NotificationHistory"
        component={NotificationHistoryScreen}
        options={{ title: 'Историја на нотификации' }}
      />
      <AdminStack.Screen
        name="AutoNotificationSettings"
        component={AutoNotificationSettingsScreen}
        options={{ title: 'Автоматски известувања' }}
      />
    </AdminStack.Navigator>
    </PaperProvider>
  );
}; 