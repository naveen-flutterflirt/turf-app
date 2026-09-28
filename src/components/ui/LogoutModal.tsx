import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ visible, onClose, onConfirm }: LogoutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="w-full bg-white rounded-[24px] p-6 items-center shadow-xl">
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
            <Ionicons name="log-out-outline" size={32} color="#DC2626" />
          </View>

          <Text className="text-xl font-sans-bold text-gray-900 mb-2">
            Sign Out
          </Text>

          <Text className="text-sm font-sans-medium text-gray-500 text-center mb-8 px-4">
            Are you sure you want to sign out of your account? You will need to login again to access your dashboard.
          </Text>

          <View className="flex-row w-full gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="flex-1 py-4 bg-gray-50 rounded-xl items-center border border-gray-100"
            >
              <Text className="text-gray-700 font-sans-semibold text-[15px]">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onConfirm}
              className="flex-1 py-4 bg-[#DC2626] rounded-xl items-center shadow-sm"
              style={{ shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
            >
              <Text className="text-white font-sans-semibold text-[15px]">Yes, Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
