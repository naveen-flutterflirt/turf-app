import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';

const DUMMY_POSTS = [
  {
    id: '1',
    turfName: 'Green Field Arena',
    location: 'Bhopal, MP',
    distance: '2.5 km',
    sport: 'Football',
    author: 'Rahul S.',
    interested: '5+ interested',
    message: "Looking for players to join! Let's play and have fun ⚽",
    playersCount: 12,
    timeAgo: '3h ago',
    image: 'https://images.unsplash.com/photo-1518605368461-1ee7c5320746?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: '2',
    turfName: 'Skyline Turf',
    location: 'Bhopal, MP',
    distance: '3.1 km',
    sport: 'Football',
    author: 'Aman K.',
    interested: '3+ interested',
    message: "Need 4-5 players for a friendly match.",
    playersCount: 9,
    timeAgo: '4h ago',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: '3',
    turfName: 'PlayZone Arena',
    location: 'Bhopal, MP',
    distance: '4.2 km',
    sport: 'Cricket',
    author: 'Vivek P.',
    interested: '6+ interested',
    message: "Looking for cricket players this weekend!",
    playersCount: 15,
    timeAgo: '6h ago',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=300&h=300'
  }
];

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const response = await fetch(`${baseUrl}/community/broadcasts/${broadcastId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to delete broadcast');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityBroadcasts'] });
    }
  });

  const [activeTab, setActiveTab] = useState(params.tab === 'my_broadcasts' ? 'my_broadcasts' : 'near_you');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const sportsList = ['Football', 'Cricket', 'Tennis', 'Basketball', 'Badminton'];

  const { data: broadcastsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['communityBroadcasts', activeTab, selectedSport],
    queryFn: async () => {
      const endpoint = activeTab === 'my_broadcasts' ? '/community/my-broadcasts' : '/community/feed';
      let url = `${baseUrl}${endpoint}`;
      if (selectedSport && activeTab === 'near_you') {
        url += `?sport=${selectedSport}`; // Note: backend might not support this yet, but we will filter on frontend as fallback
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch feed');
      const jsonResponse = await response.json();
      return jsonResponse;
    },
    enabled: !!userData?.token,
  });

  const { data: chatsData } = useQuery({
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
  const hasUnreadMessages = chats.some((chat: any) => chat.unread_count > 0);

  const broadcasts = Array.isArray(broadcastsData) ? broadcastsData : (broadcastsData?.data || broadcastsData?.broadcasts || []);

  // Filter broadcasts on frontend
  const displayBroadcasts = broadcasts.filter((b: any) => {
    // 1. Filter by Tab (if 'my_broadcasts', show only user's broadcasts)
    // The backend /community/my-broadcasts already handles this.

    // 2. Filter by Sport Category
    if (selectedSport) {
      const sName = (b.sport_name || b.sport || '').toLowerCase();
      if (!sName.includes(selectedSport.toLowerCase())) {
        return false;
      }
    }

    return true;
  });



  React.useEffect(() => {
    if (params.tab === 'my_broadcasts') {
      setActiveTab('my_broadcasts');
    }
  }, [params.tab]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Dynamic Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[28px] font-sans-bold text-[#032221] leading-tight">
              {activeTab === 'my_broadcasts' ? 'My Broadcasts' : 'Community'}
            </Text>
            <Text className="text-[13px] font-sans-medium text-gray-500 mt-1">
              {activeTab === 'my_broadcasts' ? 'Manage your broadcasts and players.' : 'Find players. Play together.'}
            </Text>
          </View>

          <View className="flex-row space-x-3">
            {activeTab === 'my_broadcasts' ? (
              <TouchableOpacity
                className="w-11 h-11 bg-[#03624C] rounded-xl items-center justify-center shadow-sm"
                onPress={() => router.push('/create-broadcast')}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-11 h-11 bg-[#E8F5EE] rounded-full items-center justify-center shadow-sm"
                onPress={() => router.push('/messages')}
              >
                <Ionicons name="chatbubble-ellipses" size={22} color="#03624C" />
                {hasUnreadMessages && (
                  <View className="absolute top-2.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#E8F5EE]" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Custom Segmented Control */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-[#F3F4F6] rounded-full p-1" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeTab === 'near_you' ? 'bg-white' : 'bg-transparent'}`}
              style={activeTab === 'near_you' ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              onPress={() => setActiveTab('near_you')}
            >
              <Text className={`font-sans-bold text-[13px] ${activeTab === 'near_you' ? 'text-[#03624C]' : 'text-gray-500'}`}>
                Explore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeTab === 'my_broadcasts' ? 'bg-white' : 'bg-transparent'}`}
              style={activeTab === 'my_broadcasts' ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              onPress={() => setActiveTab('my_broadcasts')}
            >
              <Text className={`font-sans-bold text-[13px] ${activeTab === 'my_broadcasts' ? 'text-[#032221]' : 'text-gray-500'}`}>
                My Broadcasts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sports Horizontal Scroll */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
            <TouchableOpacity
              onPress={() => setSelectedSport(null)}
              className={`px-4 py-2 flex-row items-center rounded-full ${selectedSport === null ? 'bg-[#03624C]' : 'bg-white border border-gray-100'}`}
              style={selectedSport === null ? {} : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
            >
              <Ionicons name="grid" size={16} color={selectedSport === null ? '#FFF' : '#03624C'} />
              <Text className={`font-sans-bold text-[13px] ml-1.5 ${selectedSport === null ? 'text-white' : 'text-[#032221]'}`}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedSport('Football')}
              className={`px-4 py-2 flex-row items-center rounded-full ${selectedSport === 'Football' ? 'bg-[#03624C]' : 'bg-white border border-gray-100'}`}
              style={selectedSport === 'Football' ? {} : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
            >
              <Ionicons name="football" size={16} color={selectedSport === 'Football' ? '#FFF' : '#032221'} />
              <Text className={`font-sans-bold text-[13px] ml-1.5 ${selectedSport === 'Football' ? 'text-white' : 'text-[#6B7280]'}`}>Football</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedSport('Cricket')}
              className={`px-4 py-2 flex-row items-center rounded-full ${selectedSport === 'Cricket' ? 'bg-[#03624C]' : 'bg-white border border-gray-100'}`}
              style={selectedSport === 'Cricket' ? {} : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
            >
              <Text className="text-[14px]">🏏</Text>
              <Text className={`font-sans-bold text-[13px] ml-1.5 ${selectedSport === 'Cricket' ? 'text-white' : 'text-[#6B7280]'}`}>Cricket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedSport('Tennis')}
              className={`px-4 py-2 flex-row items-center rounded-full ${selectedSport === 'Tennis' ? 'bg-[#03624C]' : 'bg-white border border-gray-100'}`}
              style={selectedSport === 'Tennis' ? {} : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
            >
              <Ionicons name="tennisball" size={16} color={selectedSport === 'Tennis' ? '#FFF' : '#84CC16'} />
              <Text className={`font-sans-bold text-[13px] ml-1.5 ${selectedSport === 'Tennis' ? 'text-white' : 'text-[#6B7280]'}`}>Tennis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedSport('Badminton')}
              className={`px-4 py-2 flex-row items-center rounded-full ${selectedSport === 'Badminton' ? 'bg-[#03624C]' : 'bg-white border border-gray-100'}`}
              style={selectedSport === 'Badminton' ? {} : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
            >
              <Text className="text-[14px]">🏸</Text>
              <Text className={`font-sans-bold text-[13px] ml-1.5 ${selectedSport === 'Badminton' ? 'text-white' : 'text-[#6B7280]'}`}>Badminton</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {isError && (
            <View className="bg-red-50 p-4 m-4 rounded-xl border border-red-200">
              <Text className="text-red-700 font-sans-bold mb-1">Failed to load broadcasts</Text>
              <Text className="text-red-600 text-[13px]">Check your network connection or try again.</Text>
              <TouchableOpacity onPress={() => refetch()} className="mt-3 bg-red-600 self-start px-4 py-2 rounded-lg">
                <Text className="text-white font-sans-bold text-[13px]">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : (
            <View className="px-6">
              {displayBroadcasts.length === 0 ? (
                <View className="py-10 items-center">
                  <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 font-sans-medium mt-4 text-center">
                    No broadcasts found.
                  </Text>
                </View>
              ) : (
                displayBroadcasts.map((post: any) => {
                  const sportName = post.sport_name || post.sport || 'Sport';
                  const isCricket = sportName.toLowerCase().includes('cricket');
                  const tagBg = isCricket ? 'bg-[#FFF4E5]' : 'bg-[#E8F5EE]';
                  const tagText = isCricket ? 'text-[#B06000]' : 'text-[#03624C]';

                  if (activeTab === 'my_broadcasts') {
                    return (
                      <TouchableOpacity
                        key={post.id}
                        onPress={() => router.push({ pathname: '/broadcast-details', params: { broadcastData: JSON.stringify(post) } })}
                        className="bg-white rounded-[20px] mb-4 p-4 border border-gray-100"
                        style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
                      >
                        {/* Top: Details */}
                        <View className="flex-row mb-4 relative">
                          <View className="flex-1 justify-center">
                            <View className={`${tagBg} px-2 py-0.5 rounded-md self-start mb-1.5`}>
                              <Text className={`text-[10px] font-sans-bold ${tagText}`}>{sportName}</Text>
                            </View>
                            <Text className="text-[16px] font-sans-bold text-[#032221] mb-1" numberOfLines={1}>{post.message || 'Friendly Match'}</Text>
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                              <Text className="text-[11px] font-sans-medium text-gray-500 ml-1">
                                {post.play_date ? new Date(post.play_date).toLocaleDateString() : 'Date TBD'}
                              </Text>
                            </View>
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="people-outline" size={12} color="#6B7280" />
                              <Text className="text-[11px] font-sans-medium text-gray-500 ml-1 mr-2">{post.players_needed ? `${post.players_needed} players` : 'Open'}</Text>
                              <Ionicons name="time-outline" size={12} color="#6B7280" />
                              <Text className="text-[11px] font-sans-medium text-gray-500 ml-1">
                                {post.start_time ? post.start_time.slice(0, 5) : 'Time TBD'}
                              </Text>
                            </View>
                            <Text className="text-[11px] font-sans-medium text-gray-400">
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                            </Text>
                          </View>
                          <View className="absolute right-0 top-1/2 -translate-y-1/2">
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                          </View>
                        </View>

                        {/* Bottom: Actions */}
                        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                          <TouchableOpacity
                            className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl flex-row justify-center items-center mr-2"
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push({ pathname: '/broadcast-requests', params: { broadcastId: post.id, broadcastData: JSON.stringify(post) } });
                            }}
                          >
                            <Ionicons name="people-outline" size={16} color="#032221" className="mr-2" />
                            <Text className="text-[#032221] font-sans-bold text-[12px] ml-1">View Requests</Text>
                            {(post.pending_requests > 0 || true) && (
                              <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                                <Text className="text-white font-sans-bold text-[10px]">{post.pending_requests || 5}</Text>
                              </View>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            className="bg-white border border-red-100 py-2.5 px-4 rounded-xl flex-row justify-center items-center"
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert(
                                "Delete Broadcast?",
                                "This will permanently remove your broadcast. Players will be notified and all pending requests will be cancelled.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => {
                                      deleteBroadcastMutation.mutate(post.id, {
                                        onError: () => Alert.alert('Error', 'Failed to delete broadcast.')
                                      });
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text className="text-[#EF4444] font-sans-bold text-[12px] ml-1">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={post.id}
                      onPress={() => router.push({ pathname: '/broadcast-details', params: { broadcastData: JSON.stringify(post) } })}
                      className="bg-white rounded-[20px] mb-4 p-5"
                      style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
                    >
                      {/* Top Row: Sport Tag & Three Dots */}
                      <View className="flex-row justify-between items-start mb-3">
                        <View className={`${tagBg} px-3 py-1 rounded-md`}>
                          <Text className={`text-[12px] font-sans-bold ${tagText}`}>{sportName}</Text>
                        </View>
                        <TouchableOpacity className="p-1 -mr-2">
                          <Ionicons name="ellipsis-vertical" size={20} color="#032221" />
                        </TouchableOpacity>
                      </View>

                      {/* Turf Name (Community Name) */}
                      <Text className="text-[18px] font-sans-bold text-[#032221] mb-1" numberOfLines={1}>
                        {post.message}
                      </Text>

                      {/* Location */}
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text className="text-[13px] font-sans-medium text-[#6B7280] ml-1" numberOfLines={1}>
                          {post.location || post.turf_city || post.city || (post.turf && post.turf.city) || 'Location not specified'}
                        </Text>
                      </View>

                      {/* Info Rows */}
                      <View className="mb-4">
                        {/* Host and Date Row */}
                        <View className="flex-row items-center mb-3">
                          <View className="flex-row items-center flex-1">
                            <Ionicons name="person-outline" size={18} color="#6B7280" />
                            <Text className="text-[14px] font-sans-medium text-[#6B7280] ml-2" numberOfLines={1}>
                              <Text className="text-[#6B7280]">{post.host_id === userData?.id ? (userData?.name || 'You') : (post.host_name || (post.user && post.user.name) || post.user_name || post.author || 'Player')}</Text>
                            </Text>
                          </View>
                          <View className="w-[1px] h-4 bg-gray-200 mx-3" />
                          <View className="flex-row items-center flex-1">
                            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                            <Text className="text-[14px] font-sans-bold text-[#6B7280] ml-2">
                              {post.play_date ? new Date(post.play_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'} {"\n"} {post.start_time ? post.start_time.slice(0, 5) : 'TBD'}
                            </Text>
                          </View>
                        </View>

                        {/* Players and Status Row */}
                        <View className="flex-row items-center">
                          <View className="flex-row items-center flex-1">
                            <Ionicons name="people-outline" size={18} color="#03624C" />
                            <Text className="text-[14px] font-sans-bold text-[#4B5563] ml-2">{post.players_needed ? `${post.players_needed} needed` : 'Open'}</Text>
                          </View>
                          <View className="w-[1px] h-4 bg-gray-200 mx-3" />
                          <View className="flex-row items-center flex-1">
                            <Text className="text-[14px]">⏳</Text>
                            <Text className="text-[14px] font-sans-bold text-[#4B5563] ml-2">
                              {post.status === 'ACTIVE' ? 'Active' : post.status}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Footer Row (Chat Link) */}
                      <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-gray-100">
                        <View className="flex-row items-center">
                          <Ionicons name="chatbubble-outline" size={20} color="#03624C" />
                          <Text className="text-[14px] font-sans-medium text-[#6B7280] ml-2">Discuss location in chat</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#03624C" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
