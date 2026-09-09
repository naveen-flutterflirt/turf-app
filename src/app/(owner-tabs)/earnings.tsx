import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function OwnerEarningsScreen() {
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-2xl font-sans-bold text-turf-text">Earnings</Text>
        <Text className="text-sm font-sans-medium text-gray-500 mt-2">View your earnings and payouts.</Text>
      </SafeAreaView>
    </View>
  );
}
