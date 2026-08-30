import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import OrderCard from '../components/OrderCard';
import { COLORS, SIZES } from '../theme';
import { getPendingOrders, fulfillOrder, addOrder, getProducts, deleteOrder } from '../../database';
import { parseCSV, findBestProductMatch } from '../utils/csvParser';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  
  // Add order form
  const [newEtsyId, setNewEtsyId] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [selectedItems, setSelectedItems] = useState({});

  const loadData = async () => {
    const data = await getPendingOrders();
    setOrders(data);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const toggleCheck = (orderId, productId) => {
    setCheckedItems(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [productId]: !prev[orderId]?.[productId],
      },
    }));
  };

  const handleFulfill = async (order) => {
    const orderChecks = checkedItems[order.id] || {};
    const allChecked = order.items.every(item => orderChecks[item.product_id]);
    if (!allChecked) {
      Alert.alert('Attention', 'Cochez tous les articles de la checklist !');
      return;
    }
    Alert.alert('Confirmer', `Expédier la commande de ${order.customer_name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          await fulfillOrder(order.id, order.items);
          const newChecks = { ...checkedItems };
          delete newChecks[order.id];
          setCheckedItems(newChecks);
          loadData();
          Alert.alert('✅ Succès', 'Commande expédiée, stock mis à jour !');
        },
      },
    ]);
  };

  const handleDeleteOrder = (order) => {
    Alert.alert('Supprimer', `Supprimer la commande ${order.etsy_id || '#' + order.id} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteOrder(order.id);
          loadData();
        },
      },
    ]);
  };

  // ── Import CSV ──
  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const rows = parseCSV(content);

      if (rows.length === 0) {
        Alert.alert('Erreur', 'Le fichier CSV est vide ou mal formaté.');
        return;
      }

      const dbProducts = await getProducts();
      let imported = 0;
      let skipped = 0;

      // Chercher les colonnes pertinentes
      const sampleRow = rows[0];
      const keys = Object.keys(sampleRow);
      
      // Grouper par "Sale ID" ou "Order ID" si disponible
      const orderIdKey = keys.find(k => /order.*id|sale.*id|numéro/i.test(k));
      const nameKey = keys.find(k => /item.*name|titre|title|product/i.test(k));
      const buyerKey = keys.find(k => /buyer|acheteur|customer|client/i.test(k));
      const qtyKey = keys.find(k => /quantity|quantit|qté|qty/i.test(k));

      if (!nameKey) {
        Alert.alert('Erreur', 'Colonne produit introuvable dans le CSV.');
        return;
      }

      // Grouper par commande
      const orderGroups = {};
      for (const row of rows) {
        const ordId = orderIdKey ? row[orderIdKey] : `import-${Date.now()}-${Math.random()}`;
        if (!orderGroups[ordId]) {
          orderGroups[ordId] = {
            etsyId: orderIdKey ? row[orderIdKey] : '',
            customer: buyerKey ? row[buyerKey] : 'Client Etsy',
            items: [],
          };
        }
        const product = findBestProductMatch(row[nameKey], dbProducts);
        if (product) {
          const qty = qtyKey ? parseInt(row[qtyKey]) || 1 : 1;
          orderGroups[ordId].items.push({ product_id: product.id, quantity: qty });
          imported++;
        } else {
          skipped++;
        }
      }

      // Insérer les commandes
      let orderCount = 0;
      for (const group of Object.values(orderGroups)) {
        if (group.items.length > 0) {
          await addOrder(group.etsyId, group.customer, group.items);
          orderCount++;
        }
      }

      loadData();
      Alert.alert('Import terminé',
        `${orderCount} commande(s) créée(s)\n${imported} article(s) reconnus\n${skipped} article(s) non reconnus`
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de lire le fichier : ' + e.message);
    }
  };

  // ── Add Manual Order ──
  const openAddModal = async () => {
    const prods = await getProducts();
    setAllProducts(prods.filter(p => p.category === 'Produits'));
    setSelectedItems({});
    setNewEtsyId('');
    setNewCustomer('');
    setShowAddModal(true);
  };

  const toggleSelectItem = (productId) => {
    setSelectedItems(prev => {
      if (prev[productId]) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: 1 };
    });
  };

  const updateItemQty = (productId, qty) => {
    setSelectedItems(prev => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const submitOrder = async () => {
    const items = Object.entries(selectedItems).map(([id, qty]) => ({
      product_id: parseInt(id),
      quantity: qty,
    }));
    if (items.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un produit.');
      return;
    }
    await addOrder(newEtsyId, newCustomer, items);
    setShowAddModal(false);
    loadData();
    Alert.alert('✅ Commande ajoutée !');
  };

  return (
    <View style={styles.container}>
      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={openAddModal} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>＋ Nouvelle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.importBtn]} onPress={handleImportCSV} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>📥 Importer CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Aucune commande en attente</Text>
          <Text style={styles.emptySubtitle}>Ajoutez une commande ou importez un CSV Etsy</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onLongPress={() => handleDeleteOrder(item)} activeOpacity={1}>
              <OrderCard
                order={item}
                checkedItems={checkedItems}
                onToggleCheck={toggleCheck}
                onFulfill={handleFulfill}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Order Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Commande</Text>
            
            <TextInput
              style={styles.input}
              placeholder="N° Etsy (ex: #123456)"
              placeholderTextColor={COLORS.textMuted}
              value={newEtsyId}
              onChangeText={setNewEtsyId}
            />
            <TextInput
              style={styles.input}
              placeholder="Nom du client"
              placeholderTextColor={COLORS.textMuted}
              value={newCustomer}
              onChangeText={setNewCustomer}
            />

            <Text style={styles.modalSubtitle}>Sélectionnez les produits :</Text>
            <ScrollView style={styles.productPicker}>
              {allProducts.map(p => {
                const isSelected = !!selectedItems[p.id];
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickItem, isSelected && styles.pickItemSelected]}
                    onPress={() => toggleSelectItem(p.id)}
                  >
                    <Text style={[styles.pickItemText, isSelected && styles.pickItemTextSelected]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity onPress={() => updateItemQty(p.id, selectedItems[p.id] - 1)}>
                          <Text style={styles.qtyBtn}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{selectedItems[p.id]}</Text>
                        <TouchableOpacity onPress={() => updateItemQty(p.id, selectedItems[p.id] + 1)}>
                          <Text style={styles.qtyBtn}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitOrder}>
                <Text style={styles.submitBtnText}>Créer la commande</Text>
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
  actionBar: { flexDirection: 'row', padding: 12, gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    padding: 14, alignItems: 'center',
  },
  importBtn: { backgroundColor: COLORS.cardLight, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.md },
  list: { padding: 12, paddingBottom: 100 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 6, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalTitle: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '800', marginBottom: 16 },
  modalSubtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.cardLight, borderRadius: SIZES.radiusSm, padding: 14,
    color: COLORS.text, fontSize: SIZES.lg, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  productPicker: { maxHeight: 300 },
  pickItem: {
    padding: 12, borderRadius: SIZES.radiusSm, marginBottom: 6,
    backgroundColor: COLORS.cardLight, borderWidth: 1, borderColor: COLORS.border,
  },
  pickItemSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(211,84,0,0.1)' },
  pickItemText: { color: COLORS.textSecondary, fontSize: SIZES.md },
  pickItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { color: COLORS.primary, fontSize: 22, fontWeight: '800', paddingHorizontal: 14 },
  qtyNum: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  modalActions: { flexDirection: 'row', marginTop: 16, gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: SIZES.radiusSm, alignItems: 'center', backgroundColor: COLORS.cardLight },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.lg },
  submitBtn: { flex: 2, padding: 14, borderRadius: SIZES.radiusSm, alignItems: 'center', backgroundColor: COLORS.primary },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.lg },
});
