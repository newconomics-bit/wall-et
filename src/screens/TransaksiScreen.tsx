/**
 * Transaksi Screen — wall-et
 * Skeleton rapi untuk Wave 1.
 */

import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

import { getTokens, type ThemeName } from '@/theme/tokens';

type TransaksiScreenProps = {
  theme: ThemeName;
};

export const TransaksiScreen: React.FC<TransaksiScreenProps> = ({ theme }) => {
  const tokens = getTokens(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>Transaksi</Text>
        <Text style={[styles.sub, { color: tokens.textMuted }]}>Riwayat transaksi akan ditampilkan di sini.</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  sub: {
    fontSize: 14,
    marginTop: 6,
  },
});
