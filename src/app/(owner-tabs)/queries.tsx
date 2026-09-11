import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApi } from '../../context/ApiContext';
import { useAppStore } from '../../stores/useAppStore';

export default function QueriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);

  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form states
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueries = useCallback(async (showLoader = true) => {
    if (!userData?.token) return;
    if (showLoader) setIsLoading(true);
    
    try {
      const response = await fetch(`${baseUrl}/owner/queries`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Handle different possible response structures
        setQueries(data.data || data.queries || (Array.isArray(data) ? data : []));
      } else {
        console.error('Failed to fetch queries', data);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [baseUrl, userData]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchQueries(false);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both subject and message.');
      return;
    }

    if (!userData?.token) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${baseUrl}/owner/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Your query has been submitted.');
        setSubject('');
        setMessage('');
        setIsFormVisible(false);
        fetchQueries(true); // Refresh list
      } else {
        Alert.alert('Error', data.message || 'Failed to submit query.');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
      ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pb-4 flex-row items-center border-b border-gray-100" style={{ paddingTop: insets.top + 10 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <Ionicons name="arrow-back" size={24} color="#032221" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-[#032221] ml-2">Support & Queries</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#03624C" />
          }
        >
          {/* Create New Query Button / Form */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
            
            {!isFormVisible ? (
              <TouchableOpacity 
                onPress={() => setIsFormVisible(true)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-[#E6F4EA] rounded-full items-center justify-center mr-3">
                    <Ionicons name="chatbubbles-outline" size={20} color="#03624C" />
                  </View>
                  <View>
                    <Text className="font-sans-bold text-[#032221] text-base">New Query</Text>
                    <Text className="font-sans-medium text-gray-500 text-xs">Reach out to support</Text>
                  </View>
                </View>
                <Ionicons name="add-circle" size={28} color="#03624C" />
              </TouchableOpacity>
            ) : (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="font-sans-bold text-[#032221] text-lg">Submit a Query</Text>
                  <TouchableOpacity onPress={() => setIsFormVisible(false)}>
                    <Ionicons name="close-circle-outline" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <Text className="text-sm font-sans-medium text-gray-600 mb-1.5 ml-1">Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Issue with payment"
                  className="bg-gray-50 rounded-xl px-4 py-3 font-sans-medium text-[#032221] border border-gray-200 mb-4"
                />

                <Text className="text-sm font-sans-medium text-gray-600 mb-1.5 ml-1">Message</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue in detail..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-50 rounded-xl px-4 py-3 min-h-[100px] font-sans-medium text-[#032221] border border-gray-200 mb-5"
                />

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`py-3.5 rounded-xl items-center justify-center ${isSubmitting ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text className="font-sans-bold text-white text-base">Submit Query</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Past Queries List */}
          <Text className="font-sans-bold text-[#032221] text-lg mb-4 ml-1">Past Queries</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#03624C" style={{ marginTop: 20 }} />
          ) : queries.length === 0 ? (
            <View className="items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 border-dashed">
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text className="font-sans-medium text-gray-400 mt-3 text-center">You haven't submitted any queries yet.</Text>
            </View>
          ) : (
            queries.map((query, index) => (
              <View key={query.id || query._id || index} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="font-sans-bold text-[#032221] text-base flex-1 mr-2">{query.subject}</Text>
                  
                  {/* Optional Status Badge if backend returns one */}
                  {query.status && (
                    <View className={`px-2 py-1 rounded-md ${
                      query.status.toLowerCase() === 'closed' || query.status.toLowerCase() === 'resolved' ? 'bg-green-100' : 
                      query.status.toLowerCase() === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Text className={`text-[10px] font-sans-bold uppercase ${
                        query.status.toLowerCase() === 'closed' || query.status.toLowerCase() === 'resolved' ? 'text-green-700' : 
                        query.status.toLowerCase() === 'pending' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        {query.status}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text className="font-sans-medium text-gray-600 text-sm leading-relaxed mb-3">
                  {query.message}
                </Text>
                
                <View className="flex-row justify-between items-center border-t border-gray-50 pt-3">
                  <Text className="font-sans-medium text-gray-400 text-xs">
                    {query.created_at || query.createdAt ? formatDate(query.created_at || query.createdAt) : 'Recently submitted'}
                  </Text>
                  {/* Optional response from admin */}
                  {query.admin_reply && (
                    <Text className="font-sans-bold text-[#03624C] text-xs">Admin Replied</Text>
                  )}
                </View>
                
                {query.admin_reply && (
                  <View className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Text className="font-sans-bold text-gray-700 text-xs mb-1">Response:</Text>
                    <Text className="font-sans-medium text-gray-600 text-sm">{query.admin_reply}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
