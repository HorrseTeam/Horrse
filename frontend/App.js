import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import NotificationManager from './src/services/Notification';
// 로그인 스크린 임포트 (💡 SignUpScreen 임포트 완전 제거)
import LoginScreen from './src/screens/LoginScreen';

// 홈 (말 등록)
import HorseProfileScreen from './src/screens/HorseProfileScreen';

// 말 관리 스택
import HorseListScreen from './src/screens/HorseListScreen';
import HorseDetailScreen from './src/screens/HorseDetailScreen';
import HorseAIAnalysisScreen from './src/screens/HorseAIAnalysisScreen';

// 대시보드 스택
import DashboardHorseListScreen from './src/screens/DashboardHorseListScreen';
import DashboardDetailScreen from './src/screens/DashboardDetailScreen';

// 일정
import CalendarScreen from './src/screens/CalendarScreen';

// 설정
import SettingsScreen from './src/screens/SettingsScreen';

const RootStack = createNativeStackNavigator(); // 최상위 스택
const Tab = createBottomTabNavigator();
const HorseStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();

// ── 말 관리 스택 ──────────────────────────────────────────────
function HorseStackNavigator() {
  return (
    <HorseStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f6ef7' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <HorseStack.Screen
        name="HorseList"
        component={HorseListScreen}
        options={{ headerShown: false }}
      />
      <HorseStack.Screen
        name="HorseDetail"
        component={HorseDetailScreen}
        options={({ route }) => ({ title: route.params?.horse?.name || '말 상세' })}
      />
      <HorseStack.Screen
        name="AIAnalysis"
        component={HorseAIAnalysisScreen}
        options={({ route }) => ({
          title: route.params?.analysisType === 'hoof' ? '발굽 분석' : '파행 진단',
        })}
      />
    </HorseStack.Navigator>
  );
}

// ── 대시보드 스택 ─────────────────────────────────────────────
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f6ef7' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <DashboardStack.Screen
        name="DashboardList"
        component={DashboardHorseListScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="DashboardDetail"
        component={DashboardDetailScreen}
        options={({ route }) => ({ title: `${route.params?.horse?.name || '말'} 데이터` })}
      />
    </DashboardStack.Navigator>
  );
}

// ── 하단 5개 탭 메뉴 묶음 컴포넌트 ─────────────────────────────
const TAB_ICONS = {
  Home: { active: '🏠', inactive: '🏠' },
  HorseManage: { active: '🐴', inactive: '🐴' },
  Dashboard: { active: '📊', inactive: '📊' },
  Schedule: { active: '📅', inactive: '📅' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Text style={{ fontSize: 22 }}>
              {focused ? icons?.active : icons?.inactive}
            </Text>
          );
        },
        tabBarActiveTintColor: '#4f6ef7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e8eeff',
          height: 70,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 8,
          marginTop: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HorseProfileScreen}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="HorseManage"
        component={HorseStackNavigator}
        options={{ tabBarLabel: '말 관리' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{ tabBarLabel: '대시보드' }}
      />
      <Tab.Screen
        name="Schedule"
        component={CalendarScreen}
        options={{ tabBarLabel: '일정' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '설정' }}
      />
    </Tab.Navigator>
  );
}

// ── 최상위 앱 내비게이션 진입점 ──────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      {/* 최상위 레이어에 전역 알림 매니저 구동 */}
      <NotificationManager />

      <NavigationContainer>
        {/* 최상위 관문 스택 */}
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {/* 첫 화면: 로그인 페이지 */}
          <RootStack.Screen name="Login" component={LoginScreen} />
          

          {/* 로그인 완료 후 진입할 메인 5개 탭 메뉴 */}
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}