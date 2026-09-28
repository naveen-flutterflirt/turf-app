import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';
import { useAlert } from '../context/AlertContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTurfImageUri } from '../utils/imageHelper';

export default function CreateBroadcastScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const params = useLocalSearchParams();
  const turf = params.turfData ? JSON.parse(params.turfData as string) : null;

  const [message, setMessage] = useState('');
  const [playerCount, setPlayerCount] = useState(5);
  const [skillLevel, setSkillLevel] = useState('Any');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedSport, setSelectedSport] = useState<any>(null);
  const [showSports, setShowSports] = useState(false);
  
  const [playDate, setPlayDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Date/Time Picker States
  const [dateObj, setDateObj] = useState(new Date());
  const [startTimeObj, setStartTimeObj] = useState(new Date());
  const [endTimeObj, setEndTimeObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Fetch Bookings to find nearest upcoming booking if turfData is not passed
  const { data: bookingsResponse } = useQuery({
    queryKey: ['customerBookings'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/customer/bookings`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      return response.json();
    },
    enabled: !!userData?.token,
  });

  const allBookings = bookingsResponse?.data || [];

  // Find nearest upcoming booking
  const nearestUpcomingBooking = React.useMemo(() => {
    const now = new Date();
    const upcoming = allBookings.filter((b: any) => {
      const status = (b.status || '').toUpperCase();
      const bookingDate = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`);
      return (status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && bookingDate >= now;
    }).sort((a: any, b: any) => {
      const dateA = new Date(`${a.booking_date?.split('T')[0]}T${a.start_time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`).getTime();
      return dateA - dateB;
    });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [allBookings]);

  // Use passed turfData if available, otherwise use the nearest booking's turf, otherwise fallback
  const activeTurf = turf || nearestUpcomingBooking?.turf;
  const activeBooking = nearestUpcomingBooking;

  const turfName = activeTurf?.name || 'Select an upcoming booking';
  const turfCity = activeTurf?.city || (activeTurf ? 'Bhopal, MP' : 'No upcoming bookings found');
  const turfImage = getTurfImageUri(activeTurf?.images);

  const availableSports = activeTurf?.sports || (activeBooking ? [{ id: activeBooking.sport_id, name: activeBooking.sport_name }] : [
    { id: 1, name: 'Football' },
    { id: 2, name: 'Cricket' },
    { id: 3, name: 'Basketball' },
    { id: 4, name: 'Tennis' },
    { id: 5, name: 'Badminton' }
  ]);
  const currentSport = selectedSport || availableSports[0];

  const createBroadcastMutation = useMutation({
    mutationFn: async () => {
        const payload: any = {
          message: message || "Looking for players for a weekend match!"
        };

        const finalSportId = selectedSport?.id || activeBooking?.sport_id || activeTurf?.sports?.[0]?.id;
        // Only send sport_id if it is a real UUID (not a mock integer ID from the fallback array)
        if (finalSportId && String(finalSportId).length > 10) {
          payload.sport_id = finalSportId;
        }

        const finalPlayDate = playDate || (activeBooking?.booking_date ? activeBooking.booking_date.split('T')[0] : null);
        if (finalPlayDate) payload.play_date = finalPlayDate;

        const finalStartTime = startTime || activeBooking?.start_time;
        if (finalStartTime) payload.start_time = finalStartTime;

        const finalEndTime = endTime || activeBooking?.end_time;
        if (finalEndTime) payload.end_time = finalEndTime;

        if (playerCount) payload.players_needed = playerCount;
        if (skillLevel) payload.skill_level = skillLevel;

        const tid = activeTurf?.id || activeTurf?._id || activeBooking?.turf_id;
        if (tid) {
          payload.turf_id = tid;
        }

        const response = await fetch(`${baseUrl}/community/broadcasts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData?.token}`,
          },
          body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error('Failed to create broadcast');
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh community feed
      queryClient.invalidateQueries({ queryKey: ['communityBroadcasts'] });

      // Simulate receiving a notification about the broadcast
      queryClient.setQueryData(['notifications'], (old: any) => {
        const newNotif = {
          id: `mock-${Date.now()}`,
          title: 'Broadcast Live!',
          message: 'Your broadcast is now live. Players will be notified.',
          type: 'SYSTEM',
          is_read: false,
          created_at: new Date().toISOString()
        };
        if (Array.isArray(old)) return [newNotif, ...old];
        if (old?.data) return { ...old, data: [newNotif, ...old.data] };
        return [newNotif];
      });

      router.push('/broadcast-success');
    },
    onError: (err) => {
      console.error(err);
      showAlert('Error', 'Failed to create broadcast. Please try again.');
    }
  });

  const handleCreate = () => {
    createBroadcastMutation.mutate();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDateObj(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setPlayDate(formattedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedTime) {
      setStartTimeObj(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).substring(0,5);
      setStartTime(formattedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedTime) {
      setEndTimeObj(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).substring(0,5);
      setEndTime(formattedTime);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-[18px] font-sans-bold text-[#032221] ml-2">
            Create Broadcast
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Turf Info Card */}
          <View className="flex-row items-center mb-6">
            {turfImage && (
              <Image source={{ uri: turfImage }} className="w-[72px] h-[72px] rounded-2xl bg-gray-200" />
            )}
            <View className={turfImage ? "ml-4 flex-1" : "flex-1"}>
              <Text className="text-[16px] font-sans-bold text-[#032221] mb-1">{turfName}</Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text className="text-[13px] font-sans-medium text-gray-500 ml-1">{turfCity}</Text>
              </View>
            </View>
          </View>

          {/* Message Input */}
          <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <TextInput
              multiline
              placeholder="Looking for players to join! Let's play and have fun ⚽"
              placeholderTextColor="#9CA3AF"
              className="font-sans-medium text-[14px] text-[#032221] h-24"
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              maxLength={200}
            />
            <Text className="text-right text-[11px] font-sans-medium text-gray-400 mt-2">
              {message.length}/200
            </Text>
          </View>

          {/* Sport Selector */}
          <Text className="text-[14px] font-sans-bold text-[#032221] mb-2">Sport</Text>
          <TouchableOpacity
            className={`flex-row items-center justify-between bg-white p-4 shadow-sm ${showSports ? 'rounded-t-[14px] mb-0' : 'rounded-[14px] mb-6'}`}
            style={!showSports ? { elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : {}}
            onPress={() => setShowSports(!showSports)}
          >
            <View className="flex-row items-center">
              <Ionicons name="football-outline" size={20} color="#032221" />
              <Text className="text-[14px] font-sans-medium text-[#032221] ml-3">{currentSport?.name}</Text>
            </View>
            <Ionicons name={showSports ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
          </TouchableOpacity>

          {showSports && (
            <View className="bg-white rounded-b-[14px] mb-6 shadow-sm overflow-hidden">
              {availableSports.map((sport: any, index: number) => (
                <TouchableOpacity
                  key={sport.id || index}
                  className={`p-4 flex-row items-center justify-between ${index !== availableSports.length - 1 ? 'border-b border-gray-50' : ''}`}
                  onPress={() => {
                    setSelectedSport(sport);
                    setShowSports(false);
                  }}
                >
                  <Text className={`text-[14px] font-sans-medium ${currentSport?.id === sport.id ? 'text-[#03624C]' : 'text-gray-600'}`}>
                    {sport.name}
                  </Text>
                  {currentSport?.id === sport.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#03624C" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Timing Fields */}
          <Text className="text-[14px] font-sans-bold text-[#032221] mb-2">Timing <Text className="font-sans-medium text-gray-400 font-normal">(Optional)</Text></Text>
          <View className="bg-white rounded-[14px] border border-gray-100 mb-6 p-4 shadow-sm" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
            <TouchableOpacity 
              className="flex-row items-center border-b border-gray-50 pb-3 mb-3"
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" className="mr-3" />
              <Text className={`flex-1 font-sans-medium text-[14px] ml-2 ${playDate ? 'text-[#032221]' : 'text-[#9CA3AF]'}`}>
                {playDate || "Select Date (YYYY-MM-DD)"}
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center justify-between">
              <TouchableOpacity 
                className="flex-row items-center flex-1 border-r border-gray-50 pr-3"
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#6B7280" className="mr-2" />
                <Text className={`flex-1 font-sans-medium text-[14px] ml-2 ${startTime ? 'text-[#032221]' : 'text-[#9CA3AF]'}`}>
                  {startTime || "Start (HH:MM)"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center flex-1 pl-4"
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#6B7280" className="mr-2" />
                <Text className={`flex-1 font-sans-medium text-[14px] ml-2 ${endTime ? 'text-[#032221]' : 'text-[#9CA3AF]'}`}>
                  {endTime || "End (HH:MM)"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showStartTimePicker && (
            <DateTimePicker
              value={startTimeObj}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleStartTimeChange}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={endTimeObj}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleEndTimeChange}
            />
          )}

          {/* Looking For Count */}
          <Text className="text-[14px] font-sans-bold text-[#032221] mb-2">Looking for</Text>
          <View className="items-center mb-6">
            <View className="flex-row items-center bg-white border border-gray-100 rounded-[14px] shadow-sm w-full" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              <TouchableOpacity
                className="w-16 h-12 items-center justify-center border-r border-gray-100"
                onPress={() => setPlayerCount(Math.max(1, playerCount - 1))}
              >
                <Ionicons name="remove" size={20} color="#032221" />
              </TouchableOpacity>

              <View className="flex-1 items-center justify-center">
                <Text className="text-[16px] font-sans-bold text-[#032221]">{playerCount}</Text>
              </View>

              <TouchableOpacity
                className="w-16 h-12 items-center justify-center border-l border-gray-100"
                onPress={() => setPlayerCount(playerCount + 1)}
              >
                <Ionicons name="add" size={20} color="#032221" />
              </TouchableOpacity>
            </View>
            <Text className="text-[12px] font-sans-medium text-gray-400 mt-2">players (optional)</Text>
          </View>

          {/* Skill Level */}
          <Text className="text-[14px] font-sans-bold text-[#032221] mb-2">Skill Level</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {['Any', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <Pressable
                key={level}
                onPress={() => setSkillLevel(level)}
                className={`px-4 py-2.5 rounded-[12px] border ${skillLevel === level ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-100'}`}
                style={skillLevel !== level ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : undefined}
              >
                <Text className={`font-sans-bold text-[13px] ${skillLevel === level ? 'text-white' : 'text-gray-500'}`}>{level}</Text>
              </Pressable>
            ))}
          </View>

        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
          <TouchableOpacity
            className="bg-[#03624C] w-full rounded-[16px] py-4 items-center justify-center flex-row"
            onPress={handleCreate}
            disabled={createBroadcastMutation.isPending}
          >
            {createBroadcastMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-sans-bold text-[16px]">Create Broadcast</Text>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
