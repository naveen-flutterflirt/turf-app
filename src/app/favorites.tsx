import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../stores/useAppStore';
import { useApi } from '../context/ApiContext';
import { getTurfImageUri } from '../utils/imageHelper';

export default function FavoritesScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const favorites = useAppStore((state) => state.favorites);

  const [turfs, setTurfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTurfs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/turfs`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTurfs(data.data);
      }
    } catch (error) {
      console.error('Error fetching turfs for favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTurfs();
    }, [])
  );

  const favoriteTurfs = turfs.filter(turf => favorites.includes(turf.id));

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Top Right Background Decoration */}
      <View className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#E8F5EE] rounded-bl-[150px] opacity-60" />

      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-6 z-10 flex flex-row ">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-xl font-sans-bold text-[#032221] mt-1.5">
              Favorites
            </Text></View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : favoriteTurfs.length === 0 ? (
            <View className="px-6 py-10 items-center mt-10">
              <Ionicons name="heart-outline" size={60} color="#E5E7EB" />
              <Text className="text-gray-500 font-sans-medium mt-4 text-center">
                You haven't added any turfs to your favorites yet.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/search')}
                className="mt-6 bg-[#E6F4EA] px-6 py-3 rounded-full"
              >
                <Text className="text-[#03624C] font-sans-bold">Explore Turfs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-6 mb-4">
              {favoriteTurfs.map((turf) => (
                <TouchableOpacity
                  key={turf.id}
                  activeOpacity={0.9}
                  className="w-full bg-white rounded-2xl mb-4 border border-gray-100 flex-row p-3 shadow-sm"
                  style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
                  onPress={() => router.push({
                    pathname: `/cust-turf-details/${turf.id}` as any,
                    params: { turfData: JSON.stringify(turf) }
                  })}
                >
                  {/* Left Side: Image */}
                  <View className="w-[120px] h-[120px] bg-gray-200 rounded-xl relative overflow-hidden mr-4">
                    {getTurfImageUri(turf.images) ? (
                      <Image source={{ uri: getTurfImageUri(turf.images) }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="absolute inset-0 bg-[#032221]/10" />
                    )}
                    <TouchableOpacity className="absolute top-2 right-2 bg-black/20 rounded-full p-1">
                      <Ionicons name="heart" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Right Side: Details */}
                  <View className="flex-1 py-1 flex-col justify-between">
                    <View>
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-[15px] font-sans-bold text-[#032221] flex-1 pr-2" numberOfLines={1}>{turf.name}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </View>

                      <View className="flex-row items-center mb-1.5">
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text className="text-[11px] font-sans-bold text-gray-700 ml-1">4.5</Text>
                        <Text className="text-[11px] font-sans-medium text-gray-400 ml-1">(0 reviews)</Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="location" size={12} color="#9CA3AF" />
                        <Text className="text-[11px] font-sans-medium text-gray-500 ml-1" numberOfLines={1}>{turf.city}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-end justify-between mt-2">
                      <Text className="text-base font-sans-bold text-[#03624C]">
                        ₹{parseFloat(turf.price_per_hour || '0').toLocaleString('en-IN')} <Text className="font-sans-medium text-[#03624C] text-[11px]">/ hour</Text>
                      </Text>
                      <View className="bg-[#03624C] px-3 py-1.5 rounded-full">
                        <Text className="text-white font-sans-bold text-[10px]">Book</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
