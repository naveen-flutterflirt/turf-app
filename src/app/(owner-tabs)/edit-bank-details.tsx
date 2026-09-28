"use no memo";
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';

export default function EditBankDetailsScreen() {
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasExistingDetails, setHasExistingDetails] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`${baseUrl}/owner/account-details`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          setBankName(data.data.bank_name || '');
          setAccountNumber(data.data.account_number || '');
          setHolderName(data.data.account_name || '');
          setIfsc(data.data.ifsc_code || '');
          setHasExistingDetails(!!data.data.account_number);
        }
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!bankName || !accountNumber || !holderName || !ifsc) {
      Alert.alert('Missing Fields', 'Please fill in all bank details.');
      return;
    }

    if (ifsc.length !== 11) {
      Alert.alert('Invalid IFSC', 'IFSC code must be exactly 11 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/owner/account-details`, {
        method: hasExistingDetails ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber,
          account_name: holderName,
          ifsc_code: ifsc.toUpperCase(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok && data.success) {
          Alert.alert('Success', 'Bank details saved successfully.', [
            { text: 'OK', onPress: () => router.push('/(owner-tabs)/bank-details') }
          ]);
        } else {
          Alert.alert('Error', data.message || 'Failed to save bank details.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View className="flex-1 bg-[#F9FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#03624C" />
        <Text className="text-gray-500 font-sans-medium mt-4">Loading details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Top Header Background */}
      <View className="absolute top-0 left-0 right-0 h-[150px] bg-[#E8F5EE] rounded-b-[40px] overflow-hidden">
        <View className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-[#03624C] opacity-10 rounded-full" />
      </View>

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center z-10">
          <TouchableOpacity
            onPress={() => router.push('/(owner-tabs)/bank-details')}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
            style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
          >
            <Ionicons name="arrow-back" size={20} color="#032221" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-xl font-sans-bold text-[#032221]">Edit Bank Details</Text>
            <Text className="text-xs font-sans-medium text-[#03624C] mt-0.5">Update payout account</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 10 }}>
            <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100" style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              
              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-[#E8F5EE] rounded-full items-center justify-center mb-3">
                  <Ionicons name="business" size={28} color="#03624C" />
                </View>
                <Text className="text-[13px] font-sans-medium text-gray-500 text-center px-4">
                  These details will be used to transfer your earnings from bookings.
                </Text>
              </View>

              {/* Account Holder Name */}
              <View className="mb-5">
                <Text className="text-xs font-sans-bold text-gray-500 mb-2 uppercase tracking-wider">Account Holder Name</Text>
                <View className="bg-gray-50 rounded-xl flex-row items-center px-4 border border-gray-200 h-[52px]">
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    value={holderName}
                    onChangeText={setHolderName}
                    placeholder="e.g. John Doe"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 font-sans-medium text-[#032221]"
                  />
                </View>
              </View>

              {/* Bank Name */}
              <View className="mb-5">
                <Text className="text-xs font-sans-bold text-gray-500 mb-2 uppercase tracking-wider">Bank Name</Text>
                <View className="bg-gray-50 rounded-xl flex-row items-center px-4 border border-gray-200 h-[52px]">
                  <Ionicons name="library-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 font-sans-medium text-[#032221]"
                  />
                </View>
              </View>

              {/* Account Number */}
              <View className="mb-5">
                <Text className="text-xs font-sans-bold text-gray-500 mb-2 uppercase tracking-wider">Account Number</Text>
                <View className="bg-gray-50 rounded-xl flex-row items-center px-4 border border-gray-200 h-[52px]">
                  <Ionicons name="calculator-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter Account Number"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 font-sans-medium text-[#032221]"
                  />
                </View>
              </View>

              {/* IFSC Code */}
              <View className="mb-8">
                <Text className="text-xs font-sans-bold text-gray-500 mb-2 uppercase tracking-wider">IFSC Code</Text>
                <View className="bg-gray-50 rounded-xl flex-row items-center px-4 border border-gray-200 h-[52px]">
                  <Ionicons name="code-working-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    value={ifsc}
                    onChangeText={(text) => setIfsc(text.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    autoCapitalize="characters"
                    maxLength={11}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 font-sans-medium text-[#032221]"
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                className="bg-[#03624C] h-[52px] rounded-xl items-center justify-center shadow-sm"
                style={{ elevation: 2, shadowColor: '#03624C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-sans-bold text-base">Save Details</Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
