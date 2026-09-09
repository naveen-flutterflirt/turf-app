import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApi } from '../../../context/ApiContext';

import { useAppStore } from '../../../stores/useAppStore';
import { useAlert } from '../../../context/AlertContext';

const getAmenitiesList = (amenitiesData: any): string[] => {
  if (!amenitiesData) return [];
  let parsed = amenitiesData;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      if (parsed.includes(',')) {
        parsed = parsed.split(',').map((item: string) => item.trim()).filter(Boolean);
      } else {
        parsed = [parsed];
      }
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((a: any) => typeof a === 'object' ? a.name || a.title || String(a) : String(a));
  }
  return [String(parsed)];
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

export default function TurfDetailsScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { id, turfData } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [turf, setTurf] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const insets = useSafeAreaInsets();

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
    const url = `https://www.google.com/maps/search/?api=1&query=${turf.latitude},${turf.longitude}`;
    Linking.openURL(url).catch(() => {
      showAlert('Error', 'Could not open the map.');
    });
  };

  const fetchTurfDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/owner/turfs/${id}`, {
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

      if (response.ok) {
        setTurf(data.turf || data);
      } else {
        showAlert('Error', data.message || 'Failed to load turf details');
        router.push('/(owner-tabs)/turfs');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to connect to the server');
      router.push('/(owner-tabs)/turfs');
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

  const handleDelete = () => {
    showAlert(
      'Deactivate Turf',
      'Are you sure you want to deactivate and remove this turf?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
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
                showAlert('Success', 'Turf deactivated.');
                router.push('/(owner-tabs)/turfs');
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

  if (isLoading || !turf) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0e07cdd8" />
      </View>
    );
  }

  const imagesArray = getTurfImageUris(turf?.images);
  const totalImages = imagesArray.length || 1;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="light" />

      {/* Overlay to close dropdown when clicking outside */}
      {showMenu && (
        <TouchableOpacity
          activeOpacity={1}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 40 }}
          onPress={() => setShowMenu(false)}
        />
      )}

      {/* Floating Top Nav */}
      <View className="absolute top-0 left-0 right-0 px-4 flex-row justify-between items-center z-50 pointer-events-box-none" style={{ paddingTop: insets.top + 10 }}>
        <TouchableOpacity onPress={() => router.push('/(owner-tabs)/turfs')} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View className="relative">
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
            <Ionicons name="ellipsis-vertical" size={20} color="#000" />
          </TouchableOpacity>
          {showMenu && (
            <View className="absolute top-12 right-0 bg-white rounded-[16px] py-1 w-44 border border-gray-100 z-50 overflow-hidden" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <TouchableOpacity
                className="px-4 py-3 flex-row items-center border-b border-gray-50"
                onPress={() => { setShowMenu(false); router.push({ pathname: `/(owner-tabs)/edit-turf/${id}` as any, params: { turfData: JSON.stringify(turf) } }); }}
              >
                <Ionicons name="pencil" size={16} color="#03624C" />
                <Text className="ml-2.5 font-sans-semibold text-gray-700 text-[13px]">Edit Turf</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-3 flex-row items-center"
                onPress={() => { setShowMenu(false); handleDelete(); }}
              >
                <Ionicons name="pause-circle-outline" size={18} color="#DC2626" />
                <Text className="ml-2.5 font-sans-semibold text-[#DC2626] text-[13px]">Deactivate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} bounces={false}>

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
            <View className="w-full h-full items-center justify-center bg-gray-300">
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          {/* Bottom Gradient Overlay & Pagination */}
          <View className="absolute bottom-0 left-0 right-0 h-24 justify-end pb-10 px-4 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
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
        <View className="px-5 pt-5 pb-10 bg-white rounded-t-[32px] -mt-6">

          {/* Title & Status Row */}
          <View className="flex-row justify-between items-start mb-1.5">
            <View className="flex-1 pr-3">
              <Text className="text-[22px] font-sans-bold text-[#032221] leading-tight">{turf.name}</Text>
            </View>
            <View className={`px-2.5 py-1 rounded-full flex-row items-center mt-1 border ${(turf.status || 'ACTIVE').toUpperCase() === 'PENDING' ? 'bg-[#FEF9C3]/80 border-[#B08D23]/10' :
                (turf.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-[#E6F4EA]/80 border-[#1E7B44]/10' :
                  'bg-gray-100 border-gray-400/10'
              }`}>
              <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(turf.status || 'ACTIVE').toUpperCase() === 'PENDING' ? 'bg-[#B08D23]' :
                  (turf.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-[#1E7B44]' :
                    'bg-gray-500'
                }`} />
              <Text className={`text-[11px] font-sans-bold uppercase ${(turf.status || 'ACTIVE').toUpperCase() === 'PENDING' ? 'text-[#B08D23]' :
                  (turf.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'text-[#1E7B44]' :
                    'text-gray-600'
                }`}>
                {turf.status || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-[13px] font-sans-medium text-gray-500 mb-4">{turf.description || 'A premium turf.'}</Text>

          {/* Sports Pills */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {Array.isArray(turf.sports) ? turf.sports.map((sport: any, index: number) => {
              const sportName = sport.name || sport;
              const isFootball = sportName.toLowerCase() === 'football';
              const isCricket = sportName.toLowerCase() === 'cricket';
              const bgColor = isFootball ? 'bg-[#E6F4EA]/60' : (isCricket ? 'bg-[#FFF4E5]/70' : 'bg-gray-100');
              const textColor = isFootball ? 'text-[#1E7B44]' : (isCricket ? 'text-[#B06000]' : 'text-gray-600');
              const iconName = isFootball ? 'football' : (isCricket ? 'baseball' : 'trophy-outline');
              return (
                <View key={index} className={`${bgColor} px-3 py-1.5 rounded-xl flex-row items-center border border-transparent`}>
                  <Ionicons name={iconName as any} size={14} color={isFootball ? '#1E7B44' : (isCricket ? '#B06000' : '#4B5563')} />
                  <Text className={`font-sans-semibold text-xs ml-1.5 ${textColor}`}>{sportName}</Text>
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
            <Text className="font-sans-bold text-[13px] ml-1.5 text-[#032221]">4.5 <Text className="font-sans-medium text-gray-400 font-normal">(120 reviews)</Text></Text>
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
              <Text className="font-sans-bold text-[#032221] text-sm">₹{parseInt(turf.price_per_hour || '0').toLocaleString('en-IN')}</Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#E6F4EA] items-center justify-center">
                  <Ionicons name="time-outline" size={14} color="#03624C" />
                </View>
                <Text className="font-sans-medium text-gray-500 text-[13px] ml-3">Opening Hours</Text>
              </View>
              <Text className="font-sans-bold text-[#032221] text-sm">{formatTime(turf.opening_time)} - {formatTime(turf.closing_time)}</Text>
            </View>

            <View className="flex-row justify-between items-center py-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#E6F4EA] items-center justify-center">
                  <Ionicons name="calendar-outline" size={14} color="#03624C" />
                </View>
                <Text className="font-sans-medium text-gray-500 text-[13px] ml-3">Total Bookings</Text>
              </View>
              <Text className="font-sans-bold text-[#032221] text-sm">0</Text>
            </View>
          </View>

          {/* Amenities Header */}
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-lg font-sans-bold text-[#032221]">Amenities</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="font-sans-medium text-[11px] text-gray-500 mr-0.5">View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#6B7280" />
            </TouchableOpacity>
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
    </View>
  );
}
