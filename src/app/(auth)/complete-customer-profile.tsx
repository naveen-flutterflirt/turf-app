import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

export default function CompleteCustomerProfileScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { baseUrl } = useApi();
  const login = useAppStore((state) => state.login);
  const { idToken, email, name } = useLocalSearchParams<{ idToken: string; email: string; name: string }>();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteProfile = async () => {
    if (!phone || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      showAlert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!idToken) {
      showAlert('Error', 'Missing Google session. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        idToken,
        phone: phone.trim(),
        password,
        name: name || 'Google User',
      };
      
      const response = await fetch(`${baseUrl}/auth/customer/google-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Log the user in immediately
        login('CUSTOMER', data);
        router.replace('/(tabs)' as any);
      } else {
        showAlert('Signup Failed', data.message || 'An error occurred while completing your profile');
      }
    } catch (error) {
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-turf-bg">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          
          {/* Header Area */}
          <View className="px-6 pt-4 pb-8 z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 justify-center mb-6"
            >
              <Ionicons name="arrow-back" size={24} color="#032221" />
            </TouchableOpacity>

            <Text className="text-4xl font-sans-bold text-turf-text mb-1">Complete</Text>
            <Text className="text-4xl font-sans-bold text-primary-dark mb-4">Profile</Text>
            <Text className="text-sm font-sans-medium text-gray-500 w-full leading-relaxed">
              Almost there! We just need a few more details to set up your TurfPlay account.
            </Text>
          </View>

          {/* Form Area */}
          <View className="flex-1 bg-white rounded-t-[30px] px-6 pt-8 pb-8 z-10">
            <View className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <Text className="text-xs font-sans-semibold text-gray-400 mb-1">GOOGLE ACCOUNT</Text>
              <Text className="text-base font-sans-semibold text-turf-text">{name || 'Google User'}</Text>
              <Text className="text-sm font-sans-medium text-gray-500">{email || ''}</Text>
            </View>

            <AuthInput
              icon="call-outline"
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <AuthInput
              icon="lock-closed-outline"
              placeholder="Create a Password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />
            <Text className="text-xs font-sans-medium text-gray-400 mt-[-10px] mb-4 ml-1">
              Minimum 6 characters
            </Text>

            {/* Complete Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCompleteProfile}
              disabled={isLoading}
              className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mt-2 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-sans-semibold text-base">Complete Registration</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ position: 'absolute', right: 20 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
