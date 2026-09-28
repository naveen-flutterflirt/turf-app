import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';

export default function BroadcastPreviewScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  
  const [broadcast, setBroadcast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchBroadcast = async () => {
      try {
        const response = await fetch(`${baseUrl}/community/broadcasts/${slug}`, {
          headers: { 'Authorization': `Bearer ${userData?.token}` }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setBroadcast(data.data || data.broadcast);
        } else {
          Alert.alert('Error', 'Broadcast not found or expired.');
          router.replace('/(tabs)');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch broadcast details.');
        router.replace('/(tabs)');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBroadcast();
  }, [slug]);

  const handleJoin = async () => {
    if (!broadcast?.id) return;
    setIsJoining(true);
    try {
      const response = await fetch(`${baseUrl}/community/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify({ broadcast_id: broadcast.id })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'You have successfully joined the broadcast!', [
          { text: 'View', onPress: () => router.replace({ pathname: '/broadcast-details', params: { broadcastData: JSON.stringify(broadcast) } }) }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to join broadcast.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#03624C" />
        <Text className="mt-4 text-gray-500 font-sans-medium">Loading broadcast details...</Text>
      </View>
    );
  }

  if (!broadcast) return null;

  const sportName = broadcast.sport_name || 'Sport';
  const timePosted = broadcast.created_at ? new Date(broadcast.created_at).toLocaleDateString() : 'Recently';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="px-5 py-3 flex-row justify-between items-center bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full">
            <Ionicons name="close" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221]">Preview Broadcast</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#E8F5EE] px-3 py-1 rounded-full">
                <Text className="text-[#03624C] font-sans-bold text-[12px]">{sportName}</Text>
              </View>
              <Text className="text-gray-400 font-sans-medium text-[12px] ml-auto">{timePosted}</Text>
            </View>

            <Text className="text-[20px] font-sans-bold text-[#032221] mb-2">{broadcast.message}</Text>
            
            <View className="bg-gray-50 rounded-xl p-4 mt-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="person-outline" size={18} color="#6B7280" />
                <Text className="text-[14px] font-sans-medium text-[#4B5563] ml-2">Host: {broadcast.host_name}</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text className="text-[14px] font-sans-medium text-[#4B5563] ml-2">
                  {broadcast.play_date ? new Date(broadcast.play_date).toLocaleDateString('en-GB') : 'Date TBD'}
                </Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text className="text-[14px] font-sans-medium text-[#4B5563] ml-2">
                  {broadcast.start_time ? broadcast.start_time.slice(0,5) : 'Time TBD'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={18} color="#6B7280" />
                <Text className="text-[14px] font-sans-medium text-[#4B5563] ml-2">
                  Needed: {broadcast.players_needed}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-5 py-4 bg-white border-t border-gray-100">
          <TouchableOpacity 
            className="w-full h-14 bg-[#03624C] rounded-full items-center justify-center flex-row"
            onPress={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text className="text-white font-sans-bold text-[16px]">Join Game</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" className="ml-2" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
