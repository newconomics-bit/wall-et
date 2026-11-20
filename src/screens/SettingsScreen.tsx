/**
 * Settings Screen — wall-et
 * Toggle: Tema, Sembunyikan Saldo, Biometrik, Kunci thumbnail recent apps (FLAG_SECURE).
 */

import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getTokens, type ThemeName } from '@/theme/tokens';
import { useSecurityStore } from '@/store/useSecurityStore';

type SettingsScreenProps = {
  theme: ThemeName;
  toggleTheme: () => void;
  onBack: () => void;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ theme, toggleTheme, onBack }) => {
  const tokens = getTokens(theme);
  const {
    isBalanceHidden,
    toggleBalanceHidden,
    secureCapture,
    setSecureCapture,
    biometricEnabled,
    biometricAvailable,
    setBiometric,
  } = useSecurityStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={[styles.header, { borderBottomColor: tokens.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={tokens.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>TAMPILAN</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: tokens.text }]}>Tema</Text>
            <Text style={[styles.settingSub, { color: tokens.textMuted }]}>
              {theme === 'dark' ? 'Dark mode (default)' : 'Light mode'}
            </Text>
          </View>
          <Switch
            value={theme === 'light'}
            onValueChange={toggleTheme}
            trackColor={{ false: tokens.border, true: tokens.accent }}
            thumbColor={theme === 'dark' ? tokens.textMuted : tokens.accent}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: tokens.border }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: tokens.text }]}>Sembunyikan Saldo</Text>
            <Text style={[styles.settingSub, { color: tokens.textMuted }]}>
              {isBalanceHidden ? 'Nominal ditampilkan sebagai Rp ••••••' : 'Nominal ditampilkan penuh'}
            </Text>
          </View>
          <Switch
            value={isBalanceHidden}
            onValueChange={toggleBalanceHidden}
            trackColor={{ false: tokens.border, true: tokens.accent }}
            thumbColor={isBalanceHidden ? tokens.accent : tokens.textMuted}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: tokens.border }]} />

        <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>KEAMANAN</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: tokens.text }]}>Biometrik</Text>
            <Text style={[styles.settingSub, { color: tokens.textMuted }]}>
              {biometricAvailable
                ? biometricEnabled
                  ? 'Pembukaan dengan sidik jari/wajah aktif'
                  : 'Pembukaan dengan sidik jari/wajah nonaktif'
                : 'Perangkat tidak mendukung atau biometrik belum didaftarkan'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometric}
            disabled={!biometricAvailable}
            trackColor={{ false: tokens.border, true: tokens.accent }}
            thumbColor={biometricEnabled ? tokens.accent : tokens.textMuted}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: tokens.border }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: tokens.text }]}>
              Kunci thumbnail recent apps
            </Text>
            <Text style={[styles.settingSub, { color: tokens.textMuted }]}>
              {secureCapture
                ? 'Screenshot dan thumbnail recent apps diblokir (FLAG_SECURE aktif).'
                : 'Screenshot dan thumbnail recent apps dapat direkam.'}
            </Text>
          </View>
          <Switch
            value={secureCapture}
            onValueChange={setSecureCapture}
            trackColor={{ false: tokens.border, true: tokens.accent }}
            thumbColor={secureCapture ? tokens.accent : tokens.textMuted}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: -20,
  },
});
