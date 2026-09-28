import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';
import { useApi } from '../context/ApiContext';

export let globalSocketInstance: Socket | null = null;

export const disconnectGlobalSocket = () => {
  if (globalSocketInstance) {
    globalSocketInstance.disconnect();
    globalSocketInstance = null;
  }
};

export const useGlobalSocket = () => {
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userData?.id || !baseUrl) return;

    if (!globalSocketInstance) {
      globalSocketInstance = io(baseUrl, { transports: ['websocket'] });
      
      globalSocketInstance.on('connect', () => {
        console.log('Global socket connected');
        // 1. Join Personal Notification Room immediately on login
        globalSocketInstance?.emit('register_user', userData.id);
      });

      // Global event listeners for Cache Invalidation & Real-Time Sync
      globalSocketInstance.on('new_join_request', (data: any) => {
        console.log('Socket: new_join_request', data);
        // Invalidate broadcasts so the host sees the "Pending Requests" red badge update
        queryClient.invalidateQueries({ queryKey: ['communityBroadcasts'] });
        // Also invalidate specific broadcast requests if they are on the requests screen
        queryClient.invalidateQueries({ queryKey: ['broadcastRequests'] });
      });

      globalSocketInstance.on('request_accepted', (data: any) => {
        console.log('Socket: request_accepted', data);
        queryClient.invalidateQueries({ queryKey: ['communityBroadcasts'] });
        queryClient.invalidateQueries({ queryKey: ['myChats'] });
      });

      globalSocketInstance.on('group_name_updated', (data: any) => {
        console.log('Socket: group_name_updated', data);
        queryClient.invalidateQueries({ queryKey: ['myChats'] });
        // chat-room.tsx is already watching myChats cache, so it will update instantly!
      });

      globalSocketInstance.on('removed_from_chat', (data: any) => {
        console.log('Socket: removed_from_chat', data);
        queryClient.invalidateQueries({ queryKey: ['myChats'] });
        // chat-room.tsx listens to this specific event to redirect if needed
      });

      globalSocketInstance.on('community_deleted', (data: any) => {
        console.log('Socket: community_deleted', data);
        queryClient.invalidateQueries({ queryKey: ['myChats'] });
        queryClient.invalidateQueries({ queryKey: ['communityBroadcasts'] });
      });
    }

    return () => {
      // Don't disconnect here so it persists across screens.
    };
  }, [userData?.id, baseUrl, queryClient]);
};
