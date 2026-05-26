import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import NotificationManager from './src/services/Notification';
import LoginScreen from './src/screens/LoginScreen';

import HorseProfileScreen from './src/screens/HorseProfileScreen';

import HorseListScreen from './src/screens/HorseListScreen';
import HorseDetailScreen from './src/screens/HorseDetailScreen';
import HorseAIAnalysisScreen from './src/screens/HorseAIAnalysisScreen';

import DashboardHorseListScreen from './src/screens/DashboardHorseListScreen';
import DashboardDetailScreen from './src/screens/DashboardDetailScreen';

import CalendarScreen from './src/screens/CalendarScreen';

import SettingsScreen from './src/screens/SettingsScreen';

import AIDetailScreen from './src/screens/AIDetailScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HorseStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();

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
            <DashboardStack.Screen
                name="AIDetail"
                component={AIDetailScreen}
                options={{ title: 'AI 분석 상세 결과' }}
            />
        </DashboardStack.Navigator>
    );
}

const TAB_ICONS = {
    Home: { active: '🏠', inactive: '🏠' },
    HorseManage: { active: '🐴', inactive: '🐴' },
    Dashboard: { active: '📊', inactive: '📊' },
    Schedule: { active: '📅', inactive: '📅' },
    Settings: { active: '⚙️', inactive: '⚙️' },
};

function MainTabNavigator() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#4f6ef7' }} edges={['top']}>
            <NotificationManager />
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
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <RootStack.Navigator screenOptions={{ headerShown: false }}>
                    <RootStack.Screen name="Login" component={LoginScreen} />
                    <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
                </RootStack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}