import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingData, totalPaid } = useLocalSearchParams();
  
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingData && typeof bookingData === 'string') {
      try {
        setBooking(JSON.parse(bookingData));
      } catch(e){}
    }
  }, [bookingData]);

  if (!booking) return <View className="flex-1 bg-[#F9FAFB]" />;

  const displayId = (booking.id || 'N/A').split('-')[0].toUpperCase();

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 pb-4 flex-row items-center border-b border-transparent" style={{ paddingTop: insets.top + 10 }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} className="w-10 h-10 items-center justify-center -ml-2">
          <Ionicons name="close" size={26} color="#032221" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        
        {/* Success Icon */}
        <View className="items-center mt-6 mb-6">
          <View className="w-24 h-24 bg-[#E6F4EA] rounded-full items-center justify-center mb-4 relative">
             <View className="w-16 h-16 bg-[#10B981] rounded-full items-center justify-center">
               <Ionicons name="checkmark-sharp" size={36} color="white" />
             </View>
             {/* Decorative Confetti - Simple representation */}
             <View className="absolute top-0 right-[-10px] w-2 h-2 bg-green-400 rounded-sm transform rotate-45" />
             <View className="absolute bottom-4 left-[-15px] w-2 h-3 bg-blue-400 rounded-sm transform -rotate-12" />
             <View className="absolute top-10 left-[-20px] w-1.5 h-1.5 bg-yellow-400 rounded-full" />
             <View className="absolute top-10 right-[-25px] w-1.5 h-1.5 bg-green-300 rounded-full" />
          </View>
          <Text className="text-2xl font-sans-bold text-[#032221] mb-2 text-center">Booking Confirmed!</Text>
          <Text className="text-sm font-sans-medium text-gray-500 text-center">Your turf has been booked successfully.</Text>
        </View>

        {/* Receipt Card */}
        <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
           <View className="flex-row justify-between items-start mb-6 border-b border-gray-50 pb-4">
             <View>
               <Text className="text-xs font-sans-medium text-gray-500 mb-1">Booking ID</Text>
               <Text className="text-lg font-sans-bold text-[#032221]">#{displayId}</Text>
             </View>
             <TouchableOpacity className="w-8 h-8 bg-gray-50 rounded-lg items-center justify-center">
               <Ionicons name="copy-outline" size={16} color="#4B5563" />
             </TouchableOpacity>
           </View>

           <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Date</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221]">
              {formatDate(booking.booking_date)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Time</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221]">
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Total Paid</Text>
            </View>
            <Text className="text-[14px] font-sans-bold text-[#03624C]">
              ₹{parseInt(totalPaid as string || booking.total_price || '0').toLocaleString('en-IN')}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={18} color="#6B7280" />
              <Text className="ml-3 text-[14px] font-sans-medium text-gray-600">Payment Method</Text>
            </View>
            <Text className="text-[14px] font-sans-semibold text-[#032221] uppercase">
              {booking.payment_method || 'Online'}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/bookings')}
          className="w-full bg-white border border-[#03624C] rounded-2xl py-4 items-center justify-center mb-3"
        >
          <Text className="text-[#03624C] font-sans-bold text-base">View Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/search')}
          className="w-full bg-[#03624C] rounded-2xl py-4 items-center justify-center mb-6"
        >
          <Text className="text-white font-sans-bold text-base">Done</Text>
        </TouchableOpacity>

        {/* Banner */}
        <View className="bg-[#E6F4EA] rounded-2xl p-4 flex-row items-center">
           <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-3">
             <Ionicons name="calendar" size={20} color="#03624C" />
           </View>
           <View className="flex-1">
             <Text className="font-sans-bold text-[#032221] text-[15px] mb-0.5">See you at the turf!</Text>
             <Text className="font-sans-medium text-[#03624C] text-xs">Get ready for an amazing game.</Text>
           </View>
        </View>

      </ScrollView>
    </View>
  );
}
