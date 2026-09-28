import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Dimensions, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { AuthButton } from '../../components/ui/AuthButton';

import { useApi } from '../../context/ApiContext';
import { Ionicons } from '@expo/vector-icons';

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

  const handleGoogleLogin = async () => {
    if (isExpoGo || !GoogleSignin) {
      showAlert('Notice', 'Google Sign-In is not available in Expo Go. Please use a development build to test this feature.');
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch (e) { }
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      const response = await fetch(`${baseUrl}/auth/owner/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isNewUser) {
          router.push({
            pathname: '/(auth)/complete-owner-profile' as any,
            params: {
              idToken: idToken,
              email: data.data?.email || '',
              name: data.data?.name || ''
            }
          });
        } else {
          login('OWNER', data);
          router.replace('/(owner-tabs)' as any);
        }
      } else {
        showAlert('Google Login Failed', data.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error("\n\n=== GOOGLE LOGIN ERROR ===\n", error, "\nCODE:", error.code, "\nMESSAGE:", error.message, "\n===========================\n\n");
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
    <View className="flex-1 bg-secondary-dark">
      <StatusBar style="light" />

      {/* Top Section with Background Image */}
      <View
        className="w-full absolute top-0 left-0 right-0"
        style={{ height: Dimensions.get('screen').height * 0.45 }}
      >
        <Image
          source={require('../../../assets/images/overlay_stadium.png')}
          className="w-full h-full opacity-60"
          resizeMode="cover"
        />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push({ pathname: '/(auth)/forgot-password' as any, params: { role: 'OWNER' } })}>
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
