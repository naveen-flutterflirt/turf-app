import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
}

export function AuthButton({ title, className = '', ...props }: AuthButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`w-full bg-primary-dark rounded-xl py-4 flex-row items-center justify-center relative ${className}`}
      {...props}
    >
      <Text className="text-white font-sans-semibold text-base">
        {title}
      </Text>
      <Ionicons 
        name="arrow-forward" 
        size={20} 
        color="#FFFFFF" 
        style={{ position: 'absolute', right: 20 }}
      />
    </TouchableOpacity>
  );
}
