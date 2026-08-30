import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../theme';

export default function OrderCard({ order, checkedItems, onToggleCheck, onFulfill }) {
  const orderChecks = checkedItems[order.id] || {};
  const allChecked = order.items.length > 0 && order.items.every(item => orderChecks[item.product_id]);
  const checkedCount = order.items.filter(item => orderChecks[item.product_id]).length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.etsyId}>{order.etsy_id || `#${order.id}`}</Text>
          <Text style={styles.customer}>👤 {order.customer_name}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{checkedCount}/{order.items.length}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Checklist */}
      <Text style={styles.sectionTitle}>CHECKLIST</Text>
      {order.items.map(item => {
        const isChecked = orderChecks[item.product_id];
        const hasStock = item.stock >= item.quantity;
        return (
          <TouchableOpacity
            key={`${order.id}-${item.product_id}`}
            style={styles.checkRow}
            onPress={() => onToggleCheck(order.id, item.product_id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxDone]}>
              {isChecked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkInfo}>
              <Text style={[styles.checkName, isChecked && styles.checkNameDone]} numberOfLines={1}>
                {item.quantity}× {item.name}
              </Text>
              {!hasStock && !isChecked && (
                <Text style={styles.noStock}>⚠ Stock insuffisant ({item.stock} dispo)</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Fulfill Button */}
      <TouchableOpacity
        style={[styles.fulfillBtn, allChecked && styles.fulfillBtnReady]}
        onPress={() => onFulfill(order)}
        activeOpacity={0.8}
      >
        <Text style={styles.fulfillBtnText}>
          {allChecked ? '✅ VALIDER & EXPÉDIER' : '📦 Cochez tout pour valider'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etsyId: {
    color: COLORS.primary,
    fontSize: SIZES.xl,
    fontWeight: '800',
  },
  customer: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: 'rgba(211,84,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  progressText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: SIZES.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  checkInfo: {
    flex: 1,
  },
  checkName: {
    color: COLORS.text,
    fontSize: SIZES.lg,
    fontWeight: '500',
  },
  checkNameDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  noStock: {
    color: COLORS.danger,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  fulfillBtn: {
    backgroundColor: COLORS.cardLight,
    borderRadius: SIZES.radiusSm,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fulfillBtnReady: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  fulfillBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: SIZES.lg,
  },
});
