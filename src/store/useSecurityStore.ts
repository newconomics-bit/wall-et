/**
 * Security Store — wall-et
 * PRD §6 & .kilocoderules #10: PIN hash SHA-256 + salt (expo-crypto),
 * disimpan di expo-secure-store. Cooldown 60 detik setelah 5x gagal.
 * State lain (biometrik, balanceHidden, lock) persist via zustand + AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export const MAX_PIN_ATTEMPTS = 5;
export const PIN_COOLDOWN_MS = 60 * 1000;

export type SecurityState = {
  // PIN (terpisah dari state biasa, di SecureStore)
  pinHash: string | null;
  pinSalt: string | null;

  // Attempts & cooldown
  pinAttempts: number;
  lockUntil: number | null; // timestamp ms

  // Biometric
  biometricEnabled: boolean;
  biometricAvailable: boolean;

  // Balance privacy
  isBalanceHidden: boolean;

  // FLAG_SECURE (prevent screenshot/recording)
  secureCapture: boolean;

  // Lock & onboarding
  isLocked: boolean;
  isOnboardingComplete: boolean;

  // Readiness (tidak di-persist): AsyncStorage & SecureStore sudah terbaca
  isHydrated: boolean;
  isSecureLoaded: boolean;

  // Actions
  setPin: (hash: string, salt: string) => Promise<void>;
  generateSalt: () => Promise<string>;
  hashPin: (pin: string, salt: string) => Promise<string>;
  verifyPin: (pin: string) => Promise<boolean>;
  incrementAttempts: () => void;
  resetAttempts: () => void;
  setLock: (locked: boolean) => void;
  setBiometric: (enabled: boolean) => void;
  setBiometricAvailable: (available: boolean) => void;
  toggleBalanceHidden: () => void;
  setSecureCapture: (enabled: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setSecureLoaded: (loaded: boolean) => void;
  clearAll: () => Promise<void>;
};

// SecureStore keys
const SECURE_PIN_HASH = 'wall-et_pin_hash';
const SECURE_PIN_SALT = 'wall-et_pin_salt';

const generateSalt = async (): Promise<string> => {
  const salt = new Uint8Array(16);
  Crypto.getRandomValues(salt);
  return Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
};

const hashPin = async (pin: string, salt: string): Promise<string> => {
  const data = salt + pin;
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return digest;
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      pinSalt: null,
      pinAttempts: 0,
      lockUntil: null,
      biometricEnabled: false,
      biometricAvailable: false,
      isBalanceHidden: false,
      secureCapture: true, // default ON per requirement
      isLocked: false,
      isOnboardingComplete: false,
      isHydrated: false,
      isSecureLoaded: false,

      setPin: async (hash, salt) => {
        // Tulis ke SecureStore DULU: jangan pernah menandai onboarding selesai
        // sebelum PIN benar-benar tersimpan (kalau proses mati, PIN tidak hilang).
        await Promise.all([
          SecureStore.setItemAsync(SECURE_PIN_HASH, hash),
          SecureStore.setItemAsync(SECURE_PIN_SALT, salt),
        ]);
        set({ pinHash: hash, pinSalt: salt });
      },

      generateSalt,
      hashPin,

      verifyPin: async (pin: string) => {
        const { pinSalt, pinHash } = get();
        if (!pinHash || !pinSalt) return false;
        const hash = await hashPin(pin, pinSalt);
        return hash === pinHash;
      },

      incrementAttempts: () => {
        const { pinAttempts, lockUntil } = get();
        // Cooldown sebelumnya sudah lewat → mulai hitungan baru dari 0.
        const base = lockUntil !== null && Date.now() >= lockUntil ? 0 : pinAttempts;
        const next = base + 1;
        if (next >= MAX_PIN_ATTEMPTS) {
          set({ pinAttempts: next, lockUntil: Date.now() + PIN_COOLDOWN_MS });
        } else {
          set({ pinAttempts: next, lockUntil: null });
        }
      },

      resetAttempts: () => {
        set({ pinAttempts: 0, lockUntil: null });
      },

      setLock: (locked) => {
        set({ isLocked: locked });
      },

      setBiometric: (enabled) => {
        set({ biometricEnabled: enabled });
      },

      setBiometricAvailable: (available) => {
        set({ biometricAvailable: available });
      },

      toggleBalanceHidden: () => {
        set((prev) => ({ isBalanceHidden: !prev.isBalanceHidden }));
      },

      setSecureCapture: (enabled) => {
        set({ secureCapture: enabled });
      },

      setOnboardingComplete: (complete) => {
        set({ isOnboardingComplete: complete });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      setSecureLoaded: (loaded) => {
        set({ isSecureLoaded: loaded });
      },

      clearAll: async () => {
        await Promise.all([
          SecureStore.deleteItemAsync(SECURE_PIN_HASH),
          SecureStore.deleteItemAsync(SECURE_PIN_SALT),
        ]);
        set({
          pinHash: null,
          pinSalt: null,
          pinAttempts: 0,
          lockUntil: null,
          biometricEnabled: false,
          // biometricAvailable = kapabilitas hardware, bukan data user.
          isBalanceHidden: false,
          secureCapture: true,
          isLocked: false,
          isOnboardingComplete: false,
        });
      },
    }),
    {
      name: 'wall-et-security',
      storage: createJSONStorage(() => AsyncStorage),
      // PIN hash/salt di SecureStore (terpisah), jangan di zustand persist.
      // isHydrated/isSecureLoaded sengaja tidak di-persist (hanya status sesi).
      partialize: (state) => ({
        biometricEnabled: state.biometricEnabled,
        biometricAvailable: state.biometricAvailable,
        isBalanceHidden: state.isBalanceHidden,
        secureCapture: state.secureCapture,
        isLocked: state.isLocked,
        isOnboardingComplete: state.isOnboardingComplete,
        // Cooldown ikut di-persist supaya restart app tidak menghapus cooldown.
        pinAttempts: state.pinAttempts,
        lockUntil: state.lockUntil,
      }),
      onRehydrateStorage: () => () => {
        useSecurityStore.getState().setHydrated(true);
      },
    }
  )
);

// Inisialisasi: ambil PIN hash/salt dari SecureStore saat pertama kali load.
// Catatan: jangan tulis balik ke SecureStore di sini (cukup hydrate state).
export const initializeSecurity = async () => {
  try {
    const [hash, salt] = await Promise.all([
      SecureStore.getItemAsync(SECURE_PIN_HASH),
      SecureStore.getItemAsync(SECURE_PIN_SALT),
    ]);
    if (hash && salt) {
      useSecurityStore.setState({ pinHash: hash, pinSalt: salt });
    }
  } finally {
    useSecurityStore.getState().setSecureLoaded(true);
  }
};
