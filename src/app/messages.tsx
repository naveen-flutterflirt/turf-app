import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { globalSocketInstance } from '../hooks/useGlobalSocket';

const getAvatarColors = (name: string) => {
  const colors = [
    { bg: '#E8F5EE', text: '#03624C', border: 'rgba(3, 98, 76, 0.1)' },
    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
    { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  ];
  const index = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export default function MessagesScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const [isNavigating, setIsNavigating] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's chats
  const { data: chatsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['myChats'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/chats`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch chats');
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.data || []);

  useEffect(() => {
    if (!globalSocketInstance) return;

    const handleReceiveMessage = (msg: any) => {
      const roomId = msg.room_id || msg.roomId;
      const msgSenderId = msg.sender_id || msg.senderId;
      if (roomId && msgSenderId !== userData?.id) {
        setUnreadCounts(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
        setLatestMessages(prev => ({ ...prev, [roomId]: msg.message || 'New message' }));
      }
    };

    globalSocketInstance.on('receive_message', handleReceiveMessage);
    return () => {
      globalSocketInstance?.off('receive_message', handleReceiveMessage);
    };
  }, [userData?.id]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
              <Ionicons name="arrow-back" size={24} color="#032221" />
            </TouchableOpacity>
            <Text className="text-[20px] font-sans-bold text-[#032221]">Messages</Text>
          </View>
          <TouchableOpacity onPress={() => setIsSearchOpen(true)} className="p-2">
            <Ionicons name="search" size={22} color="#032221" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : isError ? (
            <View className="py-10 items-center">
              <Text className="text-gray-500 font-sans-medium text-center">Failed to load messages.</Text>
              <TouchableOpacity onPress={() => refetch()} className="mt-4 p-2">
                <Text className="text-[#03624C] font-sans-bold">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : chats.length === 0 ? (
            <View className="py-16 items-center">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-[16px] font-sans-bold text-[#032221] mb-2">No Messages Yet</Text>
              <Text className="text-gray-500 font-sans-medium text-center text-sm px-6 leading-relaxed">
                Join a community broadcast or accept players to start chatting!
              </Text>
            </View>
          ) : (
            chats.map((chat: any) => {
              const roomId = chat.id || chat.room_id;
              const unread = unreadCounts[roomId] || chat.unread_count || 0;
              const preview = latestMessages[roomId] || chat.broadcast_message || 'Tap to open chat room';
              const displayName = chat.name || chat.room_name || ((chat.host_id === userData?.id && userData?.name) ? `${userData.name}'s Match` : (chat.host_name ? `${chat.host_name}'s Match` : 'Community Match'));
              const avatarColors = getAvatarColors(displayName);

              return (
                <TouchableOpacity
                  key={roomId}
                  className="bg-white rounded-2xl mb-3 p-4 flex-row items-center"
                  style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                  disabled={isNavigating}
                  onPress={() => {
                    if (isNavigating) return;
                    setIsNavigating(true);
                    // Clear unread count locally when opening
                    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
                    router.push({
                      pathname: '/chat-room',
                      params: {
                        roomId: roomId,
                        roomName: displayName,
                        isHost: (chat.host_id === userData?.id || chat.user_id === userData?.id || chat.created_by === userData?.id || chat.is_host) ? 'true' : 'false'
                      }
                    });
                    setTimeout(() => setIsNavigating(false), 1000);
                  }}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-3 border" style={{ backgroundColor: avatarColors.bg, borderColor: avatarColors.border }}>
                    <Text className="text-[18px] font-sans-bold text-center" style={{ color: avatarColors.text, textAlignVertical: 'center', includeFontPadding: false }}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-[16px] font-sans-bold text-[#032221] mb-1" numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text className={`text-[13px] font-sans-medium ${unread > 0 ? 'text-[#032221] font-sans-bold' : 'text-gray-500'}`} numberOfLines={1}>
                      {chat.host_name}
                    </Text>
                  </View>

                  <View className="ml-2 items-end justify-center min-w-[24px]">
                    {unread > 0 ? (
                      <View className="bg-[#00DF81] h-6 min-w-[24px] px-1.5 rounded-full items-center justify-center mb-1">
                        <Text className="text-white font-sans-bold text-[10px]">{unread > 99 ? '99+' : unread}</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
        {/* Search Overlay */}
        <Modal visible={isSearchOpen} animationType="fade" transparent={false} onRequestClose={() => setIsSearchOpen(false)}>
          <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
              <TouchableOpacity onPress={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 mr-2">
                <Ionicons name="arrow-back" size={24} color="#032221" />
              </TouchableOpacity>
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-[16px] font-sans-medium text-[#032221]"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-2">
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
              {chats.filter((chat: any) => {
                if (!searchQuery.trim()) return true;
                const displayName = chat.name || chat.room_name || ((chat.host_id === userData?.id && userData?.name) ? `${userData.name}'s Match` : (chat.host_name ? `${chat.host_name}'s Match` : 'Community Match'));
                return displayName.toLowerCase().includes(searchQuery.toLowerCase());
              }).map((chat: any) => {
                const roomId = chat.id || chat.room_id;
                const unread = unreadCounts[roomId] || chat.unread_count || 0;
                const preview = latestMessages[roomId] || chat.broadcast_message || 'Tap to open chat room';
                const displayName = chat.name || chat.room_name || ((chat.host_id === userData?.id && userData?.name) ? `${userData.name}'s Match` : (chat.host_name ? `${chat.host_name}'s Match` : 'Community Match'));
                const avatarColors = getAvatarColors(displayName);

                return (
                  <TouchableOpacity
                    key={`search-${roomId}`}
                    className="bg-white rounded-2xl mb-3 p-4 flex-row items-center"
                    style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                    disabled={isNavigating}
                    onPress={() => {
                      if (isNavigating) return;
                      setIsNavigating(true);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
                      router.push({
                        pathname: '/chat-room',
                        params: {
                          roomId: roomId,
                          roomName: chat.name || chat.room_name || ((chat.host_id === userData?.id && userData?.name) ? `${userData.name}'s Match` : (chat.host_name ? `${chat.host_name}'s Match` : 'Community Match')),
                          isHost: (chat.host_id === userData?.id || chat.user_id === userData?.id || chat.created_by === userData?.id || chat.is_host) ? 'true' : 'false'
                        }
                      });
                      setTimeout(() => setIsNavigating(false), 1000);
                    }}
                  >
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-3 border" style={{ backgroundColor: avatarColors.bg, borderColor: avatarColors.border }}>
                    <Text className="text-[18px] font-sans-bold text-center" style={{ color: avatarColors.text, textAlignVertical: 'center', includeFontPadding: false }}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-sans-bold text-[#032221] mb-1" numberOfLines={1}>
                      {chat.name || chat.room_name || ((chat.host_id === userData?.id && userData?.name) ? `${userData.name}'s Match` : (chat.host_name ? `${chat.host_name}'s Match` : 'Community Match'))}
                    </Text>
                    <Text className={`text-[13px] font-sans-medium ${unread > 0 ? 'text-[#032221] font-sans-bold' : 'text-gray-500'}`} numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}
