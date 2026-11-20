/**
 * Settings Screen — wall-et
 * Toggle: Tema, Sembunyikan Saldo, Kunci thumbnail recent apps (FLAG_SECURE).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView, Switch } from 'react-native';

import { getTokens, type ThemeName } from '@/theme/tokens';
import { useSecurityStore } from '@/store/useSecurityStore';

type SettingsScreenProps = {
  theme: ThemeName;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ theme }) => {
  const tokens = getTokens(theme);
  const {
    isBalanceHidden,
    toggleBalanceHidden,
    secureCapture,
    setSecureCapture,
  } = useSecurityStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
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
            onValueChange={() => {}}
            disabled
            trackColor={{ false: tokens.border, true: tokens.accent }}
            thumbColor={theme === 'dark' ? tokens.textMuted : tokens.accent}
          />
        </View>

        <View style={styles.divider} />

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

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>KEAMANAN</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: tokens.text }]}>Kunci thumbnail recent apps</Text>
            <Text style={[styles.settingSub, { color: tokens.textMuted }]}>
              {secureCapture
                ? 'Thumbnail recent apps dikosongkan (FLAG_SECURE aktif). Screenshot direkam normal.'
                : 'Thumbnail recent apps menampilkan konten. Screenshot berfungsi normal.'}
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
    backgroundColor: '#232E3F',
    marginHorizontal: -20,
  },
});