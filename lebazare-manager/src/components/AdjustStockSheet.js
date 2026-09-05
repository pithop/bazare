import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './ui/Sheet';
import Stepper from './ui/Stepper';
import Button from './ui/Button';
import { COLORS, SIZES, categoryMeta } from '../theme';

const stockColor = (p) => (p.stock === 0 ? COLORS.danger : p.stock < p.min_stock ? COLORS.warning : COLORS.success);

// Modification rapide du stock : saisie directe ou +/- 
export default function AdjustStockSheet({ visible, onClose, product, onApply, onEdit }) {
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (visible && product) setStock(product.stock);
  }, [visible, product]);

  if (!product) return null;
  const meta = categoryMeta(product.category);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={product.name}
      subtitle={`${meta.emoji} ${meta.label} · seuil d'alerte : ${product.min_stock}`}
    >
      <View style={styles.currentRow}>
        <Text style={styles.currentLabel}>Stock actuel</Text>
        <Text style={[styles.currentValue, { color: stockColor(product) }]}>{product.stock}</Text>
      </View>

      <Text style={styles.label}>Nouveau stock</Text>
      <Stepper value={stock} onChange={setStock} min={0} max={9999} />

      <Text style={styles.hint}>
        Touchez la valeur pour la saisir directement au clavier. Le changement est enregistré
        dans l’historique de stock.
      </Text>

      <View style={styles.actions}>
        <Button title="Modifier la fiche" icon="create-outline" variant="secondary" onPress={onEdit} small />
        <View style={{ flex: 1 }} />
        <Button
          title="Appliquer"
          icon="checkmark"
          onPress={async () => { await onApply(product, stock); onClose(); }}
          disabled={stock === product.stock}
          style={{ flex: 1.4 }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  currentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 6,
  },
  currentLabel: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '600' },
  currentValue: { fontSize: SIZES.xxl, fontWeight: '900' },
  label: {
    color: COLORS.textSecondary, fontSize: SIZES.sm,
    fontWeight: '700', marginBottom: 8, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hint: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 10, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 8 },
});
