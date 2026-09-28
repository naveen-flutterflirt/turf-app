import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { getTurfImageUri } from '../utils/imageHelper';

export default function BroadcastRequestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const broadcast = params.broadcastData ? JSON.parse(params.broadcastData as string) : null;
  const targetBroadcastId = params.broadcastId as string || broadcast?.id;

  // Fetch host requests
  const { data: requestsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['broadcastRequests', targetBroadcastId],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/requests`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data || []);
    },
    enabled: !!userData?.token,
  });

  // Filter requests for THIS specific broadcast
  const allRequests = requestsData || [];
  const broadcastRequests = targetBroadcastId ? allRequests.filter((r: any) => r.broadcast_id === targetBroadcastId || r.broadcastId === targetBroadcastId || r.broadcast?._id === targetBroadcastId) : allRequests;

  const pendingReqs = broadcastRequests.filter((r: any) => (r.status || '').toLowerCase() === 'pending');
  const acceptedReqs = broadcastRequests.filter((r: any) => (r.status || '').toLowerCase() === 'accepted');
  const rejectedReqs = broadcastRequests.filter((r: any) => (r.status || '').toLowerCase() === 'rejected');

  const getDisplayedRequests = () => {
    if (activeTab === 'pending') return pendingReqs;
    if (activeTab === 'accepted') return acceptedReqs;
    return rejectedReqs;
  };

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`${baseUrl}/community/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify({ requestId: requestId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to accept request (${response.status}). Please try again.`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['broadcastRequests', targetBroadcastId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Could not accept the request. Please try again.');
    }
  });

  // Reject request mutation (dummy for now as we don't have reject endpoint)
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
       // Placeholder - update to actual reject endpoint when ready
       return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcastRequests', targetBroadcastId] });
      Alert.alert('Request Rejected');
    }
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 -ml-2">
            <Ionicons name="chevron-back" size={28} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221]">Join Requests</Text>
        </View>

        {/* Broadcast Summary Card */}
        {broadcast && (
          <View className="px-5 py-3 flex-row items-center bg-white border-b border-gray-100">
            <Image 
              source={{ uri: broadcast.image || getTurfImageUri(broadcast.turf?.images) || 'https://images.unsplash.com/photo-1518605368461-1ee7c5320746?auto=format&fit=crop&q=80&w=300&h=300' }} 
              className="w-16 h-16 rounded-[12px] bg-gray-200 mr-3" 
            />
            <View className="flex-1 justify-center">
              <Text className="text-[16px] font-sans-bold text-[#032221] mb-1" numberOfLines={1}>
                {broadcast.message || "Let's play football!"}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text className="text-[13px] font-sans-medium text-gray-500 ml-1">{broadcast.turfName || broadcast.turf?.name || 'Green Field Arena'}</Text>
              </View>
            </View>
          </View>
        )}



        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : isError ? (
            <View className="py-10 items-center">
              <Text className="text-gray-500 font-sans-medium text-center">Failed to load requests.</Text>
            </View>
          ) : broadcastRequests.length === 0 ? (
            <View className="py-20 items-center">
              <View className="w-24 h-24 bg-[#E8F5EE] rounded-full items-center justify-center mb-6">
                <Ionicons name="file-tray-full" size={40} color="#03624C" />
              </View>
              <Text className="text-[18px] font-sans-bold text-[#032221] mb-2 text-center">
                No requests yet
              </Text>
              <Text className="text-gray-500 font-sans-medium text-center text-[14px] px-6 leading-relaxed mb-8">
                When someone requests to join, it will appear here.
              </Text>
              
              <TouchableOpacity 
                className="border border-[#03624C] rounded-xl py-3.5 px-6 items-center justify-center"
                onPress={() => router.back()}
              >
                <Text className="text-[#03624C] font-sans-bold text-[14px]">Back to My Broadcasts</Text>
              </TouchableOpacity>
            </View>
          ) : (
            broadcastRequests.map((request: any) => (
              <View key={request.id || request._id} className="mb-6">
                <View className="flex-col mb-3">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-[15px] font-sans-bold text-[#032221] mb-0.5">
                      {request.name || request.requester_name || request.user_name || request.user?.name || request.participant_name || request.author || 'User'}
                    </Text>
                    {request.timeAgo && (
                      <Text className="text-[11px] font-sans-medium text-gray-400">
                        {request.timeAgo}
                      </Text>
                    )}
                  </View>
                  {request.skill_level && (
                    <Text className="text-[12px] font-sans-medium text-gray-500 mb-1">
                      {request.skill_level}
                    </Text>
                  )}
                  {request.message && (
                    <Text className="text-[13px] font-sans-medium text-[#4B5563]">
                      {request.message}
                    </Text>
                  )}
                </View>

                {activeTab === 'pending' && (
                  <View className="flex-row space-x-3 mt-1">
                    <TouchableOpacity 
                      className="flex-1 py-2.5 rounded-xl bg-[#03624C] items-center justify-center"
                      onPress={() => acceptMutation.mutate(request.request_id || request.id || request._id)}
                      disabled={acceptMutation.isPending}
                    >
                      {acceptMutation.isPending ? (
                         <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                         <Text className="font-sans-bold text-[13px] text-white">Accept</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 py-2.5 rounded-xl bg-[#FEE2E2] items-center justify-center ml-3"
                      onPress={() => rejectMutation.mutate(request.request_id || request.id || request._id)}
                    >
                      <Text className="font-sans-bold text-[13px] text-[#DC2626]">Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
