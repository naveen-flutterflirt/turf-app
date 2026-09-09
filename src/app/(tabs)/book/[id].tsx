import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApi } from '../../../context/ApiContext';
import { useAppStore } from '../../../stores/useAppStore';

const { width } = Dimensions.get('window');

// Generate next 14 days for the date selector
const generateDates = (startDate = new Date()) => {
  const dates = [];
  const today = new Date(startDate);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatSlotTime = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  if (!h || !m) return time;
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function SelectSlotScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, turfData } = useLocalSearchParams();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [turf, setTurf] = useState<any>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);

  useEffect(() => {
    if (turfData && typeof turfData === 'string') {
      try {
        setTurf(JSON.parse(turfData));
      } catch (e) {
        console.error('Failed to parse turfData', e);
      }
    }
    const generated = generateDates();
    setDates(generated);
    setSelectedDate(generated[0]);
  }, [turfData]);

  const fetchSlots = useCallback(async (date: Date) => {
    if (!id || !userData?.token) return;
    setIsLoadingSlots(true);
    setSlots([]);
    setSelectedSlots([]);

    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`${baseUrl}/customer/turfs/${id}/slots?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSlots(data.data || data.slots || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [id, baseUrl, userData]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const handleSlotPress = (slot: any) => {
    if (slot.status !== 'AVAILABLE' && slot.status !== 'available' && !(!slot.status)) return;

    setSelectedSlots(prev => {
      const exists = prev.find(s => s.start === slot.start && s.end === slot.end);
      if (exists) {
        return prev.filter(s => !(s.start === slot.start && s.end === slot.end));
      } else {
        // Can add logic here if contiguous required, but for now we allow any selection
        return [...prev, slot].sort((a, b) => {
          return a.start.localeCompare(b.start);
        });
      }
    });
  };

  const handleProceed = () => {
    if (selectedSlots.length === 0) return;

    router.push({
      pathname: '/booking-summary',
      params: {
        turfData: JSON.stringify(turf),
        selectedDate: selectedDate?.toISOString(),
        selectedSlots: JSON.stringify(selectedSlots)
      }
    });
  };

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      Morning: [],
      Afternoon: [],
      Evening: []
    };

    slots.forEach(slot => {
      const startHour = parseInt(slot.start.split(':')[0], 10);
      if (startHour < 12) groups.Morning.push(slot);
      else if (startHour < 17) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    });

    return groups;
  }, [slots]);

  if (!turf) {
    return (
      <View className="flex-1 bg-[#F9FAFB] items-center justify-center">
        <ActivityIndicator size="large" color="#03624C" />
      </View>
    );
  }

  const pricePerHour = turf.price_per_hour || 0;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white px-4 pb-4 flex-row items-center justify-between border-b border-gray-100" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
            <Ionicons name="arrow-back" size={24} color="#032221" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-[#032221] ml-2">Select Date & Slot</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} className="w-10 h-10 items-center justify-center">
          <Ionicons name="calendar-outline" size={24} color="#03624C" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Date Selector */}
        <View className="py-5 bg-white mb-2 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {dates.map((date, index) => {
              const isSelected = selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0];
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const monthName = date.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = date.getDate();

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  className={`items-center justify-center px-4 py-3 rounded-2xl mr-3 border ${isSelected ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-xs font-sans-medium mb-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{dayName}</Text>
                  <Text className={`text-lg font-sans-bold mb-1 ${isSelected ? 'text-white' : 'text-[#032221]'}`}>{dayNum}</Text>
                  <Text className={`text-xs font-sans-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{monthName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-6 py-4">
          <Text className="text-lg font-sans-bold text-[#032221] mb-4">Select Time Slot</Text>

          {/* Legend */}
          <View className="flex-row items-center gap-6 mb-6">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#10B981] mr-2" />
              <Text className="text-xs font-sans-medium text-gray-600">Available</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#EF4444] mr-2" />
              <Text className="text-xs font-sans-medium text-gray-600">Booked</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#9CA3AF] mr-2" />
              <Text className="text-xs font-sans-medium text-gray-600">Unavailable</Text>
            </View>
          </View>

          {isLoadingSlots ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 40 }} />
          ) : slots.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 font-sans-medium">No slots available for this date.</Text>
            </View>
          ) : (
            <>
              {['Morning', 'Afternoon', 'Evening'].map((period) => {
                const periodSlots = groupedSlots[period];
                if (periodSlots.length === 0) return null;

                return (
                  <View key={period} className="mb-6">
                    <Text className="text-sm font-sans-bold text-[#032221] mb-3">{period}</Text>
                    <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                      {periodSlots.map((slot, index) => {
                        const status = (slot.status || 'AVAILABLE').toUpperCase();
                        const isAvailable = status === 'AVAILABLE' || status === 'AVAILABLE ';
                        const actuallyAvailable = status !== 'EXPIRED' && status !== 'BOOKED';

                        const isSelected = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);

                        let slotStyle = 'bg-white border border-[#10B981]/40'; // Available
                        let textStyle = 'text-[#032221]';
                        let subTextStyle = 'text-[#03624C]';
                        let label = `₹${pricePerHour}`;

                        if (isSelected) {
                          slotStyle = 'bg-[#03624C] border-[#03624C]';
                          textStyle = 'text-white';
                          subTextStyle = 'text-white/90';
                        } else if (status === 'BOOKED') {
                          slotStyle = 'bg-[#FEE2E2] border-[#FEE2E2] opacity-80';
                          textStyle = 'text-[#DC2626]';
                          subTextStyle = 'text-[#DC2626]';
                          label = 'Booked';
                        } else if (status === 'EXPIRED') {
                          slotStyle = 'bg-[#F3F4F6] border-[#F3F4F6]';
                          textStyle = 'text-gray-400';
                          subTextStyle = 'text-gray-400';
                          label = 'Unavailable';
                        } else {
                          // Standard available
                          slotStyle = 'bg-white border border-[#10B981]/40';
                          textStyle = 'text-[#032221]';
                          subTextStyle = 'text-[#03624C]';
                        }

                        // Calculate width for 2 items per row with gaps
                        const itemWidth = (width - 48 - 8) / 2;

                        return (
                          <TouchableOpacity
                            key={index}
                            activeOpacity={actuallyAvailable ? 0.7 : 1}
                            onPress={() => actuallyAvailable && handleSlotPress(slot)}
                            className={`rounded-xl items-center justify-center py-3 m-1 ${slotStyle}`}
                            style={{ width: itemWidth }}
                          >
                            <Text className={`text-[11px] font-sans-bold mb-0.5 ${textStyle}`}>{`${formatSlotTime(slot.start)} - ${formatSlotTime(slot.end)}`}</Text>
                            <Text className={`text-[10px] font-sans-semibold ${subTextStyle}`}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </>
          )}

        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              setDates(generateDates(date));
            }
          }}
        />
      )}

      {/* Bottom Bar */}
      {selectedSlots.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row items-center justify-between shadow-lg" style={{ paddingBottom: insets.bottom + 16 }}>
          <View>
            <Text className="font-sans-bold text-[#032221] text-base mb-1">{selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected</Text>
            {selectedSlots.length === 1 ? (
              <Text className="text-gray-500 font-sans-medium text-xs">
                {formatSlotTime(selectedSlots[0].start)} - {formatSlotTime(selectedSlots[0].end)}
              </Text>
            ) : (
              <Text className="text-gray-500 font-sans-medium text-xs">
                Multiple times selected
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleProceed}
            className="bg-[#03624C] px-8 py-3.5 rounded-2xl"
          >
            <Text className="text-white font-sans-bold text-base">Proceed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
