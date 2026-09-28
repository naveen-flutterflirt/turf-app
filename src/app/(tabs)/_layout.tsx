import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import { initFCM, setupForegroundListener } from '../../services/fcmService';
import { useGlobalSocket } from '../../hooks/useGlobalSocket';

export default function TabLayout() {
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  // Initialize Global Socket for real-time notifications
  useGlobalSocket();

  useEffect(() => {
    if (userData?.token) {
      initFCM(baseUrl, userData.token);
      const unsubscribe = setupForegroundListener();
      return () => unsubscribe();
    }
  }, [userData?.token, baseUrl]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00DF81', // Caribbean Green
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 18,
          paddingTop: 7,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 10,
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="book/[id]" options={{ href: null }} />
      <Tabs.Screen name="book/booking-details/[id]" options={{ href: null }} />
      <Tabs.Screen name="cust-turf-details/[id]" options={{ href: null }} />
      {/* We have moved turf-details/[id], book/[id], booking-summary, and booking-success 
            out of the tabs group into the root Stack to fix back navigation behavior */}
    </Tabs>
  );
}
