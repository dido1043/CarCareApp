import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CURRENCY } from '@/utils/format';

/**
 * Client-only state: which vehicle the user is looking at and their display
 * preferences. Server data lives in React Query — keeping a copy here as well
 * would mean two sources of truth to hold in step.
 */
interface PreferencesState {
  /** Null until a vehicle is chosen, or when the chosen one is deleted. */
  selectedVehicleId: string | null;
  defaultCurrency: string;
  /** False until the persisted slice has been read back from storage. */
  isHydrated: boolean;
  selectVehicle: (vehicleId: string | null) => void;
  setDefaultCurrency: (currency: string) => void;
  setHydrated: (isHydrated: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      selectedVehicleId: null,
      defaultCurrency: DEFAULT_CURRENCY,
      isHydrated: false,
      selectVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'carcare.preferences.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // `isHydrated` describes this run of the app, so it is never persisted.
      partialize: (state) => ({
        selectedVehicleId: state.selectedVehicleId,
        defaultCurrency: state.defaultCurrency,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Reads the currency to default new expenses to. */
export function useDefaultCurrency(): string {
  return usePreferences((state) => state.defaultCurrency);
}
