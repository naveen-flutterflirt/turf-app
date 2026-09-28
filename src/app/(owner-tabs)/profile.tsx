import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import { LogoutModal } from '../../components/ui/LogoutModal';

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const logout = useAppStore((state) => state.logout);
  const login = useAppStore((state) => state.login);
  const userData = useAppStore((state) => state.userData);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [businessName, setBusinessName] = useState(userData?.business_name || '');
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when modal opens or userData changes
  useEffect(() => {
    if (!isEditModalVisible) {
      setName(userData?.name || '');
      setEmail(userData?.email || '');
      setPhone(userData?.phone || '');
      setBusinessName(userData?.business_name || '');
    }
  }, [userData, isEditModalVisible]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        const currentData = useAppStore.getState().userData;
        if (!currentData?.token) return;
        try {
          const response = await fetch(`${baseUrl}/owner/profile`, {
            headers: {
              'Authorization': `Bearer ${currentData.token}`,
            },
          });
          const data = await response.json();
          if (isActive && response.ok && data.success) {
             const updatedUser = { ...currentData, ...data.data, token: currentData.token, role: currentData.role };
             useAppStore.getState().login(currentData.role || 'OWNER', updatedUser);
          }
        } catch (error) {
          console.error('Error fetching owner profile:', error);
        }
      };
      
      fetchProfile();

      return () => {
        isActive = false;
      };
    }, [baseUrl])
  );

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalVisible(false);
    logout();
    router.replace('/(auth)/role-selection');
  };

  const handleSave = async () => {
    if (!name || !email || !phone || !businessName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/owner/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ name, email, phone, business_name: businessName }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        const newProfileData = data.data || { name, email, phone, business_name: businessName };
        const updatedUser = { ...userData, ...newProfileData, token: userData?.token, role: userData?.role };
        
        login(userData?.role || 'OWNER', updatedUser);
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating owner profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-sans-bold text-[#032221]">Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          
          {/* Profile Summary Card */}
          <View className="px-6 py-6 border-b border-gray-100 bg-white">
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-gray-200 mr-4 items-center justify-center overflow-hidden">
                <Ionicons name="person" size={32} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-sans-bold text-[#032221]">{userData?.business_name || 'Your Business'}</Text>
                <Text className="text-sm font-sans-medium text-[#03624C] mt-0.5">{userData?.name || 'Owner Name'}</Text>
                <Text className="text-xs font-sans-medium text-gray-500 mt-1">{userData?.email || 'owner@email.com'}</Text>
                {userData?.phone && (
                  <Text className="text-xs font-sans-medium text-gray-400 mt-0.5">+91 {userData.phone}</Text>
                )}
                <View className="bg-[#E6F4EA] self-start px-2 py-1 rounded-md mt-2 border border-[#A7F3D0]">
                  <Text className="text-[10px] font-sans-bold text-[#03624C] uppercase tracking-wide">Business Owner</Text>
                </View>
              </View>
              {/* Edit Pencil Icon */}
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="p-2 bg-gray-50 rounded-full border border-gray-100">
                <Ionicons name="pencil" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Account Details Button */}
          <View className="mt-6 bg-white border-y border-gray-100">
            <TouchableOpacity 
              onPress={() => router.push('/(owner-tabs)/bank-details')}
              className="flex-row items-center px-6 py-4"
            >
              <Ionicons name="card-outline" size={22} color="#03624C" className="mr-4" />
              <View className="flex-1 ml-4">
                <Text className="font-sans-semibold text-[15px] text-[#032221]">Bank Account Details</Text>
                <Text className="font-sans-medium text-[13px] text-gray-500 mt-0.5">Manage your payout account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          {/* Support & Queries Button */}
          <View className="bg-white border-b border-gray-100">
            <TouchableOpacity 
              onPress={() => router.push('/(owner-tabs)/queries')}
              className="flex-row items-center px-6 py-4"
            >
              <Ionicons name="help-buoy-outline" size={22} color="#03624C" className="mr-4" />
              <View className="flex-1 ml-4">
                <Text className="font-sans-semibold text-[15px] text-[#032221]">Support & Queries</Text>
                <Text className="font-sans-medium text-[13px] text-gray-500 mt-0.5">Contact support or view past queries</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View className="mt-6 bg-white border-y border-gray-100 mb-8">
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center px-6 py-4"
            >
              <Ionicons name="log-out-outline" size={22} color="#DC2626" className="mr-4" />
              <View className="flex-1 ml-4">
                <Text className="font-sans-semibold text-[15px] text-[#DC2626]">Logout</Text>
                <Text className="font-sans-medium text-[13px] text-red-400 mt-0.5">Log out from your account</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView 
            className="flex-1 bg-white" 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text className="text-gray-500 font-sans-medium text-base">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-sans-bold text-[#032221]">Edit Profile</Text>
              <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#03624C" />
                ) : (
                  <Text className="text-[#03624C] font-sans-bold text-base">Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
              <View className="mb-5">
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter your name"
                />
              </View>

              <View className="mb-5">
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">Business Name</Text>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter business name"
                />
              </View>

              <View className="mb-5">
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter your email"
                />
              </View>

              <View className="mb-8">
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter phone number"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <LogoutModal 
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={confirmLogout}
      />

    </View>
  );
}
