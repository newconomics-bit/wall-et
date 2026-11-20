import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, AppState } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SecurityGate, PrivacyOverlay } from '@/components/security/SecurityGate';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useSecurityStore } from '@/store/useSecurityStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getTokens } from '@/theme/tokens';

import { initializeSecurity } from '@/store/useSecurityStore';

export default function App() {
  const { isBalanceHidden, toggleBalanceHidden, secureCapture } = useSecurityStore();
  const { theme, toggleTheme } = useSettingsStore();

  const [appState, setAppState] = useState(AppState.currentState);

  // Inisialisasi security (ambil PIN hash/salt dari SecureStore)
  useEffect(() => {
    initializeSecurity();
  }, []);

  // FLAG_SECURE: apply/release screen capture protection based on secureCapture setting
  useEffect(() => {
    if (secureCapture) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [secureCapture]);

  // AppState listener untuk privacy overlay - harus sinkron di root level
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, []);

  // Privacy overlay visible saat background atau inactive (untuk recent apps snapshot)
  const showPrivacyOverlay = appState === 'background' || appState === 'inactive';

  const tokens = getTokens(theme);

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: tokens.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

        {/* Privacy Overlay di level ROOT - di atas SEMUA konten termasuk modal */}
        <PrivacyOverlay visible={showPrivacyOverlay} theme={theme} />

        <SecurityGate theme={theme}>
          <AppNavigator
            theme={theme}
            toggleTheme={toggleTheme}
            toggleBalanceHidden={toggleBalanceHidden}
            isBalanceHidden={isBalanceHidden}
          />
        </SecurityGate>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
