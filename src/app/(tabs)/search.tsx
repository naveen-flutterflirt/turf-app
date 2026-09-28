import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import { getTurfImageUri } from '../../utils/imageHelper';

export default function SearchScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals visibility
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);

  const params = useLocalSearchParams();
  const initialSport = params.sport as string | null;

  // Default filters
  const [filters, setFilters] = useState<{ radius: string | null; min_price: string | null; max_price: string | null; sport: string | null }>({
    radius: null,
    min_price: null,
    max_price: null,
    sport: initialSport || null,
  });

  // Listen for changes to the sport parameter (e.g. navigating from home tab)
  React.useEffect(() => {
    if (params.sport) {
      setFilters(prev => ({ ...prev, sport: params.sport as string }));
    }
  }, [params.sport]);

  // Sports list for category selector
  const sportsList = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Others'];

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['searchTurfs', filters],
    queryFn: async ({ pageParam = 1 }) => {
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
      if (filters.sport && filters.sport !== 'Others') {
        params.append('sport', filters.sport);
      }

      params.append('page', pageParam.toString());
      params.append('limit', '10');

      const queryParams = params.toString();
      const url = queryParams ? `${baseUrl}/customer/turfs?${queryParams}` : `${baseUrl}/customer/turfs`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch turfs');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, total_pages } = lastPage.meta;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userData?.token,
  });

  const turfs = data?.pages.flatMap(page => page.data || []) || [];
  const totalTurfsCount = data?.pages?.[0]?.meta?.total || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredTurfs = turfs.filter((turf: any) => {
    if (turf.is_open === false) return false;

    if (filters.sport === 'Others') {
      const hasOtherSport = turf.sports && turf.sports.some((s: any) => {
        const name = typeof s === 'string' ? s : (s.name || '');
        return !['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton'].includes(name);
      });
      if (!hasOtherSport) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (turf.name && turf.name.toLowerCase().includes(query)) ||
        (turf.city && turf.city.toLowerCase().includes(query)) ||
        (turf.sports && turf.sports.some((s: any) => {
          const name = typeof s === 'string' ? s : (s.name || '');
          return name.toLowerCase().includes(query);
        }))
      );
    }

    return true;
  });

  const handleSetDistance = (radius: string | null) => {
    setFilters({ ...filters, radius });
    setShowDistanceModal(false);
  };

  const handleSetPrice = (min: string | null, max: string | null) => {
    setFilters({ ...filters, min_price: min, max_price: max });
    setShowPriceModal(false);
  };

  const handleSetSport = (sport: string | null) => {
    setFilters({ ...filters, sport });
    setShowSportModal(false);
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

  const hasActiveFilters = filters.radius !== null || filters.max_price !== null || filters.sport !== null;

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
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
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
              className={`px-4 pb-2 pt-1 rounded-full flex-row items-center border shadow-sm ${filters.radius ? 'bg-[#E6F4EA] border-[#03624C]/20' : 'bg-white border-gray-100'}`} style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <Text className={`font-sans-bold text-[13px] mx-2 ${filters.radius ? 'text-[#03624C]' : 'text-[#032221]'}`}>{getDistanceLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color={filters.radius ? '#03624C' : '#03624C'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPriceModal(true)}
              className={`px-4 pb-2 pt-1 rounded-full flex-row items-center border shadow-sm ${filters.max_price ? 'bg-[#E6F4EA] border-[#03624C]/20' : 'bg-white border-gray-100'}`} style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <Text className={`font-sans-bold text-[13px] mx-2 ${filters.max_price ? 'text-[#03624C]' : 'text-[#032221]'}`}>{getPriceLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color={filters.max_price ? '#03624C' : '#03624C'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSportModal(true)}
              className={`px-4 pb-2 pt-1 rounded-full flex-row items-center border shadow-sm ${filters.sport ? 'bg-[#E6F4EA] border-[#03624C]/20' : 'bg-white border-gray-100'}`} style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <Text className={`font-sans-bold text-[13px] mx-2 ${filters.sport ? 'text-[#03624C]' : 'text-[#032221]'}`}>{filters.sport || 'Sport'}</Text>
              <Ionicons name="chevron-down" size={14} color={filters.sport ? '#03624C' : '#03624C'} />
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={() => setFilters({ radius: null, min_price: null, max_price: null, sport: null })}
                className="bg-red-50 px-3 py-2 rounded-full flex-row items-center border border-red-100 shadow-sm ml-auto" style={{ elevation: 2 }}
              >
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text className="text-[#EF4444] font-sans-bold text-[12px] ml-1">Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results Header */}
          <View className="px-6 flex-row justify-between items-end mb-4">
            <Text className="text-[13px] font-sans-bold text-[#032221]">
              {searchQuery ? filteredTurfs.length : totalTurfsCount} turfs found
            </Text>
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
              {filteredTurfs.map((turf: any) => (
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
                    {getTurfImageUri(turf.images) ? (
                      <Image source={{ uri: getTurfImageUri(turf.images) }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
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
              {isFetchingNextPage && (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color="#03624C" />
                </View>
              )}
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

      {/* Sport Filter Modal */}
      <Modal visible={showSportModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" onPress={() => setShowSportModal(false)} />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-[#032221]">Select Sport</Text>
              <TouchableOpacity onPress={() => setShowSportModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sportsList.map((sport, index) => (
                <TouchableOpacity
                  key={sport}
                  onPress={() => handleSetSport(sport)}
                  className={`py-4 border-b border-gray-100 flex-row justify-between ${filters.sport === sport ? 'bg-[#E6F4EA]/30 px-4 rounded-xl border-b-0 mb-2' : ''} ${index > 0 && filters.sport === sport ? 'mt-2' : ''}`}
                >
                  <Text className={`font-sans-medium text-base ${filters.sport === sport ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>{sport}</Text>
                  {filters.sport === sport && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity onPress={() => handleSetSport(null)} className={`py-4 flex-row justify-between ${filters.sport === null ? 'bg-[#E6F4EA]/30 px-4 rounded-xl mt-2' : ''}`}>
                <Text className={`font-sans-medium text-base ${filters.sport === null ? 'text-[#03624C] font-sans-bold' : 'text-gray-700'}`}>Any Sport</Text>
                {filters.sport === null && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
