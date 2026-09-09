import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
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

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const userName = userData?.name ? userData.name.split(' ')[0] : 'Owner';

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/owner/dashboard`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">

        {/* Header Section */}
        <View className="px-6 pt-2 pb-6 flex-row justify-between items-center">
          <View>
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-sans-bold text-turf-text">TurfCut </Text>
              <Text className="text-xl font-sans-bold text-primary-dark">Owner</Text>
            </View>
            <Text className="text-lg font-sans-bold text-turf-text mb-1">
              Hi, {userName}! 👋
            </Text>
            <Text className="text-xs font-sans-medium text-gray-500">
              Here's what's happening with your turfs.
            </Text>
          </View>

          <TouchableOpacity
            className="relative"
            onPress={() => router.push('/(owner-tabs)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={28} color="#032221" />
            <View className="absolute right-0 top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
          }
        >
          {isLoading && !isRefreshing ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 50 }} />
          ) : (
            <>
              {/* Overview Cards */}
              <View className="px-6 mb-4 mt-2 flex-row flex-wrap justify-between">
                
                {/* Total Revenue */}
                <View className="w-[48%] bg-white rounded-[20px] p-3.5 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                  <View className="flex-row items-center">
                    <View className="w-[42px] h-[42px] rounded-full bg-[#E6F4EA] items-center justify-center mr-3">
                      <Ionicons name="cash" size={22} color="#1E7B44" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 font-sans-medium text-[10px] mb-0.5 uppercase tracking-wide">Revenue</Text>
                      <Text className="text-[#032221] font-sans-bold text-lg" numberOfLines={1} adjustsFontSizeToFit>
                        ₹{dashboardData?.total_earnings?.toLocaleString('en-IN') || '0'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Total Bookings */}
                <View className="w-[48%] bg-white rounded-[20px] p-3.5 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                  <View className="flex-row items-center">
                    <View className="w-[42px] h-[42px] rounded-full bg-[#EBF5FF] items-center justify-center mr-3">
                      <Ionicons name="calendar" size={20} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 font-sans-medium text-[10px] mb-0.5 uppercase tracking-wide">Bookings</Text>
                      <Text className="text-[#032221] font-sans-bold text-lg" numberOfLines={1} adjustsFontSizeToFit>
                        {dashboardData?.total_bookings || '0'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Total Turfs */}
                <View className="w-[48%] bg-white rounded-[20px] p-3.5 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                  <View className="flex-row items-center">
                    <View className="w-[42px] h-[42px] rounded-full bg-[#F3E8FF] items-center justify-center mr-3">
                      <Ionicons name="football" size={22} color="#9333EA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 font-sans-medium text-[10px] mb-0.5 uppercase tracking-wide">Turfs</Text>
                      <Text className="text-[#032221] font-sans-bold text-lg" numberOfLines={1} adjustsFontSizeToFit>
                        {dashboardData?.total_turfs || '0'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Occupancy Rate */}
                <View className="w-[48%] bg-white rounded-[20px] p-3.5 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                  <View className="flex-row items-center">
                    <View className="w-[42px] h-[42px] rounded-full bg-[#FEF3C7] items-center justify-center mr-3">
                      <Ionicons name="pie-chart" size={20} color="#D97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 font-sans-medium text-[10px] mb-0.5 uppercase tracking-wide">Occupancy</Text>
                      <Text className="text-[#032221] font-sans-bold text-lg" numberOfLines={1} adjustsFontSizeToFit>
                        {dashboardData?.occupancy_rate?.toFixed(0) || '0'}%
                      </Text>
                    </View>
                  </View>
                </View>

              </View>

              {/* Recent Bookings Header */}
              <View className="px-6 flex-row justify-between items-center mb-4">
                <Text className="text-lg font-sans-bold text-turf-text">Recent Bookings</Text>
                <TouchableOpacity onPress={() => router.push('/(owner-tabs)/bookings' as any)}>
                  <Text className="text-primary-dark font-sans-medium text-sm">See All</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Bookings List */}
              <View className="px-6">
                {!dashboardData?.recent_bookings || dashboardData.recent_bookings.length === 0 ? (
                  <View className="items-center justify-center py-6">
                    <Text className="text-gray-500 font-sans-medium">No recent bookings found.</Text>
                  </View>
                ) : (
                  dashboardData.recent_bookings.map((booking: any) => {
                    const status = (booking.status || 'CONFIRMED').toUpperCase();
                    let statusConfig = { bg: 'bg-[#E6F4EA]', text: 'text-[#1E7B44]', label: 'CONFIRMED' };

                    if (status === 'PAYMENT_PENDING' || status === 'PENDING') {
                      statusConfig = { bg: 'bg-[#FEF9C3]', text: 'text-[#B08D23]', label: 'PAYMENT PENDING' };
                    } else if (status === 'CANCELLED') {
                      statusConfig = { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', label: 'CANCELLED' };
                    }

                    return (
                      <TouchableOpacity 
                        key={booking.booking_id}
                        onPress={() => router.push({
                          pathname: `/(owner-tabs)/booking-details/${booking.booking_id}` as any,
                          params: { bookingData: JSON.stringify(booking) }
                        })}
                        className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-100"
                        style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                      >
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-sans-bold text-turf-text text-sm" numberOfLines={1}>
                            {booking.customer_name}
                          </Text>
                          <Text className="font-sans-medium text-gray-500 text-xs mt-0.5">
                            {formatDate(booking.booking_date)}, {formatTime(booking.start_time)}
                          </Text>
                          <Text className="font-sans-medium text-gray-500 text-xs">
                            {booking.turf_name}
                          </Text>
                        </View>
                        <View className={`px-2 py-1 rounded-md ${statusConfig.bg}`}>
                          <Text className={`text-[9px] font-sans-bold uppercase ${statusConfig.text}`}>
                            {statusConfig.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
