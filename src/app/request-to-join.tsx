import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';

export default function RequestToJoinScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const [message, setMessage] = useState('');

  // Data from route params or fallback
  const turfImage = (params.turfImage as string) || 'https://images.unsplash.com/photo-1518605368461-1ee7c5320746?auto=format&fit=crop&q=80&w=300&h=300';
  const turfName = (params.turfName as string) || 'Green Field Arena';
  const locationText = (params.locationText as string) || 'Bhopal, MP';
  const broadcastId = params.broadcastId as string;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${baseUrl}/community/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ broadcastId })
      });
      if (!response.ok) throw new Error('Failed to join broadcast');
      return response.json();
    },
    onSuccess: () => {
      // Simulate receiving a notification
      queryClient.setQueryData(['notifications'], (old: any) => {
        const newNotif = {
          id: `mock-${Date.now()}`,
          title: 'Request Sent',
          message: 'Your request to join the broadcast was sent successfully.',
          type: 'SYSTEM',
          is_read: false,
          created_at: new Date().toISOString()
        };
        if (Array.isArray(old)) return [newNotif, ...old];
        if (old?.data) return { ...old, data: [newNotif, ...old.data] };
        return [newNotif];
      });

      router.push('/request-sent');
    },
    onError: (err) => {
      console.error(err);
      Alert.alert("Error", "Could not send join request.");
    }
  });

  const handleSendRequest = () => {
    if (!broadcastId) {
      Alert.alert("Error", "Broadcast ID is missing.");
      return;
    }
    joinMutation.mutate();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221] ml-2">
            Request to Join
          </Text>
        </View>

        <View className="p-5 flex-1">
          {/* Turf Info Card */}
          <View className="flex-row items-center mb-8">
            <Image source={{ uri: turfImage }} className="w-[88px] h-[88px] rounded-[20px] bg-gray-200 shadow-sm" />
            <View className="ml-4 flex-1">
              <Text className="text-[16px] font-sans-bold text-[#032221] mb-1">{turfName}</Text>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text className="text-[13px] font-sans-medium text-gray-500 ml-1">{locationText}</Text>
              </View>
              <View className="bg-[#E8F5EE] self-start px-2.5 py-1 rounded-md flex-row items-center">
                <Ionicons name="football-outline" size={12} color="#03624C" />
                <Text className="text-[11px] font-sans-bold text-[#03624C] ml-1">Football</Text>
              </View>
            </View>
          </View>

          {/* Message Input */}
          <View className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
            <TextInput
              multiline
              placeholder="Message (optional)&#10;&#10;Hi, I'd love to join. I'm a regular player!"
              placeholderTextColor="#9CA3AF"
              className="font-sans-medium text-[14px] text-[#032221] h-32"
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              maxLength={200}
            />
            <Text className="text-right text-[11px] font-sans-medium text-gray-400 mt-2">
              {message.length}/200
            </Text>
          </View>
        </View>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-50">
          <TouchableOpacity
            className="bg-[#03624C] w-full rounded-[16px] py-4 items-center justify-center flex-row"
            onPress={handleSendRequest}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-sans-bold text-[16px]">Send Request</Text>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
