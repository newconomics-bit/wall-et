/**
 * Home Screen — wall-et
 * PRD §5.6: Header branding + ikon mata (isBalanceHidden) + ikon Settings.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      <View style={[styles.header, { borderBottomColor: tokens.border }]}>
        <Text style={[styles.brand, { color: tokens.text }]}>wall-et</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleBalanceHidden}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isBalanceHidden ? 'eye-off' : 'eye'}
              size={22}
              color={tokens.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
            <MaterialCommunityIcons name="cog" size={22} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>Home</Text>
        <Text style={[styles.sub, { color: tokens.textMuted }]}>Selamat datang di wall-et</Text>
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
    borderBottomWidth: 1,
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 6,
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
