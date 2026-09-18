import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';

// Define the shape of a notification based on the backend API
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getIconForType = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'BOOKING':
      return { name: 'calendar', color: '#03624C', bg: 'bg-[#E6F4EA]' };
    case 'PROMO':
      return { name: 'pricetag', color: '#F59E0B', bg: 'bg-[#FFFBEB]' };
    case 'SYSTEM':
      return { name: 'information-circle', color: '#0284C7', bg: 'bg-[#E0F2FE]' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: 'bg-gray-100' };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Notifications
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/notifications`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const notifications: Notification[] = notificationsData?.data || [];

  // Mutation to mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/customer/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return id;
    },
    onMutate: async (id) => {
      // Optimistically update the UI to show it as read immediately
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((notif: Notification) => 
            notif.id === id ? { ...notif, is_read: true } : notif
          ),
        };
      });
      
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    // You could also add logic here to navigate based on the type
    // e.g., if (notification.type === 'BOOKING') router.push('/bookings');
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconConfig = getIconForType(item.type);
    
    return (
      <TouchableOpacity 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        className={`flex-row p-4 border-b border-gray-100 ${!item.is_read ? 'bg-[#F0FDF4]' : 'bg-white'}`}
      >
        {/* Icon */}
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${iconConfig.bg}`}>
          <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
        </View>
        
        {/* Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-start mb-1">
            <Text className={`flex-1 font-sans-bold text-[15px] ${!item.is_read ? 'text-[#032221]' : 'text-gray-700'}`} numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-xs font-sans-medium text-gray-500 ml-2">
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
          <Text className={`font-sans-medium text-sm leading-5 ${!item.is_read ? 'text-gray-700' : 'text-gray-500'}`} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        
        {/* Unread Indicator */}
        {!item.is_read && (
          <View className="justify-center ml-2">
            <View className="w-2.5 h-2.5 rounded-full bg-[#03624C]" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 z-10 bg-white">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
        >
          <Ionicons name="arrow-back" size={22} color="#032221" />
        </TouchableOpacity>
        <Text className="text-lg font-sans-bold text-[#032221] ml-3">Notifications</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#03624C" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-6">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-sans-bold text-[#032221] mb-2 text-center">
                No notifications yet
              </Text>
              <Text className="text-sm font-sans-medium text-gray-500 text-center">
                When you get updates about your bookings or special offers, they'll show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
