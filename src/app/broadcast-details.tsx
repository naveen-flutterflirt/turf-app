import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../stores/useAppStore';
import { useApi } from '../context/ApiContext';
import { useQuery } from '@tanstack/react-query';
import { Alert, ActivityIndicator } from 'react-native';

export default function BroadcastDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const broadcast = params.broadcastData ? JSON.parse(params.broadcastData as string) : null;
  const userData = useAppStore((state) => state.userData);
  const { baseUrl } = useApi();
  const isHost = userData?.id === broadcast?.host_id;
  const broadcastId = broadcast?.id;

  const [isNavigating, setIsNavigating] = useState(false);

  // Check if the user is already in the chat room (accepted)
  const { data: roomData, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['broadcastRoom', broadcastId],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/broadcasts/${broadcastId}/room`, {
        headers: { Authorization: `Bearer ${userData?.token}` }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!broadcastId && !!userData?.token && !isHost, // Host doesn't need to fetch on mount unless we want to hide the alert
  });

  // Fallback data
  const turfName = broadcast?.turfName || broadcast?.turf?.name || 'Local Game';
  const locationText = broadcast?.location || broadcast?.turf?.city || 'Location not specified';
  const hostName = broadcast?.host_name || broadcast?.user?.name || broadcast?.author || (isHost ? (userData?.name || 'You') : 'Host');
  const timePosted = broadcast?.timeAgo || 'Recently';
  const message = broadcast?.message || "No description provided.";
  const sportName = broadcast?.sport_name || broadcast?.sport || 'Sport';

  // Mock avatars for interested players
  const interestedAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=100&h=100',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100'
  ]; return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-3 flex-row justify-between items-center bg-[#F9FAFB] z-10">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white rounded-full  border border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <Ionicons name="chevron-back" size={20} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221]">Broadcast Details</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center bg-white rounded-full  mr-2 border border-gray-100"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
              onPress={async () => {
                try {
                  const url = `https://turf-admin-dashboard-six.vercel.app/broadcast/${broadcast?.slug || broadcast?.id}`;
                  await Share.share({
                    message: `Join my game: ${message}. It's on ${broadcast?.play_date ? new Date(broadcast.play_date).toLocaleDateString('en-GB') : 'a scheduled date'}.\n${url}`,
                  });
                } catch (error) {
                  console.log('Share error:', error);
                }
              }}
            >
              <Ionicons name="arrow-redo-outline" size={18} color="#032221" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

          <View className="px-5 pt-3">

            {/* Hero Card */}
            <View className="bg-white rounded-[24px] p-5 mb-4  border border-gray-100 relative overflow-hidden" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }}>
              {/* Decorative faint blobs in background */}
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-[#E8F5EE] rounded-full opacity-50" />
              <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#E8F5EE] rounded-full opacity-50" />

              <View className="flex-row mb-5 z-10">
                <View className="w-[85px] h-[85px] bg-[#FFF0F0] rounded-full items-center justify-center mr-4  border border-red-50">
                  <Text className="text-[40px] leading-[50px] pt-1">🏓</Text>
                </View>
                <View className="flex-1 justify-center pt-1">
                  <View className="bg-[#FFF0F0] self-start px-3 py-1 rounded-full flex-row items-center mb-2">

                    <Text className="text-[11px] font-sans-bold text-[#E53935] ml-1.5">{sportName}</Text>
                  </View>
                  <Text className="text-[16px] font-sans-medium text-gray-500">
                    Let's play, have fun and make new friends!
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View className="flex-row flex-wrap gap-2 z-10">
                <View className="flex-row items-center bg-white px-3 py-1.5 rounded-[10px] border border-gray-100 " style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 }}>
                  <Ionicons name="people-outline" size={14} color="#032221" />
                  <Text className="text-[11px] font-sans-medium text-[#032221] ml-1.5">Open to all</Text>
                </View>
                <View className="flex-row items-center bg-white px-3 py-1.5 rounded-[10px] border border-gray-100 " style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 }}>
                  <Ionicons name="bar-chart-outline" size={14} color="#032221" />
                  <Text className="text-[11px] font-sans-medium text-[#032221] ml-1.5">Beginner Friendly</Text>
                </View>
                <View className="flex-row items-center bg-white px-3 py-1.5 rounded-[10px] border border-gray-100 " style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 }}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#032221" />
                  <Text className="text-[11px] font-sans-medium text-[#032221] ml-1.5">Friendly Match</Text>
                </View>
              </View>
            </View>

            {/* Host Card */}
            <View className="bg-white rounded-[20px] p-4 mb-4  border border-gray-100 flex-row items-center" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }}>
              <View className="w-[50px] h-[50px] bg-[#E8F5EE] rounded-full items-center justify-center mr-4">
                <Ionicons name="person" size={24} color="#03624C" />
              </View>
              <View>
                <Text className="text-[12px] font-sans-medium text-gray-500 mb-0.5">Hosted by</Text>
                <Text className="text-[16px] font-sans-bold text-[#032221]">{hostName}</Text>
              </View>
            </View>

            {/* Game Details */}
            <View className="bg-white rounded-[24px] p-5 mb-4  border border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }}>
              <View className="flex-row items-center mb-5">
                <Ionicons name="calendar-outline" size={20} color="#032221" />
                <Text className="text-[16px] font-sans-bold text-[#032221] ml-2.5">Game Details</Text>
              </View>

              <View className="flex-row flex-wrap justify-between">
                {/* Date Card */}
                <View className="bg-[#F9FAFB] rounded-[16px] p-4 w-[48%] mb-3 border border-gray-50">
                  <View className="flex-row items-start mb-1.5">
                    <View className=" flex-1">
                      <Text className="text-[11px] font-sans-medium text-gray-400 mb-0.5">Play Date</Text>
                      <Text className="text-[13px] font-sans-bold text-[#032221]" numberOfLines={1}>{broadcast?.play_date ? new Date(broadcast.play_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</Text>
                    </View>
                  </View>
                </View>

                {/* Time Card */}
                <View className="bg-[#F9FAFB] rounded-[16px] p-4 w-[48%] mb-3 border border-gray-50">
                  <View className="flex-row items-start mb-1.5">
                    <View className=" flex-1">
                      <Text className="text-[11px] font-sans-medium text-gray-400 mb-0.5">Time</Text>
                      <Text className="text-[13px] font-sans-bold text-[#032221]" numberOfLines={1}>{broadcast?.start_time ? broadcast.start_time.slice(0, 5) : 'TBD'} {broadcast?.end_time ? `- ${broadcast.end_time.slice(0, 5)}` : ''}</Text>
                    </View>
                  </View>
                </View>

                {/* Players Card */}
                <View className="bg-[#F9FAFB] rounded-[16px] p-4 w-[48%] border border-gray-50">
                  <View className="flex-row items-start mb-1.5">
                    <View className=" flex-1">
                      <Text className="text-[11px] font-sans-medium text-gray-400 mb-0.5">Players Needed</Text>
                      <Text className="text-[13px] font-sans-bold text-[#032221]" numberOfLines={1}>{broadcast?.players_needed || 'Open'}</Text>
                    </View>
                  </View>
                </View>

                {/* Sport Card */}
                <View className="bg-[#F9FAFB] rounded-[16px] p-4 w-[48%] border border-gray-50">
                  <View className="flex-row items-start mb-1.5">
                    <View className=" flex-1">
                      <Text className="text-[11px] font-sans-medium text-gray-400 mb-0.5">Sport</Text>
                      <Text className="text-[13px] font-sans-bold text-[#032221]" numberOfLines={1}>{sportName || "TBD"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* About this game */}
            <View className="bg-white rounded-[24px] p-5 mb-6  border border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }}>
              <View className="flex-row items-center mb-4">
                <Ionicons name="document-text-outline" size={20} color="#032221" />
                <Text className="text-[16px] font-sans-bold text-[#032221] ml-2.5">About this game</Text>
              </View>
              <View className="bg-[#F2F9F7] rounded-[16px] p-4">
                <Text className="text-[14px] font-sans-medium text-[#032221]">{message}</Text>
              </View>
            </View>

            {/* Features Row */}
            <View className="flex-row justify-between bg-white rounded-[24px] p-4  border border-gray-100 mb-8" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 }}>
              <View className="items-center flex-1">
                <View className="w-12 h-12 bg-[#E8F5EE] rounded-full items-center justify-center mb-2">
                  <Ionicons name="people" size={20} color="#03624C" />
                </View>
                <Text className="text-[11px] font-sans-bold text-[#032221] mb-1">Play Together</Text>
                <Text className="text-[9px] font-sans-medium text-gray-400 text-center px-1">Meet new people in your city</Text>
              </View>

              <View className="items-center flex-1 border-l border-r border-gray-100">
                <View className="w-12 h-12 bg-[#E8F5EE] rounded-full items-center justify-center mb-2">
                  <Ionicons name="hand-left" size={20} color="#03624C" />
                </View>
                <Text className="text-[11px] font-sans-bold text-[#032221] mb-1">Have Fun</Text>
                <Text className="text-[9px] font-sans-medium text-gray-400 text-center px-1">Friendly matches for everyone</Text>
              </View>

              <View className="items-center flex-1">
                <View className="w-12 h-12 bg-[#E8F5EE] rounded-full items-center justify-center mb-2">
                  <Ionicons name="trophy" size={20} color="#03624C" />
                </View>
                <Text className="text-[11px] font-sans-bold text-[#032221] mb-1">Grow Your Game</Text>
                <Text className="text-[9px] font-sans-medium text-gray-400 text-center px-1">Play more, get better</Text>
              </View>
            </View>

            {/* Divider */}
            <View className="flex-row items-center justify-center mb-4 opacity-60">
              <View className="h-[1px] w-12 bg-gray-300" />
              <Ionicons name="sparkles-outline" size={16} color="#03624C" className="mx-3" />
              <Text className="text-[11px] font-sans-bold text-[#032221] mx-1">Same Game. More Friends.</Text>
              <Ionicons name="sparkles-outline" size={16} color="#03624C" className="mx-3" />
              <View className="h-[1px] w-12 bg-gray-300" />
            </View>

          </View>
        </ScrollView>

        {/* Fixed Bottom Action Buttons */}
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white" style={{ elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
          {isHost ? (
            <View className="flex-row justify-between gap-3 w-full">
              <TouchableOpacity
                className="bg-[#03624C] flex-1 rounded-[16px] py-4 items-center justify-center flex-row"
                onPress={() => router.push('/broadcast-requests')}
              >
                <Ionicons name="people-outline" size={20} color="#FFF" />
                <Text className="text-white font-sans-bold text-[15px] ml-2" numberOfLines={1}>Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-[#03624C] flex-1 rounded-[16px] py-4 items-center justify-center flex-row"
                disabled={isNavigating}
                onPress={async () => {
                  if (isNavigating) return;
                  setIsNavigating(true);
                  try {
                    const response = await fetch(`${baseUrl}/community/broadcasts/${broadcastId}/room`, {
                      headers: { Authorization: `Bearer ${userData?.token}` }
                    });
                    const data = await response.json();
                    if (data.roomId) {
                      router.push({ pathname: '/chat-room', params: { roomId: data.roomId, isHost: 'true', roomName: 'Broadcast Chat' } });
                    } else {
                      Alert.alert("No Active Chat Room", "The chat room is only created when you accept your first player.");
                    }
                  } catch (error) {
                    Alert.alert("Error", "Could not fetch chat room data.");
                  } finally {
                    setTimeout(() => setIsNavigating(false), 1000);
                  }
                }}
              >
                <Ionicons name="chatbubbles-outline" size={20} color={isNavigating ? "#9CA3AF" : "#03624C"} />
                <Text className={`${isNavigating ? 'text-[#9CA3AF]' : 'text-[#03624C]'} font-sans-bold text-[15px] ml-2`} numberOfLines={1}>Chat Room</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isLoadingRoom ? (
                <View className="bg-gray-100 w-full rounded-[16px] py-4 items-center justify-center mb-3">
                  <ActivityIndicator size="small" color="#03624C" />
                </View>
              ) : roomData?.roomId ? (
                <TouchableOpacity
                  className="bg-[#03624C] w-full rounded-[16px] py-4 items-center justify-center flex-row mb-3"
                  disabled={isNavigating}
                  onPress={() => {
                    if (isNavigating) return;
                    setIsNavigating(true);
                    router.push({ pathname: '/chat-room', params: { roomId: roomData.roomId } });
                    setTimeout(() => setIsNavigating(false), 1000);
                  }}
                >
                  <Ionicons name="chatbubbles-outline" size={20} color="#FFF" />
                  <Text className="text-white font-sans-bold text-[15px] ml-2">Open Chat Room</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-[#03624C] w-full rounded-[16px] py-4 items-center justify-center flex-row mb-3"
                  onPress={() => router.push({ pathname: '/request-to-join', params: { broadcastId, turfName, locationText } })}
                >
                  <Ionicons name="person-add-outline" size={20} color="#FFF" />
                  <Text className="text-white font-sans-bold text-[15px] ml-2">Request to Join</Text>
                </TouchableOpacity>
              )}

            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
