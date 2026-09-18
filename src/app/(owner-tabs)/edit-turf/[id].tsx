import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApi } from '../../../context/ApiContext';
import { uploadImageToS3 } from '../../../services/imageUploadService';
import { useAppStore } from '../../../stores/useAppStore';
import { useAlert } from '../../../context/AlertContext';

const SPORTS_OPTIONS = ['Football', 'Cricket', 'Tennis', 'Basketball'];

export default function EditTurfScreen() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { id, turfData } = useLocalSearchParams();
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

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const populateData = (turf: any) => {
      setName(turf.name || '');

      let parsedSports = turf.sports || [];
      if (typeof parsedSports === 'string') {
        try { parsedSports = JSON.parse(parsedSports); } catch(e) {}
      }
      setSelectedSports(Array.isArray(parsedSports) ? parsedSports : []);
      
      let loadedAmenities: string[] = [];
      if (Array.isArray(turf.amenities)) {
        loadedAmenities = turf.amenities.map((a: any) => typeof a === 'object' ? a.name || a.title || String(a) : String(a));
      } else if (typeof turf.amenities === 'string') {
        try {
          const parsed = JSON.parse(turf.amenities);
          if (Array.isArray(parsed)) {
            loadedAmenities = parsed.map((a: any) => typeof a === 'object' ? a.name || a.title || String(a) : String(a));
          } else {
            loadedAmenities = [turf.amenities];
          }
        } catch(e) {
          loadedAmenities = turf.amenities.split(',').map((a: string) => a.trim()).filter(Boolean);
        }
      }
      setAmenities(loadedAmenities);

      setAddress(turf.address || '');
      setCity(turf.city || '');
      setStateName(turf.state || '');
      setPincode(turf.pincode?.toString() || '');
      setLatitude(turf.latitude ? parseFloat(turf.latitude) : null);
      setLongitude(turf.longitude ? parseFloat(turf.longitude) : null);
      setPrice(turf.price_per_hour?.toString() || '');
      
      let parsedImages = turf.images || [];
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch(e) {}
      }
      if (Array.isArray(parsedImages)) {
        const extractedUrls = parsedImages.map((img: any) => typeof img === 'string' ? img : (img?.url || img?.uri || img?.image_url || ''));
        setImages(extractedUrls.filter(Boolean));
      }
    };

    if (turfData) {
      try {
        const turf = typeof turfData === 'string' ? JSON.parse(turfData) : turfData;
        populateData(turf);
      } catch (error) {
        console.error("parse turfData error:", error);
        showAlert('Error', 'Failed to load turf details from previous screen');
        router.back();
      }
    } else {
      showAlert('Error', 'No turf data provided');
      router.back();
    }
    setIsFetching(false);
  }, [id, turfData]);

  const pickImage = async () => {
    if (images.length >= 5) {
      showAlert('Limit Reached', 'You can only upload up to 5 images.');
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

  const handleUpdate = async () => {
    if (!name || selectedSports.length === 0 || !address || !city || !stateName || !pincode || !price || latitude === null || longitude === null) {
      showAlert('Missing Fields', 'Please fill in all the required fields and capture your location.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload new local images to S3
      const finalImageUrls: any[] = [];
      for (const item of images) {
        const uri = typeof item === 'string' ? item : (item as any)?.url || (item as any)?.image_url || '';
        if (typeof uri === 'string' && uri.startsWith('file://')) {
          const s3Result = await uploadImageToS3(uri, userData?.token || '', baseUrl);
          finalImageUrls.push(s3Result);
        } else {
          // Already an S3 URL or existing object
          // For backend compatibility, if we have an object with id/url/s3_key, we can pass it back
          // If we only have a string URL, we pass it back as is (backend should handle it)
          finalImageUrls.push(item);
        }
      }

      // 2. Prepare payload
      const payload = {
        name,
        address,
        city,
        state: stateName,
        pincode,
        latitude,
        longitude,
        price_per_hour: parseFloat(price),
        sports: selectedSports,
        amenities,
        images: finalImageUrls,
      };

      // 3. Update via API
      const response = await fetch(`${baseUrl}/owner/turfs/${id}`, {
        method: 'PUT', // or PATCH
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Success', 'Turf updated successfully!');
        router.push('/(owner-tabs)/turfs');
      } else {
        showAlert('Error', data.message || 'Failed to update turf');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to update turf.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#03624C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">

        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.push('/(owner-tabs)/turfs')} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-sans-bold text-turf-text ml-4 flex-1 text-center mr-10">Edit Turf</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

          {/* Main Photo Editor */}
          <View className="w-full h-48 bg-gray-200 rounded-2xl mb-6 relative overflow-hidden">
            {images.length > 0 ? (
              <Image
                source={{ uri: typeof images[0] === 'string' ? images[0] : (images[0] as any)?.url || (images[0] as any)?.uri || '' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-300">
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              </View>
            )}

            <View className="absolute inset-0 bg-black/20" />

            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="camera-outline" size={16} color="#111827" />
              <Text className="ml-2 font-sans-semibold text-turf-text text-xs">Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnails */}
          {images.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-6">
              {images.map((imgObj, index) => {
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
          )}

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Turf Name <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={name}
              onChangeText={setName}
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
          <Text className="font-sans-bold text-sm text-turf-text mb-2">Location <Text className="text-red-500">*</Text></Text>

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

          <View className="mb-4">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Address <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <TextInput
                value={address}
                onChangeText={setAddress}
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



          <View className="mb-8">
            <Text className="font-sans-bold text-sm text-turf-text mb-2">Price Per Hour <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <Text className="absolute left-4 top-3.5 font-sans-semibold text-gray-500 text-base z-10">₹</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-8 font-sans-medium text-turf-text"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isSaving}
            className={`w-full bg-primary-dark rounded-xl py-4 items-center justify-center ${isSaving ? 'opacity-70' : ''}`}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-sans-semibold text-base">Update Turf</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
