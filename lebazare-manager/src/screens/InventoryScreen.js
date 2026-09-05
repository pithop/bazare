import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/ui/SearchBar';
import SegmentedControl from '../components/ui/SegmentedControl';
import EmptyState from '../components/ui/EmptyState';
import ProductRow from '../components/ProductRow';
import ProductFormSheet from '../components/ProductFormSheet';
import AdjustStockSheet from '../components/AdjustStockSheet';
import { COLORS, SIZES } from '../theme';
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  setStock, adjustStock, getDefaultMinStock,
} from '../../database';

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [defaultMin, setDefaultMin] = useState(5);

  const loadData = useCallback(async () => {
    setProducts(await getProducts());
    setDefaultMin(await getDefaultMinStock());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category]);

  const stats = useMemo(() => {
    const low = products.filter((p) => p.stock < p.min_stock).length;
    const out = products.filter((p) => p.stock === 0).length;
    const units = products.reduce((a, p) => a + p.stock, 0);
    return { refs: products.length, low, out, units };
  }, [products]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormVisible(true);
  };

  const openEdit = (product) => {
    setAdjustProduct(null);
    setEditingProduct(product);
    setFormVisible(true);
  };

  const handleSubmit = async ({ name, category: cat, stock, min_stock }) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, { name, category: cat, min_stock });
    } else {
      await addProduct({ name, category: cat, stock, min_stock });
    }
    await loadData();
  };

  const handleDelete = async (product) => {
    await deleteProduct(product.id);
    await loadData();
  };

  const handleApplyStock = async (product, newStock) => {
    await setStock(product.id, newStock);
    await loadData();
  };

  const handleIncrement = async (product) => {
    await adjustStock(product.id, 1);
    await loadData();
  };

  const handleDecrement = async (product) => {
    await adjustStock(product.id, -1);
    await loadData();
  };

  return (
    <View style={styles.container}>
      {/* Recherche + ajout */}
      <View style={styles.topBar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher un produit…" />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.refs}</Text>
          <Text style={styles.statLabel}>références</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.units}</Text>
          <Text style={styles.statLabel}>unités</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, stats.low > 0 && { color: COLORS.warning }]}>{stats.low}</Text>
          <Text style={styles.statLabel}>stock faible</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, stats.out > 0 && { color: COLORS.danger }]}>{stats.out}</Text>
          <Text style={styles.statLabel}>ruptures</Text>
        </View>
      </View>

      {/* Filtre catégorie */}
      <View style={styles.filterRow}>
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

      {/* Liste */}
      {filtered.length === 0 && products.length > 0 ? (
        <EmptyState icon="search-outline" title="Aucun résultat" subtitle="Essayez une autre recherche ou un autre filtre." />
      ) : products.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="Inventaire vide"
          subtitle="Ajoutez votre première référence pour démarrer."
          actionLabel="Ajouter un produit"
          onAction={openCreate}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductRow
              item={item}
              onPress={() => setAdjustProduct(item)}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          )}
        />
      )}

      {/* FAB ajouter */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <View style={styles.fabInner} pointerEvents="box-none">
          <Text style={styles.fabCount}>{filtered.length}</Text>
          <Text style={styles.fabLabel}>affichés</Text>
        </View>
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openCreate}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <ProductFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        product={editingProduct}
        defaultMinStock={defaultMin}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
      <AdjustStockSheet
        visible={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onApply={handleApplyStock}
        onEdit={() => openEdit(adjustProduct)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 10, gap: 7 },
  stat: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 9, alignItems: 'center',
  },
  statValue: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  filterRow: { paddingHorizontal: 14, marginTop: 10 },
  list: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 110 },

  fabWrap: { position: 'absolute', right: 16, bottom: 16 },
  fabInner: { alignItems: 'center', marginBottom: 8 },
  fabCount: { color: COLORS.textMuted, fontSize: SIZES.md, fontWeight: '800' },
  fabLabel: { color: COLORS.textFaint, fontSize: 9, fontWeight: '600' },
  fab: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
