import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../theme';

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// Carte commande en attente : checklist, progression, actions valider/éditer/supprimer
export default function OrderCard({ order, checkedItems, onToggleCheck, onFulfill, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const checks = checkedItems[order.id] || {};
  const totalCount = order.items.length;
  const checkedCount = order.items.filter((i) => checks[i.product_id]).length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  return (
    <View style={styles.card}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.etsyId}>{order.etsy_id ? `#${order.etsy_id}` : `Commande ${order.id}`}</Text>
          <Text style={styles.customer}>
            <Ionicons name="person-outline" size={11} color={COLORS.textMuted} /> {order.customer_name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {order.date ? <Text style={styles.date}>{formatDate(order.date)}</Text> : null}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.miniAction} onPress={onEdit}>
              <Ionicons name="create-outline" size={16} color={COLORS.info} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniAction} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }, allChecked && { backgroundColor: COLORS.success }]} />
        </View>
        <Text style={[styles.progressText, allChecked && { color: COLORS.success }]}>
          {checkedCount}/{totalCount}
        </Text>
      </View>

      {/* Checklist */}
      <TouchableOpacity style={styles.checklistToggle} activeOpacity={0.8} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.checklistLabel}>CHECKLIST</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textMuted} />
      </TouchableOpacity>

      {expanded &&
        order.items.map((item, idx) => {
          const isChecked = !!checks[item.product_id];
          const hasStock = item.stock >= item.quantity;
          return (
            <TouchableOpacity
              key={`${order.id}-${item.product_id}-${idx}`}
              style={styles.checkRow}
              activeOpacity={0.7}
              onPress={() => onToggleCheck(order.id, item.product_id)}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxDone]}>
                {isChecked ? <Ionicons name="check" size={15} color={COLORS.white} /> : null}
              </View>
              <View style={styles.checkInfo}>
                <Text style={[styles.checkName, isChecked && styles.checkNameDone]} numberOfLines={1}>
                  {item.quantity}× {item.name}
                </Text>
                {!hasStock && !isChecked ? (
                  <Text style={styles.noStock}>⚠ Stock insuffisant ({item.stock} dispo)</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

      {/* Valider */}
      <TouchableOpacity
        style={[styles.fulfillBtn, allChecked && styles.fulfillBtnReady]}
        activeOpacity={0.8}
        disabled={!allChecked}
        onPress={() => onFulfill(order)}
      >
        <Ionicons
          name={allChecked ? 'checkmark-circle' : 'ellipse-outline'}
          size={19}
          color={allChecked ? COLORS.white : COLORS.textMuted}
        />
        <Text style={[styles.fulfillText, allChecked && styles.fulfillTextReady]}>
          {allChecked ? 'VALIDER & EXPÉDIER' : 'Cochez tout pour valider'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, marginRight: 8 },
  etsyId: { color: COLORS.primary, fontSize: SIZES.xl, fontWeight: '800' },
  customer: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  date: { color: COLORS.textMuted, fontSize: SIZES.sm, marginBottom: 4 },
  actionsRow: { flexDirection: 'row', gap: 6 },
  miniAction: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  progressTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: COLORS.surfaceHover, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  progressText: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '800', minWidth: 34, textAlign: 'right' },
  checklistToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, marginBottom: 4,
  },
  checklistLabel: {
    color: COLORS.textMuted, fontSize: SIZES.xs,
    fontWeight: '800', letterSpacing: 1.5,
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 2, borderColor: COLORS.borderLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 11,
  },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkInfo: { flex: 1 },
  checkName: { color: COLORS.text, fontSize: SIZES.lg - 1, fontWeight: '500' },
  checkNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  noStock: { color: COLORS.warning, fontSize: SIZES.sm, marginTop: 2, fontWeight: '600' },
  fulfillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusMd, paddingVertical: 13,
    marginTop: 13,
  },
  fulfillBtnReady: { backgroundColor: COLORS.success },
  fulfillText: { color: COLORS.textMuted, fontWeight: '800', fontSize: SIZES.md, letterSpacing: 0.4 },
  fulfillTextReady: { color: COLORS.white },
});
