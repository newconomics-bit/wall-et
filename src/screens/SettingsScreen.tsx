/**
 * Settings Screen — wall-et
 * Toggle: Tema, Sembunyikan Saldo, Biometrik, Kunci thumbnail recent apps (FLAG_SECURE).
 * Gaya: neumorphism (soft UI).
 */

import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { NeuButton, NeuSurface } from '@/components/ui/Neumorphic';
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
      <View style={styles.header}>
        <NeuButton
          theme={theme}
          radius={20}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Kembali"
          contentStyle={styles.backButtonContent}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={tokens.accent} />
        </NeuButton>
        <Text style={[styles.headerTitle, { color: tokens.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>TAMPILAN</Text>

        <NeuSurface theme={theme} contentStyle={styles.group}>
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
              trackColor={{ false: tokens.neuInset, true: tokens.accent }}
              thumbColor={theme === 'dark' ? tokens.textMuted : '#FFFFFF'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: tokens.neuInset }]} />

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
              trackColor={{ false: tokens.neuInset, true: tokens.accent }}
              thumbColor={isBalanceHidden ? '#FFFFFF' : tokens.textMuted}
            />
          </View>
        </NeuSurface>

        <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>KEAMANAN</Text>

        <NeuSurface theme={theme} contentStyle={styles.group}>
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
              trackColor={{ false: tokens.neuInset, true: tokens.accent }}
              thumbColor={biometricEnabled ? '#FFFFFF' : tokens.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: tokens.neuInset }]} />

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
              trackColor={{ false: tokens.neuInset, true: tokens.accent }}
              thumbColor={secureCapture ? '#FFFFFF' : tokens.textMuted}
            />
          </View>
        </NeuSurface>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButtonContent: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
    marginLeft: 4,
  },
  group: {
    paddingHorizontal: 18,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
});
