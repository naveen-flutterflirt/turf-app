import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { useAlert } from '../context/AlertContext';
import { globalSocketInstance } from '../hooks/useGlobalSocket';
import io, { Socket } from 'socket.io-client';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = params.roomId as string;
  const roomName = (params.roomName as string) || 'Match Group';
  const isHost = params.isHost === 'true';
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<any[]>(() => {
    const cached = queryClient.getQueryData(['chatHistory', roomId]);
    return Array.isArray(cached) ? cached : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch myChats to get the dynamic room name
  const { data: myChatsResponse } = useQuery({
    queryKey: ['myChats'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/chats`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const myChats = myChatsResponse?.data || [];
  const currentChat = myChats.find((c: any) => c.room_id === roomId || c.id === roomId);
  const dynamicRoomName = currentChat?.room_name || currentChat?.name || roomName;

  // Fetch initial chat history
  const { isLoading } = useQuery({
    queryKey: ['chatHistory', roomId],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/community/chat/${roomId}`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      const msgs = Array.isArray(data) ? data : (data?.data || []);
      setMessages(msgs);
      return msgs;
    },
    enabled: !!roomId && !!userData?.token,
  });

  // Socket.io Setup using Global Socket
  useEffect(() => {
    if (!userData?.id || !roomId || !globalSocketInstance) return;

    // Join room
    globalSocketInstance.emit('join_chat_room', { roomId, userId: userData.id });
    setSocket(globalSocketInstance);

    const handleReceiveMessage = (msg: any) => {
      if (String(msg.room_id || msg.roomId) === String(roomId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleRemoved = (data: any) => {
      if (String(data.roomId) === String(roomId) || String(data.broadcastId) === String(roomId)) {
        showAlert('Removed', 'You have been removed from this chat.', [
          { text: 'OK', onPress: () => router.replace('/messages') }
        ]);
      }
    };

    const handleDeleted = (data: any) => {
      if (String(data.broadcastId) === String(roomId)) {
        showAlert('Deleted', 'This community chat was deleted.', [
          { text: 'OK', onPress: () => router.replace('/messages') }
        ]);
      }
    };

    globalSocketInstance.on('receive_message', handleReceiveMessage);
    globalSocketInstance.on('removed_from_chat', handleRemoved);
    globalSocketInstance.on('community_deleted', handleDeleted);

    return () => {
      globalSocketInstance?.off('receive_message', handleReceiveMessage);
      globalSocketInstance?.off('removed_from_chat', handleRemoved);
      globalSocketInstance?.off('community_deleted', handleDeleted);
    };
  }, [userData?.id, roomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !socket || !userData?.id || !roomId) return;

    const messageData = {
      roomId,
      senderId: userData.id,
      message: newMessage.trim(),
      sender_name: userData.name || 'Me', // Optimistic UI
    };

    // Emit to backend
    socket.emit('send_message', messageData);

    // We expect backend to echo it back via 'receive_message' event

    setNewMessage('');
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      className="flex-1 bg-[#F9FAFB]"
    >
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2 mr-1">
              <Ionicons name="arrow-back" size={24} color="#032221" />
            </TouchableOpacity>
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3 overflow-hidden">
              <Ionicons name="people" size={20} color="#9CA3AF" />
            </View>
            <View>
              <Text className="text-[16px] font-sans-bold text-[#032221]">{dynamicRoomName}</Text>
              <Text className="text-[12px] font-sans-medium text-[#00DF81]">Online</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push({ pathname: '/chat-info', params: { roomId, roomName: dynamicRoomName, isHost: isHost ? 'true' : 'false' } })}>
            <Ionicons name="ellipsis-vertical" size={22} color="#032221" />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : messages.length === 0 ? (
            <View className="items-center mt-10">
              <Text className="text-gray-500 font-sans-medium">No messages yet. Say hi!</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === userData?.id || msg.sender_id === userData?.id;

              return (
                <View key={index} className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                  {!isMe && (
                    <Text className="text-[11px] font-sans-medium text-gray-500 mb-1 ml-1">
                      {msg.sender_name || 'User'}
                    </Text>
                  )}
                  <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-[#03624C] rounded-tr-sm' : 'bg-white border border-gray-100 rounded-tl-sm shadow-sm'}`}>
                    <Text className={`text-[14px] font-sans-medium ${isMe ? 'text-white' : 'text-[#032221]'}`}>
                      {msg.message}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="px-5 py-3 bg-white border-t border-gray-100 flex-row items-center">


          <View className="flex-1 bg-[#F3F4F6] rounded-full px-4 py-2 flex-row items-center min-h-[44px]">
            <TextInput
              className="flex-1 text-[14px] font-sans-medium text-[#032221] max-h-[100px]"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
          </View>

          <TouchableOpacity
            className={`ml-3 w-[44px] h-[44px] rounded-full items-center justify-center ${newMessage.trim() ? 'bg-[#03624C]' : 'bg-gray-200'}`}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={18} color={newMessage.trim() ? '#FFF' : '#9CA3AF'} className="ml-1" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
