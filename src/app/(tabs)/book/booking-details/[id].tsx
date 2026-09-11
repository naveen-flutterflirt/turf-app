import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../../../context/ApiContext';
import { useAppStore } from '../../../../stores/useAppStore';
import * as Clipboard from 'expo-clipboard';

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

const getDuration = (start: string, end: string) => {
  if (!start || !end) return 'N/A';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} mins`;
};

export default function CustomerBookingDetailsScreen() {
  const router = useRouter();
  const { id, bookingData } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (bookingData && typeof bookingData === 'string') {
      try {
        setBooking(JSON.parse(bookingData));
        setIsLoading(false);
      } catch (e) {
        fetchBookingDetails();
      }
    } else {
      fetchBookingDetails();
    }
  }, [id, bookingData]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/bookings`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const foundBooking = data.data?.find((b: any) => b.id === id || b.booking_id === id);
        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          Alert.alert('Error', 'Booking not found');
          router.push('/(tabs)/bookings');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", onPress: cancelBookingApi, style: "destructive" }
      ]
    );
  };

  const cancelBookingApi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/bookings/${booking.id || booking.booking_id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && (data.success !== false)) {
        Alert.alert('Success', 'Booking has been cancelled.');
        setBooking({ ...booking, status: 'CANCELLED' });
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F9FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#03624C" />
      </View>
    );
  }

  if (!booking) return null;

  const status = (booking.status || 'CONFIRMED').toUpperCase();
  let statusConfig = { bg: 'bg-[#E6F4EA]', text: 'text-[#1E7B44]', label: 'CONFIRMED' };

  if (status === 'PAYMENT_PENDING' || status === 'PENDING') {
    statusConfig = { bg: 'bg-[#FEF9C3]', text: 'text-[#B08D23]', label: 'PAYMENT PENDING' };
  } else if (status === 'CANCELLED') {
    statusConfig = { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', label: 'CANCELLED' };
  }

  const isPaid = booking.razorpay_payment_id != null && booking.status !== 'CANCELLED';
  
  const bookingDate = new Date(`${booking.booking_date?.split('T')[0]}T${booking.start_time || '00:00:00'}`);
  const isFuture = bookingDate >= new Date();
  const canCancel = (status === 'CONFIRMED' || status === 'PAYMENT_PENDING' || status === 'PENDING') && isFuture;

  // Extract first image
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
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-4 flex-row items-center justify-between bg-white border-b border-gray-100 z-10" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')} className="w-10 h-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221]">Booking Details</Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Top Turf Image */}
          <View className="w-full h-48 bg-gray-200 relative mb-4">
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              </View>
            )}
            <View className="absolute inset-0 bg-black/20" />
            <View className="absolute bottom-4 left-4 right-4 flex-row justify-between items-end">
              <View className="flex-1">
                <Text className="text-white font-sans-bold text-2xl mb-1 drop-shadow-md" numberOfLines={1}>{booking.turf_name}</Text>
                <View className="flex-row items-center">
                  <Ionicons name="location" size={12} color="#E5E7EB" />
                  <Text className="text-white/90 font-sans-medium text-xs ml-1 drop-shadow-md">{booking.city || 'City'}</Text>
                </View>
              </View>
              <View className={`px-3 py-1.5 rounded-md ${statusConfig.bg}`}>
                <Text className={`text-[10px] font-sans-bold uppercase tracking-wider ${statusConfig.text}`}>{statusConfig.label}</Text>
              </View>
            </View>
          </View>

          <View className="px-4">
            {/* Card 1: Booking ID & Status */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex-row items-center justify-between" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-[#E8F5EE] items-center justify-center mr-3">
                  <Ionicons name="qr-code-outline" size={20} color="#03624C" />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-bold text-[#032221] text-sm mb-0.5">Booking ID</Text>
                  <Text className="font-sans-medium text-gray-500 text-[11px]" numberOfLines={1} ellipsizeMode="middle">
                    {booking.id || booking.booking_id}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(booking.id || booking.booking_id, 'Booking ID')} className="p-2 bg-gray-50 rounded-xl">
                <Ionicons name="copy-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Card 2: Schedule Details */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
              <View className="flex-row items-center mb-4">
                <Text className="font-sans-bold text-[#032221] text-base">Schedule Details</Text>
              </View>

              <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Date</Text>
                </View>
                <Text className="font-sans-bold text-[#032221] text-[13px]">{formatDate(booking.booking_date)}</Text>
              </View>

              <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Time</Text>
                </View>
                <Text className="font-sans-bold text-[#032221] text-[13px]">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="hourglass-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Duration</Text>
                </View>
                <Text className="font-sans-bold text-[#032221] text-[13px]">
                  {getDuration(booking.start_time, booking.end_time)}
                </Text>
              </View>
            </View>

            {/* Card 3: Turf Information */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
              <View className="flex-row items-center mb-4">
                <Text className="font-sans-bold text-[#032221] text-base">Turf Details</Text>
              </View>

              <View className="flex-row items-start mb-3 border-b border-gray-50 pb-3">
                <Ionicons name="business-outline" size={16} color="#6B7280" className="mt-0.5" />
                <View className="ml-2 flex-1">
                  <Text className="font-sans-bold text-[#032221] text-[13px] mb-1">{booking.turf_name}</Text>
                  <Text className="font-sans-medium text-gray-500 text-[11px]">ID: {booking.turf_id}</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Ionicons name="location-outline" size={16} color="#6B7280" className="mt-0.5" />
                <View className="ml-2 flex-1">
                  <Text className="font-sans-medium text-gray-600 text-[13px] leading-relaxed">
                    {booking.address || 'Address not available'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card 4: Payment Summary */}
            <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
              <View className="flex-row items-center mb-4">
                <Text className="font-sans-bold text-[#032221] text-base">Payment Summary</Text>
              </View>

              <View className="flex-row justify-between items-center mb-4 border-b border-gray-50 pb-4">
                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={16} color="#032221" />
                  <Text className="font-sans-bold text-[#032221] text-[14px] ml-2">Total Paid</Text>
                </View>
                <Text className="font-sans-bold text-[#03624C] text-[16px]">
                  ₹{parseInt(booking.total_price || '0').toLocaleString('en-IN')}.00
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Payment Method</Text>
                </View>
                <Text className="font-sans-bold text-[#032221] text-[13px] capitalize">
                  {booking.payment_method || 'Online'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Payment Status</Text>
                </View>
                <View className={`px-2 py-0.5 rounded-full ${isPaid ? 'bg-[#E6F4EA]' : 'bg-[#FEF9C3]'}`}>
                  <Text className={`text-[10px] font-sans-bold uppercase ${isPaid ? 'text-[#1E7B44]' : 'text-[#B08D23]'}`}>
                    {isPaid ? 'PAID' : 'PENDING'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={14} color="#6B7280" />
                  <Text className="font-sans-medium text-gray-600 text-[13px] ml-2">Payment ID</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="font-sans-medium text-gray-500 text-[11px] mr-2">{booking.razorpay_payment_id || 'N/A'}</Text>
                  {booking.razorpay_payment_id && (
                    <TouchableOpacity onPress={() => copyToClipboard(booking.razorpay_payment_id, 'Payment ID')}>
                      <Ionicons name="copy-outline" size={14} color="#03624C" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            </View>

            {/* Cancel Button */}
            {canCancel && (
              <TouchableOpacity
                onPress={handleCancelBooking}
                className="w-full bg-[#FEF2F2] border border-[#FECACA] rounded-xl py-4 flex-row items-center justify-center mb-6 shadow-sm"
              >
                <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                <Text className="text-[#DC2626] font-sans-bold text-base ml-2">Cancel Booking</Text>
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
