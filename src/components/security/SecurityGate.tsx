/**
 * Security Gate — wall-et
 * PRD §6: App Lock (biometrik + fallback PIN), auto-lock 15s background,
 * privacy overlay (expo-blur + logo wall-et), lupa PIN (biometrik atau reset
 * total ketik "HAPUS").
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSecurityStore, MAX_PIN_ATTEMPTS } from '@/store/useSecurityStore';
import { NeuButton } from '@/components/ui/Neumorphic';
import { getTokens, type ThemeName, type ThemeTokens } from '@/theme/tokens';

const PIN_LENGTH = 6;
const AUTO_LOCK_MS = 15 * 1000; // 15 detik
const KEYPAD_SIZE = 48; // minimum 48dp untuk thumb-friendly

type SecurityGateProps = {
  children: React.ReactNode;
  theme: ThemeName;
};

// Komponen Overlay Privasi terpisah - di-render di level root (App.tsx)
// agar berada di atas SEMUA layar termasuk modal
type PrivacyOverlayProps = {
  visible: boolean;
  theme: ThemeName;
};

const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({ visible, theme }) => {
  if (!visible) return null;

  return (
    <BlurView
      style={[
        styles.overlay,
        { backgroundColor: 'rgba(0,0,0,0.35)' },
        Platform.select({
          ios: { zIndex: 9999 },
          android: { zIndex: 9999 },
        }),
      ]}
      intensity={100}
    >
      <View style={styles.overlayContent}>
        <MaterialCommunityIcons name="wallet" size={80} color="rgba(255,255,255,0.4)" />
        <Text style={styles.overlayText}>wall-et</Text>
      </View>
    </BlurView>
  );
};

// Keypad Numerik 3x4 (1-9, 0, backspace)
const NumericKeypad: React.FC<{
  onPressKey: (key: string) => void;
  disabled?: boolean;
  tokens: ThemeTokens;
  theme: ThemeName;
}> = ({ onPressKey, disabled, tokens, theme }) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  return (
    <View style={styles.keypadContainer}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key, keyIndex) => {
            if (key === '') {
              return <View key={keyIndex} style={styles.keypadKey} />;
            }
            const isBackspace = key === 'backspace';
            return (
              <NeuButton
                key={keyIndex}
                theme={theme}
                radius={KEYPAD_SIZE / 2}
                style={styles.keypadKey}
                contentStyle={styles.keypadKeyContent}
                onPress={() => !disabled && onPressKey(key)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={isBackspace ? 'Hapus digit' : `Angka ${key}`}
              >
                {isBackspace ? (
                  <MaterialCommunityIcons name="backspace" size={24} color={tokens.text} />
                ) : (
                  <Text style={[styles.keypadKeyText, { color: tokens.text }]}>{key}</Text>
                )}
              </NeuButton>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export const SecurityGate: React.FC<SecurityGateProps> = ({ children, theme }) => {
  const {
    pinHash,
    pinSalt,
    lockUntil,
    biometricEnabled,
    biometricAvailable,
    isLocked,
    isOnboardingComplete,
    isHydrated,
    isSecureLoaded,
    setPin,
    resetAttempts,
    setLock,
    setBiometric,
    setBiometricAvailable,
    setOnboardingComplete,
    clearAll,
  } = useSecurityStore();

  const tokens = getTokens(theme);

  const [pinSetup, setPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [onboardingStep, setOnboardingStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState<'none' | 'reset'>('none');
  const [resetInput, setResetInput] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const coldStartHandled = useRef(false);
  const backgroundAt = useRef<number | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isReady = isHydrated && isSecureLoaded;

  // Status onboarding menentukan apakah layar buat PIN harus tampil.
  useEffect(() => {
    setPinSetup(!isOnboardingComplete);
  }, [isOnboardingComplete]);

  // Cold start: app yang sudah punya PIN harus terbuka dalam keadaan terkunci.
  // Dijalankan sekali setelah state persisten + SecureStore siap.
  useEffect(() => {
    if (!isReady || coldStartHandled.current) return;
    coldStartHandled.current = true;
    if (isOnboardingComplete && pinHash && pinSalt) {
      setLock(true);
    }
  }, [isReady, isOnboardingComplete, pinHash, pinSalt, setLock]);

  // Deteksi ketersediaan biometrik (hardware + sudah terdaftar di perangkat).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hasHardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (!cancelled) setBiometricAvailable(hasHardware && enrolled);
      } catch {
        if (!cancelled) setBiometricAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setBiometricAvailable]);

  // AppState listener: auto-lock HANYA jika background/inactive > 15 detik.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isAway = nextState === 'background' || nextState === 'inactive';

      if (isAway) {
        if (backgroundAt.current === null) backgroundAt.current = Date.now();
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => {
          lockTimer.current = null;
          const store = useSecurityStore.getState();
          if (store.isOnboardingComplete) store.setLock(true);
        }, AUTO_LOCK_MS);
        return;
      }

      if (nextState === 'active') {
        const since = backgroundAt.current;
        backgroundAt.current = null;
        if (lockTimer.current) {
          clearTimeout(lockTimer.current);
          lockTimer.current = null;
        }
        // Timer JS bisa tertunda saat app di background: cek durasi sebenarnya.
        if (since !== null && Date.now() - since >= AUTO_LOCK_MS) {
          const store = useSecurityStore.getState();
          if (store.isOnboardingComplete) store.setLock(true);
        }
      }
    });

    return () => {
      subscription.remove();
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
    };
  }, []);

  const isCooldownActive = lockUntil !== null && now < lockUntil;
  const cooldownRemaining = isCooldownActive
    ? Math.ceil((lockUntil! - now) / 1000)
    : 0;

  // Tick hitungan mundur cooldown, lalu bersihkan attempt setelah cooldown habis.
  useEffect(() => {
    if (lockUntil === null || Date.now() >= lockUntil) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockUntil, now]);

  useEffect(() => {
    if (lockUntil !== null && now >= lockUntil) {
      resetAttempts();
      setError(null);
    }
  }, [lockUntil, now, resetAttempts]);

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

  const handleBiometricUnlock = async () => {
    const ok = await authenticateBiometric();
    if (ok) {
      setLock(false);
      resetAttempts();
      setPinInput('');
      setError(null);
    } else {
      setError('Biometrik gagal. Gunakan PIN.');
    }
  };

  const handleUnlock = async () => {
    const coolingDown = lockUntil !== null && Date.now() < lockUntil;
    if (coolingDown) {
      const remaining = Math.ceil((lockUntil! - Date.now()) / 1000);
      setError(`Tunggu ${remaining} detik sebelum mencoba lagi`);
      return;
    }
    if (pinInput.length !== PIN_LENGTH) {
      setError('PIN harus 6 digit');
      return;
    }
    if (!pinHash || !pinSalt) {
      setError('PIN belum diatur');
      return;
    }
    const store = useSecurityStore.getState();
    const ok = await store.verifyPin(pinInput);
    if (ok) {
      setLock(false);
      resetAttempts();
      setPinInput('');
      setError(null);
    } else {
      store.incrementAttempts();
      setPinInput('');
      setError('PIN salah');
    }
  };

  const resetPinSetup = () => {
    setPinInput('');
    setFirstPin('');
    setConfirmPin('');
    setOnboardingStep('create');
  };

  const handleCreatePin = async () => {
    if (onboardingStep === 'create') {
      if (pinInput.length !== PIN_LENGTH) {
        setError('PIN harus 6 digit');
        return;
      }
      setFirstPin(pinInput);
      setPinInput('');
      setOnboardingStep('confirm');
      setError(null);
      return;
    }

    // Konfirmasi: bandingkan dengan PIN pertama, bukan dengan dirinya sendiri.
    if (confirmPin.length !== PIN_LENGTH) {
      setError('PIN harus 6 digit');
      return;
    }
    if (confirmPin !== firstPin) {
      resetPinSetup();
      setError('PIN tidak cocok. Ulangi dari awal.');
      return;
    }

    try {
      const salt = await useSecurityStore.getState().generateSalt();
      const hash = await useSecurityStore.getState().hashPin(confirmPin, salt);
      await setPin(hash, salt);
      setOnboardingComplete(true);
      setPinSetup(false);
      setLock(false);
      resetPinSetup();
      setError(null);
    } catch {
      setError('Gagal menyimpan PIN. Coba lagi.');
    }
  };

  const handleForgotPin = async () => {
    if (biometricAvailable) {
      const ok = await authenticateBiometric();
      if (ok) {
        // Biometrik berhasil → buat PIN baru.
        resetPinSetup();
        setPinSetup(true);
        setLock(false);
        setError(null);
        return;
      }
      setError('Biometrik gagal. Reset total diperlukan.');
    }
    setResetInput('');
    setForgotMode('reset');
  };

  const handleResetConfirm = async () => {
    if (resetInput.trim().toUpperCase() !== 'HAPUS') {
      setError('Ketik "HAPUS" untuk mengonfirmasi reset total');
      return;
    }
    await clearAll();
    setForgotMode('none');
    setResetInput('');
    resetPinSetup();
    setPinSetup(true);
    setLock(false);
    setError(null);
  };

  const renderPinIndicator = (value: string) => (
    <View style={styles.pinRow}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const filled = i < value.length;
        return (
          <View
            key={i}
            style={[
              styles.pinBox,
              filled
                ? {
                    borderColor: tokens.accent,
                    backgroundColor: tokens.accent,
                    shadowColor: tokens.accent,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    elevation: 4,
                  }
                : {
                    borderColor: tokens.neuShadow,
                    backgroundColor: tokens.neuInset,
                  },
            ]}
          >
            {filled ? <Text style={styles.pinDot}>•</Text> : null}
          </View>
        );
      })}
    </View>
  );

  const renderKeypad = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    disabled = false
  ) => {
    const handleKeyPress = (key: string) => {
      setError(null);
      if (key === 'backspace') {
        setValue((prev) => prev.slice(0, -1));
      } else if (value.length < PIN_LENGTH) {
        setValue((prev) => prev + key);
      }
    };
    return (
      <NumericKeypad
        onPressKey={handleKeyPress}
        disabled={disabled}
        tokens={tokens}
        theme={theme}
      />
    );
  };

  const renderGate = () => {
    if (pinSetup) {
      const currentValue = onboardingStep === 'create' ? pinInput : confirmPin;
      const setCurrentValue = onboardingStep === 'create' ? setPinInput : setConfirmPin;

      return (
        <View style={styles.gateContainer}>
          <Text style={[styles.gateTitle, { color: tokens.text }]}>
            {onboardingStep === 'create' ? 'Buat PIN wall-et' : 'Konfirmasi PIN'}
          </Text>
          <Text style={[styles.gateSub, { color: tokens.textMuted }]}>
            {onboardingStep === 'create'
              ? 'Buat PIN 6 digit untuk mengamankan aplikasi'
              : 'Masukkan ulang PIN untuk konfirmasi'}
          </Text>
          {renderPinIndicator(currentValue)}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {renderKeypad(currentValue, setCurrentValue)}
          <NeuButton
            theme={theme}
            radius={16}
            style={styles.gateButton}
            contentStyle={[styles.gateButtonContent, { backgroundColor: tokens.accent }]}
            onPress={handleCreatePin}
            accessibilityLabel={onboardingStep === 'create' ? 'Buat PIN' : 'Konfirmasi PIN'}
          >
            <Text style={styles.gateButtonText}>
              {onboardingStep === 'create' ? 'Buat PIN' : 'Konfirmasi'}
            </Text>
          </NeuButton>

          {biometricAvailable && (
            <View style={styles.biometricRow}>
              <MaterialCommunityIcons name="fingerprint" size={22} color={tokens.text} />
              <Text style={[styles.biometricRowText, { color: tokens.text }]}>
                Aktifkan biometrik
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometric}
                trackColor={{ false: tokens.border, true: tokens.accent }}
                thumbColor={biometricEnabled ? tokens.accent : tokens.textMuted}
              />
            </View>
          )}
        </View>
      );
    }

    if (forgotMode === 'reset') {
      return (
        <View style={styles.gateContainer}>
          <Text style={[styles.gateTitle, { color: tokens.text }]}>Reset total</Text>
          <Text style={[styles.gateSub, { color: tokens.textMuted }]}>
            Semua data dan PIN akan dihapus. Ketik HAPUS untuk melanjutkan.
          </Text>
          <TextInput
            style={[
              styles.resetInput,
              {
                color: tokens.text,
                borderColor: tokens.neuShadow,
                backgroundColor: tokens.neuInset,
              },
            ]}
            value={resetInput}
            onChangeText={(text) => {
              setResetInput(text);
              setError(null);
            }}
            placeholder="HAPUS"
            placeholderTextColor={tokens.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <NeuButton
            theme={theme}
            radius={16}
            style={styles.gateButton}
            contentStyle={[styles.gateButtonContent, { backgroundColor: tokens.error }]}
            onPress={handleResetConfirm}
            accessibilityLabel="Reset total"
          >
            <Text style={styles.gateButtonText}>Reset total</Text>
          </NeuButton>
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {
              setForgotMode('none');
              setResetInput('');
              setError(null);
            }}
          >
            <Text style={[styles.forgotText, { color: tokens.accent }]}>Batal</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLocked) {
      return (
        <View style={styles.gateContainer}>
          <Text style={[styles.gateTitle, { color: tokens.text }]}>Masuk ke wall-et</Text>
          <Text style={[styles.gateSub, { color: tokens.textMuted }]}>
            Verifikasi identitas Anda
          </Text>
          {biometricEnabled && biometricAvailable && !isCooldownActive && (
            <NeuButton
              theme={theme}
              radius={16}
              style={styles.biometricButton}
              contentStyle={styles.biometricButtonContent}
              onPress={handleBiometricUnlock}
              disabled={biometricLoading}
              accessibilityLabel="Gunakan biometrik"
            >
              <MaterialCommunityIcons
                name={biometricLoading ? 'circle-outline' : 'fingerprint'}
                size={24}
                color={tokens.text}
              />
              <Text style={[styles.biometricText, { color: tokens.text }]}>
                {biometricLoading ? 'Memverifikasi...' : 'Gunakan Biometrik'}
              </Text>
            </NeuButton>
          )}
          {renderPinIndicator(pinInput)}
          {renderKeypad(pinInput, setPinInput, isCooldownActive)}
          {isCooldownActive ? (
            <Text style={styles.cooldownText}>
              Terlalu banyak percobaan gagal ({MAX_PIN_ATTEMPTS}x). Coba lagi dalam{' '}
              {cooldownRemaining} detik.
            </Text>
          ) : (
            error && <Text style={styles.errorText}>{error}</Text>
          )}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPin}
            disabled={biometricLoading}
          >
            <Text style={[styles.forgotText, { color: tokens.accent }]}>Lupa PIN?</Text>
          </TouchableOpacity>
          {!isCooldownActive && (
            <NeuButton
              theme={theme}
              radius={16}
              style={styles.gateButton}
              contentStyle={[styles.gateButtonContent, { backgroundColor: tokens.accent }]}
              onPress={handleUnlock}
              accessibilityLabel="Masuk dengan PIN"
            >
              <Text style={styles.gateButtonText}>Masuk dengan PIN</Text>
            </NeuButton>
          )}
        </View>
      );
    }

    return null;
  };

  // Render children (navigator) hanya jika sudah siap, tidak onboarding,
  // tidak membuat PIN baru, dan tidak terkunci.
  // coldStartLockPending mencegah satu frame konten bocor sebelum lock aktif.
  const coldStartLockPending =
    isReady &&
    !coldStartHandled.current &&
    isOnboardingComplete &&
    pinHash !== null &&
    pinSalt !== null;
  const showLoading = !isReady || coldStartLockPending;
  const showGate = showLoading || pinSetup || isLocked || !isOnboardingComplete;

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      {showLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.accent} />
          <Text style={[styles.loadingText, { color: tokens.textMuted }]}>Memuat wall-et...</Text>
        </View>
      ) : showGate ? (
        renderGate()
      ) : (
        <View style={styles.contentWrapper}>{children}</View>
      )}
    </View>
  );
};

// Overlay Privasi sebagai komponen terpisah untuk di-render di App.tsx (level root)
export { PrivacyOverlay };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  gateSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
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
  resetInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  gateButton: {
    marginTop: 16,
  },
  gateButtonContent: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  gateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  biometricButton: {
    marginBottom: 16,
  },
  biometricButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '500',
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  biometricRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
  keypadContainer: {
    marginTop: 16,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  keypadKey: {
    width: KEYPAD_SIZE,
    height: KEYPAD_SIZE,
    marginHorizontal: 8,
  },
  keypadKeyContent: {
    width: KEYPAD_SIZE,
    height: KEYPAD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 22,
    fontWeight: '600',
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
