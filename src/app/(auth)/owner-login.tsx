import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { SocialLoginButton } from '../../components/ui/SocialLoginButton';
import { useApi } from '../../context/ApiContext';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

export default function OwnerLoginScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { baseUrl } = useApi();
  const login = useAppStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        login('OWNER', data);
        router.replace('/(owner-tabs)' as any);
      } else {
        showAlert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-secondary-dark">
      <StatusBar style="light" />

      {/* Top Section with Background Image */}
      <View className="h-[45%] w-full absolute top-0 left-0 right-0">
        <Image
          source={require('../../../assets/images/overlay_stadium.png')}
          className="w-full h-full opacity-100"
          resizeMode="cover"
        />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Header Area */}
          <View className="px-6 pt-8 pb-14">
            <View className="flex-col items-start mb-6">
              <Image
                source={require('../../../assets/images/logo_only.png')}
                style={{ width: 35, height: 35 }}
                resizeMode="contain"
              />
              <Image
                source={require('../../../assets/images/logo_text.png')}
                style={{ width: 90, height: 30 }}
                resizeMode="contain"
                className="mt-2"
              />
            </View>
            <Text className="text-3xl font-sans-bold text-white mt-10 mb-2">Welcome Owner!</Text>
            <Text className="text-sm font-sans-medium text-gray-300 w-2/3 mb-5">
              Login to manage your turfs and bookings.
            </Text>
          </View>

          {/* Bottom Card Area */}
          <View className="flex-1 bg-turf-bg rounded-t-[40px] px-6 pt-10 pb-8 mt-auto" style={{ minHeight: '55%' }}>

            {/* Inputs */}
            <AuthInput
              icon="mail-outline"
              placeholder="Email or Phone number"
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

            {/* Forgot Password */}
            <View className="items-end mb-6">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-primary-dark font-sans-semibold text-sm">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={isLoading}
              className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mb-8 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-sans-semibold text-base">Login</Text>
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

            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-auto">
              <Text className="text-gray-500 font-sans-medium text-md">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/owner-signup')}>
                <Text className="text-primary-dark font-sans-bold text-md">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
