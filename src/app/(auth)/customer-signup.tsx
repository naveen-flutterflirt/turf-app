import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Dimensions, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { AuthButton } from '../../components/ui/AuthButton';

import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SocialLoginButton } from '../../components/ui/SocialLoginButton';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let GoogleSignin: any = null;

if (!isExpoGo) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({
      webClientId: '1090732856735-b6flsagu6ielg7q7b7ac8guknn36aj6v.apps.googleusercontent.com',
    });
  } catch (e) {
    console.warn('Google Signin could not be configured', e);
  }
}

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
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      };
      
      const response = await fetch(`${baseUrl}/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - Redirect to verification screen
        router.push({ pathname: '/(auth)/verify-email' as any, params: { email: payload.email, role: 'CUSTOMER' } });
      } else {
        showAlert('Signup Failed', data.message || 'An error occurred');
      }
    } catch (error) {
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isExpoGo || !GoogleSignin) {
      showAlert('Notice', 'Google Sign-In is not available in Expo Go. Please use a development build to test this feature.');
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch (e) {}
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      const response = await fetch(`${baseUrl}/auth/customer/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isNewUser) {
          router.push({
            pathname: '/(auth)/complete-customer-profile' as any,
            params: {
              idToken: idToken,
              email: data.data?.email || '',
              name: data.data?.name || ''
            }
          });
        } else {
          login('CUSTOMER', data);
          router.replace('/(tabs)' as any);
        }
      } else {
        showAlert('Google Sign-Up Failed', data.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error("\n\n=== GOOGLE SIGNUP ERROR ===\n", error, "\nCODE:", error.code, "\nMESSAGE:", error.message, "\n===========================\n\n");
      if (error.code === 'SIGN_IN_CANCELLED') {
        // user cancelled the login flow
      } else if (error.code === 'IN_PROGRESS') {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        showAlert('Error', 'Play services not available or outdated');
      } else {
        showAlert('Error', `Google Sign-In Error: ${error?.message || String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-turf-bg">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-500 font-sans-medium text-sm">Or continue with</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Social Login */}
            <View className="flex-row mb-8">
              <SocialLoginButton
                title="Google"
                provider="google"
                onPress={handleGoogleLogin}
                disabled={isLoading}
              />
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
