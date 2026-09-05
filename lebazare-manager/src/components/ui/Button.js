import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

const VARIANTS = {
  primary: { bg: COLORS.primary, text: COLORS.white, icon: COLORS.white },
  secondary: { bg: COLORS.surfaceLight, text: COLORS.text, icon: COLORS.textSecondary, border: COLORS.border },
  success: { bg: COLORS.success, text: COLORS.white, icon: COLORS.white },
  danger: { bg: COLORS.dangerSoft, text: COLORS.danger, icon: COLORS.danger, border: COLORS.danger },
  ghost: { bg: 'transparent', text: COLORS.textSecondary, icon: COLORS.textMuted },
  info: { bg: COLORS.info, text: COLORS.white, icon: COLORS.white },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  small = false,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        small ? styles.small : styles.md,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={small ? 14 : 17} color={v.icon} style={styles.icon} /> : null}
          <Text style={[styles.text, small ? styles.textSm : styles.textMd, { color: v.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: SIZES.radiusMd, alignItems: 'center', justifyContent: 'center' },
  md: { paddingVertical: 14, paddingHorizontal: 18, minHeight: SIZES.buttonHeight },
  small: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 34 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 7 },
  text: { fontWeight: '700' },
  textMd: { fontSize: SIZES.lg },
  textSm: { fontSize: SIZES.sm },
  disabled: { opacity: 0.45 },
});
