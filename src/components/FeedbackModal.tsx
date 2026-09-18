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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-sans-bold text-[#032221]">
              {existingFeedbackId ? 'Update Review' : 'Leave a Review'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
              <Ionicons name="close" size={20} color="#032221" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-center font-sans-medium text-gray-600 mb-4">
              How was your experience at the turf?
            </Text>

            {/* Star Rating */}
            <View className="flex-row justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={40}
                    color={rating >= star ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Input */}
            <Text className="font-sans-semibold text-[#032221] mb-2">Write a comment (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us what you liked or didn't like..."
              multiline
              numberOfLines={4}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-[#032221] font-sans-medium text-[15px] min-h-[100px]"
              textAlignVertical="top"
            />

            {/* Actions */}
            <View className="mt-8 gap-3">
              <TouchableOpacity
                onPress={existingFeedbackId ? handleUpdate : handleSubmit}
                disabled={isLoading}
                className="bg-[#03624C] py-4 rounded-xl flex-row justify-center items-center"
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
                  className="bg-[#FEF2F2] border border-[#FECACA] py-4 rounded-xl flex-row justify-center items-center"
                >
                  <Text className="text-[#DC2626] font-sans-bold text-[16px]">
                    Delete Review
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
