import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import Sheet from './ui/Sheet';
import Input from './ui/Input';
import Button from './ui/Button';
import SegmentedControl from './ui/SegmentedControl';
import Stepper from './ui/Stepper';
import { COLORS, SIZES, CATEGORIES } from '../theme';

// Création / édition d'un produit (le stock se modifie via AdjustStockSheet)
export default function ProductFormSheet({
  visible, onClose, product, defaultCategory = 'Produits', defaultMinStock = 5, onSubmit, onDelete,
}) {
  const editing = !!product;
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(defaultMinStock);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(product ? product.name : '');
      setCategory(product ? product.category : defaultCategory);
      setStock(product ? product.stock : 0);
      setMinStock(product ? product.min_stock : defaultMinStock);
      setError(null);
    }
  }, [visible, product, defaultCategory, defaultMinStock]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), category, stock, min_stock: minStock });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer le produit',
      `Supprimer « ${product.name} » ?\n\nCette action est définitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(product);
              onClose();
            } catch (e) {
              Alert.alert('Suppression impossible', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Modifier le produit' : 'Nouveau produit'}
      subtitle={editing ? 'Nom, catégorie et seuil d’alerte' : 'Ajoutez une référence à votre inventaire'}
    >
      <Input
        label="Nom du produit"
        value={name}
        onChangeText={(t) => { setName(t); setError(null); }}
        placeholder="Ex : Malle en osier taille M"
        autoFocus={!editing}
        error={error}
      />

      <Text style={styles.label}>Catégorie</Text>
      <SegmentedControl
        options={Object.entries(CATEGORIES).map(([value, meta]) => ({ label: meta.label, value }))}
        value={category}
        onChange={setCategory}
      />

      {!editing && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.label}>Stock initial</Text>
          <Stepper value={stock} onChange={setStock} min={0} max={9999} />
        </View>
      )}

      <View style={{ marginTop: 18 }}>
        <Text style={styles.label}>Seuil d’alerte (minimum avant réappro)</Text>
        <Stepper value={minStock} onChange={setMinStock} min={1} max={99} />
        <Text style={styles.hint}>
          L’app vous alerte quand le stock passe sous {minStock} unité(s) et proposera
          automatiquement de le racheter dans la liste de courses.
        </Text>
      </View>

      <View style={styles.actions}>
        {editing ? (
          <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={confirmDelete} small />
        ) : null}
        <View style={{ flex: 1 }} />
        <Button
          title={editing ? 'Enregistrer' : 'Ajouter au stock'}
          icon={editing ? 'checkmark' : 'add'}
          onPress={submit}
          loading={saving}
          style={{ flex: 2 }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: {
    color: COLORS.textSecondary, fontSize: SIZES.sm,
    fontWeight: '700', marginBottom: 8, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hint: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 8, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 8 },
});
