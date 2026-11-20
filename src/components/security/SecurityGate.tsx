/**
 * Security Gate — wall-et
 * PRD §6: App Lock (biometrik + fallback PIN), auto-lock 15s background,
 * privacy overlay (expo-blur + logo wall-et), lupa PIN (biometrik atau reset
 * total ketik "HAPUS").
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSecurityStore } from '@/store/useSecurityStore';
import { getTokens, type ThemeName } from '@/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIN_LENGTH = 6;
const AUTO_LOCK_MS = 15 * 1000; // 15 detik

type SecurityGateProps = {
  children: React.ReactNode;
  theme: ThemeName;
};

export const SecurityGate: React.FC<SecurityGateProps> = ({ children, theme }) => {
  const {
    pinHash,
    pinSalt,
    pinAttempts,
    lockUntil,
    biometricEnabled,
    biometricAvailable,
    isLocked,
    isOnboardingComplete,
    setPin,
    resetAttempts,
    setLock,
    setBiometric,
    setBiometricAvailable,
    setOnboardingComplete,
    toggleBalanceHidden,
    isBalanceHidden,
    clearAll,
  } = useSecurityStore();

  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [onboardingStep, setOnboardingStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState<'none' | 'biometric' | 'reset'>('none');
  const [resetInput, setResetInput] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  const tokens = getTokens(theme);

  // Cek status onboarding & unlock saat mount
  useEffect(() => {
    if (!isOnboardingComplete) {
      setShowOnboarding(true);
      return;
    }
    if (isLocked) {
      setShowUnlock(true);
    }
  }, [isOnboardingComplete, isLocked]);

  // AppState listener: auto-lock & privacy overlay
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      const isBackground = nextState === 'background' || nextState === 'inactive';

      if (isBackground) {
        setBackgroundTime(Date.now());
        // Privacy overlay segera muncul saat background/inactive
        setShowOverlay(true);
        // Auto-lock setelah 15 detik
        setTimeout(() => {
          if (AppState.currentState === 'background' || AppState.currentState === 'inactive') {
            setLock(true);
            setShowUnlock(true);
          }
        }, AUTO_LOCK_MS);
      } else {
        setBackgroundTime(null);
        setShowOverlay(false);
        setShowUnlock(false);
      }
    });
    return () => subscription.remove();
  }, [setLock]);

  // Jika ada cooldown aktif, biarkan unlock tampil dengan hitungan mundur
  const isCooldownActive = lockUntil ? Date.now() < lockUntil : false;
  const cooldownRemaining = isCooldownActive ? Math.ceil((lockUntil! - Date.now()) / 1000) : 0;

  const handlePinInput = (value: string) => {
    setError(null);
    setPinInput(value);
  };

  const handleUnlock = async () => {
    if (isCooldownActive) {
      setError(`Tunggu ${cooldownRemaining} detik sebelum mencoba lagi`);
      return;
    }

    // Coba biometrik dulu jika aktif & tersedia
    if (biometricEnabled && biometricAvailable) {
      const ok = await authenticateBiometric();
      if (ok) {
        setLock(false);
        setShowUnlock(false);
        resetAttempts();
        return;
      }
      // Biometrik gagal → fallback PIN
    }

    if (!pinHash || !pinSalt) {
      setError('PIN belum diatur');
      return;
    }

    const store = useSecurityStore.getState();
    const ok = await store.verifyPin(pinInput);
    if (ok) {
      setLock(false);
      setShowUnlock(false);
      resetAttempts();
      setPinInput('');
    } else {
      store.incrementAttempts();
      setPinInput('');
      setError('PIN salah');
    }
  };

  const authenticateBiometric = async (): Promise<boolean> => {
    setBiometricLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifikasi biometrik untuk membuka wall-et',
        cancelLabel: 'Batal',
        fallbackLabel: 'Gunakan PIN',
        disableDeviceFallback: true,
      });
      return result.success;
    } catch {
      return false;
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (pinInput.length !== PIN_LENGTH) {
      setError('PIN harus 6 digit');
      return;
    }
    if (onboardingStep === 'create') {
      setConfirmPin(pinInput);
      setPinInput('');
      setOnboardingStep('confirm');
      setError(null);
      return;
    }
    // Konfirmasi
    if (pinInput !== confirmPin) {
      setError('PIN tidak cocok');
      setPinInput('');
      return;
    }
    const salt = await useSecurityStore.getState().generateSalt();
    const hash = await useSecurityStore.getState().hashPin(pinInput, salt);
    setPin(hash, salt);
    setOnboardingComplete(true);
    setShowOnboarding(false);
    setPinInput('');
    setConfirmPin('');
    setOnboardingStep('create');
    setError(null);
  };

  const handleForgotPin = async () => {
    if (biometricEnabled && biometricAvailable) {
      setForgotMode('biometric');
      const ok = await authenticateBiometric();
      if (ok) {
        setForgotMode('none');
        // Biometrik berhasil → buat PIN baru
        setShowOnboarding(true);
        setOnboardingStep('create');
        setLock(false);
        setShowUnlock(false);
      } else {
        setError('Biometrik gagal');
        setForgotMode('none');
      }
    } else {
      setForgotMode('reset');
    }
  };

  const handleResetConfirm = () => {
    if (resetInput !== 'HAPUS') {
      setError('Ketik "HAPUS" untuk mengonfirmasi reset total');
      return;
    }
    // Reset total: hapus PIN & data, kembali ke onboarding
    useSecurityStore.getState().clearAll();
    setForgotMode('none');
    setResetInput('');
    setOnboardingComplete(false);
    setShowOnboarding(true);
    setOnboardingStep('create');
    setLock(false);
    setShowUnlock(false);
    setError(null);
  };

  // Render PIN input (6 kotak)
  const renderPinInput = (value: string, onChange: (v: string) => void) => {
    const chars = value.padEnd(PIN_LENGTH, '').split('').slice(0, PIN_LENGTH);
    return (
      <View style={styles.pinRow}>
        {chars.map((ch, i) => (
          <View
            key={i}
            style={[
              styles.pinBox,
              i < value.length ? styles.pinBoxFilled : styles.pinBoxEmpty,
            ]}
          >
            {i < value.length ? '•' : null}
          </View>
        ))}
      </View>
    );
  };

  // Overlay privasi (blur + logo)
  const renderOverlay = () => {
    if (!showOverlay) return null;
    return (
      <BlurView style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]} blurType="light" intensity={100}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="wallet" size={80} color="rgba(255,255,255,0.4)" />
          <Text style={styles.overlayText}>wall-et</Text>
        </View>
      </BlurView>
    );
  };

  const renderGate = () => {
    if (showOnboarding) {
      return (
        <View style={styles.gateContainer}>
          <Text style={styles.gateTitle}>
            {onboardingStep === 'create' ? 'Buat PIN wall-et' : 'Konfirmasi PIN'}
          </Text>
          <Text style={styles.gateSub}>
            {onboardingStep === 'create'
              ? 'Buat PIN 6 digit untuk mengamankan aplikasi'
              : 'Masukkan ulang PIN untuk konfirmasi'}
          </Text>
          {renderPinInput(onboardingStep === 'create' ? pinInput : confirmPin, (v) => setPinInput(v))}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity style={styles.gateButton} onPress={handleCreatePin}>
            <Text style={styles.gateButtonText}>
              {onboardingStep === 'create' ? 'Buat PIN' : 'Konfirmasi'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showUnlock) {
      return (
        <View style={styles.gateContainer}>
          <Text style={styles.gateTitle}>Masuk ke wall-et</Text>
          <Text style={styles.gateSub}>Verifikasi identitas Anda</Text>
          {biometricEnabled && biometricAvailable && !isCooldownActive && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleUnlock}
              disabled={biometricLoading}
            >
              <MaterialCommunityIcons
                name={biometricLoading ? 'circle-outline' : 'fingerprint'}
                size={24}
                color={tokens.text}
              />
              <Text style={styles.biometricText}>
                {biometricLoading ? 'Memverifikasi...' : 'Gunakan Biometrik'}
              </Text>
            </TouchableOpacity>
          )}
          {renderPinInput(pinInput, (v) => setPinInput(v))}
          {isCooldownActive && (
            <Text style={styles.cooldownText}>
              Terlalu banyak percobaan gagal. Coba lagi dalam {cooldownRemaining} detik.
            </Text>
          )}
          {!isCooldownActive && error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPin}>
            <Text style={styles.forgotText}>Lupa PIN?</Text>
          </TouchableOpacity>
          {!isCooldownActive && (
            <TouchableOpacity style={styles.gateButton} onPress={handleUnlock}>
              <Text style={styles.gateButtonText}>Masuk dengan PIN</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  // Render children (navigator) jika tidak terkunci dan tidak onboarding
  const content = (
    <View style={styles.container}>

      {showOverlay && renderOverlay()}

      {(!isOnboardingComplete || isLocked) ? (
        renderGate()
      ) : (
        <View style={styles.contentWrapper}>{children}</View>
      )}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  contentWrapper: {
    flex: 1,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  gateSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  pinBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFilled: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  pinBoxEmpty: {
    borderColor: '#334155',
    backgroundColor: '#131A2A',
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  cooldownText: {
    color: '#F59E0B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  gateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  gateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131A2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  biometricText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
});
