import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, RefreshControl, Platform, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';
import { useAlert } from '../../context/AlertContext';

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  if (!h || !m) return time;
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function OwnerBookingsScreen() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  const { showAlert } = useAlert();
  const { turfId } = useLocalSearchParams();

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTurfFilter, setSelectedTurfFilter] = useState<string | null>(null);
  const [showTurfFilter, setShowTurfFilter] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const uniqueTurfs = Array.from(new Set(bookings.map(b => b.turf_id)))
    .map(id => {
      const turf = bookings.find(b => b.turf_id === id);
      return { id, name: turf?.turf_name || 'Unknown Turf' };
    })
    .filter(t => t.id);

  const fetchBookings = async (pageToFetch = 1, isRefresh = false) => {
    if (isRefresh) {
      setIsLoading(true);
      setPage(1);
    } else if (pageToFetch > 1) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${baseUrl}/owner/bookings?page=${pageToFetch}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTotalPages(data.meta?.total_pages || 1);
        
        const validBookings = (data.data || []).filter((b: any) => {
          const status = (b.status || '').toUpperCase();
          return status !== 'PENDING' && status !== 'PAYMENT_PENDING';
        });

        if (isRefresh || pageToFetch === 1) {
          setBookings(validBookings);
        } else {
          // Remove duplicates
          setBookings(prev => {
            const newArray = [...prev, ...validBookings];
            const unique = newArray.filter((v, i, a) => a.findIndex(t => (t.booking_id === v.booking_id)) === i);
            return unique;
          });
        }
        setPage(pageToFetch);
      } else {
        showAlert('Error', data.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings(1, true);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom && !isFetchingMore && !isLoading && page < totalPages) {
      fetchBookings(page + 1);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings(1, true);
      return () => {
        setSelectedTurfFilter(null);
        router.setParams({ turfId: '' });
      };
    }, [])
  );

  useEffect(() => {
    if (turfId && typeof turfId === 'string') {
      setSelectedTurfFilter(turfId);
    }
  }, [turfId]);

  const getFilteredBookings = (tab: string) => {
    return bookings.filter(b => {
      // Search filter
      const searchMatch = (b.turf_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!searchMatch) return false;

      // Date filter
      if (selectedDateFilter) {
        const selectedDateString = selectedDateFilter.toISOString().split('T')[0];
        const bookingDateString = b.booking_date?.split('T')[0];
        if (bookingDateString !== selectedDateString) return false;
      }

      // Turf filter
      if (selectedTurfFilter && b.turf_id !== selectedTurfFilter) return false;

      // Tab filter
      const status = (b.status || '').toUpperCase();
      const bookingDate = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`);
      const now = new Date();
      const isFuture = bookingDate >= now;

      if (tab === 'All') return true;
      if (tab === 'Upcoming') return (status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && isFuture;
      if (tab === 'Completed') return status === 'CONFIRMED' && !isFuture;
      if (tab === 'Cancelled') return status === 'CANCELLED';

      return true;
    });
  };

  // We need to pass the base empty search query to get the correct count for tabs
  const getTabCount = (tab: string) => {
    return bookings.filter(b => {
      // Date filter
      if (selectedDateFilter) {
        const selectedDateString = selectedDateFilter.toISOString().split('T')[0];
        const bookingDateString = b.booking_date?.split('T')[0];
        if (bookingDateString !== selectedDateString) return false;
      }

      // Turf filter
      if (selectedTurfFilter && b.turf_id !== selectedTurfFilter) return false;

      const status = (b.status || '').toUpperCase();
      const bookingDate = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`);
      const now = new Date();
      const isFuture = bookingDate >= now;

      if (tab === 'All') return true;
      if (tab === 'Upcoming') return (status === 'CONFIRMED' || status === 'PAYMENT_PENDING') && isFuture;
      if (tab === 'Completed') return status === 'CONFIRMED' && !isFuture;
      if (tab === 'Cancelled') return status === 'CANCELLED';
      return true;
    }).length;
  };

  const filteredBookings = getFilteredBookings(selectedTab).sort((a, b) => {
    const dateA = new Date(`${a.booking_date?.split('T')[0]}T${a.start_time || '00:00:00'}`).getTime();
    const dateB = new Date(`${b.booking_date?.split('T')[0]}T${b.start_time || '00:00:00'}`).getTime();
    return dateB - dateA; // Sort newest first
  });

  const tabs = [
    { id: 'All', label: 'All', count: getTabCount('All') },
    { id: 'Upcoming', label: 'Upcoming', count: getTabCount('Upcoming') },
    { id: 'Completed', label: 'Completed', count: getTabCount('Completed') },
    { id: 'Cancelled', label: 'Cancelled', count: getTabCount('Cancelled') },
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Dark Green Background for Header */}
      <View className="absolute top-0 left-0 right-0 h-[280px] bg-[#03624C]" />

      <SafeAreaView className="flex-1">
        {/* Header Content */}
        <View className="px-6 pt-6 pb-6 flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-3xl font-sans-bold text-white mb-1">Bookings</Text>
            <Text className="text-sm font-sans-medium text-white/80">
              {selectedDateFilter ? `Filtered by ${selectedDateFilter.toLocaleDateString()}` : 'Manage all bookings for your turfs'}
            </Text>
          </View>
          <View className="flex-row gap-2">
            {selectedDateFilter && (
              <TouchableOpacity
                onPress={() => setSelectedDateFilter(null)}
                className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center border border-red-500/40"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`w-10 h-10 rounded-xl items-center justify-center border ${selectedDateFilter ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}
            >
              <Ionicons name="calendar-outline" size={20} color={selectedDateFilter ? "#03624C" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area overlapping the header */}
        <View className="flex-1 bg-[#F9FAFB] rounded-t-[32px] pt-6 shadow-sm overflow-hidden" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>

          {/* Tabs */}
          <View className="px-4 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {tabs.map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setSelectedTab(tab.id)}
                    className={`mr-3 px-4 py-2.5 rounded-xl border ${isActive ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-sans-semibold text-[13px] ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {tab.label} <Text className={isActive ? 'text-white/80' : 'text-gray-400'}>({tab.count})</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View className="px-6 mb-4 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 border border-gray-100 mr-3" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search by customer name or turf..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 font-sans-medium text-[#032221]"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View className="flex-row gap-2">
              {selectedTurfFilter && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTurfFilter(null);
                    router.setParams({ turfId: '' });
                  }}
                  className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
                >
                  <Ionicons name="close" size={22} color="#DC2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowTurfFilter(true)} className={`w-12 h-12 rounded-xl border items-center justify-center ${selectedTurfFilter ? 'bg-[#03624C] border-[#03624C]' : 'bg-white border-gray-100'}`} style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
                <Ionicons name="options-outline" size={22} color={selectedTurfFilter ? "#FFFFFF" : "#03624C"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bookings List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#03624C']} tintColor="#03624C" />
            }
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 50 }} />
            ) : filteredBookings.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
                <Text className="text-gray-500 font-sans-medium mt-4 text-center px-6">
                  {selectedDateFilter
                    ? `No bookings found on ${selectedDateFilter.toLocaleDateString()}.`
                    : searchQuery
                      ? "No bookings match your search."
                      : `No ${selectedTab.toLowerCase()} bookings found.`}
                </Text>
              </View>
            ) : (
              filteredBookings.map((booking) => {
                const status = (booking.status || 'CONFIRMED').toUpperCase();
                let statusConfig = { bg: 'bg-[#E6F4EA]', text: 'text-[#1E7B44]', label: 'CONFIRMED' };

                if (status === 'PAYMENT_PENDING' || status === 'PENDING') {
                  statusConfig = { bg: 'bg-[#FEF9C3]', text: 'text-[#B08D23]', label: 'PAYMENT PENDING' };
                } else if (status === 'CANCELLED') {
                  statusConfig = { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', label: 'CANCELLED' };
                }

                return (
                  <TouchableOpacity
                    key={booking.booking_id}
                    onPress={() => router.push({
                      pathname: `/(owner-tabs)/booking-details/${booking.booking_id}` as any,
                      params: { bookingData: JSON.stringify(booking) }
                    })}
                    className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex-row justify-between items-center"
                    style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
                  >
                    <View className="flex-1">
                      {/* Turf Name and Status */}
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-sans-bold text-[#032221] text-base leading-tight flex-1 pr-2" numberOfLines={1}>{booking.turf_name}</Text>
                        <View className={`px-2 py-1 rounded-md ${statusConfig.bg}`}>
                          <Text className={`text-[9px] font-sans-bold uppercase ${statusConfig.text}`}>{statusConfig.label}</Text>
                        </View>
                      </View>

                      {/* Customer Name */}
                      <View className="flex-row items-center mb-1.5">
                        <Ionicons name="person-outline" size={14} color="#6B7280" />
                        <Text className="ml-2 font-sans-medium text-gray-600 text-xs">{booking.customer_name}</Text>
                      </View>

                      {/* Date */}
                      <View className="flex-row items-center mb-1.5">
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="ml-2 font-sans-medium text-gray-600 text-xs">{formatDate(booking.booking_date)}</Text>
                      </View>

                      {/* Time */}
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="ml-2 font-sans-medium text-gray-600 text-xs">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </Text>
                      </View>
                    </View>

                    {/* Right side Price and Arrow */}
                    <View className="items-end justify-between self-stretch ml-4 pt-1">
                      <Ionicons name="chevron-forward" size={20} color="#032221" />
                      <Text className="font-sans-bold text-[#03624C] text-base">₹{parseInt(booking.total_price || '0').toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            
            {/* Loading more indicator */}
            {isFetchingMore && (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#03624C" />
                <Text className="text-gray-500 font-sans-medium text-xs mt-2">Loading more bookings...</Text>
              </View>
            )}
            {!isFetchingMore && page >= totalPages && filteredBookings.length > 0 && (
              <View className="py-4 items-center justify-center">
                <Text className="text-gray-400 font-sans-medium text-xs">No more bookings</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} className="w-full bg-white rounded-3xl overflow-hidden p-2" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
            <View className="flex-row justify-between items-center px-4 pt-3 pb-2">
              <Text className="font-sans-bold text-lg text-[#032221]">Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close-circle-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => {
                const date = new Date(day.timestamp);
                setSelectedDateFilter(date);
                setShowDatePicker(false);
              }}
              markedDates={
                selectedDateFilter ? {
                  [selectedDateFilter.toISOString().split('T')[0]]: { selected: true, selectedColor: '#03624C' }
                } : {}
              }
              theme={{
                selectedDayBackgroundColor: '#03624C',
                todayTextColor: '#03624C',
                arrowColor: '#03624C',
                textDayFontFamily: 'PlusJakartaSans_600SemiBold',
                textMonthFontFamily: 'PlusJakartaSans_600SemiBold',
                textDayHeaderFontFamily: 'PlusJakartaSans_600SemiBold',
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Turf Filter Modal */}
      <Modal
        visible={showTurfFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTurfFilter(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowTurfFilter(false)}
        >
          <TouchableOpacity activeOpacity={1} className="w-full bg-white rounded-3xl overflow-hidden py-4" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
            <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100 mb-2">
              <Text className="font-sans-bold text-lg text-[#032221]">Filter by Turf</Text>
              <TouchableOpacity onPress={() => setShowTurfFilter(false)}>
                <Ionicons name="close-circle-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-64 px-4" showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedTurfFilter(null);
                  setShowTurfFilter(false);
                }}
                className={`px-4 py-3 rounded-xl mb-2 flex-row justify-between items-center ${selectedTurfFilter === null ? 'bg-[#03624C]/10 border border-[#03624C]/20' : 'bg-gray-50 border border-transparent'}`}
              >
                <Text className={`font-sans-bold ${selectedTurfFilter === null ? 'text-[#03624C]' : 'text-gray-600'}`}>All Turfs</Text>
                {selectedTurfFilter === null && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
              </TouchableOpacity>

              {uniqueTurfs.map(turf => (
                <TouchableOpacity
                  key={turf.id}
                  onPress={() => {
                    setSelectedTurfFilter(turf.id);
                    setShowTurfFilter(false);
                  }}
                  className={`px-4 py-3 rounded-xl mb-2 flex-row justify-between items-center ${selectedTurfFilter === turf.id ? 'bg-[#03624C]/10 border border-[#03624C]/20' : 'bg-gray-50 border border-transparent'}`}
                >
                  <Text className={`font-sans-bold ${selectedTurfFilter === turf.id ? 'text-[#03624C]' : 'text-gray-600'}`}>{turf.name}</Text>
                  {selectedTurfFilter === turf.id && <Ionicons name="checkmark-circle" size={20} color="#03624C" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
