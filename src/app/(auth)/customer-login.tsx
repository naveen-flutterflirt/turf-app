import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { AuthButton } from '../../components/ui/AuthButton';

import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

export default function CustomerLoginScreen() {
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
      const response = await fetch(`${baseUrl}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login('CUSTOMER', data);
        router.replace('/(tabs)' as any);
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
          source={require('../../../assets/images/login_bg.png')}
          className="w-full h-full opacity-60"
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
            <Text className="text-3xl font-sans-bold text-white mb-2 mt-10">Welcome Back!</Text>
            <Text className="text-sm font-sans-medium text-gray-300 w-2/3 mb-5">
              Login to continue booking {"\n"} your favorite turfs.
            </Text>
          </View>

          {/* Bottom Card Area */}
          <View className="flex-1 bg-white rounded-t-[30px] px-6 pt-8 pb-8" style={{ minHeight: '55%' }}>

            {/* Inputs */}
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

            {/* Forgot Password */}
            <View className="items-end mb-6">
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push({ pathname: '/(auth)/forgot-password' as any, params: { role: 'CUSTOMER' } })}>
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


            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-auto">
              <Text className="text-gray-500 font-sans-medium text-md">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/customer-signup')}>
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
