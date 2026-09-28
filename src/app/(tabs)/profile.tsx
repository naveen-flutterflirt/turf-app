import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import { LogoutModal } from '../../components/ui/LogoutModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalVisible(false);
    logout();
    router.replace('/(auth)/role-selection');
  };

  useEffect(() => {
    if (!isEditing) {
      setName(userData?.name || '');
      setEmail(userData?.email || '');
      setPhone(userData?.phone || '');
    }
  }, [userData, isEditing]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        const currentData = useAppStore.getState().userData;
        if (!currentData?.token) return;
        try {
          const response = await fetch(`${baseUrl}/customer/profile`, {
            headers: {
              'Authorization': `Bearer ${currentData.token}`,
            },
          });
          const data = await response.json();
          if (isActive && response.ok && data.success) {
             const updatedUser = { ...currentData, ...data.data, token: currentData.token, role: currentData.role };
             useAppStore.getState().login(currentData.role || 'CUSTOMER', updatedUser);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      
      fetchProfile();

      return () => {
        isActive = false;
      };
    }, [baseUrl])
  );

  const handleSave = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        // If API returns the updated data use it, otherwise use our local variables
        const newProfileData = data.data || { name, email, phone };
        const updatedUser = { ...userData, ...newProfileData, token: userData?.token, role: userData?.role };
        
        login(userData?.role || 'CUSTOMER', updatedUser);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        Alert.alert('Success', 'Password changed successfully');
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
    setName(userData?.name || '');
    setEmail(userData?.email || '');
    setPhone(userData?.phone || '');
  };

  const handleCancelPress = () => {
    setIsEditing(false);
    setName(userData?.name || '');
    setEmail(userData?.email || '');
    setPhone(userData?.phone || '');
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-[#F9FAFB]" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        {/* Fixed Header */}
        <View className="flex-row justify-between items-center py-4 px-6">
          <View className="flex-row items-center">
            <Text className="text-2xl font-sans-bold text-[#032221] mr-3">Profile</Text>
          </View>
          {!isEditing ? (
            <TouchableOpacity onPress={handleEditPress}>
              <Text className="text-[#03624C] font-sans-bold">Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCancelPress}>
              <Text className="text-gray-500 font-sans-bold">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6 items-center">
            <View className="w-20 h-20 bg-[#E6F4EA] rounded-full items-center justify-center mb-4">
              <Text className="text-[#03624C] text-3xl font-sans-bold">
                {(userData?.name || 'G').charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <Text className="text-xl font-sans-bold text-[#032221] mb-1">{userData?.name || 'Guest'}</Text>
            <Text className="text-sm font-sans-medium text-gray-500 mb-2">{userData?.role === 'CUSTOMER' ? 'Customer' : 'User'}</Text>
          </View>

          {/* Details Form */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <Text className="text-sm font-sans-bold text-[#032221] mb-4">Personal Details</Text>

            <View className="mb-4">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Full Name</Text>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                />
              ) : (
                <Text className="text-base font-sans-medium text-[#032221]">{userData?.name || '-'}</Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Email</Text>
              {isEditing ? (
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                />
              ) : (
                <Text className="text-base font-sans-medium text-[#032221]">{userData?.email || '-'}</Text>
              )}
            </View>

            <View className="mb-2">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Phone Number</Text>
              {isEditing ? (
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                />
              ) : (
                <Text className="text-base font-sans-medium text-[#032221]">{userData?.phone || '-'}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isLoading}
              className={`w-full rounded-xl py-4 items-center mb-6 ${isLoading ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-sans-bold text-base">Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Security Section */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <Text className="text-sm font-sans-bold text-[#032221] mb-4">Security</Text>
            <TouchableOpacity 
              className="flex-row items-center justify-between py-2"
              onPress={() => setIsChangingPassword(true)}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center mr-3">
                  <Ionicons name="lock-closed-outline" size={16} color="#F97316" />
                </View>
                <Text className="text-sm font-sans-medium text-[#032221]">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {!isEditing && (
            <TouchableOpacity 
              onPress={handleLogout}
              className="w-full bg-red-50 border border-red-100 rounded-xl py-4 items-center mt-6 flex-row justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 font-sans-semibold ml-2">Logout</Text>
            </TouchableOpacity>
          )}
          
        </ScrollView>

        {/* Change Password Modal */}
        <Modal
          visible={isChangingPassword}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsChangingPassword(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[32px] p-6 pb-10 shadow-lg">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-sans-bold text-[#032221]">Change Password</Text>
                <TouchableOpacity onPress={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Current Password</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter current password"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">New Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Enter new password (min. 6 chars)"
                />
              </View>

              <View className="mb-6">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Confirm New Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200"
                  placeholder="Re-enter new password"
                />
              </View>

              <TouchableOpacity 
                onPress={handleChangePassword}
                disabled={isPasswordLoading}
                className={`w-full rounded-xl py-4 items-center ${isPasswordLoading ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
              >
                {isPasswordLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-bold text-base">Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <LogoutModal 
          visible={isLogoutModalVisible}
          onClose={() => setIsLogoutModalVisible(false)}
          onConfirm={confirmLogout}
        />

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
