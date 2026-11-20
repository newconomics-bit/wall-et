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

export type SecurityState = {
  // PIN (terpisah dari state biasa, di SecureStore)
  pinHash: string | null;
  pinSalt: string | null;

  // Attempts & cooldown
  pinAttempts: integer;
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

  // Actions
  setPin: (hash: string, salt: string) => void;
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
  clearAll: () => Promise<void>;
};

// Type alias karena TS tidak kenal `integer` bawaan
type integer = number;

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

      setPin: (hash, salt) => {
        set({ pinHash: hash, pinSalt: salt });
        SecureStore.setItemAsync(SECURE_PIN_HASH, hash);
        SecureStore.setItemAsync(SECURE_PIN_SALT, salt);
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
        const { pinAttempts } = get();
        const next = pinAttempts + 1;
        if (next >= 5) {
          const lockUntil = Date.now() + 60 * 1000; // 60 detik cooldown
          set({ pinAttempts: next, lockUntil });
        } else {
          set({ pinAttempts: next });
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

      clearAll: async () => {
        await SecureStore.deleteItemAsync(SECURE_PIN_HASH);
        await SecureStore.deleteItemAsync(SECURE_PIN_SALT);
        set({
          pinHash: null,
          pinSalt: null,
          pinAttempts: 0,
          lockUntil: null,
          biometricEnabled: false,
          biometricAvailable: false,
          isBalanceHidden: false,
          isLocked: false,
          isOnboardingComplete: false,
        });
      },
    }),
    {
      name: 'wall-et-security',
      storage: createJSONStorage(() => AsyncStorage),
      // PIN hash/salt di SecureStore (terpisah), jangan di zustand persist
      partialize: (state) => ({
        biometricEnabled: state.biometricEnabled,
        biometricAvailable: state.biometricAvailable,
        isBalanceHidden: state.isBalanceHidden,
        secureCapture: state.secureCapture,
        isLocked: state.isLocked,
        isOnboardingComplete: state.isOnboardingComplete,
      }),
    }
  )
);

// Inisialisasi: ambil PIN hash/salt dari SecureStore saat pertama kali load
export const initializeSecurity = async () => {
  const store = useSecurityStore.getState();
  const [hash, salt] = await Promise.all([
    SecureStore.getItemAsync(SECURE_PIN_HASH),
    SecureStore.getItemAsync(SECURE_PIN_SALT),
  ]);
  if (hash && salt) {
    store.setPin(hash, salt);
  }
};
