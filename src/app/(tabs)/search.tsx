import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';

export default function SearchScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [turfs, setTurfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals visibility
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Default filters
  const [filters, setFilters] = useState<{ radius: string | null; min_price: string | null; max_price: string | null }>({
    radius: null,
    min_price: null,
    max_price: null,
  });

  const fetchTurfs = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.radius) {
        params.append('lat', '23.250081'); // Using default location since it's a mock or fixed loc for now
        params.append('lng', '77.466382');
        params.append('radius', filters.radius);
      }
      if (filters.max_price) {
        params.append('min_price', filters.min_price || '0');
        params.append('max_price', filters.max_price);
      }

      const queryParams = params.toString();
      const url = queryParams ? `${baseUrl}/customer/turfs?${queryParams}` : `${baseUrl}/customer/turfs`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTurfs(data.data);
      }
    } catch (error) {
      console.error('Error fetching turfs for search:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTurfs(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTurfs();
    }, [filters])
  );

  const filteredTurfs = turfs.filter((turf) => {
    if (turf.is_open === false) return false;
    const query = searchQuery.toLowerCase();
    return (
      turf.name.toLowerCase().includes(query) ||
      (turf.city && turf.city.toLowerCase().includes(query)) ||
      (turf.sports && turf.sports.some((s: any) => s.name.toLowerCase().includes(query)))
    );
  });

  const handleSetDistance = (radius: string | null) => {
    setFilters({ ...filters, radius });
    setShowDistanceModal(false);
  };

  const handleSetPrice = (min: string | null, max: string | null) => {
    setFilters({ ...filters, min_price: min, max_price: max });
    setShowPriceModal(false);
  };

  // Helper to format filter display
  const getDistanceLabel = () => {
    if (filters.radius === '5') return '0-5 km';
    if (filters.radius === '15') return '5-15 km';
    if (filters.radius === '30') return '15-30 km';
    return 'Near me';
  };

  const getPriceLabel = () => {
    if (filters.max_price === '1000') return '₹0 - ₹1,000';
    if (filters.max_price === '3000') return '₹1,000 - ₹3,000';
    if (filters.max_price === '6000') return '₹3,000 - ₹6,000';
    return 'Price';
  };

  const hasActiveFilters = filters.radius !== null || filters.max_price !== null;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Top Right Background Decoration */}
      <View className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#E8F5EE] rounded-bl-[150px] opacity-60" />

      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-3 flex-row justify-between items-start z-10">
          <View>
            <Text className="text-[28px] font-sans-bold text-[#032221] mb-1 leading-tight">
              Search Turfs
            </Text>
            <Text className="text-sm font-sans-medium text-gray-500">
              Find the perfect turf near you
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
          }
        >

          {/* Search Bar */}
          <View className="px-6 mb-4 z-10">
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-1.5 shadow-sm border border-gray-100" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              <Ionicons name="search" size={20} color="#03624C" />
              <TextInput
                placeholder="Search by turf name, sports or location..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 font-sans-medium text-turf-text text-[13px] h-10"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filters Row */}
          <View className="px-6 flex-row items-center flex-wrap gap-2 mb-6 z-10">
            <TouchableOpacity
              onPress={() => setShowDistanceModal(true)}
              className={`px-4 py-2 rounded-full flex-row items-center border shadow-sm ${filters.radius ? 'bg-[#E6F4EA] border-[#03624C]/20' : 'bg-white border-gray-100'}`} style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <Ionicons name="location" size={14} color={filters.radius ? '#03624C' : '#03624C'} />
              <Text className={`font-sans-bold text-[13px] mx-2 ${filters.radius ? 'text-[#03624C]' : 'text-[#032221]'}`}>{getDistanceLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color={filters.radius ? '#03624C' : '#03624C'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPriceModal(true)}
              className={`px-4 py-2 rounded-full flex-row items-center border shadow-sm ${filters.max_price ? 'bg-[#E6F4EA] border-[#03624C]/20' : 'bg-white border-gray-100'}`} style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <Ionicons name="options-outline" size={16} color={filters.max_price ? '#03624C' : '#03624C'} />
              <Text className={`font-sans-bold text-[13px] mx-2 ${filters.max_price ? 'text-[#03624C]' : 'text-[#032221]'}`}>{getPriceLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color={filters.max_price ? '#03624C' : '#03624C'} />
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={() => setFilters({ radius: null, min_price: null, max_price: null })}
                className="bg-red-50 px-3 py-2 rounded-full flex-row items-center border border-red-100 shadow-sm ml-auto" style={{ elevation: 2 }}
              >
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text className="text-[#EF4444] font-sans-bold text-[12px] ml-1">Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results Header */}
          <View className="px-6 flex-row justify-between items-end mb-4">
            <Text className="text-[13px] font-sans-bold text-[#032221]">{filteredTurfs.length} turfs found</Text>
            <View className="flex-row items-center">
              {/* <Text className="text-[11px] font-sans-medium text-gray-500 mr-2">Sort by</Text>
              <Ionicons name="swap-vertical" size={12} color="#03624C" className="mr-1" />
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-[12px] font-sans-bold text-[#032221] mr-1">Recommended</Text>
                <Ionicons name="chevron-down" size={12} color="#03624C" />
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Turf List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : filteredTurfs.length === 0 ? (
            <View className="px-6 py-10 items-center">
              <Text className="text-gray-500 font-sans-medium">No turfs match your search filters.</Text>
            </View>
          ) : (
            <View className="px-6 mb-4">
              {filteredTurfs.map((turf) => (
                <TouchableOpacity
                  key={turf.id}
                  activeOpacity={0.9}
                  className="w-full bg-white rounded-2xl mb-4 border border-gray-100 flex-row p-3 shadow-sm"
                  style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
                  onPress={() => router.push({
                    pathname: `/cust-turf-details/${turf.id}` as any, // Temporary fallback path
                    params: { turfData: JSON.stringify(turf) }
                  })}
                >
                  {/* Left Side: Image */}
                  <View className="w-[100px] h-[100px] bg-gray-200 rounded-xl relative overflow-hidden mr-4">
                    {turf.images && turf.images.length > 0 ? (
                      <Image source={{ uri: turf.images[0].image_url }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="absolute inset-0 bg-[#032221]/10" />
                    )}
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
                        <Text className="text-white font-sans-bold text-[10px]">View</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Distance Filter Modal */}
      <Modal visible={showDistanceModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" onPress={() => setShowDistanceModal(false)} />
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-[#032221]">Select Distance</Text>
              <TouchableOpacity onPress={() => setShowDistanceModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleSetDistance('5')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.radius === '5' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.radius === '5' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>0-5 km</Text>
              {filters.radius === '5' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetDistance('15')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.radius === '15' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2 mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.radius === '15' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>5-15 km</Text>
              {filters.radius === '15' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetDistance('30')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.radius === '30' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2 mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.radius === '30' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>15-30 km</Text>
              {filters.radius === '30' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetDistance(null)} className={`py-4 flex-row justify-between ${filters.radius === null ? 'bg-[#E6F4EA]/30 px-4 rounded-xl mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.radius === null ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>Any distance</Text>
              {filters.radius === null && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Filter Modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" onPress={() => setShowPriceModal(false)} />
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-[#032221]">Select Price Range</Text>
              <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleSetPrice('0', '1000')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.max_price === '1000' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.max_price === '1000' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>₹0 - ₹1,000</Text>
              {filters.max_price === '1000' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetPrice('1000', '3000')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.max_price === '3000' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2 mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.max_price === '3000' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>₹1,000 - ₹3,000</Text>
              {filters.max_price === '3000' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetPrice('3000', '6000')} className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.max_price === '6000' ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2 mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.max_price === '6000' ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>₹3,000 - ₹6,000</Text>
              {filters.max_price === '6000' && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSetPrice(null, null)} className={`py-4 flex-row justify-between ${filters.max_price === null ? 'bg-[#E6F4EA]/30 px-4 rounded-xl mt-2' : ''}`}>
              <Text className={`font-sans-medium text-base ${filters.max_price === null ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>Any Price</Text>
              {filters.max_price === null && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
