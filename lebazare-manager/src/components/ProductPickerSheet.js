import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './ui/Sheet';
import SearchBar from './ui/SearchBar';
import SegmentedControl from './ui/SegmentedControl';
import Stepper from './ui/Stepper';
import Button from './ui/Button';
import { COLORS, SIZES, categoryMeta } from '../theme';

// Sélecteur de produits pour composer une commande : recherche + filtre catégorie + quantités
export default function ProductPickerSheet({ visible, onClose, products, initialSelected, onConfirm }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (visible) {
      setSelected(initialSelected || {});
      setSearch('');
      setCategory('all');
    }
  }, [visible, initialSelected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category]);

  const setQty = (id, qty) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (qty <= 0) delete copy[id];
      else copy[id] = qty;
      return copy;
    });
  };

  const totalRefs = Object.keys(selected).length;
  const totalUnits = Object.values(selected).reduce((a, b) => a + b, 0);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Produits de la commande"
      subtitle="Recherchez, ajustez les quantités puis validez"
      maxHeight="92%"
    >
      <View style={styles.filters}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher un produit…" />
      </View>
      <View style={styles.filters}>
        <SegmentedControl
          options={[
            { label: 'Tout', value: 'all', icon: 'apps' },
            { label: 'Créations', value: 'Produits', icon: 'color-palette-outline' },
            { label: 'Emballages', value: 'Emballages', icon: 'cube-outline' },
          ]}
          value={category}
          onChange={setCategory}
        />
      </View>

      <View style={styles.list}>
        {filtered.map((p) => {
          const qty = selected[p.id] || 0;
          const isSelected = qty > 0;
          const meta = categoryMeta(p.category);
          return (
            <View
              key={p.id}
              style={[styles.item, isSelected && styles.itemSelected]}
            >
              <View style={styles.itemLeft}>
                <Text style={[styles.itemName, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.itemMeta}>
                  {meta.emoji} {meta.label} · {p.stock} en stock
                </Text>
              </View>
              {isSelected ? (
                <Stepper value={qty} onChange={(v) => setQty(p.id, v)} min={0} small />
              ) : (
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => setQty(p.id, 1)}>
                  <Ionicons name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun produit trouvé.</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {totalRefs} référence{totalRefs > 1 ? 's' : ''} · {totalUnits} article{totalUnits > 1 ? 's' : ''}
        </Text>
        <Button
          title="Valider la sélection"
          icon="checkmark"
          disabled={totalRefs === 0}
          onPress={() => {
            const items = Object.entries(selected).map(([id, qty]) => ({
              product_id: parseInt(id),
              quantity: qty,
            }));
            onConfirm(items);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: 10 },
  list: { minHeight: 200 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 7,
  },
  itemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600' },
  itemMeta: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 },
  addBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: 30, fontSize: SIZES.md },
  footer: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 14, marginTop: 10,
  },
  footerText: {
    color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '700',
    marginBottom: 10, textAlign: 'center',
  },
});
