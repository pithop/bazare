import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme';

// Contrôle segmenté avec compteur optionnel par segment
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
            activeOpacity={0.8}
            onPress={() => onChange(opt.value)}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={15}
                color={active ? COLORS.white : COLORS.textMuted}
                style={styles.icon}
              />
            ) : null}
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {opt.label}
            </Text>
            {typeof opt.count === 'number' && opt.count > 0 ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{opt.count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 3,
  },
  segment: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: SIZES.radiusSm, paddingHorizontal: 4,
  },
  segmentActive: { backgroundColor: COLORS.primary },
  icon: { marginRight: 5 },
  label: {
    color: COLORS.textMuted, fontSize: SIZES.md, fontWeight: '700',
    flexShrink: 1,
  },
  labelActive: { color: COLORS.white },
  badge: {
    marginLeft: 6, minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: COLORS.surfaceHover,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { color: COLORS.textSecondary, fontSize: SIZES.xs, fontWeight: '800' },
  badgeTextActive: { color: COLORS.white },
});
