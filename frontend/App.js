import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import HorseProfileScreen from './src/screens/HorseProfileScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AIAnalysisScreen from './src/screens/AIAnalysisScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: 'gray',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: 'bold', color: '#1e293b' },
          }}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: '이력 대시보드', tabBarLabel: '대시보드' }} 
          />
          <Tab.Screen 
            name="Profile" 
            component={HorseProfileScreen} 
            options={{ title: '말 신규 등록/관리', tabBarLabel: '프로필' }} 
          />
          <Tab.Screen 
            name="Calendar" 
            component={CalendarScreen} 
            options={{ title: '일정 알림', tabBarLabel: '일정' }} 
          />
          <Tab.Screen 
            name="AI" 
            component={AIAnalysisScreen} 
            options={{ title: 'AI 파행/발굽 진단', tabBarLabel: 'AI 진단' }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
