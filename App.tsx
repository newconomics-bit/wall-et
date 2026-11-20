import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SecurityGate } from '@/components/security/SecurityGate';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useSecurityStore } from '@/store/useSecurityStore';
import { getTokens, type ThemeName } from '@/theme/tokens';

import { initializeSecurity } from '@/store/useSecurityStore';

export default function App() {
  const {
    isBalanceHidden,
    toggleBalanceHidden,
  } = useSecurityStore();

  const [theme, setTheme] = useState<ThemeName>('dark');
  const [showSettings, setShowSettings] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Inisialisasi security (ambil PIN hash/salt dari SecureStore)
  React.useEffect(() => {
    initializeSecurity();
  }, []);

  const tokens = getTokens(theme);

  return (
    <View style={[styles.root, { backgroundColor: tokens.background }]}>
      <StatusBar style="auto" />

      {showSettings ? (
        <View style={styles.content}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.backText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.settingsTitle}>Settings</Text>
          </View>
          <View style={styles.settingsBody}>
            <Text style={styles.settingsLabel}>Tema</Text>
            <TouchableOpacity style={styles.themeRow} onPress={toggleTheme}>
              <Text style={styles.themeText}>
                Berpindah ke {theme === 'dark' ? 'Light' : 'Dark'} mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.themeRow} onPress={toggleBalanceHidden}>
              <Text style={styles.themeText}>
                Saldo {isBalanceHidden ? 'Tampilkan' : 'Sembunyikan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <SecurityGate theme={theme}>
          <AppNavigator
            theme={theme}
            toggleTheme={toggleTheme}
            toggleBalanceHidden={toggleBalanceHidden}
            isBalanceHidden={isBalanceHidden}
          />
        </SecurityGate>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#232E3F',
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#10B981',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  settingsBody: {
    padding: 20,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#232E3F',
  },
  themeText: {
    fontSize: 15,
    color: '#F8FAFC',
  },
});
