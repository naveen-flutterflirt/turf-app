import React, { useEffect, useState } from 'react';
import { Platform, Linking, Modal, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import Constants from 'expo-constants';
import { useApi } from '../context/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function AppUpdateChecker() {
  const { baseUrl } = useApi();
  const [showUpdate, setShowUpdate] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  
  const [bounceValue] = useState(new Animated.Value(0));

  useEffect(() => {
    async function checkUpdate() {
      try {
        const response = await fetch(`${baseUrl}/customer/app-settings`);
        const json = await response.json();
        
        if (json?.success && json?.data) {
          const settings = json.data;
          const currentVersion = Constants.expoConfig?.version || '1.0.0';
          const latestVersion = Platform.OS === 'ios' ? settings.latest_ios_version : settings.latest_android_version;
          
          if (latestVersion && latestVersion !== currentVersion) {
            const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0;
            
            if (isNewer) {
              const url = Platform.OS === 'ios' ? settings.app_store_url : settings.play_store_url;
              setStoreUrl(url);
              
              if (settings.force_update) {
                setUpdateMessage(settings.update_message || "A shiny new version is available. Please update to continue using the app!");
                setIsForceUpdate(true);
                setShowUpdate(true);
              } else if (settings.normal_update) {
                setUpdateMessage(settings.update_message || "A shiny new version of the app is available with exciting new features and improvements!");
                setIsForceUpdate(false);
                setShowUpdate(true);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check app updates", err);
      }
    }

    checkUpdate();
  }, [baseUrl]);

  useEffect(() => {
    if (showUpdate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -12,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [showUpdate, bounceValue]);

  const handleUpdate = () => {
    if (storeUrl) Linking.openURL(storeUrl);
  };

  if (!showUpdate) return null;

  return (
    <Modal visible={showUpdate} transparent animationType="fade">
      <View className="flex-1 justify-center items-center px-6 bg-[#0f172a]/80">
        
        {/* Main Card Container */}
        <View className="w-full bg-white rounded-[40px] overflow-visible" style={{ elevation: 25, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 35, shadowOffset: { width: 0, height: 20 }, marginTop: 50 }}>
          
          {/* Header Gradient Area */}
          <View className="w-full h-40 rounded-t-[40px] overflow-hidden relative">
            <LinearGradient
              colors={['#10B981', '#03624C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
            {/* Abstract Decorative Shapes */}
            <View className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10" />
            <View className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10" />
            
            {/* Subtle Dot Pattern */}
            <View className="absolute inset-0 opacity-20 flex-row flex-wrap items-center justify-center pt-2">
              {[...Array(60)].map((_, i) => (
                <View key={i} className="w-1 h-1 rounded-full bg-white m-3" />
              ))}
            </View>
          </View>

          {/* Floating Icon with Animation */}
          <View className="absolute top-14 self-center z-10">
            <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
              <View className="w-28 h-28 rounded-full bg-white items-center justify-center p-2" style={{ elevation: 15, shadowColor: '#03624C', shadowOpacity: 0.5, shadowRadius: 25, shadowOffset: { width: 0, height: 12 } }}>
                <LinearGradient
                  colors={['#10B981', '#03624C']}
                  className="w-full h-full rounded-full items-center justify-center"
                >
                  <Ionicons name="rocket" size={48} color="#FFF" style={{ marginLeft: 4, marginTop: -4 }} />
                </LinearGradient>
              </View>
            </Animated.View>
          </View>
          
          {/* Content Area */}
          <View className="px-7 pt-16 pb-8 items-center bg-white rounded-b-[40px]">
            <Text className="text-[#0f172a] font-sans-bold text-[26px] tracking-tight mb-3">
              App Update
            </Text>
            <Text className="text-gray-500 font-sans-medium text-[15px] text-center leading-6 mb-8">
              {updateMessage}
            </Text>

            <TouchableOpacity 
              onPress={handleUpdate}
              activeOpacity={0.8}
              className="w-full mb-4"
            >
              <LinearGradient
                colors={['#10B981', '#03624C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full rounded-[24px] py-4 items-center justify-center"
                style={{ elevation: 8, shadowColor: '#03624C', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } }}
              >
                <Text className="text-white font-sans-bold text-[17px] tracking-wide">Update Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!isForceUpdate && (
              <TouchableOpacity 
                onPress={() => setShowUpdate(false)}
                activeOpacity={0.7}
                className="w-full py-3 items-center justify-center"
              >
                <Text className="text-gray-400 font-sans-bold text-[15px]">I'll do it later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
