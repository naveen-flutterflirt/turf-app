import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApi } from '../../context/ApiContext';
import { uploadImageToS3 } from '../../services/imageUploadService';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

const SPORTS_OPTIONS = ['Football', 'Cricket', 'Tennis', 'Basketball'];

export default function AddTurfScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 10) {
      showAlert('Limit Reached', 'You can only upload up to 10 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showAlert('File too large', 'Image must be 5 MB or smaller.');
        return;
      }
      setImages([...images, asset.uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const fetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permission Denied',
          'We need location access to accurately place your turf. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setIsFetchingLocation(false);
        return;
      }

      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    } catch (error) {
      showAlert('Error', 'Failed to fetch location. Ensure your GPS is on.');
    } finally {
      setIsFetchingLocation(false);
    }
  };



  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (!name || selectedSports.length === 0 || !address || !city || !stateName || !pincode || !price || latitude === null || longitude === null) {
      showAlert('Missing Fields', 'Please fill in all the required fields and capture your location.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload images to S3
      const uploadedImages: { url: string; key: string }[] = [];
      for (const uri of images) {
        const s3Result = await uploadImageToS3(uri, userData?.token || '', baseUrl);
        uploadedImages.push(s3Result);
      }

      // 2. Prepare payload
      const payload = {
        name,
        description: 'No description provided.',
        address,
        city,
        state: stateName,
        pincode,
        latitude,
        longitude,
        price_per_hour: parseFloat(price),
        opening_time: '06:00:00',
        closing_time: '23:00:00',
        sports: selectedSports,
        amenities,
        images: uploadedImages,
      };

      // 3. Save to API
      const response = await fetch(`${baseUrl}/owner/turfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Success', 'Turf added successfully!');
        router.push('/(owner-tabs)/turfs');
      } else {
        showAlert('Error', data.message || 'Failed to add turf');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to save turf and upload images.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">

        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-sans-bold text-turf-text ml-4 flex-1 text-center mr-10">Add New Turf</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

          {/* Image Upload Area */}
          <View className="border-2 border-dashed border-gray-300 rounded-2xl p-6 items-center justify-center mb-6">
            <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="images-outline" size={24} color="#03624C" />
            </View>
            <Text className="font-sans-bold text-turf-text text-sm">Upload Photos</Text>
            <Text className="font-sans-medium text-gray-500 text-xs mt-1 mb-4">Add photos of your turf (Max 10 images, &lt; 5MB each)</Text>

            <View className="flex-row flex-wrap justify-center w-full gap-2 mt-2">
              {images.map((imgObj, index) => {
                // Handle cases where the backend might return an object instead of a string
                const uri = typeof imgObj === 'string' ? imgObj : (imgObj as any)?.url || (imgObj as any)?.uri || '';
                if (!uri) return null;
                return (
                  <View key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                    <Image source={{ uri }} className="w-full h-full" />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              {images.length < 10 && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="w-16 h-16 rounded-xl border border-gray-300 items-center justify-center bg-gray-50"
                >
                  <Ionicons name="add" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Turf Name <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter turf name"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-sans-medium text-turf-text"
            />
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Sport Type <Text className="text-red-500">*</Text></Text>
            <View className="flex-row flex-wrap gap-2">
              {SPORTS_OPTIONS.map(sport => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => toggleSport(sport)}
                    className={`flex-row items-center border rounded-xl px-4 py-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                  >
                    <Ionicons
                      name={sport === 'Football' ? 'football' : sport === 'Cricket' ? 'baseball' : sport === 'Tennis' ? 'tennisball' : 'basketball'}
                      size={18}
                      color={isSelected ? '#03624C' : '#9CA3AF'}
                    />
                    <Text className={`ml-2 font-sans-medium text-sm ${isSelected ? 'text-primary' : 'text-gray-500'}`}>{sport}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Amenities</Text>
            <View className="flex-row items-center gap-2 mb-2">
              <TextInput
                value={amenityInput}
                onChangeText={setAmenityInput}
                placeholder="E.g. Parking, Washroom, WiFi"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-sans-medium text-turf-text"
              />
              <TouchableOpacity onPress={handleAddAmenity} className="bg-[#03624C] px-4 py-3.5 rounded-xl justify-center">
                <Text className="text-white font-sans-bold text-sm">Add</Text>
              </TouchableOpacity>
            </View>
            {amenities.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <View key={index} className="flex-row items-center bg-[#E6F4EA] border border-[#03624C]/20 rounded-xl px-3 py-1.5">
                    <Text className="font-sans-medium text-[13px] text-[#03624C] mr-2">{amenity}</Text>
                    <TouchableOpacity onPress={() => handleRemoveAmenity(index)}>
                      <Ionicons name="close-circle" size={16} color="#03624C" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Address <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter full address"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-sans-medium text-turf-text pr-10"
              />
              <Ionicons name="location-outline" size={20} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: 14 }} />
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">City <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Select city"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-sans-medium text-turf-text pr-10"
              />
              <Ionicons name="location-outline" size={20} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: 14 }} />
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">State <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={stateName}
              onChangeText={setStateName}
              placeholder="E.g. Maharashtra"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-sans-medium text-turf-text"
            />
          </View>

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Pincode <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={pincode}
              onChangeText={setPincode}
              placeholder="E.g. 400001"
              keyboardType="numeric"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-sans-medium text-turf-text"
            />
          </View>

          <View className="mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Turf Location (GPS) <Text className="text-red-500">*</Text></Text>
            {latitude && longitude ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="font-sans-medium text-xs text-primary mb-1">Location Captured ✓</Text>
                  <Text className="font-sans-medium text-xs text-gray-500">Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}</Text>
                </View>
                <TouchableOpacity onPress={fetchLocation} disabled={isFetchingLocation} className="bg-white border border-gray-300 px-3 py-2 rounded-lg">
                  {isFetchingLocation ? <ActivityIndicator size="small" /> : <Text className="font-sans-semibold text-xs text-gray-600">Retake</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={fetchLocation} disabled={isFetchingLocation} className="flex-row items-center justify-center bg-primary px-4 py-3 rounded-xl mt-2">
                {isFetchingLocation ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="locate" size={18} color="#fff" />
                    <Text className="text-white font-sans-semibold ml-2">Capture Current Location</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-8">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Price Per Hour <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <Text className="absolute left-4 top-3.5 font-sans-semibold text-gray-500 text-base z-10">₹</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="800"
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-8 font-sans-medium text-turf-text"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={isLoading}
            className={`w-full bg-primary-dark rounded-xl py-4 items-center justify-center ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-sans-semibold text-base">Continue</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
