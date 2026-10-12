import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
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
        <Text className="text-xl font-sans-bold text-[#032221]">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-500 font-sans-medium text-sm mb-6">Last updated: 9/30/2026</Text>

        <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-8">
          Welcome to <Text className="font-sans-bold text-[#032221]">Turfcut</Text>. This Privacy Policy explains how your personal information is collected, used, and protected when you use our application and services. By accessing or using Turfcut, you agree to the collection and use of information in accordance with this policy.
        </Text>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">1. What Information You Collect</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            When you create an account with us, we collect Personal Information such as your <Text className="font-sans-bold text-[#032221]">Name, Email Address, Phone Number, and Passwords</Text>. This information is necessary to provide you with our services.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">2. How You Use That Information</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-2">The data we collect is used strictly for the following purposes:</Text>
          <View className="flex-row items-start mb-2 pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed"><Text className="font-sans-bold text-[#032221]">App Functionality:</Text> Managing turf bookings, scheduling, and confirming reservations.</Text>
          </View>
          <View className="flex-row items-start pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#03624C] mt-2 mr-2" />
            <Text className="flex-1 text-base font-sans-medium text-gray-700 leading-relaxed"><Text className="font-sans-bold text-[#032221]">Account Management:</Text> Facilitating user login, profile management, and password resets.</Text>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">3. Third-Party Services</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            We use third-party services to ensure a seamless and secure experience. For processing payments securely, we use <Text className="font-sans-bold text-[#032221]">Razorpay</Text>. We want to explicitly state that we do not store sensitive credit card information or payment details on our own servers. All payment processing is handled directly and securely by Razorpay.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">4. Data Security</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            We take your data security seriously. All user data is transmitted securely over an encrypted connection (HTTPS). We implement industry-standard security measures to protect your personal information from unauthorized access or disclosure.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">5. Data Deletion Policy</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed mb-4">
            You have the right to request the deletion of your personal data and account at any time.
          </Text>
          <View className="bg-red-50 p-4 rounded-xl border border-red-100">
            <Text className="text-sm font-sans-bold text-red-700 mb-2">To request deletion of your account and data, please email us at support@turfcut.com</Text>
            <Text className="text-xs font-sans-medium text-red-500">We will process your request within 30 days of receiving your email.</Text>
          </View>
        </View>

        <View className="mb-12">
          <Text className="text-lg font-sans-bold text-[#03624C] mb-3">6. Contact Information</Text>
          <Text className="text-base font-sans-medium text-gray-700 leading-relaxed">
            If you have any questions, concerns, or require further clarification about our privacy practices, please contact us at: support@turfcut.com
          </Text>
        </View>
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
