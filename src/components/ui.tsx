import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export function NightBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[theme.colors.nightTop, theme.colors.night, theme.colors.nightDeep]}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </LinearGradient>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.night} />
      ) : (
        <Text style={styles.btnText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Spacer({ h = 0 }: { h?: number }) {
  return <View style={{ height: h }} />;
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.lavender,
    height: 56,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: { opacity: 0.85 },
  btnText: { color: theme.colors.night, fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceVariant,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { backgroundColor: theme.colors.lavender },
  chipText: { color: theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: theme.colors.night },
});
