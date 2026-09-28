import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import FeedbackModal from '../../components/FeedbackModal';

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

const getSportConfig = (sportName: string) => {
  if (!sportName) return { icon: 'trophy-outline', bg: 'bg-gray-100', text: 'text-gray-600', color: '#4B5563' };
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

export default function BookingsScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('All');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState<any>(null);

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ['customerBookings'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/bookings`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const bookings = bookingsResponse?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['customerBookings'] });
    setIsRefreshing(false);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      const status = (b.status || '').toUpperCase();
      // Use end_time to ensure the booking slot is fully over before marking it completed
      const bookingEndDate = new Date(`${b.booking_date?.split('T')[0]}T${b.end_time || '23:59:00'}`);
      const now = new Date();
      const isFuture = bookingEndDate >= now;

      if (selectedTab === 'All') return status === 'CONFIRMED' || status === 'COMPLETED';
      if (selectedTab === 'Upcoming') return (status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && isFuture;
      if (selectedTab === 'Completed') return (status === 'CONFIRMED' || status === 'COMPLETED') && !isFuture;
      if (selectedTab === 'Cancelled') return status === 'CANCELLED';

      return status === 'CONFIRMED';
    }).sort((a: any, b: any) => {
      const dateA = new Date(`${a.booking_date?.split('T')[0]}T${a.start_time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`).getTime();
      return dateB - dateA; // Sort newest first
    });
  }, [bookings, selectedTab]);

  const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];

  const getStatusConfig = (status: string, isFuture: boolean) => {
    status = status.toUpperCase();
    if (status === 'CANCELLED') {
      return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', label: 'Cancelled' };
    }
    if ((status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && isFuture) {
      return { bg: 'bg-[#E6F4EA]', text: 'text-[#1E7B44]', label: 'Upcoming' };
    }
    return { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', label: 'Completed' };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-[28px] font-sans-bold text-[#032221] mb-1">My Bookings</Text>
        <Text className="text-sm font-sans-medium text-gray-500">View and manage your bookings</Text>
      </View>

      {/* Tabs */}
      <View className="px-4 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab)}
                className={`mr-3 px-5 py-2.5 rounded-xl border ${isActive ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-100'}`}
              >
                <Text className={`font-sans-semibold text-[13px] ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 50 }} />
        ) : filteredBookings.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
            <Text className="text-gray-500 font-sans-medium mt-4 text-center px-6">
              No {selectedTab !== 'All' ? selectedTab.toLowerCase() : ''} bookings found.
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking: any) => {
            const bookingEndDate = new Date(`${booking.booking_date?.split('T')[0]}T${booking.end_time || '23:59:00'}`);
            const isFuture = bookingEndDate >= new Date();
            const statusConfig = getStatusConfig(booking.status || '', isFuture);

            // Get first image
            let imageUrl = null;
            if (booking.turf_images) {
              try {
                const parsed = typeof booking.turf_images === 'string' ? JSON.parse(booking.turf_images) : booking.turf_images;
                imageUrl = Array.isArray(parsed) ? (parsed[0]?.image_url || parsed[0]) : null;
              } catch (e) { }
            }
            if (!imageUrl && booking.turf_image) {
              imageUrl = booking.turf_image;
            }

            return (
              <View
                key={booking.booking_id || Math.random().toString()}
                className="bg-white rounded-2xl p-3.5 mb-4 border border-gray-100"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
              >
                <View className="flex-row">
                  {/* Turf Image */}
                  <View className="w-[85px] h-[85px] bg-gray-100 rounded-xl mr-3 overflow-hidden border border-gray-100">
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {/* Booking Details */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1.5">
                      <Text className="font-sans-bold text-[15px] text-[#032221] flex-1 mr-2" numberOfLines={1}>
                        {booking.turf_name || 'Turf Name'}
                      </Text>
                      <View className={`px-2.5 py-1 rounded-md ${statusConfig.bg}`}>
                        <Text className={`text-[10px] font-sans-bold ${statusConfig.text}`}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-1.5">
                      <Ionicons name="location-outline" size={13} color="#6B7280" />
                      <Text className="ml-1 text-[11px] text-gray-500 font-sans-medium" numberOfLines={1}>
                        {booking.turf_address || 'Patna, Bihar'}
                      </Text>
                    </View>

                    {(() => {
                      const sportNameStr = booking.sport_name || (booking.sport && booking.sport.name) || (typeof booking.sport === 'string' ? booking.sport : null);
                      if (!sportNameStr) return null;
                      const config = getSportConfig(sportNameStr);
                      return (
                        <View className="flex-row items-center mb-1.5">
                          <View className={`${config.bg} px-2 py-0.5 rounded-lg flex-row items-center border border-transparent`}>
                            <Ionicons name={config.icon as any} size={11} color={config.color} />
                            <Text className={`font-sans-semibold text-[10px] ml-1 ${config.text}`}>
                              {sportNameStr}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}

                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                        <Text className="ml-1 text-[11px] text-gray-500 font-sans-medium">
                          {formatDate(booking.booking_date)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={13} color="#6B7280" />
                        <Text className="ml-1 text-[11px] text-gray-500 font-sans-medium">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </Text>
                      </View>
                      <Text className="font-sans-bold text-[15px] text-[#03624C]">
                        ₹{parseInt(booking.total_price || '0').toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-50">
                  {statusConfig.label === 'Upcoming' ? (
                    <TouchableOpacity
                      onPress={() => {
                        const sportNameStr = booking.sport_name || (booking.sport && booking.sport.name) || (typeof booking.sport === 'string' ? booking.sport : 'Sport');
                        const sportId = booking.sport_id || (booking.sport && booking.sport.id);

                        router.push({
                          pathname: `/(tabs)/book/${booking.turf_id}` as any,
                          params: {
                            turfData: JSON.stringify({
                              id: booking.turf_id,
                              name: booking.turf_name,
                              price_per_hour: booking.total_price,
                              sports: [{ id: sportId, name: sportNameStr }]
                            }),
                            isReschedule: 'true',
                            bookingId: booking.booking_id || booking.id
                          }
                        });
                      }}
                      className="flex-1 flex-row items-center justify-center bg-[#E6F4EA] py-2.5 rounded-xl border border-[#03624C]/10"
                    >
                      <Ionicons name="calendar" size={14} color="#03624C" />
                      <Text className="ml-1.5 text-xs font-sans-bold text-[#03624C]">Reschedule</Text>
                    </TouchableOpacity>
                  ) : statusConfig.label === 'Completed' ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedBookingForFeedback(booking);
                        setFeedbackModalVisible(true);
                      }}
                      className="flex-1 flex-row items-center justify-center bg-[#FFFBEB] py-2.5 rounded-xl border border-[#F59E0B]/20"
                    >
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text className="ml-1.5 text-xs font-sans-bold text-[#F59E0B]">Review</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center bg-[#E6F4EA] py-2.5 rounded-xl border border-[#03624C]/10"
                    >
                      <Ionicons name="refresh" size={14} color="#03624C" />
                      <Text className="ml-1.5 text-xs font-sans-bold text-[#03624C]">Book Again</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: `/(tabs)/book/booking-details/${booking.id || booking.booking_id}` as any,
                        params: { bookingData: JSON.stringify(booking) }
                      });
                    }}
                    className="flex-1 flex-row items-center justify-center bg-[#E6F4EA] py-2.5 rounded-xl border border-[#03624C]/10"
                  >
                    <Ionicons name="document-text" size={14} color="#03624C" />
                    <Text className="ml-1.5 text-xs font-sans-bold text-[#03624C]">View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Feedback Modal */}
      {selectedBookingForFeedback && (
        <FeedbackModal
          visible={feedbackModalVisible}
          onClose={() => {
            setFeedbackModalVisible(false);
            setSelectedBookingForFeedback(null);
          }}
          bookingId={selectedBookingForFeedback.id || selectedBookingForFeedback.booking_id}
          turfId={selectedBookingForFeedback.turf_id}
          onSuccess={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
}
