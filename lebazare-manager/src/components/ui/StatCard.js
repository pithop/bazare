import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

export default function StatCard({ icon, label, value, color = COLORS.text, soft }) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: soft || COLORS.surfaceLight }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 12, alignItems: 'center',
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  value: { fontSize: SIZES.xxl, fontWeight: '800' },
  label: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2, fontWeight: '600' },
});
