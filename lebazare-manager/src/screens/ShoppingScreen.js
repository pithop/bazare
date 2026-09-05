import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import EmptyState from '../components/ui/EmptyState';
import { COLORS, SIZES, categoryMeta } from '../theme';
import { getShoppingList, exportInventoryCSV } from '../../database';

export default function ShoppingScreen() {
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});

  const loadData = async () => {
    setItems(await getShoppingList());
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      setChecked({});
    }, [])
  );

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const critical = items.filter((i) => i.stock === 0);
  const low = items.filter((i) => i.stock > 0);
  const toBuyTotal = items.reduce((a, i) => a + i.to_buy, 0);

  const handleShareList = async () => {
    try {
      if (items.length === 0) {
        Alert.alert('Vide', 'Aucun article sous le seuil — rien à commander.');
        return;
      }
      let text = '🛒 LISTE DE COURSES — LeBazare\n';
      text += `${new Date().toLocaleDateString('fr-FR')}\n\n`;
      const produits = items.filter((i) => i.category === 'Produits');
      const emballages = items.filter((i) => i.category === 'Emballages');
      const section = (title, data) => {
        if (data.length === 0) return;
        text += `${title}\n`;
        for (const p of data) {
          const done = checked[p.id] ? '☑' : '☐';
          text += `  ${done} ${p.name}\n     en stock : ${p.stock}  →  à acheter : ${p.to_buy}\n`;
        }
        text += '\n';
      };
      section('👜 CRÉATIONS', produits);
      section('📦 EMBALLAGES', emballages);
      text += `Total à acheter : ${toBuyTotal} article(s)\n`;

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

  const renderRow = (item) => {
    const isCritical = item.stock === 0;
    const isDone = !!checked[item.id];
    const meta = categoryMeta(item.category);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.row, isDone && styles.rowDone, isCritical && !isDone && styles.rowCritical]}
        activeOpacity={0.75}
        onPress={() => toggle(item.id)}
      >
        <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
          {isDone ? <Ionicons name="check" size={15} color={COLORS.white} /> : null}
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, isDone && styles.rowNameDone]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta}>
            {meta.emoji} {meta.label} · reste {item.stock} (seuil {item.min_stock})
          </Text>
        </View>
        <View style={[styles.buyBox, isDone && { opacity: 0.4 }]}>
          <Text style={[styles.buyNum, isCritical && !isDone && { color: COLORS.danger }]}>
            {item.to_buy}
          </Text>
          <Text style={styles.buyLabel}>à acheter</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, critical.length > 0 && { borderColor: COLORS.danger }]}>
          <Text style={[styles.statNum, { color: critical.length > 0 ? COLORS.danger : COLORS.text }]}>
            {critical.length}
          </Text>
          <Text style={styles.statLabel}>ruptures</Text>
        </View>
        <View style={[styles.stat, low.length > 0 && { borderColor: COLORS.warning }]}>
          <Text style={[styles.statNum, { color: low.length > 0 ? COLORS.warning : COLORS.text }]}>
            {low.length}
          </Text>
          <Text style={styles.statLabel}>stock faible</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{toBuyTotal}</Text>
          <Text style={styles.statLabel}>à acheter</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} activeOpacity={0.8} onPress={handleShareList}>
          <Ionicons name="share-social-outline" size={17} color={COLORS.white} />
          <Text style={[styles.actionText, { color: COLORS.white }]}>Partager</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleExportCSV}>
          <Ionicons name="server-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Export stock</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Tout va bien !"
          subtitle="Aucun produit sous son seuil d'alerte. La liste se remplit automatiquement."
        />
      ) : (
        <>
          <Text style={styles.hint}>
            Touchez un article une fois acheté pour le cocher, puis partagez la liste.
          </Text>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => renderRow(item)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  statsRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, gap: 7 },
  stat: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 10, alignItems: 'center',
  },
  statNum: { fontSize: SIZES.xxl, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 },

  actionRow: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 10, gap: 9 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd, paddingVertical: 12,
  },
  actionText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '700' },

  hint: {
    color: COLORS.textMuted, fontSize: SIZES.sm,
    paddingHorizontal: 14, marginTop: 12,
  },
  list: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 13, marginBottom: 8,
  },
  rowDone: { opacity: 0.5, borderColor: COLORS.success },
  rowCritical: { borderColor: COLORS.danger },
  checkbox: {
    width: 26, height: 26, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 11,
  },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  rowInfo: { flex: 1, marginRight: 10 },
  rowName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600', lineHeight: 19 },
  rowNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  rowMeta: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 },
  buyBox: { alignItems: 'center', minWidth: 56 },
  buyNum: { color: COLORS.primary, fontSize: SIZES.xxl, fontWeight: '900' },
  buyLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600' },
});
