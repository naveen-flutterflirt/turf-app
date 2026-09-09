import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '' });

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setOptions({
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => {} }]
    });
    setVisible(true);
  };

  const handlePress = (button: AlertButton) => {
    setVisible(false);
    if (button.onPress) {
      setTimeout(button.onPress, 100);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className="bg-white w-full rounded-3xl p-6 shadow-xl" style={{ elevation: 5 }}>
            <Text className="text-xl font-sans-bold text-[#032221] mb-2">{options.title}</Text>
            {options.message && (
              <Text className="text-[13px] font-sans-medium text-gray-500 mb-6 leading-relaxed">{options.message}</Text>
            )}
            
            <View className="flex-row justify-end flex-wrap gap-2 mt-2">
              {options.buttons?.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handlePress(btn)}
                    className={`px-5 py-2.5 rounded-xl justify-center items-center min-w-[80px] ${
                      isCancel 
                        ? 'bg-gray-100' 
                        : isDestructive 
                          ? 'bg-red-50' 
                          : 'bg-[#03624C]'
                    }`}
                  >
                    <Text className={`font-sans-semibold text-[13px] ${
                      isCancel 
                        ? 'text-gray-600' 
                        : isDestructive 
                          ? 'text-red-600' 
                          : 'text-white'
                    }`}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
