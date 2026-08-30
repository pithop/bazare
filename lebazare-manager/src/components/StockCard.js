import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../theme';

export default function StockCard({ item, onIncrement, onDecrement }) {
  const getStockStatus = () => {
    if (item.stock === 0) return { label: 'RUPTURE', color: COLORS.danger, bg: 'rgba(231,76,60,0.15)' };
    if (item.stock <= 5) return { label: 'FAIBLE', color: COLORS.warning, bg: 'rgba(243,156,18,0.15)' };
    return { label: 'OK', color: COLORS.success, bg: 'rgba(39,174,96,0.15)' };
  };

  const status = getStockStatus();

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnMinus]} 
          onPress={onDecrement}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.stockNum, item.stock === 0 && { color: COLORS.danger }]}>
          {item.stock}
        </Text>
        <TouchableOpacity 
          style={[styles.btn, styles.btnPlus]} 
          onPress={onIncrement}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: COLORS.text,
    fontSize: SIZES.lg,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: SIZES.iconButton,
    height: SIZES.iconButton,
    borderRadius: SIZES.iconButton / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMinus: {
    backgroundColor: 'rgba(189,195,199,0.2)',
  },
  btnPlus: {
    backgroundColor: COLORS.success,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -1,
  },
  stockNum: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },
});
