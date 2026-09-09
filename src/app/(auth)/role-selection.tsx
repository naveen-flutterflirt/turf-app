import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: 'CUSTOMER' | 'OWNER') => {
    if (role === 'CUSTOMER') {
      router.push('/(auth)/customer-login');
    } else {
      router.push('/(auth)/owner-login');
    }
  };

  return (
    <View className="flex-1 bg-[#032221]">

      {/* Status Bar */}
      <StatusBar style="light" />

      {/* Full Screen Background */}
      <Image
        source={require('../../../assets/images/role-bg.png')}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* Subtle Overlay */}
      <View
        className="absolute inset-0 bg-[#032221]"
        style={{ opacity: 0.18 }}
      />

      <SafeAreaView className="flex-1 px-6">

        {/* Logo */}
        <View className="items-center pt-8">

          <Image
            source={require('../../../assets/images/logo_only.png')}
            style={{
              width: 58,
              height: 58,
            }}
            resizeMode="contain"
          />

          <Image
            source={require('../../../assets/images/logo_text.png')}
            style={{
              width: 125,
              height: 38,
            }}
            resizeMode="contain"
            className="mt-1"
          />

          <Text className="text-[9px] font-sans-bold text-white/70 tracking-[0.2em] mt-1">
            BOOK • PLAY • GROW
          </Text>

        </View>

        {/* Welcome */}
        <View className="items-center mt-10 mb-8">

          <Text className="text-[32px] font-sans-bold text-white">
            Welcome!
          </Text>

          <Text className="text-[14px] font-sans-medium text-white/70 mt-2">
            Choose how you want to continue
          </Text>

        </View>

        {/* Role Cards */}
        <View className="w-full">

          {/* Customer */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleRoleSelect('CUSTOMER')}
            className="w-full bg-white rounded-2xl p-4 mb-4 flex-row items-center shadow-lg shadow-black/5"
          >

            <View className="w-14 h-14 bg-[#E8F5EE] rounded-full items-center justify-center">

              <Ionicons
                name="person"
                size={27}
                color="#03624C"
              />

            </View>

            <View className="flex-1 ml-4">

              <Text className="font-sans-bold text-[#032221] text-xl">
                Customer
              </Text>

              <Text className="font-sans-medium text-gray-500 text-[13px] mt-1">
                Find and book your favorite turfs
              </Text>

            </View>

            <View className="w-9 h-9 rounded-full bg-[#E8F5EE] items-center justify-center">

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#03624C"
              />

            </View>

          </TouchableOpacity>

          {/* Turf Owner */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleRoleSelect('OWNER')}
            className="w-full bg-white rounded-2xl p-4 flex-row items-center shadow-lg shadow-black/5"
          >

            <View className="w-14 h-14 bg-[#E8F5EE] rounded-full items-center justify-center">

              <Ionicons
                name="business"
                size={27}
                color="#03624C"
              />

            </View>

            <View className="flex-1 ml-4">

              <Text className="font-sans-bold text-[#032221] text-xl">
                Turf Owner
              </Text>

              <Text className="font-sans-medium text-gray-500 text-[13px] mt-1">
                List and manage your turf
              </Text>

            </View>

            <View className="w-9 h-9 rounded-full bg-[#E8F5EE] items-center justify-center">

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#03624C"
              />

            </View>

          </TouchableOpacity>

        </View>

        {/* Bottom Tagline */}
        <View className="flex-1 justify-end items-center pb-8">

          <Text className="text-[10px] font-sans-bold text-white/70 tracking-[0.2em]">
            PLAY MORE
          </Text>

          <Text className="text-[10px] font-sans-bold text-white/70 tracking-[0.2em] mt-1">
            LIVE BETTER
          </Text>

          <View className="w-10 h-0.5 bg-[#00DF81] mt-2" />

        </View>

      </SafeAreaView>

    </View>
  );
}