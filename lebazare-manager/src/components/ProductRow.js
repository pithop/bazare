import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, categoryMeta } from '../theme';

// Ligne produit : tap = ajuster le stock, − / + rapides à droite
export default function ProductRow({ item, onPress, onDecrement, onIncrement }) {
  const meta = categoryMeta(item.category);
  const stockColor =
    item.stock === 0 ? COLORS.danger : item.stock < item.min_stock ? COLORS.warning : COLORS.text;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>
            {meta.emoji} {meta.label}
          </Text>
          {item.stock < item.min_stock ? (
            <View style={styles.alertBadge}>
              <Ionicons name="warning" size={10} color={COLORS.warning} />
              <Text style={styles.alertText}>seuil {item.min_stock}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.stock, { color: stockColor }]}>{item.stock}</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.miniBtn}
          activeOpacity={0.7}
          disabled={item.stock === 0}
          onPress={() => onDecrement(item)}
        >
          <Ionicons name="remove" size={17} color={item.stock === 0 ? COLORS.textFaint : COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.miniBtn} activeOpacity={0.7} onPress={() => onIncrement(item)}>
          <Ionicons name="add" size={17} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 8,
  },
  left: { flex: 1, marginRight: 10 },
  name: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600', lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  category: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '600' },
  alertBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginLeft: 8, backgroundColor: COLORS.warningSoft,
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  alertText: { color: COLORS.warning, fontSize: 9, fontWeight: '700', marginLeft: 2 },
  stock: { fontSize: SIZES.xxl, fontWeight: '900', minWidth: 40, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  miniBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
