import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/ui/EmptyState';
import { COLORS, SIZES, categoryMeta } from '../theme';
import { getWavePickList } from '../../database';

const storeKey = (id) => `wave_${id}`;

export default function WavePickScreen() {
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});

  const loadData = async () => {
    const data = await getWavePickList();
    setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const toggle = (id) => setChecked((prev) => ({ ...prev, [storeKey(id)]: !prev[storeKey(id)] }));

  const produits = items.filter((i) => i.category === 'Produits');
  const emballages = items.filter((i) => i.category === 'Emballages');
  const hasShortage = items.some((i) => i.stock < i.total_needed);
  const doneCount = items.filter((i) => checked[storeKey(i.id)]).length;
  const progress = items.length > 0 ? doneCount / items.length : 0;

  const confirmClear = () => {
    Alert.alert('Tout décocher', 'Effacer les cases cochées du ramassage en cours ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => setChecked({}) },
    ]);
  };

  const renderRow = (item) => {
    const isDone = !!checked[storeKey(item.id)];
    const shortage = item.stock < item.total_needed;
    const meta = categoryMeta(item.category);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.row, isDone && styles.rowDone, shortage && !isDone && styles.rowDanger]}
        activeOpacity={0.75}
        onPress={() => toggle(item.id)}
      >
        <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
          {isDone ? <Ionicons name="check" size={16} color={COLORS.white} /> : null}
        </View>
        <View style={styles.rowLeft}>
          <Text style={[styles.rowName, isDone && styles.rowNameDone]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta}>
            {meta.emoji} {meta.label} · en stock :{' '}
            <Text style={{ color: shortage ? COLORS.danger : COLORS.success, fontWeight: '700' }}>
              {item.stock}
            </Text>
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowNeeded, isDone && { color: COLORS.textFaint }]}>
            {item.total_needed}
          </Text>
          <Text style={styles.rowNeededLabel}>à prendre</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const Section = ({ title, data }) =>
    data.length > 0 ? (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map(renderRow)}
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {/* Bandeau progression */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Ramassage en cours</Text>
            <Text style={styles.headerDesc}>
              Un seul passage dans le garage — cochez au fur et à mesure.
            </Text>
          </View>
          {doneCount > 0 ? (
            <TouchableOpacity style={styles.clearBtn} activeOpacity={0.7} onPress={confirmClear}>
              <Ionicons name="refresh-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.clearText}>Reset</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                progress === 1 && items.length > 0 && { backgroundColor: COLORS.success },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {doneCount}/{items.length}
          </Text>
        </View>
        {hasShortage ? (
          <View style={styles.warning}>
            <Ionicons name="warning" size={13} color={COLORS.warning} />
            <Text style={styles.warningText}>Stock insuffisant pour certains articles</Text>
          </View>
        ) : null}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="basket-outline"
          title="Rien à ramasser"
          subtitle="Les articles des commandes en attente apparaîtront ici, regroupés par produit."
        />
      ) : (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <View style={styles.list}>
              <Section title="👜 CRÉATIONS À PRENDRE" data={produits} />
              <Section title="📦 EMBALLAGES À PRENDRE" data={emballages} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerCard: {
    margin: 14, marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 15,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  headerDesc: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 3, lineHeight: 18, marginRight: 8 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6,
  },
  clearText: { color: COLORS.textMuted, fontSize: SIZES.sm, fontWeight: '700' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  progressTrack: {
    flex: 1, height: 7, borderRadius: 4,
    backgroundColor: COLORS.surfaceHover, overflow: 'hidden',
  },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  progressText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 11, backgroundColor: COLORS.warningSoft,
    borderRadius: SIZES.radiusSm, padding: 9,
  },
  warningText: { color: COLORS.warning, fontSize: SIZES.sm, fontWeight: '700', flex: 1 },

  list: { paddingHorizontal: 14, paddingTop: 12 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '800',
    letterSpacing: 1.4, marginBottom: 9, marginTop: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 13, marginBottom: 8,
  },
  rowDone: { opacity: 0.5, borderColor: COLORS.success },
  rowDanger: { borderColor: COLORS.danger },
  checkbox: {
    width: 27, height: 27, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  rowLeft: { flex: 1, marginRight: 10 },
  rowName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600', lineHeight: 19 },
  rowNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  rowMeta: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 },
  rowRight: { alignItems: 'center', minWidth: 58 },
  rowNeeded: { color: COLORS.primary, fontSize: SIZES.title - 2, fontWeight: '900' },
  rowNeededLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', marginTop: 1 },
});
