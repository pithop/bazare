import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import SearchBar from '../components/ui/SearchBar';
import SegmentedControl from '../components/ui/SegmentedControl';
import EmptyState from '../components/ui/EmptyState';
import OrderCard from '../components/OrderCard';
import OrderFormSheet from '../components/OrderFormSheet';
import ImportPreviewSheet from '../components/ImportPreviewSheet';
import { COLORS, SIZES } from '../theme';
import {
  getOrders, addOrder, updateOrder, deleteOrder, fulfillOrder, unshipOrder,
  getProducts, getExistingEtsyIds,
} from '../../database';
import { parseCSV, findBestProductMatch } from '../utils/csvParser';

export default function OrdersScreen() {
  const [tab, setTab] = useState('PENDING');
  const [pending, setPending] = useState([]);
  const [shipped, setShipped] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [previewPlan, setPreviewPlan] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadData = useCallback(async () => {
    const [pend, ship, prods] = await Promise.all([
      getOrders('PENDING'),
      getOrders('SHIPPED'),
      getProducts(),
    ]);
    setPending(pend);
    setShipped(ship);
    setProducts(prods);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const displayed = tab === 'PENDING' ? pending : shipped;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayed;
    return displayed.filter(
      (o) =>
        (o.etsy_id || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        o.items.some((i) => (i.name || '').toLowerCase().includes(q))
    );
  }, [displayed, search]);

  // ── Checklist ──
  const toggleCheck = (orderId, productId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [productId]: !prev[orderId]?.[productId] },
    }));
  };

  // ── Expédier ──
  const handleFulfill = (order) => {
    Alert.alert(
      'Expédier la commande',
      `${order.customer_name} — le stock sera décrémenté automatiquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Expédier', style: 'default',
          onPress: async () => {
            await fulfillOrder(order.id);
            setCheckedItems((prev) => {
              const copy = { ...prev };
              delete copy[order.id];
              return copy;
            });
            await loadData();
            Alert.alert('✅ Expédiée', 'Commande validée, stock mis à jour.\nVous pouvez l’annuler depuis l’historique.');
          },
        },
      ]
    );
  };

  // ── Annuler une expédition ──
  const handleUnship = (order) => {
    Alert.alert(
      'Annuler l’expédition',
      'La commande repassera en attente et le stock sera restauré.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer', style: 'default',
          onPress: async () => {
            await unshipOrder(order.id);
            await loadData();
            Alert.alert('↩️ Restaurée', 'Le stock a été recrédité.');
          },
        },
      ]
    );
  };

  // ── Supprimer ──
  const handleDelete = (order) => {
    Alert.alert(
      'Supprimer la commande',
      `${order.etsy_id ? `#${order.etsy_id}` : `Commande ${order.id}`} — ${order.customer_name}\n\nCette action est définitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await deleteOrder(order.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ── Nouvelle / édition ──
  const openCreate = () => {
    setEditingOrder(null);
    setFormVisible(true);
  };
  const openEdit = (order) => {
    setEditingOrder(order);
    setFormVisible(true);
  };
  const handleSubmitOrder = async ({ etsyId, customer, items }) => {
    if (editingOrder) await updateOrder(editingOrder.id, etsyId, customer, items);
    else await addOrder(etsyId, customer, items);
    await loadData();
  };

  // ── Import CSV avec aperçu ──
  const buildImportPlan = async (content) => {
    const rows = parseCSV(content);
    if (rows.length === 0) throw new Error('Le fichier CSV est vide ou mal formaté.');

    const keys = Object.keys(rows[0]);
    const orderIdKey = keys.find((k) => /order.*id|sale.*id|numéro/i.test(k));
    const nameKey = keys.find((k) => /item.*name|titre|title|product/i.test(k));
    const buyerKey = keys.find((k) => /buyer|acheteur|customer|client/i.test(k));
    const qtyKey = keys.find((k) => /quantity|quantit|qté|qty/i.test(k));
    if (!nameKey) throw new Error('Colonne produit introuvable dans le CSV.');

    const dbProducts = await getProducts();
    const existingIds = await getExistingEtsyIds();
    const now = Date.now();

    const groups = new Map();
    const unmatched = [];
    let totalArticles = 0;

    for (const row of rows) {
      const rawId = orderIdKey ? String(row[orderIdKey] || '').trim() : '';
      const groupKey = rawId || `manual-${now}-${Math.random()}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          etsyId: rawId,
          customer: buyerKey && row[buyerKey] ? row[buyerKey] : 'Client Etsy',
          items: [],
        });
      }
      const product = findBestProductMatch(row[nameKey], dbProducts);
      if (product) {
        const qty = qtyKey ? parseInt(row[qtyKey]) || 1 : 1;
        groups.get(groupKey).items.push({ product_id: product.id, quantity: qty });
        totalArticles += qty;
      } else {
        unmatched.push(row[nameKey]);
      }
    }

    const planOrders = [];
    const duplicates = [];
    for (const g of groups.values()) {
      if (g.items.length === 0) continue;
      if (g.etsyId && existingIds.has(g.etsyId)) {
        duplicates.push(g.etsyId);
        continue;
      }
      planOrders.push(g);
    }

    return { orders: planOrders, duplicates, unmatched: [...new Set(unmatched)], totalArticles };
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const plan = await buildImportPlan(content);
      setPreviewPlan(plan);
    } catch (e) {
      Alert.alert('Import impossible', e.message);
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      for (const g of previewPlan.orders) {
        await addOrder(g.etsyId, g.customer, g.items);
      }
      setPreviewPlan(null);
      await loadData();
      Alert.alert('✅ Import terminé', `${previewPlan.orders.length} commande(s) créée(s).`);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Actions principales */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} activeOpacity={0.8} onPress={openCreate}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={[styles.actionText, { color: COLORS.white }]}>Nouvelle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleImportCSV}>
          <Ionicons name="download-outline" size={17} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Importer CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets En attente / Historique */}
      <View style={styles.tabsRow}>
        <SegmentedControl
          options={[
            { label: 'En attente', value: 'PENDING', icon: 'time-outline', count: pending.length },
            { label: 'Historique', value: 'SHIPPED', icon: 'archive-outline', count: shipped.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {/* Recherche */}
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="N° Etsy, client, article…" />
      </View>

      {/* Liste */}
      {filtered.length === 0 ? (
        tab === 'PENDING' && !search ? (
          <EmptyState
            icon="receipt-outline"
            title="Aucune commande en attente"
            subtitle="Créez une commande manuellement ou importez le CSV Etsy."
            actionLabel="Nouvelle commande"
            onAction={openCreate}
          />
        ) : (
          <EmptyState icon="search-outline" title="Aucun résultat" subtitle="Aucune commande ne correspond à cette recherche." />
        )
      ) : tab === 'PENDING' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              checkedItems={checkedItems}
              onToggleCheck={toggleCheck}
              onFulfill={handleFulfill}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.shippedCard}>
              <View style={styles.shippedLeft}>
                <View style={styles.shippedIcon}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                </View>
                <View style={styles.shippedInfo}>
                  <Text style={styles.shippedTitle}>
                    {item.etsy_id ? `#${item.etsy_id}` : `Commande ${item.id}`} · {item.customer_name}
                  </Text>
                  <Text style={styles.shippedItems} numberOfLines={1}>
                    {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </Text>
                  <Text style={styles.shippedDate}>
                    Expédiée le {item.shipped_date || item.date || '?'}
                  </Text>
                </View>
              </View>
              <View style={styles.shippedActions}>
                <TouchableOpacity style={styles.shippedBtn} activeOpacity={0.7} onPress={() => handleUnship(item)}>
                  <Ionicons name="arrow-undo-outline" size={15} color={COLORS.info} />
                  <Text style={[styles.shippedBtnText, { color: COLORS.info }]}>Restaurer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shippedBtn} activeOpacity={0.7} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                  <Text style={[styles.shippedBtnText, { color: COLORS.danger }]}>Suppr.</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Sheets */}
      <OrderFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        products={products}
        order={editingOrder}
        onSubmit={handleSubmitOrder}
      />
      <ImportPreviewSheet
        visible={!!previewPlan}
        onClose={() => setPreviewPlan(null)}
        plan={previewPlan}
        importing={importing}
        onConfirm={confirmImport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  actionBar: { flexDirection: 'row', gap: 9, paddingHorizontal: 14, paddingTop: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12, flex: 1,
  },
  actionPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, flex: 1.2 },
  actionText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '700' },
  tabsRow: { paddingHorizontal: 14, marginTop: 10 },
  searchRow: { paddingHorizontal: 14, marginTop: 10 },
  list: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 40 },

  shippedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 13, marginBottom: 8,
  },
  shippedLeft: { flexDirection: 'row' },
  shippedIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  shippedInfo: { flex: 1, marginRight: 8 },
  shippedTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  shippedItems: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 2 },
  shippedDate: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 },
  shippedActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  shippedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6,
  },
  shippedBtnText: { fontSize: SIZES.sm, fontWeight: '700' },
});
