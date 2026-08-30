import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SIZES } from '../theme';
import { getLowStockProducts, exportInventoryCSV } from '../../database';

export default function ShoppingScreen() {
  const [items, setItems] = useState([]);

  const loadData = async () => {
    const data = await getLowStockProducts(5);
    setItems(data);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleShare = async () => {
    try {
      if (items.length === 0) {
        Alert.alert('Vide', 'Rien à partager.');
        return;
      }
      let text = '🛒 LISTE DE COURSES – LeBazare\n\n';
      const produits = items.filter(i => i.category === 'Produits');
      const emballages = items.filter(i => i.category === 'Emballages');
      
      if (produits.length > 0) {
        text += '👜 CRÉATIONS :\n';
        produits.forEach(p => { text += `  • ${p.name} (reste: ${p.stock})\n`; });
        text += '\n';
      }
      if (emballages.length > 0) {
        text += '📦 EMBALLAGES :\n';
        emballages.forEach(p => { text += `  • ${p.name} (reste: ${p.stock})\n`; });
      }

      const path = FileSystem.documentDirectory + 'liste_courses.txt';
      await FileSystem.writeAsStringAsync(path, text);
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await exportInventoryCSV();
      const path = FileSystem.documentDirectory + 'inventaire_lebazare.csv';
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Exporter inventaire' });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const critical = items.filter(i => i.stock === 0);
  const low = items.filter(i => i.stock > 0);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, { borderColor: COLORS.danger }]}>
          <Text style={[styles.statNum, { color: COLORS.danger }]}>{critical.length}</Text>
          <Text style={styles.statLabel}>Ruptures</Text>
        </View>
        <View style={[styles.stat, { borderColor: COLORS.warning }]}>
          <Text style={[styles.statNum, { color: COLORS.warning }]}>{low.length}</Text>
          <Text style={styles.statLabel}>Stock faible</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.shareBtnText}>📤 Partager la liste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, styles.exportBtn]} onPress={handleExportCSV} activeOpacity={0.7}>
          <Text style={styles.shareBtnText}>📊 Exporter tout le stock</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>Tout va bien !</Text>
          <Text style={styles.emptySubtitle}>Aucun article sous le seuil de 5 unités</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isCritical = item.stock === 0;
            return (
              <View style={[styles.row, isCritical && styles.rowCritical]}>
                <View style={[styles.urgencyDot, { backgroundColor: isCritical ? COLORS.danger : COLORS.warning }]} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.rowCategory}>
                    {item.category === 'Produits' ? '👜' : '📦'} {item.category}
                  </Text>
                </View>
                <View style={styles.rowStockBox}>
                  <Text style={[styles.rowStock, isCritical && { color: COLORS.danger }]}>
                    {item.stock}
                  </Text>
                  <Text style={styles.rowStockLabel}>restant</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  statsRow: { flexDirection: 'row', padding: 12, gap: 10 },
  stat: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusSm,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  statNum: { fontSize: 28, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },

  actionRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  shareBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    padding: 12, alignItems: 'center',
  },
  exportBtn: { backgroundColor: COLORS.info },
  shareBtnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.sm },

  list: { padding: 12, paddingBottom: 100 },

  row: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 8, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  rowCritical: { borderColor: COLORS.danger },
  urgencyDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowInfo: { flex: 1, marginRight: 10 },
  rowName: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '600' },
  rowCategory: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 3 },
  rowStockBox: { alignItems: 'center', minWidth: 50 },
  rowStock: { color: COLORS.warning, fontSize: 24, fontWeight: '900' },
  rowStockLabel: { color: COLORS.textMuted, fontSize: SIZES.xs },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 6, textAlign: 'center' },
});
