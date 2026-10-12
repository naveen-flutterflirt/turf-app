import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationDisabledModalProps {
  visible: boolean;
  onClose: () => void;
  onSettings: () => void;
}

export function LocationDisabledModal({ visible, onClose, onSettings }: LocationDisabledModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="w-full bg-white rounded-[24px] p-6 items-center shadow-xl">
          <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center mb-4">
            <Ionicons name="location-outline" size={32} color="#F97316" />
          </View>

          <Text className="text-xl font-sans-bold text-gray-900 mb-2">
            Location Disabled
          </Text>

          <Text className="text-sm font-sans-medium text-gray-500 text-center mb-8 px-4">
            Please turn on your device location to see nearby turfs and get directions.
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
              onPress={onSettings}
              className="flex-1 py-4 bg-[#F97316] rounded-xl items-center shadow-sm"
              style={{ shadowColor: '#F97316', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
            >
              <Text className="text-white font-sans-semibold text-[15px]">Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
