import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

const getTurfImageUri = (images: any) => {
  if (!images) return '';
  let parsed = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return parsed.startsWith('http') ? parsed : '';
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0];
    return typeof first === 'string' ? first : (first?.image_url || first?.url || first?.uri || '');
  }
  return '';
};

const getTurfImagesCount = (images: any) => {
  if (!images) return 0;
  let parsed = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return parsed.startsWith('http') ? 1 : 0;
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.length;
  }
  return 0;
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  if (!h || !m) return time;
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function OwnerTurfsScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const [turfs, setTurfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('Active');

  const handleDelete = (id: string) => {
    showAlert(
      'Delete Turf',
      'Are you sure you want to permanently delete this turf?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/owner/turfs/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${userData?.token}`
                }
              });
              if (response.ok) {
                showAlert('Success', 'Turf deleted successfully.');
                fetchTurfs(true);
              } else {
                showAlert('Error', 'Failed to delete turf.');
              }
            } catch (err) {
              showAlert('Error', 'Failed to connect to the server');
            }
          }
        }
      ]
    );
  };


  const fetchTurfs = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/owner/turfs`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      let data: any = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse JSON response in fetchTurfs');
      }
      if (response.ok) {
        let parsedTurfs = data.turfs || data.data || data;
        setTurfs(Array.isArray(parsedTurfs) ? parsedTurfs : []);
      } else {
        showAlert('Error', data.message || 'Failed to load turfs');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTurfs(true);
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTurfs();
    }, [])
  );

  const filteredTurfs = Array.isArray(turfs) ? turfs.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = (t.status || 'ACTIVE').toUpperCase() === selectedTab.toUpperCase();
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  }) : [];

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <View className="flex-1 pt-12">

        {/* Header Section */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-start">
          <View>
            <Text className="text-2xl font-sans-bold text-turf-text">My Turfs</Text>
            <Text className="text-sm font-sans-medium text-gray-500 mt-1">Manage and grow your turfs</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(owner-tabs)/add-turf')}
            className="bg-[#03624C] rounded-lg px-4 py-2 flex-row items-center"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="text-white font-sans-semibold text-sm ml-1">Add Turf</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4 mt-4 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search turfs by name, location..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 font-sans-medium text-turf-text"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {['Active', 'Pending', 'Rejected'].map((tab) => {
              const isActive = selectedTab === tab;
              const count = turfs.filter(t => (t.status || 'ACTIVE').toUpperCase() === tab.toUpperCase()).length;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  className={`mr-3 px-4 py-2 rounded-full border ${isActive ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`font-sans-semibold text-[13px] ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {tab} <Text className={isActive ? 'text-white/80' : 'text-gray-400'}>({count})</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
          }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 50 }} />
          ) : filteredTurfs.length === 0 ? (
            <View className="items-center justify-center mt-20">
              <Ionicons name="football-outline" size={60} color="#E5E7EB" />
              <Text className="text-gray-500 font-sans-medium mt-4">
                {searchQuery ? "No turfs match your search." : selectedTab !== 'All' ? `No ${selectedTab.toLowerCase()} turfs found.` : "You have no turfs listed."}
              </Text>
            </View>
          ) : (
            filteredTurfs
              .map((turf) => (
                <View
                  key={turf.id || turf._id}
                  className={`bg-white rounded-[24px] mb-6 p-4 border relative ${turf.is_open !== false ? 'border-gray-100' : 'opacity-60 border-gray-200'}`}
                  style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}
                >
                  <View className="flex-row mb-1">
                    {/* Left Side: Image (40%) */}
                    <View className="w-[130px] h-[130px] rounded-2xl overflow-hidden relative mr-4 bg-gray-200">
                      {getTurfImageUri(turf.images) ? (
                        <Image
                          source={{ uri: getTurfImageUri(turf.images) }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-300">
                          <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                        </View>
                      )}

                      {/* Status Badge inside image top-left */}
                      <View className="absolute top-2 left-2 rounded-full px-2.5 py-1.5 flex-row items-center bg-white/95" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                        <Ionicons name={turf.is_open !== false ? 'checkmark-circle' : 'close-circle'} size={12} color={turf.is_open !== false ? '#1E7B44' : '#DC2626'} />
                        <Text className={`font-sans-bold text-[10px] ml-1 uppercase tracking-wide ${turf.is_open !== false ? 'text-[#1E7B44]' : 'text-[#DC2626]'}`}>
                          {turf.is_open !== false ? 'ACTIVE' : 'DEACTIVATED'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side: Details (60%) */}
                    <View className="flex-1 justify-start">
                      <View className="flex-row justify-between items-start py-2 z-50">
                        <View className="flex-1 pr-2">
                          <Text className="font-sans-bold text-[#032221] text-lg leading-tight" numberOfLines={1}>{turf.name}</Text>
                        </View>

                      </View>

                      {/* Location */}
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-[12px] font-sans-medium text-gray-500 ml-1.5 flex-1" numberOfLines={1}>
                          {turf.city}, {turf.state}
                        </Text>
                      </View>

                      {/* Open Hours */}
                      <View className="flex-row items-start mt-0.5">
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                        <View className="ml-2 flex-1">
                          <Text className="font-sans-bold text-[#032221] text-xs" numberOfLines={1}>
                            {formatTime(turf.opening_time)} – {formatTime(turf.closing_time)}
                          </Text>
                          <Text className="font-sans-medium text-gray-400 text-[10px] mt-0.5">Open Hours</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View className='h-[1px] w-full bg-gray-200 my-2'></View>

                  {/* 2-Column Info Row */}
                  <View className="flex-row flex-wrap justify-between items-center mb-5 gap-y-3">
                    {/* Price */}
                    <View className="flex-row items-center w-[48%]">
                      <View className="w-[38px] h-[38px] rounded-[12px] bg-white border border-[#E6F4EA] items-center justify-center mr-3" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                        <Ionicons name="server-outline" size={18} color="#03624C" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-bold text-[#032221] text-[13px]" numberOfLines={1}>₹{parseInt(turf.price_per_hour || '0').toLocaleString('en-IN')} <Text className="text-[11px] font-sans-medium text-gray-500 font-normal">/ hour</Text></Text>
                        <Text className="font-sans-medium text-gray-400 text-[11px] mt-0.5">Price</Text>
                      </View>
                    </View>

                    {/* Bookings */}
                    <View className="flex-row items-center w-[48%]">
                      <View className="w-[38px] h-[38px] rounded-[12px] bg-white border border-[#E6F4EA] items-center justify-center mr-3" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                        <Ionicons name="calendar-outline" size={18} color="#03624C" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-bold text-[#032221] text-[13px]" numberOfLines={1}>{turf.bookings_count || 0}</Text>
                        <Text className="font-sans-medium text-gray-400 text-[11px] mt-0.5">Total Bookings</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => router.push({
                        pathname: `/(owner-tabs)/turf-details/${turf.id || turf._id}` as any,
                        params: { turfData: JSON.stringify(turf) }
                      })}
                      className="flex-1 py-3.5 border border-[#03624C] bg-[#F4F9F8] rounded-xl items-center justify-center flex-row"
                    >
                      <Ionicons name="eye-outline" size={18} color="#03624C" />
                      <Text className="font-sans-semibold text-[#03624C] text-sm ml-2">View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push({
                        pathname: '/(owner-tabs)/bookings',
                        params: { turfId: turf.id || turf._id }
                      })}
                      className="flex-1 py-3.5 bg-[#03624C] rounded-xl items-center justify-center flex-row"
                    >
                      <Ionicons name="calendar-outline" size={18} color="#fff" />
                      <Text className="font-sans-semibold text-white text-sm ml-2">View Bookings</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
