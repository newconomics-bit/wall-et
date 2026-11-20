/**
 * Settings Store — wall-et
 * PRD §4 (Settings): theme default dark, persist via zustand + AsyncStorage.
 * Store ini sengaja minimal untuk Wave 1; field lain menyusul di wave-nya.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeName } from '@/theme/tokens';

type SettingsState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((prev) => ({ theme: prev.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'wall-et-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
