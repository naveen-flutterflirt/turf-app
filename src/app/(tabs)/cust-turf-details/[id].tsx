import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApi } from '../../../context/ApiContext';
import { useAppStore } from '../../../stores/useAppStore';
import { useAlert } from '../../../context/AlertContext';

const getAmenitiesList = (amenitiesData: any): string[] => {
  if (!amenitiesData) return [];
  let arr: any[] = [];

  if (Array.isArray(amenitiesData)) {
    arr = amenitiesData;
  } else if (typeof amenitiesData === 'string') {
    try {
      const parsed = JSON.parse(amenitiesData);
      arr = Array.isArray(parsed) ? parsed : [amenitiesData];
    } catch (e) {
      if (amenitiesData.includes(',')) {
        arr = amenitiesData.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        arr = [amenitiesData];
      }
    }
  }

  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.name || item.title || String(item);
    return String(item);
  }).filter(Boolean);
};

const getSportsList = (sportsData: any): any[] => {
  if (!sportsData) return [];
  let arr: any[] = [];

  if (Array.isArray(sportsData)) {
    arr = sportsData;
  } else if (typeof sportsData === 'string') {
    try {
      const parsed = JSON.parse(sportsData);
      arr = Array.isArray(parsed) ? parsed : [sportsData];
    } catch (e) {
      if (sportsData.includes(',')) {
        arr = sportsData.split(',').map((item: string) => item.trim()).filter(Boolean);
      } else {
        arr = [sportsData];
      }
    }
  }

  return arr;
};

const getTurfImageUris = (images: any): string[] => {
  if (!images) return [];
  let parsed = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return parsed.startsWith('http') ? [parsed] : [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((item: any) => {
      return typeof item === 'string' ? item : (item?.image_url || item?.url || item?.uri || '');
    }).filter(Boolean);
  }
  return [];
};

const getSportConfig = (sportName: string) => {
  const name = sportName.toLowerCase();
  if (name.includes('football') || name.includes('soccer')) return { icon: 'football', bg: 'bg-[#E6F4EA]', text: 'text-[#1E7B44]', color: '#1E7B44' };
  if (name.includes('cricket')) return { icon: 'baseball', bg: 'bg-[#FFF4E5]', text: 'text-[#B06000]', color: '#B06000' };
  if (name.includes('tennis')) return { icon: 'tennisball', bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', color: '#166534' };
  if (name.includes('basket')) return { icon: 'basketball', bg: 'bg-[#FFF7ED]', text: 'text-[#C2410C]', color: '#C2410C' };
  if (name.includes('badminton')) return { icon: 'golf', bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', color: '#6B21A8' };
  if (name.includes('swim')) return { icon: 'water', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', color: '#1D4ED8' };
  if (name.includes('table tennis') || name.includes('ping pong')) return { icon: 'tennisball-outline', bg: 'bg-[#FDF4FF]', text: 'text-[#86198F]', color: '#86198F' };
  return { icon: 'trophy-outline', bg: 'bg-gray-100', text: 'text-gray-600', color: '#4B5563' };
};

export default function TurfDetailsScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { id, turfData } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const [turf, setTurf] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: isHeaderVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isHeaderVisible]);

  const isFavorite = favorites.includes(id as string);

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

  const openMap = () => {
    if (!turf?.latitude || !turf?.longitude) {
      showAlert('Error', 'Location coordinates not available for this turf.');
      return;
    }
    const url = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${turf.latitude},${turf.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${turf.latitude},${turf.longitude}`;
    Linking.openURL(url).catch(() => {
      showAlert('Error', 'Could not open the map.');
    });
  };

  const fetchTurfDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/turfs/${id}`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`
        }
      });

      let data: any = {};
      try {
        const textResponse = await response.text();
        data = JSON.parse(textResponse);
      } catch (e) {
        console.warn('Failed to parse JSON response in fetchTurfDetails');
      }

      if (response.ok && data.success) {
        setTurf(data.data || data.turf);
      } else if (response.ok) {
        setTurf(data.turf || data);
      } else {
        showAlert('Error', data.message || 'Failed to load turf details');
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to connect to the server');
      router.push('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (turfData && typeof turfData === 'string') {
        try {
          setTurf(JSON.parse(turfData));
          setIsLoading(false);
        } catch (e) {
          fetchTurfDetails();
        }
      } else {
        fetchTurfDetails();
      }
    }, [id, turfData])
  );

  if (isLoading || !turf) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#03624C" />
      </View>
    );
  }

  const imagesArray = getTurfImageUris(turf?.images);
  const totalImages = imagesArray.length || 1;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="light" />

      {/* Floating Top Nav */}
      <Animated.View 
        className="absolute top-0 left-0 right-0 px-4 flex-row justify-between items-center z-50" 
        pointerEvents={isHeaderVisible ? "box-none" : "none"}
        style={{ 
          paddingTop: insets.top + 10, 
          opacity: headerOpacity,
          transform: [{ translateY: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
        }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/search")} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Heart Icon for favoriting */}
        <TouchableOpacity onPress={() => toggleFavorite(id as string)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#EF4444" : "#000"} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }} 
        bounces={false}
        onScroll={(e) => {
          const currentScrollY = e.nativeEvent.contentOffset.y;
          if (currentScrollY <= 0) {
            setIsHeaderVisible(true);
            lastScrollY.current = 0;
          } else if (currentScrollY > lastScrollY.current + 15) {
            setIsHeaderVisible(false);
            lastScrollY.current = currentScrollY;
          } else if (currentScrollY < lastScrollY.current - 15) {
            setIsHeaderVisible(true);
            lastScrollY.current = currentScrollY;
          }
        }}
        scrollEventThrottle={16}
      >

        {/* Header Image */}
        <View className="h-[300px] w-full relative bg-gray-200">
          {imagesArray.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              className="w-full h-full"
              onMomentumScrollEnd={(e) => {
                const slideSize = e.nativeEvent.layoutMeasurement.width;
                const index = e.nativeEvent.contentOffset.x / slideSize;
                setActiveImageIndex(Math.round(index));
              }}
            >
              {imagesArray.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-screen h-full"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View className="w-full h-full items-center justify-center bg-[#032221]/10">
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          {/* Bottom Gradient Overlay & Pagination */}
          <View className="absolute bottom-0 left-0 right-0 h-24 justify-end pb-10 px-4 pointer-events-none">
            <View className="flex-row justify-between items-center">
              <View className="bg-black/50 rounded-full px-3 py-1">
                <Text className="text-white font-sans-medium text-[11px]">{activeImageIndex + 1} / {totalImages}</Text>
              </View>
              <View className="flex-row gap-1.5">
                {[...Array(totalImages)].map((_, i) => (
                  <View key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View className="px-5 pt-5 pb-6 bg-white rounded-t-[32px] -mt-6">

          {/* Title Row */}
          <View className="flex-row justify-between items-start mb-1.5">
            <View className="flex-1 pr-3">
              <Text className="text-[22px] font-sans-bold text-[#032221] leading-tight">{turf.name}</Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-[13px] font-sans-medium text-gray-500 mb-4">{turf.description || 'A premium turf.'}</Text>

          {/* Sports Pills */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {getSportsList(turf?.sports).length > 0 ? getSportsList(turf?.sports).map((sport: any, index: number) => {
              const sportName = sport.name || sport;
              const config = getSportConfig(sportName);
              return (
                <View key={index} className={`${config.bg} px-3 py-1.5 rounded-xl flex-row items-center border border-transparent`}>
                  <Ionicons name={config.icon as any} size={14} color={config.color} />
                  <Text className={`font-sans-semibold text-xs ml-1.5 ${config.text}`}>{sportName}</Text>
                </View>
              );
            }) : (
              <View className="bg-[#E6F4EA]/60 px-3 py-1.5 rounded-xl flex-row items-center">
                <Ionicons name="football" size={14} color="#1E7B44" />
                <Text className="font-sans-semibold text-xs ml-1.5 text-[#1E7B44]">Football</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="flex-row items-center mb-7">
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text className="font-sans-bold text-[13px] ml-1.5 text-[#032221]">4.5 <Text className="font-sans-medium text-gray-400 font-normal">(0 reviews)</Text></Text>
          </View>

          {/* Turf Information Card */}
          <Text className="text-lg font-sans-bold text-[#032221] mb-3">Turf Information</Text>
          <View className="bg-white rounded-[10px] px-4 py-2 mb-8 border border-gray-100">
            <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-full bg-[#E6F4EA] items-center justify-center">
                  <Ionicons name="server-outline" size={14} color="#03624C" />
                </View>
                <Text className="font-sans-medium text-gray-500 text-[13px] ml-3">Price Per Hour</Text>
              </View>
              <Text className="font-sans-bold text-[#032221] text-sm">₹{parseFloat(turf.price_per_hour || '0').toLocaleString('en-IN')}</Text>
            </View>

            <View className="flex-row justify-between items-center py-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#E6F4EA] items-center justify-center">
                  <Ionicons name="time-outline" size={14} color="#03624C" />
                </View>
                <Text className="font-sans-medium text-gray-500 text-[13px] ml-3">Opening Hours</Text>
              </View>
              <Text className="font-sans-bold text-[#032221] text-sm">{formatTime(turf.opening_time)} - {formatTime(turf.closing_time)}</Text>
            </View>
          </View>

          {/* Amenities Header */}
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-lg font-sans-bold text-[#032221]">Amenities</Text>
          </View>

          {/* Amenities Grid */}
          <View className="flex-row flex-wrap justify-start gap-3 mb-8">
            {getAmenitiesList(turf?.amenities || turf?.facilities).map((amenity, index) => (
              <View key={index} className="bg-[#F4F9F8] rounded-[14px] px-3 pt-1.5 pb-2 flex-row items-center border border-[#E5E7EB]">
                <Text className="font-sans-medium text-[12px] text-[#032221]">{amenity}</Text>
              </View>
            ))}
            {getAmenitiesList(turf?.amenities || turf?.facilities).length === 0 && (
              <Text className="font-sans text-[12px] text-gray-500">No amenities listed</Text>
            )}
          </View>

          {/* Location Header */}
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-lg font-sans-bold text-[#032221]">Location</Text>
            <TouchableOpacity className="flex-row items-center" onPress={openMap}>
              <Text className="font-sans-medium text-[11px] text-gray-500 mr-0.5">View on Map</Text>
              <Ionicons name="chevron-forward" size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Location Card */}
          <TouchableOpacity className="flex-row items-center mb-8" activeOpacity={0.8} onPress={openMap}>
            <View className="w-28 h-20 bg-gray-200 rounded-[14px] items-center justify-center mr-3 relative overflow-hidden border border-gray-100">
              <Image source={require('../../../../assets/images/map.png')} className="w-full h-full opacity-50" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="font-sans-medium text-gray-500 text-[12px] leading-snug mb-1.5" numberOfLines={2}>
                {turf.address ? `${turf.address}, ${turf.city}, ${turf.state} ${turf.pincode}` : `${turf.city}, ${turf.state}`}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="navigate-outline" size={12} color="#6B7280" />
                <Text className="font-sans-medium text-gray-400 text-[10px] ml-1">{turf.latitude}, {turf.longitude}</Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Fixed Bottom Booking Button */}
      <View className="absolute bg-white bottom-0 left-0 right-0 px-6 py-4 flex-row gap-3">
        <TouchableOpacity
          className="bg-[#E8F5EE] border border-[#03624C]/20 flex-1 rounded-2xl py-4 items-center flex-row justify-center"
          onPress={() => router.push({
            pathname: '/create-broadcast' as any,
            params: { turfData: JSON.stringify(turf) }
          })}
        >
          <Text className="text-[#03624C] font-sans-bold text-base mr-2">Find Peoples</Text>
          <Ionicons name="people" size={18} color="#03624C" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#03624C] flex-1 rounded-2xl py-4 items-center flex-row justify-center"
          onPress={() => router.push({
            pathname: `/book/${turf.id}` as any,
            params: { turfData: JSON.stringify(turf) }
          })}
        >
          <Text className="text-white font-sans-bold text-base mr-2">Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

    </View>
  );
}
