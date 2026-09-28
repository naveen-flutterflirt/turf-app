import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../context/ApiContext';
import { useAppStore } from '../stores/useAppStore';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  turfId: string;
  initialFeedback?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  onSuccess: () => void;
}

export default function FeedbackModal({ visible, onClose, bookingId, turfId, initialFeedback, onSuccess }: FeedbackModalProps) {
  const { baseUrl } = useApi();
  const userData = useAppStore((state) => state.userData);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialFeedback) {
        setRating(initialFeedback.rating || 0);
        setComment(initialFeedback.comment || '');
        setExistingFeedbackId(initialFeedback.id);
      } else {
        setRating(0);
        setComment('');
        setExistingFeedbackId(null);
        // Fetch existing feedback if not provided
        fetchExistingFeedback();
      }
    }
  }, [visible, initialFeedback, bookingId]);

  const fetchExistingFeedback = async () => {
    try {
      const response = await fetch(`${baseUrl}/customer/feedback?booking_id=${bookingId}`, {
        headers: { 'Authorization': `Bearer ${userData?.token}` }
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        // Handle if it's an array or object
        const feedback = Array.isArray(data.data) ? data.data[0] : data.data;
        if (feedback && feedback.id) {
            setRating(feedback.rating || 0);
            setComment(feedback.comment || '');
            setExistingFeedbackId(feedback.id);
        }
      }
    } catch (e) {
      // Silently fail, it just means we don't have feedback yet or the endpoint doesn't exist
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Validation Error', 'Please select a rating');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          turf_id: turfId,
          booking_id: bookingId,
          rating,
          comment
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success !== false) {
        Alert.alert('Success', 'Thank you for your feedback!');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!existingFeedbackId) return;
    if (rating === 0) {
      Alert.alert('Validation Error', 'Please select a rating');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/feedback/${existingFeedbackId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userData?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          comment
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success !== false) {
        Alert.alert('Success', 'Feedback updated successfully');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Failed to update feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: deleteFeedbackApi, style: "destructive" }
      ]
    );
  };

  const deleteFeedbackApi = async () => {
    if (!existingFeedbackId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/customer/feedback/${existingFeedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData?.token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success !== false) {
        Alert.alert('Success', 'Feedback deleted successfully');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get rating text
  const getRatingText = (val: number) => {
    switch(val) {
      case 1: return "Poor 😞";
      case 2: return "Fair 😐";
      case 3: return "Good 🙂";
      case 4: return "Very Good 😃";
      case 5: return "Excellent! 🤩";
      default: return "";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end"
      >
        <View className="bg-white rounded-t-[32px] p-6 pb-10" style={{ maxHeight: '90%', elevation: 20 }}>
          
          {/* Close Button Absolute */}
          <View className="absolute top-4 right-4 z-10">
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100/80 rounded-full items-center justify-center w-10 h-10">
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
            
            {/* Header Icon */}
            <View className="items-center mb-5 mt-2">
              <View className="w-16 h-16 bg-[#E6F4EA] rounded-full items-center justify-center mb-3">
                <Ionicons name="star" size={32} color="#F59E0B" />
              </View>
              <Text className="text-2xl font-sans-bold text-[#032221] text-center">
                {existingFeedbackId ? 'Update Review' : 'Rate Your Experience'}
              </Text>
              <Text className="text-center font-sans-medium text-gray-500 mt-2 text-[15px] px-4">
                How was your time at the turf? Your feedback helps others.
              </Text>
            </View>

            {/* Star Rating */}
            <View className="items-center mb-8 bg-gray-50 py-6 rounded-3xl border border-gray-100">
              <View className="flex-row justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={rating >= star ? 'star' : 'star-outline'}
                      size={44}
                      color={rating >= star ? '#F59E0B' : '#D1D5DB'}
                      style={{ transform: [{ scale: rating === star ? 1.1 : 1 }] }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="font-sans-bold text-[#F59E0B] mt-3 text-lg h-6">
                {getRatingText(rating)}
              </Text>
            </View>

            {/* Comment Input */}
            <View className="mb-2">
              <Text className="font-sans-bold text-[#032221] mb-2 ml-1 text-[15px]">Additional Comments</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us what you loved or what needs improvement..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="bg-[#F9FAFB] border border-gray-200 rounded-[20px] p-5 text-[#032221] font-sans-medium text-[15px] min-h-[120px]"
                textAlignVertical="top"
              />
            </View>

            {/* Actions */}
            <View className="mt-8 gap-3">
              <TouchableOpacity
                onPress={existingFeedbackId ? handleUpdate : handleSubmit}
                disabled={isLoading}
                className={`py-4 rounded-2xl flex-row justify-center items-center shadow-sm ${isLoading ? 'bg-[#03624C]/70' : 'bg-[#03624C]'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-bold text-[16px]">
                    {existingFeedbackId ? 'Update Review' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>

              {existingFeedbackId && (
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={isLoading}
                  className="bg-transparent py-4 rounded-2xl flex-row justify-center items-center mt-1"
                >
                  <Text className="text-[#DC2626] font-sans-bold text-[15px]">
                    Remove Review
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
