import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Rechercher…' }) {
  const hasText = value && value.length > 0;
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textFaint}
        returnKeyType="search"
        autoCorrect={false}
      />
      {hasText && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clear}>
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12, height: 46,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.lg, paddingVertical: 0 },
  clear: { padding: 2 },
});
