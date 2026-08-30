import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StockCard from '../components/StockCard';
import { COLORS, SIZES } from '../theme';
import { getProductsByCategory, updateStock, addProduct, deleteProduct } from '../../database';

export default function InventoryScreen() {
  const [activeCategory, setActiveCategory] = useState('Produits');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStock, setNewStock] = useState('0');

  const loadData = async () => {
    const data = await getProductsByCategory(activeCategory);
    setProducts(data);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [activeCategory]));

  const handleStockChange = async (id, currentStock, change) => {
    await updateStock(id, currentStock + change);
    loadData();
  };

  const handleDelete = (item) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => { await deleteProduct(item.id); loadData(); },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Entrez un nom.');
      return;
    }
    await addProduct(newName.trim(), activeCategory, parseInt(newStock) || 0);
    setShowAddModal(false);
    setNewName('');
    setNewStock('0');
    loadData();
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.stock < 5).length;

  return (
    <View style={styles.container}>
      {/* Category Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, activeCategory === 'Produits' && styles.toggleActive]}
          onPress={() => setActiveCategory('Produits')}
        >
          <Text style={[styles.toggleText, activeCategory === 'Produits' && styles.toggleTextActive]}>
            👜 Créations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, activeCategory === 'Emballages' && styles.toggleActive]}
          onPress={() => setActiveCategory('Emballages')}
        >
          <Text style={[styles.toggleText, activeCategory === 'Emballages' && styles.toggleTextActive]}>
            📦 Emballages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{products.length}</Text>
          <Text style={styles.statLabel}>Références</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{totalStock}</Text>
          <Text style={styles.statLabel}>Total en stock</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, lowStock > 0 && { color: COLORS.warning }]}>{lowStock}</Text>
          <Text style={styles.statLabel}>Stock faible</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => { setShowAddModal(true); }}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={1}>
            <StockCard
              item={item}
              onIncrement={() => handleStockChange(item.id, item.stock, 1)}
              onDecrement={() => handleStockChange(item.id, item.stock, -1)}
            />
          </TouchableOpacity>
        )}
      />

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeCategory === 'Produits' ? '👜 Ajouter un produit' : '📦 Ajouter un emballage'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du produit"
              placeholderTextColor={COLORS.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock initial"
              placeholderTextColor={COLORS.textMuted}
              value={newStock}
              onChangeText={setNewStock}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  toggleContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  toggle: {
    flex: 1, paddingVertical: 12, borderRadius: SIZES.radiusSm,
    alignItems: 'center', backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  toggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.md },
  toggleTextActive: { color: COLORS.white },

  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  stat: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusSm,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statNum: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },

  searchRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusSm,
    padding: 12, color: COLORS.text, fontSize: SIZES.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: {
    width: SIZES.buttonHeight, height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },

  list: { padding: 12, paddingBottom: 100 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '800', marginBottom: 16 },
  input: {
    backgroundColor: COLORS.cardLight, borderRadius: SIZES.radiusSm, padding: 14,
    color: COLORS.text, fontSize: SIZES.lg, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: SIZES.radiusSm, alignItems: 'center', backgroundColor: COLORS.cardLight },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.lg },
  submitBtn: { flex: 2, padding: 14, borderRadius: SIZES.radiusSm, alignItems: 'center', backgroundColor: COLORS.primary },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.lg },
});
