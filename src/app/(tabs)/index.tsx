import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, AppState, useWindowDimensions, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import * as Location from 'expo-location';
import { getTurfImageUri } from '../../utils/imageHelper';

export default function HomeScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const { width: screenWidth } = useWindowDimensions();

  // Container has px-6 padding (24px left + 24px right = 48px).
  // A standard modern aspect ratio for banners is 16:9 or 2:1. Here we use 16:9.
  const bannerWidth = screenWidth - 48;
  const bannerHeight = bannerWidth * (9 / 16);
  const userData = useAppStore((state) => state.userData);
  const userName = userData?.name ? userData.name.split(' ')[0] : 'Guest';

  const cachedFeaturedTurfs = useAppStore((state) => state.cachedFeaturedTurfs);
  const setCachedFeaturedTurfs = useAppStore((state) => state.setCachedFeaturedTurfs);
  const cachedNearbyTurfs = useAppStore((state) => state.cachedNearbyTurfs);
  const setCachedNearbyTurfs = useAppStore((state) => state.setCachedNearbyTurfs);
  const favorites = useAppStore((state) => state.favorites) || [];
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const queryClient = useQueryClient();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [cityName, setCityName] = useState('Locating...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isFetchingLocation = useRef(false);
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const promoScrollRef = useRef<ScrollView>(null);

  const fetchLocation = useCallback(async (silent = false) => {
    if (isFetchingLocation.current) return;
    isFetchingLocation.current = true;

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (!silent) {
          Alert.alert(
            'Location Disabled',
            'Please turn on your device location to see nearby turfs.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Platform.OS === 'ios' ? Linking.openSettings() : Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings()) }
            ]
          );
          setCityName('Location Off');
          setErrorMsg('Device location is turned off.');
        }
        isFetchingLocation.current = false;
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        // If silent (e.g. app just resumed), don't pop up a prompt, just exit
        if (silent) {
          isFetchingLocation.current = false;
          return;
        }
        // Otherwise ask for permission
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        setErrorMsg('Permission denied for location');
        setCityName('Unknown');
        isFetchingLocation.current = false;
        return;
      }

      setErrorMsg(null);

      let loc = await Location.getLastKnownPositionAsync({
        maxAge: 1000 * 60 * 5 // 5 minutes cache
      });

      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

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
      if (!silent) {
        setCityName('Location Error');
        setErrorMsg('Could not fetch GPS location.');
      }
    } finally {
      isFetchingLocation.current = false;
    }
  }, []);

  // Fetch Featured Turfs using React Query
  const { data: featuredTurfsResponse, isLoading: isLoadingFeatured, isFetching: isFetchingFeatured } = useQuery({
    queryKey: ['featuredTurfs'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/turfs`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
    initialData: cachedFeaturedTurfs ? { data: cachedFeaturedTurfs } : undefined,
  });
  const featuredTurfs = (featuredTurfsResponse?.data || []).filter((turf: any) => turf.is_featured);

  // Fetch Nearby Turfs using React Query (Depends on location)
  const { data: nearbyTurfsResponse, isLoading: isLoadingNearby, isFetching: isFetchingNearby } = useQuery({
    queryKey: ['nearbyTurfs', location?.coords?.latitude, location?.coords?.longitude],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/turfs?lat=${location?.coords?.latitude}&lng=${location?.coords?.longitude}&radius=15`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token && !!location,
    initialData: cachedNearbyTurfs ? { data: cachedNearbyTurfs } : undefined,
  });
  const nearbyTurfs = nearbyTurfsResponse?.data || [];

  // Fetch Notifications in background for instant load and unread count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/notifications`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!userData?.token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const rawNotificationsList = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.data || []);
  const unreadNotificationsCount = rawNotificationsList.filter((n: any) => !n.is_read).length;

  // Fetch real weather data
  const { data: weatherData, isLoading: isLoadingWeather } = useQuery({
    queryKey: ['weather', location?.coords?.latitude, location?.coords?.longitude],
    queryFn: async () => {
      if (!location?.coords) return null;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&current_weather=true`);
      return res.json();
    },
    enabled: !!location?.coords,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const isWeatherLoading = isLoadingWeather || !location;

  const getWeatherIcon = (code: number) => {
    if (code === undefined) return '⛅';
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '⛅';
  };

  const weatherTemp = weatherData?.current_weather?.temperature ? Math.round(weatherData.current_weather.temperature) : 28;
  const weatherIcon = getWeatherIcon(weatherData?.current_weather?.weathercode);
  const weatherMessage = weatherTemp > 35 ? 'A bit hot for a game!' : weatherTemp < 15 ? 'Chilly weather, warm up!' : weatherData?.current_weather?.weathercode > 50 ? 'Rainy, check indoor turfs!' : 'Great weather for a game!';

  React.useEffect(() => {
    if (featuredTurfsResponse?.data) {
      setCachedFeaturedTurfs(featuredTurfsResponse.data);
    }
  }, [featuredTurfsResponse?.data]);

  React.useEffect(() => {
    if (nearbyTurfsResponse?.data) {
      setCachedNearbyTurfs(nearbyTurfsResponse.data);
    }
  }, [nearbyTurfsResponse?.data]);

  React.useEffect(() => {
    // Initial fetch (not silent, will prompt if needed)
    fetchLocation(false);

    // Silently check and update location every time the app is opened (comes to foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchLocation(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchLocation]);

  // Fetch Bookings to find nearest upcoming booking
  const { data: bookingsResponse } = useQuery({
    queryKey: ['customerBookings'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/bookings`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const allBookings = bookingsResponse?.data || [];

  // Find nearest upcoming booking
  const nearestUpcomingBooking = React.useMemo(() => {
    const now = new Date();
    const upcoming = allBookings.filter((b: any) => {
      const status = (b.status || '').toUpperCase();
      const bookingDate = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`);
      return (status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && bookingDate >= now;
    }).sort((a: any, b: any) => {
      const dateA = new Date(`${a.booking_date?.split('T')[0]}T${a.start_time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`).getTime();
      return dateA - dateB; // Ascending order to get the nearest
    });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [allBookings]);

  // Determine if we should show the upcoming booking (e.g., if it's within the next 2 days)
  const showUpcomingBooking = React.useMemo(() => {
    if (!nearestUpcomingBooking) return false;
    const now = new Date();
    const bookingDate = new Date(`${nearestUpcomingBooking.booking_date?.split('T')[0]}T${nearestUpcomingBooking.start_time || '00:00:00'}`);
    const diffTime = Math.abs(bookingDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  }, [nearestUpcomingBooking]);

  const formatBookingDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const isLoading = isLoadingFeatured || (isLoadingNearby && !!location) || (!location && cityName === 'Locating...');

  // Dynamic offers query (promos API)
  const { data: offersResponse } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/promos`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });
  const offers = offersResponse?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['featuredTurfs'] });
    await queryClient.refetchQueries({ queryKey: ['offers'] });
    if (location) {
      await queryClient.refetchQueries({ queryKey: ['nearbyTurfs'] });
    } else if (errorMsg) {
      await fetchLocation(true);
    }
    setIsRefreshing(false);
  };

  const handleOfferScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / bannerWidth);
    setActiveOfferIndex(index);
  };

  React.useEffect(() => {
    if (!offers || offers.length <= 1) return;
    const interval = setInterval(() => {
      setActiveOfferIndex((prevIndex) => {
        const nextIndex = prevIndex >= offers.length - 1 ? 0 : prevIndex + 1;
        promoScrollRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [offers, bannerWidth]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <View className="absolute top-0 left-0 right-0 h-[260px] bg-[#E8F5EE] overflow-hidden rounded-b-[40px]">
        <Image
          source={require('../../../assets/images/cust_home.png')}
          className="absolute w-full h-full"
          resizeMode="cover"
        />
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
              <View className="flex-row items-center mb-1 relative">
                <TouchableOpacity
                  onPress={() => router.push('/favorites')}
                  className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm mr-2 z-10"
                >
                  <Ionicons name="heart-outline" size={22} color="#032221" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mr-2 z-10 relative"
                  style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}
                >
                  <Ionicons name="notifications-outline" size={22} color="#032221" />
                  {unreadNotificationsCount > 0 && (
                    <View className="absolute right-1 top-1 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 border-2 border-white">
                      <Text className="text-white text-[9px] font-sans-bold">{unreadNotificationsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Weather Widget */}
              <TouchableOpacity className="bg-[#F9FAFB] rounded-full flex-row items-center px-3 py-1 shadow-sm mt-1" style={{ alignSelf: 'flex-end', minHeight: 40, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                {isWeatherLoading ? (
                  <View className="flex-row items-center justify-center px-1">
                    <ActivityIndicator size="small" color="#03624C" />
                    <Text className="text-[10px] font-sans-medium text-gray-500 ml-2">Fetching...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-[24px] mr-2">{weatherIcon}</Text>
                    <View className="mr-1 w-[55px] py-0.5">
                      <Text className="text-[12px] font-sans-bold text-[#032221] leading-[14px]">{weatherTemp}°C</Text>
                      <Text className="text-[8px] font-sans-medium text-gray-500 leading-[10px]" numberOfLines={2}>
                        {weatherMessage}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 mb-6 z-10">
            <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              <Ionicons name="search" size={20} color="#03624C" />
              <TextInput
                placeholder="Search turfs, sports or locations..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 font-sans-medium text-[#032221] text-sm h-10"
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-6">
            <View className="flex-row pr-10 pb-2">
              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Football')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="football" size={20} color="#03624C" />
                </View>
                <Text className="text-[#03624C] font-sans-bold text-[11px]">Football</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Cricket')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="baseball" size={20} color="#EF4444" />
                </View>
                <Text className="text-[#032221] font-sans-bold text-[11px]">Cricket</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Basketball')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="basketball" size={20} color="#F97316" />
                </View>
                <Text className="text-[#032221] font-sans-bold text-[11px]">Basketball</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Tennis')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="tennisball" size={20} color="#84CC16" />
                </View>
                <Text className="text-[#032221] font-sans-bold text-[11px]">Tennis</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Badminton')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <MaterialCommunityIcons name="badminton" size={20} color="#6B7280" />
                </View>
                <Text className="text-[#032221] font-sans-bold text-[11px]">Badminton</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-100 rounded-2xl w-[72px] h-[85px] items-center justify-center mr-3 shadow-sm"
                onPress={() => router.push('/search?sport=Others')}
              >
                <View className="w-10 h-10 bg-[#F3F4F6] rounded-full items-center justify-center mb-1.5">
                  <Ionicons name="grid" size={20} color="#9CA3AF" />
                </View>
                <Text className="text-[#032221] font-sans-bold text-[11px]">Others</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Upcoming Booking Dynamic Component */}
          {showUpcomingBooking && nearestUpcomingBooking && (() => {
            const booking = nearestUpcomingBooking;
            const turfObj = booking.turf || {};

            const turfName = turfObj.name || booking.turf_name || 'Your Turf';
            const turfCity = turfObj.city || booking.turf_city || booking.turf_address || 'Location';

            let imageUrl = null;
            const rawImages = turfObj.images || booking.turf_images || booking.turf_image;
            if (rawImages) {
              try {
                const parsed = typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;
                imageUrl = Array.isArray(parsed) ? (parsed[0]?.image_url || parsed[0]?.url || parsed[0]?.uri || parsed[0]) : rawImages;
              } catch (e) {
                imageUrl = typeof rawImages === 'string' ? rawImages : null;
              }
            }
            if (typeof imageUrl !== 'string') imageUrl = null;

            const lat = turfObj.latitude || booking.latitude || booking.turf_latitude || turfObj.lat || booking.lat;
            const lng = turfObj.longitude || booking.longitude || booking.turf_longitude || turfObj.lng || booking.lng;

            return (
              <View className="px-6 mb-6">
                <View className="bg-white rounded-[20px] p-3 flex-row shadow-sm border border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                  {/* Image */}
                  <View className="w-[80px] h-[80px] rounded-[14px] overflow-hidden bg-gray-200 mr-3">
                    <Image
                      source={{ uri: getTurfImageUri(imageUrl || rawImages) || imageUrl || 'https://images.unsplash.com/photo-1518605368461-1ee7c5320746?auto=format&fit=crop&q=80&w=300&h=300' }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Details & Buttons Container */}
                  <View className="flex-1 flex-row justify-between">
                    <View className="flex-1 justify-center">
                      <Text className="text-[#03624C] font-sans-bold text-[10px] mb-1">Upcoming Booking</Text>
                      <Text className="text-[#032221] font-sans-bold text-[13px] mb-1.5" numberOfLines={1}>
                        {turfName}
                      </Text>

                      <View className="flex-row items-center mb-1">
                        <Ionicons name="calendar-outline" size={12} color="#03624C" />
                        <Text className="text-gray-500 font-sans-medium text-[10px] ml-1">
                          {formatBookingDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="location" size={12} color="#03624C" />
                        <Text className="text-gray-500 font-sans-medium text-[10px] ml-1" numberOfLines={1}>
                          {turfCity}
                        </Text>
                      </View>
                    </View>

                    {/* Vertical Buttons */}
                    <View className="justify-center pl-2">
                      <TouchableOpacity
                        className="bg-[#03624C] px-3 py-1.5 rounded-lg flex-row items-center justify-center mb-2"
                        onPress={() => {
                          console.log('Directions Button Pressed -> lat:', lat, 'lng:', lng, 'turf:', turfName);
                          if (lat && lng) {
                            const url = Platform.select({
                              ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
                              android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                            });
                            if (url) Linking.openURL(url);
                          } else {
                            const query = encodeURIComponent(`${turfName} ${turfCity}`);
                            const url = `https://maps.google.com/?q=${query}`;
                            Linking.openURL(url);
                          }
                        }}
                      >
                        <Ionicons name="navigate" size={12} color="#FFF" />
                        <Text className="text-white font-sans-bold text-[10px] ml-1">Directions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-white border border-[#03624C] px-3 py-1.5 rounded-lg items-center justify-center"
                        onPress={() => router.push('/bookings')}
                      >
                        <Text className="text-[#03624C] font-sans-bold text-[10px]">View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Promotional Banner Dummy Component */}
          {offers && offers.length > 0 && (
            <View className="px-6 mb-6">
              <ScrollView
                ref={promoScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={bannerWidth}
                snapToAlignment="center"
                onScroll={handleOfferScroll}
                scrollEventThrottle={16}
                style={{ width: bannerWidth }}
              >
                {offers.map((offer: any) => (
                  <View key={offer.id} className="rounded-[10px] overflow-hidden bg-gray-200 shadow-sm" style={{ width: bannerWidth, height: bannerHeight, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                    <Image
                      source={offer.localImage ? offer.localImage : { uri: offer.image_url || offer.image }}
                      className="w-full h-full absolute inset-0"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              {(() => {
                const totalPromos = offersResponse?.total_promos || offers.length;
                return totalPromos > 1 ? (
                  <View className="flex-row justify-center mt-3 items-center">
                    {Array.from({ length: totalPromos }).map((_, i) => (
                      <View
                        key={i}
                        className={`h-2 rounded-full mx-1 ${i === activeOfferIndex ? 'w-4 bg-[#03624C]' : 'w-2 bg-gray-300'}`}
                      />
                    ))}
                  </View>
                ) : null;
              })()}
            </View>
          )}






          {/* Featured Turfs Section - Hide entirely if no turfs and not fetching */}
          {(isFetchingFeatured || featuredTurfs.length > 0) && (
            <>
              {/* Featured Turfs Header */}
              <View className="px-6 flex-row justify-between items-end mb-4 mt-2">
                <Text className="text-lg font-sans-bold text-[#032221]">Featured Turfs</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text className="text-[#03624C] font-sans-bold text-[13px]">See All {'>'}</Text>
                </TouchableOpacity>
              </View>

              {isFetchingFeatured && !isRefreshing ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8" scrollEnabled={false}>
                  <View className="flex-row">
                    {[1, 2, 3].map((i) => (
                      <View key={i} className="w-[200px] bg-white rounded-[20px] mr-4 border border-gray-100 overflow-hidden shadow-sm" style={{ elevation: 2 }}>
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
                          {getTurfImageUri(turf.images) ? (
                            <Image source={{ uri: getTurfImageUri(turf.images) }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="absolute inset-0 bg-[#032221]/10" />
                          )}
                          <View className="absolute inset-0 bg-black/10" />

                          <TouchableOpacity
                            className="absolute top-3 right-3 z-10 bg-black/20 rounded-full p-1.5"
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleFavorite(turf.id);
                            }}
                          >
                            <Ionicons name={favorites.includes(turf.id) ? "heart" : "heart-outline"} size={20} color={favorites.includes(turf.id) ? "#EF4444" : "#FFF"} />
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
            </>
          )}

          {/* Nearby Turfs Header */}
          <View className="px-6 flex-row justify-between items-end mb-4">
            <Text className="text-lg font-sans-bold text-[#032221]">Nearby Turfs</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text className="text-[#03624C] font-sans-bold text-[13px]">See All {'>'}</Text>
            </TouchableOpacity>
          </View>

          {((isLoadingNearby && !!location) || (!location && cityName === 'Locating...')) && !isRefreshing ? (
            <View className="px-6 mb-8">
              {[1, 2, 3].map(i => (
                <View key={i} className="w-full bg-white rounded-2xl mb-4 border border-gray-100 flex-row p-2.5 shadow-sm" style={{ elevation: 1 }}>
                  <View className="w-[100px] h-[75px] bg-gray-200 rounded-xl" />
                  <View className="flex-1 ml-3 py-1 justify-center">
                    <View className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                    <View className="w-1/2 h-3 bg-gray-200 rounded mb-2" />
                    <View className="w-2/3 h-3 bg-gray-200 rounded" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="px-6 mb-8">
              {errorMsg ? (
                <View className="items-center py-6">
                  <Text className="text-red-500 text-sm font-sans-medium text-center mb-3">{errorMsg}</Text>
                  <TouchableOpacity
                    onPress={() => fetchLocation(false)}
                    className="bg-white border border-[#03624C] px-5 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="refresh" size={14} color="#03624C" />
                    <Text className="text-[#03624C] font-sans-bold text-xs ml-1.5">Retry Location</Text>
                  </TouchableOpacity>
                </View>
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
                      {getTurfImageUri(turf.images) ? (
                        <Image source={{ uri: getTurfImageUri(turf.images) }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
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
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
