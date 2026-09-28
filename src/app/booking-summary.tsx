import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { useAlert } from '../context/AlertContext';
import RazorpayCheckout from 'react-native-razorpay';
import { getTurfImageUri } from '../utils/imageHelper';

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' };
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

export default function BookingSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { turfData, selectedDate, selectedSlots, selectedSport } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const { showAlert } = useAlert();

  const [turf, setTurf] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [sport, setSport] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  useEffect(() => {
    if (turfData && typeof turfData === 'string') {
      try {
        setTurf(JSON.parse(turfData));
      } catch (e) { }
    }
    if (selectedSlots && typeof selectedSlots === 'string') {
      try {
        setSlots(JSON.parse(selectedSlots));
      } catch (e) { }
    }
    if (selectedSport && typeof selectedSport === 'string') {
      try {
        setSport(JSON.parse(selectedSport));
      } catch (e) { }
    }
  }, [turfData, selectedSlots, selectedSport]);

  if (!turf || slots.length === 0) {
    return (
      <View className="flex-1 bg-[#F9FAFB] items-center justify-center">
        <ActivityIndicator size="large" color="#03624C" />
      </View>
    );
  }

  const pricePerHour = turf.price_per_hour || 0;
  const totalAmount = slots.length * pricePerHour;

  const handlePayNow = async () => {
    if (!userData?.token) return;
    setIsProcessing(true);

    try {
      // Step 1: Create booking
      const timeSlotsPayload = slots.map(s => ({ start_time: s.start, end_time: s.end }));
      const bookingDate = selectedDate ? (selectedDate as string).split('T')[0] : new Date().toISOString().split('T')[0];

      const createResponse = await fetch(`${baseUrl}/customer/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          turf_id: turf.id,
          date: bookingDate,
          time_slots: timeSlotsPayload,
          ...(sport?.id && { sport_id: sport.id })
        })
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        setIsProcessing(false);
        showAlert('Error', createData.message || 'Failed to create booking.');
        return;
      }

      const orderId = createData.data?.order_id;
      // The backend returns the amount already in paise (e.g. 450000)
      // Razorpay checkout strictly requires the amount to match the order's amount exactly.
      const amount = createData.data?.amount || (totalAmount * 100);
      const currency = createData.data?.currency || 'INR';
      const bookingsCreated = createData.data?.bookings || [];

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        description: `Booking for ${turf.name}`,
        image: getTurfImageUri(turf.images) || undefined,
        currency: currency,
        // key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_live_TYIPEgOrhunqOl',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_TZ5ihZtkKXzxpl',
        amount: amount,
        name: turf.name,
        order_id: orderId,
        prefill: {
          email: userData?.email || '',
          contact: userData?.phone || '',
          name: userData?.name || ''
        },
        theme: { color: '#03624C' }
      };

      try {
        const data = await RazorpayCheckout.open(options);

        // Step 3: Verify payment with backend
        const verifyResponse = await fetch(`${baseUrl}/customer/bookings/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
          body: JSON.stringify({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature
          })
        });

        const verifyData = await verifyResponse.json();
        setIsProcessing(false);

        if (verifyResponse.ok && verifyData.success) {
          const confirmedBooking = (verifyData.data && verifyData.data.length > 0)
            ? verifyData.data[0]
            : bookingsCreated[0];

          router.replace({
            pathname: '/booking-success',
            params: {
              bookingData: JSON.stringify(confirmedBooking),
              totalPaid: totalAmount,
              slotCount: slots.length
            }
          });
        } else {
          showAlert('Payment Failed', verifyData.message || 'Could not verify payment.');
        }
      } catch (error: any) {
        setIsProcessing(false);
        const errorMsg = typeof error === 'string' ? error : error.description || error.message || 'Payment was cancelled or failed.';
        showAlert('Payment Failed', errorMsg);
      }

    } catch (error) {
      setIsProcessing(false);
      showAlert('Error', 'An unexpected error occurred during checkout.');
    }
  };

  // Get first image
  const imageUrl = getTurfImageUri(turf.images) || null;

  // Format Time Range for display
  const startTime = slots.length > 0 ? slots[0].start : '';
  const endTime = slots.length > 0 ? slots[slots.length - 1].end : '';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white px-4 pb-4 flex-row items-center border-b border-gray-100" style={{ paddingTop: insets.top + 10 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <Ionicons name="arrow-back" size={24} color="#032221" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-[#032221] ml-2">Booking Summary</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Turf Info Card */}
        <View className="m-4 p-3 bg-white rounded-2xl border border-gray-100 flex-row shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <View className="w-24 h-24 rounded-xl overflow-hidden mr-3 bg-gray-100">
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>
          <View className="flex-1 py-1 justify-center">
            <Text className="font-sans-bold text-lg text-[#032221] mb-1">{turf.name}</Text>
            <View className="flex-row items-center mb-1.5">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="ml-1 text-xs text-gray-500 font-sans-medium" numberOfLines={1}>{turf.address || turf.city || 'Location'}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text className="ml-1 text-xs font-sans-bold text-[#032221]">4.8</Text>
              <Text className="ml-1 text-xs font-sans-medium text-gray-500">(120 reviews)</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>

          {sport && (
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="trophy-outline" size={18} color="#6B7280" />
                <Text className="ml-3 text-[15px] font-sans-medium text-gray-600">Sport</Text>
              </View>
              <Text className="text-[15px] font-sans-semibold text-[#032221]">
                {sport.name || sport}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[15px] font-sans-medium text-gray-600">Date</Text>
            </View>
            <Text className="text-[15px] font-sans-semibold text-[#032221]">
              {selectedDate ? formatDate(selectedDate as string) : ''}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[15px] font-sans-medium text-gray-600">Time</Text>
            </View>
            <Text className="text-[15px] font-sans-semibold text-[#032221]">
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="hourglass-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[15px] font-sans-medium text-gray-600">Duration</Text>
            </View>
            <Text className="text-[15px] font-sans-semibold text-[#032221]">
              {slots.length} Hour{slots.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[15px] font-sans-medium text-gray-600">Price per hour</Text>
            </View>
            <Text className="text-[15px] font-sans-semibold text-[#032221]">
              ₹{pricePerHour}
            </Text>
          </View>

          <View className="h-[1px] bg-gray-100 my-2" />

          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-lg font-sans-bold text-[#032221]">Total Amount</Text>
            <Text className="text-xl font-sans-bold text-[#03624C]">
              ₹{totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Player Details */}
        <View className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-outline" size={18} color="#032221" />
            <Text className="ml-2 text-[15px] font-sans-bold text-[#032221]">Player Details</Text>
          </View>

          <View className="flex-row justify-between items-center mb-4 pl-1">
            <View className="flex-row items-center">
              <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Name</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221]">{userData?.name || 'Guest'}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-4 pl-1">
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Phone</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221]">{userData?.phone || '+91 0000000000'}</Text>
          </View>

          <View className="flex-row justify-between items-center pl-1">
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Email</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221]">{userData?.email || 'guest@example.com'}</Text>
          </View>
        </View>



      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row items-center justify-between shadow-lg" style={{ paddingBottom: insets.bottom + 16 }}>
        <View>
          <Text className="text-gray-500 font-sans-medium text-xs mb-0.5">Total Payable</Text>
          <Text className="font-sans-bold text-2xl text-[#03624C]">₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePayNow}
          disabled={isProcessing}
          className={`px-10 py-3.5 rounded-2xl ${isProcessing ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-sans-bold text-base">Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
