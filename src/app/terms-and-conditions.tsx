import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white shadow-sm">
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }} 
          className="p-2 mr-2"
        >
          <Ionicons name="arrow-back" size={24} color="#032221" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-[#032221]">Terms & Conditions</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-500 font-sans-medium text-sm mb-6">Last updated: 9/30/2026</Text>

        <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-8">
          Welcome to <Text className="font-sans-bold text-[#032221]">Turfcut</Text>. These Terms and Conditions govern your use of our platform, applications, and services. By registering for an account or using our platform to book or list turf venues, you agree to be bound by these terms.
        </Text>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">1. Account Registration</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            Users must provide accurate, current, and complete information during the registration process. You are responsible for safeguarding your password and for all activities that occur under your account. Turfcut reserves the right to suspend or terminate accounts that provide false information or violate these terms.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">2. Booking and Cancellations</Text>
          <View className="flex-row items-start mb-4 pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed"><Text className="font-sans-bold text-[#032221]">For Players:</Text> All bookings made through Turfcut are subject to the availability of the venue. Cancellation policies are set by individual turf owners. Please review the specific cancellation policy of the venue before completing your booking.</Text>
          </View>
          <View className="flex-row items-start pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed"><Text className="font-sans-bold text-[#032221]">For Owners:</Text> You agree to honor all confirmed bookings. In the event of an unavoidable cancellation on your part, you must notify the platform and the user immediately to facilitate a full refund.</Text>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">3. Payments, Commission, and Platform Share</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-3">
            Turfcut facilitates seamless online and on-venue payments between players and turf owners through secure authorized payment gateways (e.g., Razorpay).
          </Text>
          <View className="bg-[#E6F4EA] border border-[#03624C]/20 rounded-2xl p-4 mb-3">
            <Text className="text-base font-sans-bold text-[#03624C] mb-1">Platform Commission Fee (10%):</Text>
            <Text className="text-sm font-sans-medium text-gray-800 leading-relaxed">
              Turfcut charges a flat platform service fee / commission of <Text className="font-sans-bold text-[#032221]">10% on every confirmed booking</Text>. By listing your turf on Turfcut, turf owners explicitly agree that our 10% platform share will be automatically deducted from the total booking amount before final payouts/settlements are disbursed to the turf owner.
            </Text>
          </View>
          <Text className="text-sm font-sans-medium text-gray-600 leading-relaxed">
            Payouts are processed to the bank account details provided during owner verification. We are not responsible for transaction failures or processing delays caused by external banking networks.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">4. User Conduct</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-2">You agree to use Turfcut only for lawful purposes. You are prohibited from:</Text>
          <View className="flex-row items-start mb-2 pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed">Attempting to bypass the platform to make direct bookings to avoid fees.</Text>
          </View>
          <View className="flex-row items-start mb-2 pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed">Posting false, inaccurate, or misleading reviews or venue information.</Text>
          </View>
          <View className="flex-row items-start pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed">Using the platform to harass, abuse, or harm other users or turf owners.</Text>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">5. Liability and Disclaimers</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            Turfcut acts solely as a technological bridge between players and venue owners. We are not liable for any injuries, damages, or disputes that occur on the physical premises of the booked turfs. Venue owners are solely responsible for maintaining safe facilities and holding appropriate liability insurance.
          </Text>
        </View>

        <View className="mb-12">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">6. Contact & Support</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            For support, inquiries, or questions regarding these Terms and Conditions, please reach out to us at:{' '}
            <Text className="font-sans-bold text-[#03624C]">info@flutterflirt.com</Text>
          </Text>
        </View>
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
