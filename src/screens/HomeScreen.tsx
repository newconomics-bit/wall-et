/**
 * Home Screen — wall-et
 * PRD §5.6: Header branding + ikon mata (isBalanceHidden) + ikon Settings.
 * Gaya: neumorphism (soft UI).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { NeuButton, NeuSurface } from '@/components/ui/Neumorphic';
import { getTokens, type ThemeName } from '@/theme/tokens';

type HomeScreenProps = {
  theme: ThemeName;
  toggleBalanceHidden: () => void;
  isBalanceHidden: boolean;
  onSettingsPress: () => void;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  theme,
  toggleBalanceHidden,
  isBalanceHidden,
  onSettingsPress,
}) => {
  const tokens = getTokens(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <NeuSurface
            theme={theme}
            radius={14}
            contentStyle={styles.brandBadge}
          >
            <MaterialCommunityIcons name="wallet" size={20} color={tokens.accent} />
          </NeuSurface>
          <Text style={[styles.brand, { color: tokens.text }]}>wall-et</Text>
        </View>

        <View style={styles.headerActions}>
          <NeuButton
            theme={theme}
            radius={20}
            onPress={toggleBalanceHidden}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            contentStyle={styles.iconButtonContent}
          >
            <MaterialCommunityIcons
              name={isBalanceHidden ? 'eye-off' : 'eye'}
              size={20}
              color={tokens.textMuted}
            />
          </NeuButton>
          <NeuButton
            theme={theme}
            radius={20}
            onPress={onSettingsPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Buka Settings"
            contentStyle={styles.iconButtonContent}
          >
            <MaterialCommunityIcons name="cog" size={20} color={tokens.textMuted} />
          </NeuButton>
        </View>
      </View>

      <View style={styles.content}>
        <NeuSurface theme={theme} contentStyle={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: tokens.neuInset },
            ]}
          >
            <MaterialCommunityIcons name="home" size={26} color={tokens.accent} />
          </View>
          <Text style={[styles.title, { color: tokens.text }]}>Home</Text>
          <Text style={[styles.sub, { color: tokens.textMuted }]}>
            Selamat datang di wall-et
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 14,
  },
  iconButtonContent: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIcon: {
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
