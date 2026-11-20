/**
 * App Navigator — wall-et
 * Bottom Tab 4 (Home, Transaksi, Budget, Analitik) + FAB bulat tengah (Add Transaction).
 * Dilarang expo-router (.kilocoderules #5-6).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeScreen } from '@/screens/HomeScreen';
import { TransaksiScreen } from '@/screens/TransaksiScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { AnalitikScreen } from '@/screens/AnalitikScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { getTokens, type ThemeName } from '@/theme/tokens';
import { useSecurityStore } from '@/store/useSecurityStore';

const Tab = createBottomTabNavigator();

type AppNavigatorProps = {
  theme: ThemeName;
  toggleTheme: () => void;
  toggleBalanceHidden: () => void;
  isBalanceHidden: boolean;
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  theme,
  toggleTheme,
  toggleBalanceHidden,
  isBalanceHidden,
}) => {
  const tokens = getTokens(theme);

  const HomeTab = () => (
    <HomeScreen
      theme={theme}
      toggleBalanceHidden={toggleBalanceHidden}
      isBalanceHidden={isBalanceHidden}
      onSettingsPress={() => {}}
    />
  );
  const TransaksiTab = () => <TransaksiScreen theme={theme} />;
  const BudgetTab = () => <BudgetScreen theme={theme} />;
  const AnalitikTab = () => <AnalitikScreen theme={theme} />;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarShowLabel: true,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tokens.card,
            borderTopWidth: 1,
            borderTopColor: tokens.border,
            height: 74,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeTab}
          initial
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialCommunityIcons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Transaksi"
          component={TransaksiTab}
          options={{
            tabBarLabel: 'Transaksi',
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialCommunityIcons name="swap-horizontal" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Budget"
          component={BudgetTab}
          options={{
            tabBarLabel: 'Budget',
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialCommunityIcons name="chart-line-variant" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Analitik"
          component={AnalitikTab}
          options={{
            tabBarLabel: 'Analitik',
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialCommunityIcons name="chart-line" size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* FAB bulat menonjol di tengah bawah */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tokens.accent }]}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Tombol Settings di kanan atas (dipanggil lewat HomeScreen header) —
          SettingsScreen tersedia sebagai navigasi mandiri dari Home header. */}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
});
