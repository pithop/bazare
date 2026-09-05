import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

// Stepper − / valeur / + ; la valeur est saisissable directement au clavier
export default function Stepper({ value, onChange, min = 0, max = 9999, small = false }) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const commitText = () => {
    setEditing(false);
    const n = parseInt(text);
    onChange(Number.isFinite(n) ? clamp(n) : value);
  };

  return (
    <View style={[styles.container, small && styles.containerSm]}>
      <TouchableOpacity
        style={[styles.btn, small && styles.btnSm]}
        activeOpacity={0.7}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - 1))}
      >
        <Ionicons name="remove" size={small ? 16 : 20} color={value <= min ? COLORS.textFaint : COLORS.primary} />
      </TouchableOpacity>

      <TextInput
        style={[styles.value, small && styles.valueSm]}
        keyboardType="numeric"
        value={text}
        onFocus={() => setEditing(true)}
        onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
        onEndEditing={commitText}
        onBlur={commitText}
        selectTextOnFocus
      />

      <TouchableOpacity
        style={[styles.btn, small && styles.btnSm]}
        activeOpacity={0.7}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + 1))}
      >
        <Ionicons name="add" size={small ? 16 : 20} color={value >= max ? COLORS.textFaint : COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
  },
  containerSm: { borderRadius: SIZES.radiusSm },
  btn: { width: 44, height: 46, alignItems: 'center', justifyContent: 'center' },
  btnSm: { width: 32, height: 34 },
  value: {
    minWidth: 52, textAlign: 'center',
    color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '800',
    paddingVertical: 0,
  },
  valueSm: { minWidth: 36, fontSize: SIZES.lg },
});
