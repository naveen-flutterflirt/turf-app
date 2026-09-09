import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { SocialLoginButton } from '../../components/ui/SocialLoginButton';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

export default function CustomerSignupScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { baseUrl } = useApi();
  const login = useAppStore((state) => state.login);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !phone || !email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      showAlert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login('CUSTOMER', data);
        router.replace('/(tabs)' as any);
      } else {
        showAlert('Signup Failed', data.message || 'An error occurred');
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

          {/* Top Decorative Image */}
          <View className="absolute top-0 right-0 w-64 h-64">
            <Image
              source={require('../../../assets/images/football.png')}
              className="w-full h-full opacity-30"
              resizeMode="contain"
            />
          </View>

          {/* Header Area */}
          <View className="px-6 pt-4 pb-8 z-10">
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/customer-login')}
              className="w-10 h-10 justify-center mb-6"
            >
              <Ionicons name="arrow-back" size={24} color="#032221" />
            </TouchableOpacity>

            <Text className="text-4xl font-sans-bold text-turf-text mb-1">Create</Text>
            <Text className="text-4xl font-sans-bold text-primary-dark mb-4">Account</Text>
            <Text className="text-sm font-sans-medium text-gray-500 w-2/3">
              Join TurfPlay and start {"\n"}booking amazing turfs
            </Text>
          </View>

          {/* Form Area */}
          <View className="flex-1 bg-white rounded-t-[30px] px-6 pt-8 pb-8 z-10">

            <AuthInput
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            <AuthInput
              icon="call-outline"
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <AuthInput
              icon="mail-outline"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <AuthInput
              icon="lock-closed-outline"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />
            <Text className="text-xs font-sans-medium text-gray-400 mt-[-10px] mb-4 ml-1">
              Minimum 6 characters
            </Text>

            {/* Sign Up Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignUp}
              disabled={isLoading}
              className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mt-2 mb-8 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-sans-semibold text-base">Sign Up</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ position: 'absolute', right: 20 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Social Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-300" />
              <Text className="mx-4 text-gray-500 font-sans-medium text-xs">
                or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-gray-300" />
            </View>

            {/* Social Buttons */}
            <View className="flex-row justify-between mb-8 mx-[-8px]">
              <SocialLoginButton title="Google" provider="google" />
              <SocialLoginButton title="Apple" provider="apple" />
            </View>

            {/* Login Link */}
            <View className="flex-row justify-center mt-auto">
              <Text className="text-gray-500 font-sans-medium text-md">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/customer-login')}>
                <Text className="text-primary-dark font-sans-bold text-md">
                  Login
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
