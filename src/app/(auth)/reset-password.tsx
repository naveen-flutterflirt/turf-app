import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthInput } from '../../components/ui/AuthInput';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../context/AlertContext';
import { useApi } from '../../context/ApiContext';

export default function ResetPasswordScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const role = params.role as string;
  const { baseUrl } = useApi();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Go back on backspace if empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      showAlert('Error', 'Please enter the complete 6-digit code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showAlert('Success', data.message || 'Your password has been reset successfully');
        
        // Redirect to login screen based on role
        if (role === 'OWNER') {
          router.replace('/(auth)/owner-login');
        } else {
          router.replace('/(auth)/customer-login');
        }
      } else {
        showAlert('Error', data.message || 'Failed to reset password');
      }
      
    } catch (error) {
      showAlert('Error', 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
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
              <View className="mb-8">
                <Text className="text-3xl font-sans-bold text-gray-900 mb-2">
                  Create New Password
                </Text>
                <Text className="text-gray-500 font-sans-medium text-base leading-6">
                  Enter the 6-digit code sent to {email || 'your email'} and your new password.
                </Text>
              </View>

              {/* OTP Input Boxes */}
              <View className="mb-8">
                <Text className="text-gray-700 font-sans-semibold mb-3">Verification Code</Text>
                <View className="flex-row justify-between w-full">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      className={`w-[45px] h-[55px] border ${digit ? 'border-primary-dark border-2' : 'border-gray-300'} rounded-xl text-center text-xl font-sans-bold text-gray-900 bg-white`}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                    />
                  ))}
                </View>
              </View>

              <View className="space-y-4 mb-8 mt-2">
                {/* Inputs */}
                <AuthInput
                  icon="lock-closed-outline"
                  placeholder="New Password"
                  isPassword
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                
                <AuthInput
                  icon="lock-closed-outline"
                  placeholder="Confirm New Password"
                  isPassword
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleResetPassword}
                disabled={isLoading}
                className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative mt-auto mb-8 ${isLoading ? 'opacity-70' : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-sans-semibold text-base">Reset Password</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ position: 'absolute', right: 20 }} />
                  </>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
