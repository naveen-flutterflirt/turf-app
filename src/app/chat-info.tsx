import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { useAlert } from '../context/AlertContext';

export default function ChatInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = params.roomId as string;
  const initialRoomName = params.roomName as string;
  const isHost = params.isHost === 'true';
  const queryClient = useQueryClient();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const { showAlert } = useAlert();

  const [isEditingName, setIsEditingName] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(initialRoomName || '');

  // Fetch Members
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['chatMembers', roomId],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/chat/${roomId}/members`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch chat members');
      return response.json();
    },
    enabled: !!roomId && !!userData?.token,
  });

  const members = membersResponse?.data || [];
  const memberCount = membersResponse?.count || members.length;
  
  // Fallback to determine if user is host by checking the members list roles
  // or assuming the first member (creator) is the host if no roles are explicitly returned.
  const actualIsHost = isHost || members.some((m: any, index: number) => 
    m.user_id === userData?.id && (m.role === 'host' || m.role === 'admin' || m.is_host || m.is_admin || index === 0)
  );

  // Update Room Name Mutation
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await fetch(`${baseUrl}/community/chat/${roomId}/name`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName, room_name: newName })
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (${response.status}). Please try again.`);
      }
      if (!response.ok) throw new Error(data.message || 'Failed to update room name');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChats'] });
      setIsEditingName(false);
      showAlert('Success', 'Group name updated successfully!');
    },
    onError: (error: any) => {
      showAlert('Error', error.message || 'Failed to update group name.');
    }
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${baseUrl}/community/chat/${roomId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to remove member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMembers', roomId] });
      showAlert('Success', 'Member removed successfully.');
    },
    onError: () => {
      showAlert('Error', 'Failed to remove member.');
    }
  });

  const handleUpdateName = () => {
    if (roomNameInput.trim() && roomNameInput !== initialRoomName) {
      updateNameMutation.mutate(roomNameInput.trim());
    } else {
      setIsEditingName(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    showAlert(
      "Remove Member?",
      `Are you sure you want to remove ${memberName} from this chat?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeMemberMutation.mutate(memberId)
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2 mr-1">
              <Ionicons name="arrow-back" size={24} color="#032221" />
            </TouchableOpacity>
            <Text className="text-[18px] font-sans-bold text-[#032221]">Chat Settings</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Group Name Section */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <Text className="text-[13px] font-sans-medium text-gray-500 mb-2">Group Name</Text>

            {isEditingName ? (
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 bg-[#F3F4F6] text-[16px] font-sans-bold text-[#032221] px-4 py-3 rounded-xl mr-3"
                  value={roomNameInput}
                  onChangeText={setRoomNameInput}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleUpdateName}
                  disabled={updateNameMutation.isPending}
                  className="bg-[#03624C] w-12 h-12 rounded-xl items-center justify-center"
                >
                  {updateNameMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="text-[18px] font-sans-bold text-[#032221] flex-1">{roomNameInput || 'Match Group'}</Text>
                {actualIsHost && (
                  <TouchableOpacity onPress={() => setIsEditingName(true)} className="p-2">
                    <Ionicons name="pencil" size={20} color="#03624C" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Members Section */}
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="px-5 py-4 border-b border-gray-100 flex-row items-center justify-between bg-gray-50/50">
              <Text className="text-[16px] font-sans-bold text-[#032221]">Members</Text>
              <View className="bg-[#E8F5EE] px-2 py-1 rounded-md">
                <Text className="text-[12px] font-sans-bold text-[#03624C]">{memberCount} participants</Text>
              </View>
            </View>

            {isLoadingMembers ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" color="#03624C" />
              </View>
            ) : (
              members.map((member: any, index: number) => {
                const isMe = member.user_id === userData?.id;
                return (
                  <View key={member.user_id} className={`px-5 py-4 flex-row items-center justify-between ${index !== members.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-[#F3F4F6] rounded-full items-center justify-center mr-3 border border-gray-100">
                        <Text className="text-[16px] font-sans-bold text-[#032221]">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="text-[15px] font-sans-bold text-[#032221]" numberOfLines={1}>
                            {member.name}
                          </Text>
                          {isMe && (
                            <View className="bg-gray-100 px-2 py-0.5 rounded-md ml-2">
                              <Text className="text-[10px] font-sans-bold text-gray-500">You</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[11px] font-sans-medium text-gray-400 mt-0.5">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {actualIsHost && !isMe && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(member.user_id, member.name)}
                        className="bg-[#FEF2F2] px-3 py-2 rounded-lg border border-[#FECACA]"
                      >
                        <Text className="text-[#DC2626] font-sans-bold text-[12px]">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
