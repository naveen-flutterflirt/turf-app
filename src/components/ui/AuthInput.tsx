import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function AuthInput({ icon, isPassword, className = '', ...props }: AuthInputProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center bg-white rounded-xl border px-4 py-1 mb-4 transition-colors ${isFocused ? 'border-black' : 'border-gray-200'
        } ${className}`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? '#000000' : '#9CA3AF'}
        style={{ marginRight: 12 }}
      />
      <TextInput
        className="flex-1 font-sans-medium text-turf-text text-base"
        placeholderTextColor="#9CA3AF"
        secureTextEntry={isSecure}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setIsSecure(!isSecure)}
          className="p-1"
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSecure ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={isFocused ? '#000000' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
