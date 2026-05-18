import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from './lib/theme';

// 💎 Premium Lucide Icons
import { LayoutDashboard, Stethoscope, FileText, Pill, User } from 'lucide-react-native';

// Auth
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Core Phase 1
import DashboardScreen from './screens/DashboardScreen';
import SymptomChatScreen from './screens/SymptomChatScreen';
import HealthReportScreen from './screens/HealthReportScreen';
import MedicineReminderScreen from './screens/MedicineReminderScreen';
import ProfileScreen from './screens/ProfileScreen';

// Phase 2
import HealthGoalsScreen from './screens/HealthGoalsScreen';
import MedicalHistoryScreen from './screens/MedicalHistoryScreen';
import LabResultsScreen from './screens/LabResultsScreen';
import RemindersScreen from './screens/RemindersScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import MedInventoryScreen from './screens/MedInventoryScreen';
import InsuranceScreen from './screens/InsuranceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Home stack — dashboard + phase 2 features
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: COLORS.bg }, headerTintColor: COLORS.text, headerTitleStyle: { fontWeight: FONT.bold } }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Goals" component={HealthGoalsScreen} options={{ title: 'Health Goals' }} />
      <HomeStack.Screen name="Medical" component={MedicalHistoryScreen} options={{ title: 'Medical History' }} />
      <HomeStack.Screen name="Labs" component={LabResultsScreen} options={{ title: 'Lab Results' }} />
      <HomeStack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Reminders' }} />
      <HomeStack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Emergency Profile' }} />
      <HomeStack.Screen name="Inventory" component={MedInventoryScreen} options={{ title: 'Med Inventory' }} />
      <HomeStack.Screen name="Insurance" component={InsuranceScreen} options={{ title: 'Insurance & Claims' }} />
    </HomeStack.Navigator>
  );
}

const ICONS = {
  Home: LayoutDashboard,
  Symptoms: Stethoscope,
  Report: FileText,
  Medicines: Pill,
  Profile: User,
};

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, height: 85, paddingBottom: 25, paddingTop: 10, ...SHADOW.lg },
      tabBarShowLabel: false,
      tabBarIcon: ({ focused }) => {
        const IconComponent = ICONS[route.name];
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? COLORS.primaryGlow : 'transparent' }}>
              <IconComponent size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />
            </View>
            <Text style={{ fontSize: 10, marginTop: 4, fontWeight: focused ? FONT.bold : FONT.medium, color: focused ? COLORS.primary : COLORS.textMuted }}>
              {route.name}
            </Text>
          </View>
        );
      },
    })}>
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Symptoms" component={SymptomChatScreen} />
      <Tab.Screen name="Report" component={HealthReportScreen} />
      <Tab.Screen name="Medicines" component={MedicineReminderScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}