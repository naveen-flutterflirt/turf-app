import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  isAuthenticated: boolean;
  userRole: 'CUSTOMER' | 'OWNER' | null;
  userData: any | null;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  cachedFeaturedTurfs: any[] | null;
  setCachedFeaturedTurfs: (turfs: any[]) => void;
  cachedNearbyTurfs: any[] | null;
  setCachedNearbyTurfs: (turfs: any[]) => void;
  login: (role: 'CUSTOMER' | 'OWNER', data: any) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      isAuthenticated: false,
      userRole: null,
      userData: null,
      favorites: [],
      toggleFavorite: (id) => set((state) => {
        const isFav = state.favorites.includes(id);
        return {
          favorites: isFav ? state.favorites.filter(favId => favId !== id) : [...state.favorites, id]
        };
      }),
      cachedFeaturedTurfs: null,
      setCachedFeaturedTurfs: (turfs) => set({ cachedFeaturedTurfs: turfs }),
      cachedNearbyTurfs: null,
      setCachedNearbyTurfs: (turfs) => set({ cachedNearbyTurfs: turfs }),
      login: (role, responseData) => {
        const userDetails = responseData.data || responseData.owner || responseData.customer || responseData.user || {};
        set({ isAuthenticated: true, userRole: role, userData: { ...responseData, ...userDetails } });
      },
      logout: () => set({ isAuthenticated: false, userRole: null, userData: null }),
    }),
    {
      name: 'turfplay-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
);

