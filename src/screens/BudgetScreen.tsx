/**
 * Budget Screen — wall-et
 * Skeleton rapi untuk Wave 1. Gaya neumorphism.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { NeuSurface } from '@/components/ui/Neumorphic';
import { getTokens, type ThemeName } from '@/theme/tokens';

type BudgetScreenProps = {
  theme: ThemeName;
};

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ theme }) => {
  const tokens = getTokens(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.content}>
        <NeuSurface theme={theme} contentStyle={styles.card}>
          <View style={[styles.icon, { backgroundColor: tokens.neuInset }]}>
            <MaterialCommunityIcons
              name="chart-line-variant"
              size={26}
              color={tokens.accent}
            />
          </View>
          <Text style={[styles.title, { color: tokens.text }]}>Budget</Text>
          <Text style={[styles.sub, { color: tokens.textMuted }]}>
            Pengaturan budget siklus gajian akan ditampilkan di sini.
          </Text>
        </NeuSurface>
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
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  sub: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
