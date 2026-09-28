import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BroadcastSuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          
          {/* Confetti & Icon Container */}
          <View className="relative items-center justify-center mb-8 h-40 w-40">
            {/* Decorative "Confetti" Elements */}
            <View className="absolute top-2 left-6 w-2 h-4 bg-[#03624C] rounded-full transform -rotate-45" />
            <View className="absolute top-4 right-10 w-2 h-2 bg-[#2563EB] rounded-full" />
            <View className="absolute bottom-8 left-2 w-2 h-6 bg-[#2563EB] rounded-full transform rotate-45" />
            <View className="absolute bottom-4 right-6 w-2 h-4 bg-[#03624C] rounded-full transform -rotate-12" />
            <View className="absolute top-1/2 -right-2 w-3 h-3 bg-[#03624C] rounded-full" />
            <View className="absolute top-10 right-4 w-1.5 h-4 bg-[#2563EB] rounded-full transform rotate-45" />

            {/* Main Image */}
            <View className="w-28 h-28 items-center justify-center">
              <Image source={require('../../assets/images/broadcast_icon.png')} className="w-full h-full" resizeMode="contain" />
            </View>
          </View>

          {/* Text Content */}
          <Text className="text-[24px] font-sans-bold text-[#032221] mb-4 text-center">
            Broadcast Created!
          </Text>
          <Text className="text-[14px] font-sans-medium text-gray-500 text-center leading-relaxed px-4">
            Your post is now live. Players interested in this turf can see and join.
          </Text>

        </View>

        {/* Bottom Actions */}
        <View className="px-6 pb-8 pt-4">
          <TouchableOpacity
            className="bg-[#03624C] w-full rounded-[16px] py-4 items-center justify-center mb-3"
            onPress={() => router.push({
              pathname: '/(tabs)/community',
              params: { tab: 'my_broadcasts' }
            })}
          >
            <Text className="text-white font-sans-bold text-[16px]">View Broadcast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-white border border-[#03624C] w-full rounded-[16px] py-4 items-center justify-center"
            onPress={() => router.navigate('/(tabs)')}
          >
            <Text className="text-[#03624C] font-sans-bold text-[16px]">Back to Home</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}
