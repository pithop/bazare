import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../theme';

export default function Input({ label, hint, error, style, ...props }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.textFaint}
        style={[styles.input, error && styles.inputError, props.multiline && styles.multiline]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    color: COLORS.textSecondary, fontSize: SIZES.sm,
    fontWeight: '700', marginBottom: 7, textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14, paddingVertical: 13,
    color: COLORS.text, fontSize: SIZES.lg,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.danger },
  hint: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 5 },
  error: { color: COLORS.danger, fontSize: SIZES.sm, marginTop: 5 },
});
