import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import StatCard from './ui/StatCard';
import { COLORS, SIZES } from '../theme';

// Aperçu avant import CSV : rien n'est écrit dans la base tant que l'utilisateur ne confirme pas
export default function ImportPreviewSheet({ visible, onClose, plan, importing, onConfirm }) {
  if (!plan) return null;
  const { orders: planOrders, duplicates, unmatched, totalArticles } = plan;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Aperçu de l'import"
      subtitle="Vérifiez avant d'enregistrer — rien n'est encore créé"
      maxHeight="92%"
    >
      <View style={styles.stats}>
        <StatCard
          icon="receipt-outline" label="Commandes"
          value={planOrders.length} color={COLORS.primary} soft={COLORS.primarySoft}
        />
        <StatCard
          icon="layers-outline" label="Articles"
          value={totalArticles} color={COLORS.info} soft={COLORS.infoSoft}
        />
        <StatCard
          icon="alert-circle-outline" label="Non reconnus"
          value={unmatched.length} color={unmatched.length > 0 ? COLORS.warning : COLORS.textMuted}
          soft={COLORS.warningSoft}
        />
      </View>

      {duplicates.length > 0 && (
        <View style={[styles.notice, styles.noticeWarning]}>
          <Ionicons name="copy-outline" size={16} color={COLORS.warning} />
          <Text style={styles.noticeText}>
            {duplicates.length} commande(s) déjà existante(s) seront ignorées :{' '}
            {duplicates.slice(0, 5).map((d) => `#${d}`).join(', ')}
            {duplicates.length > 5 ? '…' : ''}
          </Text>
        </View>
      )}

      {unmatched.length > 0 && (
        <View style={[styles.notice, styles.noticeInfo]}>
          <Ionicons name="help-circle-outline" size={16} color={COLORS.info} />
          <Text style={styles.noticeText}>
            {unmatched.length} article(s) du CSV ne correspondent à aucun produit de votre stock :
            {' '}
            {unmatched.slice(0, 3).map((u) => `« ${u} »`).join(', ')}
            {unmatched.length > 3 ? '…' : ''}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>DÉTAIL DES COMMANDES À CRÉER</Text>
      <View>
        {planOrders.map((o, idx) => (
          <View key={idx} style={styles.orderRow}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderId}>{o.etsyId ? `#${o.etsyId}` : 'Sans n°'}</Text>
              <Text style={styles.orderCustomer} numberOfLines={1}>
                <Ionicons name="person-outline" size={10} color={COLORS.textMuted} /> {o.customer}
              </Text>
            </View>
            <Text style={styles.orderCount}>{o.items.length} art.</Text>
          </View>
        ))}
        {planOrders.length === 0 && (
          <Text style={styles.nothing}>
            Aucune nouvelle commande à créer (doublons ou aucun article reconnu).
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button title="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button
          title={`Importer ${planOrders.length} commande(s)`}
          icon="download"
          onPress={onConfirm}
          loading={importing}
          disabled={planOrders.length === 0 || importing}
          style={{ flex: 2 }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: SIZES.radiusMd, padding: 12, marginBottom: 8,
  },
  noticeWarning: { backgroundColor: COLORS.warningSoft },
  noticeInfo: { backgroundColor: COLORS.infoSoft },
  noticeText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.sm, lineHeight: 18 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: SIZES.xs,
    fontWeight: '800', letterSpacing: 1.2, marginVertical: 10,
  },
  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  orderLeft: { flex: 1, marginRight: 8 },
  orderId: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  orderCustomer: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 2 },
  orderCount: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '800' },
  nothing: { color: COLORS.textMuted, fontSize: SIZES.md, textAlign: 'center', paddingVertical: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
});
