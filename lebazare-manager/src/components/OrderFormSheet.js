import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './ui/Sheet';
import Input from './ui/Input';
import Button from './ui/Button';
import Stepper from './ui/Stepper';
import ProductPickerSheet from './ProductPickerSheet';
import { COLORS, SIZES } from '../theme';

// Création / édition d'une commande manuelle
export default function OrderFormSheet({
  visible, onClose, products, order, onSubmit,
}) {
  const editing = !!order;
  const [etsyId, setEtsyId] = useState('');
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]); // [{product_id, quantity, name, stock}]
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEtsyId(order ? (order.etsy_id || '') : '');
      setCustomer(order ? (order.customer_name || '') : '');
      setItems(order ? order.items.map((i) => ({
        product_id: i.product_id, quantity: i.quantity, name: i.name, stock: i.stock,
      })) : []);
    }
  }, [visible, order]);

  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const setQty = (productId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product_id !== productId)
        : prev.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i))
    );
  };

  const submit = async () => {
    if (items.length === 0) {
      Alert.alert('Commande vide', 'Ajoutez au moins un produit à la commande.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ etsyId: etsyId.trim(), customer: customer.trim(), items });
      onClose();
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible d’enregistrer la commande.');
    } finally {
      setSaving(false);
    }
  };

  const totalUnits = items.reduce((a, b) => a + b.quantity, 0);

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={editing ? 'Modifier la commande' : 'Nouvelle commande'}
        subtitle={editing ? 'Ajustez les articles ou les informations client' : 'Créez une commande manuelle'}
      >
        <View style={styles.inputsRow}>
          <View style={{ flex: 1 }}>
            <Input label="N° Etsy" value={etsyId} onChangeText={setEtsyId} placeholder="123456" />
          </View>
          <View style={{ flex: 2 }}>
            <Input label="Client" value={customer} onChangeText={setCustomer} placeholder="Nom du client" />
          </View>
        </View>

        <View style={styles.itemsHeader}>
          <Text style={styles.itemsTitle}>
            ARTICLES ({items.length} réf. · {totalUnits} art.)
          </Text>
          <TouchableOpacity style={styles.addItemBtn} activeOpacity={0.8} onPress={() => setPickerVisible(true)}>
            <Ionicons name="add" size={16} color={COLORS.white} />
            <Text style={styles.addItemText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <TouchableOpacity style={styles.emptyPicker} activeOpacity={0.8} onPress={() => setPickerVisible(true)}>
            <Ionicons name="search" size={26} color={COLORS.textFaint} />
            <Text style={styles.emptyPickerText}>Rechercher et ajouter des produits</Text>
            <Text style={styles.emptyPickerHint}>Créations et emballages, avec recherche instantanée</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.product_id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemStock}>{item.stock} en stock</Text>
                </View>
                <Stepper value={item.quantity} onChange={(v) => setQty(item.product_id, v)} min={0} small />
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={editing ? 'Enregistrer' : 'Créer la commande'}
            icon="checkmark"
            onPress={submit}
            loading={saving}
            disabled={items.length === 0}
          />
        </View>
      </Sheet>

      <ProductPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        products={products}
        initialSelected={(() => {
          const map = {};
          for (const i of items) map[i.product_id] = i.quantity;
          return map;
        })()}
        onConfirm={(selected) => {
          setItems(
            selected.map((s) => ({
              product_id: s.product_id,
              quantity: s.quantity,
              name: productMap[s.product_id]?.name || `Produit ${s.product_id}`,
              stock: productMap[s.product_id]?.stock ?? 0,
            }))
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inputsRow: { flexDirection: 'row', gap: 10 },
  itemsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, marginBottom: 10,
  },
  itemsTitle: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '800', letterSpacing: 1.2 },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7,
  },
  addItemText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  emptyPicker: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: SIZES.radiusMd,
    paddingVertical: 34,
  },
  emptyPickerText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '700', marginTop: 10 },
  emptyPickerHint: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 3 },
  itemsList: {},
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 7,
  },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600' },
  itemStock: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  actions: { marginTop: 20, marginBottom: 8 },
});
