import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../context/AlertContext';
import { useApi } from '../../context/ApiContext';

export default function ForgotPasswordScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string;
  const { baseUrl } = useApi();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showAlert('Success', data.message || 'Password reset code has been sent to your email.');
        // Redirect to reset password screen
        router.push({ 
          pathname: '/(auth)/reset-password' as any, 
          params: { email, role } 
        });
      } else {
        showAlert('Error', data.message || 'Failed to send reset code');
      }

      
    } catch (error) {
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-8 pt-8">
            <View className="mb-10">
              <Text className="text-3xl font-sans-bold text-gray-900 mb-2">
                Reset Password
              </Text>
              <Text className="text-gray-500 font-sans-medium text-base leading-6">
                Enter the email address associated with your account and we'll send you a code to reset your password.
              </Text>
            </View>

            <View className="space-y-4 mb-8">
              {/* Inputs */}
              <AuthInput
                icon="mail-outline"
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendCode}
              disabled={isLoading}
              className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mb-8 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-sans-semibold text-base">Send Reset Code</Text>
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
