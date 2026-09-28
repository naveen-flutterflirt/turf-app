import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../context/ApiContext';
import { useAlert } from '../../context/AlertContext';
import { useAppStore } from '../../stores/useAppStore';

export default function VerifyEmailScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email: string, role: string }>();
  const { baseUrl } = useApi();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      showAlert('Error', `Please enter the complete 6-digit verification code.`);
      return;
    }

    setIsLoading(true);
    try {
      const payload = { email, code };
      const response = await fetch(`${baseUrl}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Success', 'Email verified successfully!');
        
        // Attempt to auto-login if the API returned a token
        if (data.token) {
          useAppStore.getState().login(role as 'CUSTOMER' | 'OWNER', data);
          if (role === 'OWNER') {
            router.replace('/(owner-tabs)/edit-bank-details');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          // Fallback if no token is returned
          if (role === 'OWNER') {
            router.replace('/(auth)/owner-login');
          } else {
            router.replace('/(auth)/customer-login');
          }
        }
      } else {
        showAlert('Verification Failed', data.message || 'Invalid code.');
      }
    } catch (error: any) {
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) {
      return;
    }

    try {
      const payload = { email };
      const response = await fetch(`${baseUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert('Success', 'A new verification code has been sent to your email.');
        setTimer(30);
      } else {
        const data = await response.json();
        showAlert('Error', data.message || 'Failed to resend code.');
      }
    } catch (error) {
      showAlert('Error', 'Failed to connect to the server');
    }
  };

  return (
    <View className="flex-1 bg-turf-bg">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-8 mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>

          <Text className="text-3xl font-sans-bold text-primary-dark mb-2">Verify Email</Text>
          <Text className="text-sm font-sans-medium text-gray-500 mb-8 leading-relaxed">
            We've sent a 6-digit verification code to <Text className="font-sans-bold text-[#032221]">{email}</Text>. Please enter it below.
          </Text>

          <View className="flex-row justify-between mb-8 relative">
            <Pressable className="flex-row justify-between w-full" onPress={() => inputRef.current?.focus()}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = code[index] || '';
                const isFocused = code.length === index;
                return (
                  <View
                    key={index}
                    className={`w-[45px] h-14 rounded-xl items-center justify-center border ${digit ? 'border-primary-dark bg-[#E6F4EA]' : isFocused ? 'border-[#03624C] bg-white' : 'border-gray-200 bg-white'}`}
                    style={{ elevation: digit ? 1 : 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                  >
                    <Text className={`text-xl font-sans-bold ${digit ? 'text-primary-dark' : 'text-[#032221]'}`}>{digit}</Text>
                  </View>
                );
              })}
            </Pressable>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={setCode}
              maxLength={6}
              keyboardType="number-pad"
              className="absolute opacity-0 w-full h-full"
              autoFocus
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleVerify}
            disabled={isLoading}
            className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mb-6 ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-sans-semibold text-base">Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-500 font-sans-medium text-sm">
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
              <Text className={`font-sans-bold text-sm ${timer > 0 ? 'text-gray-400' : 'text-primary-dark'}`}>
                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
