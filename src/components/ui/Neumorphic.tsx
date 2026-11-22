/**
 * Neumorphic primitives — wall-et
 *
 * React Native hanya mendukung satu shadow per View, jadi kedalaman
 * neumorphism dibuat dengan dua lapis: lapisan luar membawa bayangan gelap
 * (kanan-bawah) dan lapisan dalam membawa highlight (kiri-atas).
 * Varian `inset` meniru elemen yang ditekan/tenggelam dengan border bevel.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getTokens, type ThemeName } from '@/theme/tokens';

type BaseProps = {
  theme: ThemeName;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
};

type NeuSurfaceProps = BaseProps & {
  inset?: boolean;
};

const raisedShadow = (
  shadowColor: string,
  opacity: number,
  elevation = 0
): ViewStyle => ({
  shadowColor,
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: opacity,
  shadowRadius: 14,
  elevation,
});

export const NeuSurface: React.FC<NeuSurfaceProps> = ({
  theme,
  children,
  style,
  contentStyle,
  radius,
  inset = false,
}) => {
  const tokens = getTokens(theme);
  const r = { borderRadius: radius ?? tokens.neu.radius };

  if (inset) {
    return (
      <View style={[styles.insetOuter, r, { backgroundColor: tokens.neuInset }, style]}>
        <View
          pointerEvents="none"
          style={[styles.insetEdgeTL, r, { borderColor: tokens.neuShadow }]}
        />
        <View
          pointerEvents="none"
          style={[styles.insetEdgeBR, r, { borderColor: tokens.neuHighlight }]}
        />
        <View style={[styles.insetContent, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.raisedOuter,
        r,
        raisedShadow(tokens.neuShadow, tokens.neu.shadowOpacity, tokens.neu.elevation),
        { backgroundColor: tokens.neuSurface },
        style,
      ]}
    >
      <View
        style={[
          styles.raisedInner,
          r,
          raisedShadow(tokens.neuHighlight, tokens.neu.highlightOpacity),
          { backgroundColor: tokens.neuSurface },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

type NeuButtonProps = BaseProps & {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
};

export const NeuButton: React.FC<NeuButtonProps> = ({
  theme,
  children,
  style,
  contentStyle,
  radius,
  onPress,
  disabled,
  accessibilityLabel,
  hitSlop,
}) => {
  const tokens = getTokens(theme);
  const r = { borderRadius: radius ?? tokens.neu.radius };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.raisedOuter,
        r,
        pressed
          ? [styles.pressedOuter, { backgroundColor: tokens.neuInset }]
          : [
              raisedShadow(tokens.neuShadow, tokens.neu.shadowOpacity, tokens.neu.elevation),
              { backgroundColor: tokens.neuSurface },
            ],
        disabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.raisedInner,
            r,
            pressed
              ? { backgroundColor: tokens.neuInset }
              : [
                  raisedShadow(tokens.neuHighlight, tokens.neu.highlightOpacity),
                  { backgroundColor: tokens.neuSurface },
                ],
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  raisedOuter: {},
  raisedInner: {
    overflow: 'hidden',
  },
  pressedOuter: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  insetOuter: {
    overflow: 'hidden',
  },
  insetEdgeTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    opacity: 0.7,
  },
  insetEdgeBR: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    opacity: 0.8,
  },
  insetContent: {
    flexGrow: 1,
  },
});
