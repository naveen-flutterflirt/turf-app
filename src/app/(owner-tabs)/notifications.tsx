import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();

  const notifications = [
    {
      id: 1,
      title: 'New booking received',
      description: 'Arjun Singh booked Football Arena',
      time: '2 mins ago',
      icon: 'ticket',
      iconColor: '#10B981', // green
      iconBg: '#D1FAE5'
    },
    {
      id: 2,
      title: 'Payment received',
      description: '₹800 received for booking #BOOK12345',
      time: '10 mins ago',
      icon: 'cash',
      iconColor: '#10B981', // green
      iconBg: '#D1FAE5'
    },
    {
      id: 3,
      title: 'Booking cancelled',
      description: 'Sagar Gupta cancelled a booking',
      time: '1 hour ago',
      icon: 'close-circle',
      iconColor: '#EF4444', // red
      iconBg: '#FEE2E2'
    },
    {
      id: 4,
      title: 'Turf review received',
      description: 'New review for Football Arena',
      time: '2 hours ago',
      icon: 'star',
      iconColor: '#F59E0B', // orange
      iconBg: '#FEF3C7'
    },
    {
      id: 5,
      title: 'Weekly summary',
      description: 'You earned ₹12,450 this week',
      time: '1 day ago',
      icon: 'stats-chart',
      iconColor: '#3B82F6', // blue
      iconBg: '#DBEAFE'
    }
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-center flex-1 mr-8">Notifications</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {notifications.map((notification) => (
            <View key={notification.id} className="flex-row items-center p-4 border-b border-gray-100">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: notification.iconBg }}
              >
                <Ionicons name={notification.icon as any} size={24} color={notification.iconColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="font-sans-semibold text-base text-gray-900">{notification.title}</Text>
                  <Text className="font-sans-medium text-xs text-gray-400 mt-1">{notification.time}</Text>
                </View>
                <Text className="font-sans-medium text-sm text-gray-500">{notification.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
