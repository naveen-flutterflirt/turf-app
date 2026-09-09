import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../../context/ApiContext';
import { useAppStore } from '../../../stores/useAppStore';
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

export default function BookingDetailsScreen() {
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
      const response = await fetch(`${baseUrl}/owner/bookings`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const foundBooking = data.data?.find((b: any) => b.booking_id === id);
        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          Alert.alert('Error', 'Booking not found');
          router.back();
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

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.push('/(owner-tabs)/bookings')} className="w-10 h-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221]">Booking Details</Text>
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={20} color="#032221" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

          {/* Card 1: Booking ID & Status */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex-row items-center justify-between" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-[#E8F5EE] items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={24} color="#03624C" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[#032221] text-sm mb-0.5">Booking ID</Text>
                <Text className="font-sans-medium text-gray-500 text-xs" numberOfLines={1} ellipsizeMode="middle">
                  {booking.booking_id}
                </Text>
              </View>
            </View>

            <View className="items-end justify-between self-stretch">
              <View className={`px-2.5 py-1 rounded-md ${statusConfig.bg}`}>
                <Text className={`text-[9px] font-sans-bold uppercase ${statusConfig.text}`}>{statusConfig.label}</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(booking.booking_id, 'Booking ID')} className="mt-2 p-1">
                <Ionicons name="copy-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Turf Information */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="flex-row items-center mb-3">
              <Text className="font-sans-bold text-[#032221] text-md">Turf Information</Text>
            </View>

            <View className="flex-row items-center">

              <View className="flex-1">
                <Text className="font-sans-bold text-[#032221] text-sm mb-1">Name: {booking.turf_name}</Text>
                <View className="flex-row items-center">
                  <Text className="font-sans-medium text-gray-500 text-xs flex-1" numberOfLines={1} ellipsizeMode="middle">
                    Turf ID: {booking.turf_id}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 3: Booking Schedule */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="flex-row items-center mb-4">
              <Text className="font-sans-bold text-[#032221] text-md">Booking Schedule</Text>
            </View>

            <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Date</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">{formatDate(booking.booking_date)}</Text>
            </View>

            <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Time</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <Ionicons name="hourglass-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Duration</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">
                {getDuration(booking.start_time, booking.end_time)}
              </Text>
            </View>
          </View>

          {/* Card 4: Customer Information */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="flex-row items-center mb-4">
              <Text className="font-sans-bold text-[#032221] text-md">Customer Information</Text>
            </View>

            <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Name</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">{booking.customer_name}</Text>
            </View>

            <View className="flex-row justify-between mb-3 border-b border-gray-50 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Email</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">{booking.customer_email || 'N/A'}</Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Phone</Text>
              </View>
              <Text className="font-sans-semibold text-[#032221] text-[13px]">{booking.customer_phone || 'N/A'}</Text>
            </View>
          </View>

          {/* Card 5: Payment Information */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View className="flex-row items-center mb-4">
              <Text className="font-sans-bold text-[#032221] text-md">Payment Information</Text>
            </View>

            <View className="flex-row justify-between mb-4 border-b border-gray-50 pb-4">
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color="#032221" />
                <Text className="font-sans-bold text-[#032221] text-[13px] ml-2">Total Price</Text>
              </View>
              <Text className="font-sans-bold text-[#03624C] text-[15px]">
                ₹{parseInt(booking.total_price || '0').toLocaleString('en-IN')}.00
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3 border-b border-gray-50 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="cube-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Razorpay Order ID</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-sans-medium text-gray-500 text-xs mr-2">{booking.razorpay_order_id || 'N/A'}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(booking.razorpay_order_id, 'Order ID')}>
                  <Ionicons name="copy-outline" size={14} color="#032221" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-4 border-b border-gray-50 pb-4">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Razorpay Payment ID</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-sans-medium text-gray-500 text-xs mr-2">{booking.razorpay_payment_id || 'N/A'}</Text>
                {booking.razorpay_payment_id && (
                  <TouchableOpacity onPress={() => copyToClipboard(booking.razorpay_payment_id, 'Payment ID')}>
                    <Ionicons name="copy-outline" size={14} color="#032221" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text className="font-sans-medium text-gray-600 text-xs ml-2">Payment Status</Text>
              </View>
              <View className={`px-2.5 py-1 rounded-full ${isPaid ? 'bg-[#E6F4EA]' : 'bg-[#FEF9C3]'}`}>
                <Text className={`text-[10px] font-sans-bold uppercase ${isPaid ? 'text-[#1E7B44]' : 'text-[#B08D23]'}`}>
                  {isPaid ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
