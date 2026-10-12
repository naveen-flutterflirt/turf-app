import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../stores/useAppStore';
import { useApi } from '../../context/ApiContext';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
        const newProfileData = data.data || { name, email, phone };
        const updatedUser = { ...userData, ...newProfileData, token: userData?.token, role: userData?.role };

        login(userData?.role || 'CUSTOMER', updatedUser);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully');
        setSuccessModalVisible(true);
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
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Show success modal
        setSuccessMessage('Password changed successfully');
        setSuccessModalVisible(true);
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

  const handleDeleteAccount = async () => {
    if (deleteInput.toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "delete" to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`${baseUrl}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsDeleteModalVisible(false);
        Alert.alert('Success', 'Your account has been deleted.');
        logout();
        router.replace('/(auth)/role-selection');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F9FAFB]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        {/* Fixed Header */}
        <View className="flex-row items-center py-4 px-6">
          <Text className="text-2xl font-sans-bold text-[#032221]">Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Top Banner Card */}
          <View className="w-full bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden mb-8 relative">
            {/* Gradient Header Area */}
            <View className="h-28 w-full absolute top-0 left-0 right-0 rounded-t-3xl overflow-hidden">
              <LinearGradient
                colors={['#03624C', '#0A8A6D', '#2DD4BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            </View>

            {/* Avatar Container */}
            <View className="items-center mt-12 mb-6">
              <View className="w-24 h-24 rounded-full bg-[#E6F4EA] border-4 border-white items-center justify-center shadow-md">
                <Text className="text-[#03624C] text-3xl font-sans-bold">
                  {userData?.name ? userData.name.substring(0, 2).toUpperCase() : 'G'}
                </Text>
              </View>
              <Text className="text-[#032221] text-xl font-sans-bold mt-3">{userData?.name || 'Guest'}</Text>
              <Text className="text-gray-500 text-sm font-sans-medium mt-1">{userData?.email || 'No email provided'}</Text>
            </View>
          </View>

          {/* PERSONAL DETAILS Section */}
          <Text className="text-[#03624C] text-xs font-sans-bold tracking-widest mb-3 ml-2">PERSONAL DETAILS</Text>

          {/* Detail Card: Mobile */}
          <View className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#E6F4EA] items-center justify-center mr-4">
              <Ionicons name="call" size={20} color="#03624C" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-sans-medium mb-1">Mobile Number</Text>
              <Text className="text-[#032221] text-sm font-sans-semibold">{userData?.phone || '-'}</Text>
            </View>
          </View>

          {/* Detail Card: Email */}
          <View className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-8">
            <View className="w-10 h-10 rounded-full bg-[#E6F4EA] items-center justify-center mr-4">
              <Ionicons name="mail" size={20} color="#03624C" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-sans-medium mb-1">Email Address</Text>
              <Text className="text-[#032221] text-sm font-sans-semibold">{userData?.email || '-'}</Text>
            </View>
          </View>

          {/* ACCOUNT SETTINGS Section */}
          <Text className="text-[#03624C] text-xs font-sans-bold tracking-widest mb-3 ml-2">ACCOUNT SETTINGS</Text>

          {/* Setting: Edit Personal Details */}
          <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.7} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#E6F4EA] items-center justify-center mr-4">
              <Ionicons name="create" size={20} color="#03624C" />
            </View>
            <View className="flex-1">
              <Text className="text-[#032221] text-sm font-sans-semibold mb-1">Edit Personal Details</Text>
              <Text className="text-gray-500 text-xs font-sans-medium">Update your name, email, and mobile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Setting: Change Password */}
          <TouchableOpacity onPress={() => setIsChangingPassword(true)} activeOpacity={0.7} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4">
              <Ionicons name="lock-closed" size={20} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="text-[#032221] text-sm font-sans-semibold mb-1">Change Password</Text>
              <Text className="text-gray-500 text-xs font-sans-medium">Reset or secure your password details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Setting: Delete Account */}
          <TouchableOpacity onPress={() => setIsDeleteModalVisible(true)} activeOpacity={0.7} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
              <Ionicons name="trash" size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-red-600 text-sm font-sans-semibold mb-1">Delete My Account</Text>
              <Text className="text-gray-500 text-xs font-sans-medium">Permanently delete your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* LEGAL Section */}
          <Text className="text-[#03624C] text-xs font-sans-bold tracking-widest mb-3 ml-2">LEGAL</Text>

          {/* Setting: Privacy Policy */}
          <TouchableOpacity onPress={() => router.push('/privacy-policy')} activeOpacity={0.7} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-[#032221] text-sm font-sans-semibold mb-1">Privacy Policy</Text>
              <Text className="text-gray-500 text-xs font-sans-medium">Read our data and privacy policies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Setting: Terms & Conditions */}
          <TouchableOpacity onPress={() => router.push('/terms-and-conditions')} activeOpacity={0.7} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex-row items-center mb-8">
            <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-4">
              <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-[#032221] text-sm font-sans-semibold mb-1">Terms & Conditions</Text>
              <Text className="text-gray-500 text-xs font-sans-medium">View our terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* CRITICAL ACTIONS Section */}
          <View className="mt-2 border-t border-gray-200 pt-8 pb-4">
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} className="w-full bg-red-50 border border-red-300 rounded-xl py-4 flex-row justify-center items-center">
              <Ionicons name="log-out-outline" size={20} color="#7F1D1D" />
              <Text className="text-red-900 font-sans-bold text-base ml-2">Sign Out</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditing}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditing(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-sans-bold text-[#032221]">Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholderTextColor="#9CA3AF"
                  placeholder="Enter full name"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholderTextColor="#9CA3AF"
                  placeholder="Enter email address"
                />
              </View>

              <View className="mb-6">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Mobile Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 rounded-xl px-4 py-3.5 font-sans-medium text-[#032221] border border-gray-200"
                  placeholderTextColor="#9CA3AF"
                  placeholder="Enter mobile number"
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                className={`w-full rounded-xl py-3.5 items-center ${isLoading ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-bold text-sm">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={isChangingPassword}
          transparent
          animationType="fade"
          onRequestClose={() => setIsChangingPassword(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
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
                <View className="relative justify-center">
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    className="bg-gray-50 rounded-xl px-4 py-3.5 pr-12 font-sans-medium text-[#032221] border border-gray-200"
                    placeholderTextColor="#9CA3AF"
                    placeholder="Enter current password"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4"
                  >
                    <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    className="bg-gray-50 rounded-xl px-4 py-3.5 pr-12 font-sans-medium text-[#032221] border border-gray-200"
                    placeholderTextColor="#9CA3AF"
                    placeholder="Enter new password (min. 6 chars)"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4"
                  >
                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Confirm New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="bg-gray-50 rounded-xl px-4 py-3.5 pr-12 font-sans-medium text-[#032221] border border-gray-200"
                    placeholderTextColor="#9CA3AF"
                    placeholder="Re-enter new password"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4"
                  >
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isPasswordLoading}
                className={`w-full rounded-xl py-3.5 items-center ${isPasswordLoading ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
              >
                {isPasswordLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-bold text-sm">Update Password</Text>
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

        {/* Delete Account Modal */}
        <Modal
          visible={isDeleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDeleteModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-white w-full rounded-3xl p-6 items-center shadow-xl">
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <Ionicons name="warning" size={32} color="#DC2626" />
              </View>
              <Text className="text-xl font-sans-bold text-[#032221] mb-2 text-center">Delete Account?</Text>
              <Text className="text-sm font-sans-medium text-gray-500 text-center mb-6 leading-relaxed">
                This action is permanent and cannot be undone. All your data will be erased. Type <Text className="font-sans-bold text-red-600">delete</Text> below to confirm.
              </Text>

              <TextInput
                value={deleteInput}
                onChangeText={setDeleteInput}
                placeholder="Type 'delete'"
                placeholderTextColor="#9CA3AF"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-6 text-center font-sans-medium text-[#032221]"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View className="flex-row justify-between w-full">
                <TouchableOpacity
                  onPress={() => { setIsDeleteModalVisible(false); setDeleteInput(''); }}
                  className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center mr-2"
                >
                  <Text className="text-[#032221] font-sans-bold text-sm">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={isDeleting || deleteInput !== 'delete'}
                  className={`flex-1 py-3.5 rounded-xl items-center ml-2 ${isDeleting || deleteInput !== 'delete' ? 'bg-red-300' : 'bg-red-600'}`}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-sans-bold text-sm">Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-white w-full rounded-3xl p-6 items-center shadow-xl">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text className="text-xl font-sans-bold text-[#032221] mb-2 text-center">Success!</Text>
              <Text className="text-sm font-sans-medium text-gray-500 text-center mb-6 leading-relaxed">
                {successMessage}
              </Text>

              <TouchableOpacity
                onPress={() => setSuccessModalVisible(false)}
                className="w-full bg-[#03624C] py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-sans-bold text-sm">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
