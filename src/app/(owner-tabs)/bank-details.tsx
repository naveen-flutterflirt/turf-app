"use no memo";
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';

export default function BankDetailsScreen() {
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [ifsc, setIfsc] = useState('');
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

        if (response.ok && data.success && data.data && data.data.account_number) {
          setBankName(data.data.bank_name || '');
          setAccountNumber(data.data.account_number || '');
          setHolderName(data.data.account_name || '');
          setIfsc(data.data.ifsc_code || '');
          setHasExistingDetails(true);
        } else {
          setHasExistingDetails(false);
        }
      } else {
        const rawText = await response.text();
        console.error('\n========== BACKEND ERROR HTML ==========');
        console.error(rawText);
        console.error('========================================\n');
        setHasExistingDetails(false);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      setHasExistingDetails(false);
    } finally {
      setIsFetching(false);
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
        <View className="px-6 pt-4 pb-6 flex-row items-center z-10 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.push('/(owner-tabs)/profile')}
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
            >
              <Ionicons name="arrow-back" size={20} color="#032221" />
            </TouchableOpacity>
            <View className="ml-4">
              <Text className="text-xl font-sans-bold text-[#032221]">Bank Details</Text>
              <Text className="text-xs font-sans-medium text-[#03624C] mt-0.5">Your payout account</Text>
            </View>
          </View>

          {hasExistingDetails && (
            <TouchableOpacity onPress={() => router.push('/(owner-tabs)/edit-bank-details')} className="bg-white p-2 rounded-full border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
              <Ionicons name="pencil" size={20} color="#03624C" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 10 }}>
          {hasExistingDetails ? (
            <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100" style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              
              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-[#E8F5EE] rounded-full items-center justify-center mb-3">
                  <Ionicons name="business" size={28} color="#03624C" />
                </View>
                <Text className="text-[13px] font-sans-medium text-gray-500 text-center px-4">
                  Earnings from bookings will be transferred to this account.
                </Text>
              </View>

              <View className="mb-5 border-b border-gray-100 pb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1 uppercase tracking-wider">Account Holder Name</Text>
                <Text className="text-lg font-sans-bold text-[#032221]">{holderName}</Text>
              </View>

              <View className="mb-5 border-b border-gray-100 pb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1 uppercase tracking-wider">Bank Name</Text>
                <Text className="text-lg font-sans-bold text-[#032221]">{bankName}</Text>
              </View>

              <View className="mb-5 border-b border-gray-100 pb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1 uppercase tracking-wider">Account Number</Text>
                <Text className="text-lg font-sans-bold text-[#032221]">{accountNumber}</Text>
              </View>

              <View className="mb-2">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1 uppercase tracking-wider">IFSC Code</Text>
                <Text className="text-lg font-sans-bold text-[#032221]">{ifsc}</Text>
              </View>

            </View>
          ) : (
            <View className="bg-white rounded-[24px] p-8 items-center shadow-sm border border-gray-100" style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-gray-100">
                <Ionicons name="card-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-sans-bold text-[#032221] mb-2 text-center">No Bank Account Added</Text>
              <Text className="text-sm font-sans-medium text-gray-500 text-center mb-8">
                Add your bank details to receive payouts for your turf bookings.
              </Text>
              
              <TouchableOpacity
                onPress={() => router.push('/(owner-tabs)/edit-bank-details')}
                className="bg-[#03624C] w-full h-[52px] rounded-xl items-center justify-center shadow-sm"
                style={{ elevation: 2, shadowColor: '#03624C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
              >
                <Text className="text-white font-sans-bold text-base">Add Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
