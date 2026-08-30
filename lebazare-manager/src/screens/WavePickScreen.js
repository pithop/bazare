import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../theme';
import { getWavePickList } from '../../database';

export default function WavePickScreen() {
  const [items, setItems] = useState([]);

  const loadData = async () => {
    const data = await getWavePickList();
    setItems(data);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const produits = items.filter(i => i.category === 'Produits');
  const emballages = items.filter(i => i.category === 'Emballages');
  const hasShortage = items.some(i => i.stock < i.total_needed);

  const renderSection = (title, emoji, data) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{emoji} {title}</Text>
        {data.map(item => {
          const shortage = item.stock < item.total_needed;
          return (
            <View key={item.id} style={[styles.row, shortage && styles.rowDanger]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.rowStock}>
                  En stock : <Text style={{ color: shortage ? COLORS.danger : COLORS.success, fontWeight: '700' }}>{item.stock}</Text>
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowNeeded, shortage && { color: COLORS.danger }]}>
                  {item.total_needed}
                </Text>
                <Text style={styles.rowNeededLabel}>à prendre</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🧺 Résumé de Ramassage</Text>
        <Text style={styles.infoDesc}>
          Prenez tout ce qui est listé ci-dessous en un seul passage dans le garage, puis revenez à la table d'emballage.
        </Text>
        {hasShortage && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠ Stock insuffisant pour certains articles</Text>
          </View>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>Rien à ramasser</Text>
          <Text style={styles.emptySubtitle}>Ajoutez des commandes pour générer la liste</Text>
        </View>
      ) : (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <View>
              {renderSection('CRÉATIONS À PRENDRE', '👜', produits)}
              {renderSection('EMBALLAGES À PRENDRE', '📦', emballages)}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  infoCard: {
    margin: 12, backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  infoTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800', marginBottom: 6 },
  infoDesc: { color: COLORS.textSecondary, fontSize: SIZES.md, lineHeight: 20 },
  warningBadge: {
    marginTop: 10, backgroundColor: 'rgba(231,76,60,0.15)',
    padding: 10, borderRadius: SIZES.radiusSm,
  },
  warningText: { color: COLORS.danger, fontWeight: '700', fontSize: SIZES.sm },

  list: { paddingHorizontal: 12, paddingBottom: 100 },

  section: { marginBottom: 20 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: SIZES.sm, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 10, marginTop: 4,
  },
  row: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 8, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  rowDanger: { borderColor: COLORS.danger },
  rowLeft: { flex: 1, marginRight: 12 },
  rowName: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '600' },
  rowStock: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 4 },
  rowRight: { alignItems: 'center', minWidth: 60 },
  rowNeeded: { color: COLORS.primary, fontSize: 26, fontWeight: '900' },
  rowNeededLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 6, textAlign: 'center' },
});
