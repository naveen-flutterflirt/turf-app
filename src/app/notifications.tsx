import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SectionList, 
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getIconForType = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'BOOKING':
      return { name: 'calendar', color: '#03624C', bg: 'bg-[#E6F4EA]', accent: '#03624C' };
    case 'PROMO':
      return { name: 'pricetag', color: '#F59E0B', bg: 'bg-[#FFFBEB]', accent: '#F59E0B' };
    case 'SYSTEM':
      return { name: 'information-circle', color: '#0284C7', bg: 'bg-[#E0F2FE]', accent: '#0284C7' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: 'bg-gray-100', accent: '#6B7280' };
  }
};

// Helper to group notifications
const groupNotifications = (notifications: Notification[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = {
    'Today': [] as Notification[],
    'Yesterday': [] as Notification[],
    'Earlier': [] as Notification[]
  };

  notifications.forEach(notif => {
    const notifDate = new Date(notif.created_at);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      groups['Today'].push(notif);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(notif);
    } else {
      groups['Earlier'].push(notif);
    }
  });

  return Object.keys(groups)
    .filter(key => groups[key as keyof typeof groups].length > 0)
    .map(key => ({
      title: key,
      data: groups[key as keyof typeof groups]
    }));
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const rawNotifications: Notification[] = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.data || []);
  
  // Memoize grouped data for SectionList
  const groupedNotifications = useMemo(() => {
    // Sort newest first before grouping
    const sorted = [...rawNotifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return groupNotifications(sorted);
  }, [rawNotifications]);

  // Auto-read logic: Mark all as read as soon as they are loaded
  useEffect(() => {
    const unreadIds = rawNotifications
      .filter((n: any) => !n.is_read)
      .map((n: any) => n.id || n._id);

    if (unreadIds.length > 0) {
      // 1. Instantly update UI (Optimistic update)
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        const updateFn = (notif: any) => ({ ...notif, is_read: true });
        if (Array.isArray(old)) {
          return old.map(updateFn);
        } else if (old.data) {
          return { ...old, data: old.data.map(updateFn) };
        }
        return old;
      });

      // 2. Silently tell the backend in the background
      unreadIds.forEach((id) => {
        if (id) {
          fetch(`${baseUrl}/customer/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${userData?.token}` },
          }).catch((err) => console.log('Auto-read silently failed:', err));
        }
      });
    }
  }, [rawNotifications, baseUrl, userData?.token, queryClient]);

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
      // Smooth animation when item changes state
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        
        const updateFn = (notif: Notification) => notif.id === id ? { ...notif, is_read: true } : notif;
        
        if (Array.isArray(old)) {
          return old.map(updateFn);
        } else if (old.data) {
          return { ...old, data: old.data.map(updateFn) };
        }
        return old;
      });
      
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/customer/notifications/${id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return id;
    },
    onMutate: async (id) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        
        const filterFn = (notif: Notification) => notif.id !== id;
        
        if (Array.isArray(old)) {
          return old.filter(filterFn);
        } else if (old.data) {
          return { ...old, data: old.data.filter(filterFn) };
        }
        return old;
      });
      
      return { previousNotifications };
    },
    onError: (err, id, context) => {
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
  };

  const renderNotification = ({ item, index }: { item: Notification, index: number }) => {
    const iconConfig = getIconForType(item.type);
    
    return (
      <TouchableOpacity 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        className={`flex-row mx-5 mb-4 rounded-2xl bg-white shadow-sm border ${!item.is_read ? 'border-[#03624C]/30 shadow-[#03624C]/10' : 'border-gray-100'}`}
        style={{
          elevation: !item.is_read ? 3 : 1, // subtle lift for unread on Android
          overflow: 'hidden'
        }}
      >
        {/* Unread Left Accent Bar */}
        {!item.is_read && (
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-[#03624C]" />
        )}

        <View className="flex-row p-4 flex-1 items-center">
          {/* Icon */}
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${iconConfig.bg}`}>
            <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
          </View>
          
          {/* Content */}
          <View className="flex-1 justify-center relative pr-6">
            <View className="flex-row justify-between items-center mb-1">
              <Text 
                className={`flex-1 font-sans-bold text-[16px] ${!item.is_read ? 'text-[#032221]' : 'text-gray-800'}`} 
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
            <Text 
              className={`font-sans-medium text-[13px] leading-5 ${!item.is_read ? 'text-gray-700' : 'text-gray-500'}`} 
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text className={`text-[11px] font-sans-medium mt-1.5 ${!item.is_read ? 'text-[#03624C]' : 'text-gray-400'}`}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          {/* Delete Button & Unread Dot Container */}
          <View className="absolute right-4 top-4 bottom-4 justify-between items-end">
            <TouchableOpacity 
              onPress={() => deleteNotificationMutation.mutate(item.id)}
              className="p-1 -mr-2 -mt-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            
            {!item.is_read && (
              <View className="w-2 h-2 rounded-full bg-[#03624C]" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View className="px-6 py-2 mb-2">
      <Text className="text-[13px] font-sans-bold tracking-wider text-gray-400 uppercase">
        {title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 z-10 bg-[#F9FAFB]">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
        >
          <Ionicons name="arrow-back" size={22} color="#032221" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-[#032221] ml-4 flex-1">Notifications</Text>
        
        {/* Optional Action (e.g. Mark all as read) */}
        {rawNotifications.some(n => !n.is_read) && (
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-[#E6F4EA]"
            // onPress={() => { /* Implement mark all read */ }}
          >
            <Ionicons name="checkmark-done" size={20} color="#03624C" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#03624C" />
        </View>
      ) : (
        <SectionList
          sections={groupedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10, flexGrow: 1 }}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-6">
              <View className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 items-center justify-center mb-6 transform rotate-3">
                <Ionicons name="notifications-off" size={40} color="#D1D5DB" />
              </View>
              <Text className="text-xl font-sans-bold text-[#032221] mb-2 text-center">
                All Caught Up!
              </Text>
              <Text className="text-[15px] font-sans-medium text-gray-500 text-center leading-6">
                You have no new notifications right now. We'll let you know when something comes up.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
