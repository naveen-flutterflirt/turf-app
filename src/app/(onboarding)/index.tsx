import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAppStore } from '../../stores/useAppStore';

const slides = [
  {

    id: '1',
    image: require('../../../assets/images/sports_players.png'),
    backgroundImage: require('../../../assets/images/stadium_bg.png'),
    logo: require('../../../assets/images/logo_only.png'),
    logo_text: require('../../../assets/images/logo_text.png'),
    title: 'Book. Play.\nWin Together.',
    description: 'Discover and book the\nbest turfs near you.',
    buttonLabel: 'Next',
    isFullScreen: true,

  },
  {
    id: '2',
    image: require('../../../assets/images/onboarding_map.png'),
    title: 'Find Best Turfs\nNear You',
    description: 'Explore top-rated turfs for\nfootball, cricket, and more.',
    buttonLabel: 'Next',
    isFullScreen: false,
  },
  {
    id: '3',
    image: require('../../../assets/images/onboarding_calendar.png'),
    title: 'Easy Booking\nin Seconds',
    description: 'Choose your slot and book\ninstantly with secure payments.',
    buttonLabel: 'Next',
    isFullScreen: false,
  },
  {
    id: '4',
    image: require('../../../assets/images/onboarding_success.png'),
    title: 'Play More.\nCreate Memories.',
    description: 'Manage your bookings and\nenjoy the game!',
    buttonLabel: 'Get Started',
    isFullScreen: false,
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
    return () => { };
  }, []);

  const setHasSeenOnboarding = useAppStore((state) => state.setHasSeenOnboarding);

  const finishOnboarding = () => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/role-selection');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Calculate bottom padding for content so it stays clear of the pagination dots
  const contentPaddingBottom = Math.max(insets.bottom + 40, 60);

  return (
    <View className="flex-1 bg-turf-bg">
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => {
          const isDark = index === 0;
          return (
            <View style={{ width, height: '100%' }} className={item.isFullScreen ? 'bg-secondary-dark' : 'bg-turf-bg'}>
              {item.isFullScreen ? (
                <View className="flex-1 bg-secondary-dark">
                  {/* Stadium Background */}
                  <Image
                    source={item.backgroundImage}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                  />
                  {/* Dark Green Overlay */}
                  <View
                    className="absolute inset-0"
                    style={{ backgroundColor: 'rgba(0, 35, 30, 0.40)' }}
                  />


                  {/* Content Container with Manual Safe Area */}
                  <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: contentPaddingBottom }}>
                    {/* Top Row: Logo & Skip */}
                    <View className="w-full px-6 mt-6 flex-row justify-between items-center z-20">
                      <View className="flex-row items-center">
                        <Image source={item.logo} style={{ width: 32, height: 32 }} resizeMode="contain" />
                        <Image source={item.logo_text} style={{ width: 85, height: 28, marginLeft: 8 }} resizeMode="contain" />
                      </View>
                      <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.7} className="bg-black/20 px-4 py-2 rounded-full">
                        <Text className="text-white font-sans-medium text-xs tracking-wide">SKIP</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Heading Area */}
                    <View className="px-6 mt-12 z-20">
                      <Text className="font-sans-bold text-white text-4xl leading-tight">Book. Play.</Text>
                      <Text className="font-sans-bold text-primary text-4xl leading-tight">Win Together.</Text>
                      <Text className="text-white/85 font-sans-medium text-base mt-4 leading-relaxed">
                        Discover and book the best turfs{'\n'}near you.
                      </Text>
                    </View>

                    {/* Sports Players Image */}
                    <View className="flex-1 justify-center items-center mt-4 z-10">
                      <Image
                        source={item.image}
                        className="w-[110%] h-[100%]"
                        style={{ marginLeft: '-5%' }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Bottom Area: Button */}
                    <View className="px-6 mt-4">
                      <TouchableOpacity onPress={handleNext} activeOpacity={0.85} className="w-full bg-white rounded-2xl py-4 items-center flex-row justify-center relative shadow-md">
                        <Text className="text-secondary-dark font-sans-bold text-lg">{item.buttonLabel}</Text>
                        <Text className="absolute right-6 text-secondary-dark text-xl">→</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                // Standard Variant (Screens 2, 3, 4)
                <View className="flex-1 px-8" style={{ paddingTop: insets.top + 16, paddingBottom: contentPaddingBottom }}>
                  {/* Top Skip Button */}
                  <View className="w-full flex-row justify-end mb-4 z-20">
                    <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.7} className="bg-gray-100 px-4 py-2 rounded-full">
                      <Text className="text-gray-600 font-sans-medium text-xs tracking-wide">SKIP</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Image Section */}
                  <View className="flex-[0.6] justify-center items-center bg-white rounded-[32px] overflow-hidden mb-8 shadow-sm">
                    <Image source={item.image} className="w-[85%] h-[85%]" resizeMode="contain" />
                  </View>

                  {/* Text & Button Section */}
                  <View className="flex-[0.4] justify-between">
                    <View>
                      <Text className={`text-[32px] font-sans-bold leading-tight mb-4 ${isDark ? 'text-white' : 'text-turf-text'}`}>
                        {item.title.split('\n').map((line: string, idx: number) => (
                          <Text key={idx} className={idx === 1 ? 'text-primary-dark font-sans-bold' : 'font-sans-bold'}>
                            {line}{'\n'}
                          </Text>
                        ))}
                      </Text>
                      <Text className={`text-base font-sans-medium leading-relaxed ${isDark ? 'text-secondary' : 'text-gray-500'}`}>
                        {item.description}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleNext} className="w-full rounded-2xl py-4 items-center flex-row justify-center bg-secondary-dark shadow-md" activeOpacity={0.85}>
                      <Text className="font-sans-bold text-lg text-white">{item.buttonLabel}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Pagination Dots - Positioned absolutely at the bottom, safe from the content */}

      <View
        className="absolute flex-row w-full justify-center space-x-4 pointer-events-none"
        style={{ bottom: Math.max(insets.bottom + 10, 20) }}
      >
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full mx-1 transition-all duration-300 ${currentIndex === index ? 'w-8 bg-primary-dark' : 'w-2 bg-gray-300'
              } ${currentIndex === 0 && index === 0 ? 'bg-primary' : ''} ${currentIndex === 0 && index !== 0 ? 'bg-white/40' : ''
              }`}
          />
        ))}
      </View>

    </View>
  );
}
