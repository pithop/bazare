import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';
import Button from './Button';

export default function EmptyState({ icon = 'sparkles', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={34} color={COLORS.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} icon="add" onPress={onAction} style={styles.action} small />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    color: COLORS.textMuted, fontSize: SIZES.md,
    marginTop: 6, textAlign: 'center', lineHeight: 21,
  },
  action: { marginTop: 18 },
});
