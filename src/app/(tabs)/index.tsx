import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const userName = userData?.name ? userData.name.split(' ')[0] : 'Guest';

  const queryClient = useQueryClient();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [cityName, setCityName] = useState('Locating...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Featured Turfs using React Query
  const { data: featuredTurfsResponse, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featuredTurfs'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/turfs`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });
  const featuredTurfs = featuredTurfsResponse?.data || [];

  // Fetch Nearby Turfs using React Query (Depends on location)
  const { data: nearbyTurfsResponse, isLoading: isLoadingNearby } = useQuery({
    queryKey: ['nearbyTurfs', location?.coords?.latitude, location?.coords?.longitude],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/turfs?lat=${location?.coords?.latitude}&lng=${location?.coords?.longitude}&radius=15`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token && !!location,
  });
  const nearbyTurfs = nearbyTurfsResponse?.data || [];

  React.useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission denied for location');
        setCityName('Unknown');
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        let geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        if (geocode && geocode.length > 0) {
          setCityName(geocode[0].city || geocode[0].region || 'Found');
        } else {
          setCityName('Found');
        }
      } catch (err) {
        console.error("Error getting location:", err);
        setCityName('Location Error');
        setErrorMsg('Could not fetch GPS location.');
      }
    };
    fetchLocation();
  }, []);

  const isLoading = isLoadingFeatured || (isLoadingNearby && !!location) || (!location && cityName === 'Locating...');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['featuredTurfs'] });
    if (location) {
      await queryClient.refetchQueries({ queryKey: ['nearbyTurfs'] });
    }
    setIsRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <View className="absolute top-0 left-0 right-0 h-[320px] bg-[#E8F5EE] overflow-hidden rounded-b-[40px]">

      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
          }
        >

          <View className="px-6 pt-4 pb-4 flex-row justify-between items-start z-10">
            <View>
              <Text className="text-sm font-sans-medium text-gray-500 mb-0.5">Hi,</Text>
              <Text className="text-2xl font-sans-bold text-[#032221]">
                {userName} 👋
              </Text>
              <TouchableOpacity className="flex-row items-center mt-2">
                <Ionicons name="location" size={16} color="#03624C" />
                <Text className="text-[#03624C] font-sans-bold text-sm ml-1" numberOfLines={1}>
                  {cityName}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#03624C" className="ml-1" />
              </TouchableOpacity>
            </View>

            <View className="items-end mt-1">
              {/* <View className="flex-row items-center mb-1 relative">
                <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm mr-2 z-10">
                  <Ionicons name="notifications-outline" size={22} color="#032221" />
                  <View className="absolute right-2 top-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                </TouchableOpacity>
              </View> */}
            </View>
          </View>

          <View className="px-6 mb-8 z-10">
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-1.5 shadow-sm border border-gray-100" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              <Ionicons name="search" size={20} color="#03624C" />
              <TextInput
                placeholder="Search turfs, sports or locations..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 font-sans-medium text-turf-text text-sm"
              />
            </View>
          </View>
          {/* 
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8">
            <View className="flex-row pr-10">
              <TouchableOpacity className="bg-[#E6F4EA] border border-[#00DF81]/30 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3" style={{ elevation: 2, shadowColor: '#00DF81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-1.5 shadow-sm">
                  <Ionicons name="football" size={20} color="#03624C" />
                </View>
                <Text className="text-[#03624C] font-sans-bold text-[11px]">Football</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm">
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="basketball" size={20} color="#4B5563" />
                </View>
                <Text className="text-gray-500 font-sans-medium text-[11px]">Basketball</Text>
              </TouchableOpacity>
            </View>
          </ScrollView> */}

          {isLoading && !isRefreshing ? (
            <View className="mt-2">
              {/* Featured Turfs Skeleton */}
              <View className="px-6 flex-row justify-between items-end mb-4">
                <View className="w-32 h-6 bg-gray-200 rounded-md" />
                <View className="w-16 h-4 bg-gray-200 rounded-md" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8" scrollEnabled={false}>
                <View className="flex-row">
                  {[1, 2, 3].map((i) => (
                    <View key={i} className="w-[200px] bg-white rounded-[20px] mr-4 border border-gray-100 overflow-hidden">
                      <View className="h-32 bg-gray-200" />
                      <View className="p-3.5 pt-4">
                        <View className="w-3/4 h-4 bg-gray-200 rounded mb-3" />
                        <View className="w-1/2 h-3 bg-gray-200 rounded mb-3" />
                        <View className="w-full h-3 bg-gray-200 rounded mb-3" />
                        <View className="w-1/3 h-4 bg-gray-200 rounded" />
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Nearby Turfs Skeleton */}
              <View className="px-6 flex-row justify-between items-end mb-4">
                <View className="w-32 h-6 bg-gray-200 rounded-md" />
                <View className="w-16 h-4 bg-gray-200 rounded-md" />
              </View>
              <View className="px-6 mb-8">
                {[1, 2, 3].map(i => (
                  <View key={i} className="w-full bg-white rounded-2xl mb-4 border border-gray-100 flex-row p-2.5">
                    <View className="w-[100px] h-[75px] bg-gray-200 rounded-xl" />
                    <View className="flex-1 ml-3 py-1 justify-center">
                      <View className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                      <View className="w-1/2 h-3 bg-gray-200 rounded mb-2" />
                      <View className="w-2/3 h-3 bg-gray-200 rounded" />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <>
              <View className="px-6 flex-row justify-between items-end mb-4">
                <Text className="text-lg font-sans-bold text-[#032221]">Featured Turfs</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text className="text-[#03624C] font-sans-bold text-[13px]">See All {'>'}</Text>
                </TouchableOpacity>
              </View>

              {featuredTurfs.length === 0 ? (
                <View className="px-6 mb-8 items-center py-6">
                  <Text className="text-gray-500 font-sans-medium">No featured turfs available.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8">
                  <View className="flex-row pr-10">
                    {featuredTurfs.map((turf: any) => (
                      <TouchableOpacity
                        key={turf.id}
                        activeOpacity={0.9}
                        className="w-[200px] bg-white rounded-[20px] mr-4 border border-gray-100 overflow-hidden shadow-sm" style={{ elevation: 2 }}
                        onPress={() => router.push({
                          pathname: `/cust-turf-details/${turf.id}` as any,
                          params: { turfData: JSON.stringify(turf) }
                        })}
                      >
                        <View className="h-32 bg-gray-200 relative">
                          {turf.images && turf.images.length > 0 ? (
                            <Image source={{ uri: turf.images[0].image_url }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="absolute inset-0 bg-[#032221]/10" />
                          )}
                          <View className="absolute inset-0 bg-black/10" />

                          <TouchableOpacity className="absolute top-3 right-3">
                            <Ionicons name="heart-outline" size={22} color="#FFF" />
                          </TouchableOpacity>

                          <View className="absolute bottom-3 left-3 bg-[#032221]/80 rounded px-2 py-1 flex-row items-center border border-white/10">
                            <Ionicons name="star" size={10} color="#FBBF24" />
                            <Text className="text-white font-sans-bold text-xs ml-1">4.5</Text>
                          </View>
                        </View>

                        <View className="p-3.5 pt-4">
                          <Text className="text-[15px] font-sans-bold text-[#032221] mb-1.5" numberOfLines={1}>{turf.name}</Text>

                          <View className="flex-row items-center mb-1.5 flex-wrap">
                            {turf.sports && turf.sports.slice(0, 2).map((sport: any, index: number) => (
                              <React.Fragment key={sport.id}>
                                <Ionicons name={sport.name.toLowerCase() === 'football' ? 'football' : sport.name.toLowerCase() === 'tennis' ? 'tennisball' : sport.name.toLowerCase() === 'basketball' ? 'basketball' : 'baseball'} size={12} color="#4B5563" />
                                <Text className="text-[11px] font-sans-medium text-gray-500 ml-1 mr-2">{sport.name}</Text>
                                {index < Math.min(turf.sports.length, 2) - 1 && <Text className="text-[11px] font-sans-medium text-gray-400 mr-2">•</Text>}
                              </React.Fragment>
                            ))}
                          </View>

                          <View className="flex-row items-center mb-3">
                            <Ionicons name="location" size={12} color="#9CA3AF" />
                            <Text className="text-[11px] font-sans-medium text-gray-400 ml-1" numberOfLines={1}>{turf.city}</Text>
                          </View>

                          <Text className="text-base font-sans-bold text-[#03624C]">
                            ₹{parseFloat(turf.price_per_hour || '0').toLocaleString('en-IN')} <Text className="font-sans-medium text-[#03624C] text-[11px]">/ hour</Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              <View className="px-6 flex-row justify-between items-end mb-4">
                <Text className="text-lg font-sans-bold text-[#032221]">Nearby Turfs</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text className="text-[#03624C] font-sans-bold text-[13px]">See All {'>'}</Text>
                </TouchableOpacity>
              </View>

              <View className="px-6 mb-8">
                {errorMsg ? (
                  <Text className="text-red-500 text-sm text-center my-4">{errorMsg}</Text>
                ) : nearbyTurfs.length === 0 ? (
                  <Text className="text-gray-500 font-sans-medium text-center my-4">No nearby turfs found in a 15km radius.</Text>
                ) : (
                  nearbyTurfs.map((turf: any) => (
                    <TouchableOpacity
                      key={turf.id}
                      activeOpacity={0.8}
                      className="w-full bg-white rounded-2xl mb-4 border border-gray-100 flex-row items-center p-2.5 shadow-sm" style={{ elevation: 1 }}
                      onPress={() => router.push({
                        pathname: `/cust-turf-details/${turf.id}` as any,
                        params: { turfData: JSON.stringify(turf) }
                      })}
                    >
                      <View className="w-[100px] h-[75px] bg-gray-200 rounded-xl relative overflow-hidden">
                        {turf.images && turf.images.length > 0 ? (
                          <Image source={{ uri: turf.images[0].image_url }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
                        ) : (
                          <View className="absolute inset-0 bg-[#032221]/10" />
                        )}
                      </View>

                      <View className="flex-1 ml-3 py-1">
                        <Text className="text-sm font-sans-bold text-[#032221] mb-1" numberOfLines={1}>{turf.name}</Text>

                        <View className="flex-row items-center mb-1.5">
                          <Ionicons name="star" size={12} color="#FBBF24" />
                          <Text className="text-[11px] font-sans-bold text-gray-700 ml-1">4.5</Text>
                          <Text className="text-[11px] font-sans-medium text-gray-400 ml-1">(0 reviews)</Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1 pr-2">
                            <Ionicons name="location" size={12} color="#9CA3AF" />
                            <Text className="text-[11px] font-sans-medium text-gray-500 ml-1" numberOfLines={1}>
                              {turf.distance_km ? `${parseFloat(turf.distance_km).toFixed(1)} km • ` : ''}{turf.city}
                            </Text>
                          </View>
                          <Text className="text-[13px] font-sans-bold text-[#03624C]">₹{parseFloat(turf.price_per_hour || '0').toLocaleString('en-IN')} <Text className="font-normal text-[10px]">/ hr</Text></Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="ml-1" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
