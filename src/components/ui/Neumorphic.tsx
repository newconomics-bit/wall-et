/**
 * Neumorphic primitives — wall-et
 *
 * React Native hanya mendukung satu shadow per View, jadi kedalaman dibuat
 * dua lapis: lapisan luar membawa bayangan gelap ke kanan-bawah, lapisan
 * dalam membawa highlight ke kiri-atas. Saat ditekan, bayangan dilepas dan
 * diganti bevel gelap (kiri-atas) + terang (kanan-bawah) agar terbaca cekung.
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

type NeuShadowArgs = {
  shadowColor: string;
  opacity: number;
  offset: number;
  blur: number;
  elevation?: number;
};

const neuShadow = ({
  shadowColor,
  opacity,
  offset,
  blur,
  elevation = 0,
}: NeuShadowArgs): ViewStyle => ({
  shadowColor,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation,
});

type CommonProps = {
  theme: ThemeName;
  children?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
};

export const NeuSurface: React.FC<CommonProps> = ({
  theme,
  children,
  contentStyle,
  radius,
}) => {
  const tokens = getTokens(theme);
  const r = { borderRadius: radius ?? tokens.neu.radius };
  const surface = { backgroundColor: tokens.neuSurface };

  return (
    <View
      style={[
        r,
        neuShadow({
          shadowColor: tokens.neuShadow,
          opacity: tokens.neu.shadowOpacity,
          offset: tokens.neu.offset,
          blur: tokens.neu.blur,
          elevation: tokens.neu.elevation,
        }),
        surface,
      ]}
    >
      <View
        style={[
          styles.clip,
          r,
          neuShadow({
            shadowColor: tokens.neuHighlight,
            opacity: tokens.neu.highlightOpacity,
            offset: -tokens.neu.offset,
            blur: tokens.neu.blur,
          }),
          surface,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

type NeuButtonProps = CommonProps & {
  style?: StyleProp<ViewStyle>;
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
  const surface = { backgroundColor: tokens.neuSurface };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        r,
        pressed
          ? styles.pressed
          : neuShadow({
              shadowColor: tokens.neuShadow,
              opacity: tokens.neu.shadowOpacity,
              offset: tokens.neu.offset,
              blur: tokens.neu.blur,
              elevation: tokens.neu.elevation,
            }),
        !pressed && surface,
        disabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.clip,
            r,
            pressed ? { backgroundColor: tokens.neuInset } : surface,
            contentStyle,
          ]}
        >
          {pressed && (
            <>
              <View
                pointerEvents="none"
                style={[styles.bevelEdge, r, styles.bevelTL, { borderColor: tokens.neuShadow }]}
              />
              <View
                pointerEvents="none"
                style={[styles.bevelEdge, r, styles.bevelBR, { borderColor: tokens.neuHighlight }]}
              />
            </>
          )}
          {children}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  bevelEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bevelTL: {
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    opacity: 0.8,
  },
  bevelBR: {
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    opacity: 0.9,
  },
});
