import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import { COLORS, SIZES } from '../theme';
import {
  getGlobalStats, exportBackup, restoreBackup, getStockHistory, setSetting, getDefaultMinStock,
} from '../../database';

export default function SettingsScreen() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [defaultMin, setDefaultMin] = useState('5');
  const [restoring, setRestoring] = useState(false);

  const loadData = useCallback(async () => {
    setStats(await getGlobalStats());
    setHistory(await getStockHistory(12));
    setDefaultMin(String(await getDefaultMinStock()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ── Sauvegarde complète (produits + commandes + historique + réglages) ──
  const handleBackup = async () => {
    try {
      const data = await exportBackup();
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const path = FileSystem.documentDirectory + `sauvegarde_lebazare_${stamp}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Sauvegarder vers…',
        });
      } else {
        Alert.alert('Sauvegarde créée', `Fichier : ${path}`);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  // ── Restauration depuis un fichier JSON ──
  const handleRestore = () => {
    Alert.alert(
      'Restaurer une sauvegarde',
      'Toutes les données actuelles seront REMPLACÉES par le contenu du fichier de sauvegarde.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', style: 'destructive', onPress: pickAndRestore },
      ]
    );
  };

  const pickAndRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setRestoring(true);
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content);
      const counts = await restoreBackup(data);
      await loadData();
      Alert.alert(
        '✅ Restauration terminée',
        `${counts.products} produit(s) et ${counts.orders} commande(s) ont été restaurés.`
      );
    } catch (e) {
      Alert.alert('Restauration impossible', e.message || 'Fichier illisible.');
    } finally {
      setRestoring(false);
    }
  };

  const saveDefaultMin = async (value) => {
    const n = parseInt(value);
    if (Number.isFinite(n) && n > 0) {
      await setSetting('default_min_stock', n);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Statistiques */}
      <Text style={styles.sectionTitle}>VUE D'ENSEMBLE</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="cube-outline" label="Références" value={stats?.productCount ?? '—'} color={COLORS.text} />
        <StatCard icon="layers-outline" label="Unités" value={stats?.totalUnits ?? '—'} color={COLORS.info} soft={COLORS.infoSoft} />
        <StatCard icon="time-outline" label="En attente" value={stats?.pendingOrders ?? '—'} color={COLORS.primary} soft={COLORS.primarySoft} />
        <StatCard icon="paper-plane-outline" label="Expédiées" value={stats?.shippedOrders ?? '—'} color={COLORS.success} soft={COLORS.successSoft} />
      </View>

      {/* Réglages */}
      <Text style={styles.sectionTitle}>RÉGLAGES</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.settingLabel}>Seuil d'alerte par défaut</Text>
            <Text style={styles.settingDesc}>
              Proposé pour chaque nouveau produit (modifiable fiche par fiche).
            </Text>
          </View>
          <View style={styles.minInputWrap}>
            <Text style={styles.minInput}>{defaultMin}</Text>
            <View style={styles.minButtons}>
              <TouchableOpacity
                style={styles.minBtn}
                onPress={() => {
                  const n = Math.max(1, parseInt(defaultMin) - 1);
                  setDefaultMin(String(n));
                  saveDefaultMin(n);
                }}
              >
                <Ionicons name="remove" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.minBtn}
                onPress={() => {
                  const n = Math.min(99, parseInt(defaultMin) + 1);
                  setDefaultMin(String(n));
                  saveDefaultMin(n);
                }}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Sauvegarde */}
      <Text style={styles.sectionTitle}>SAUVEGARDE & RESTAURATION</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Exportez régulièrement un fichier de sauvegarde : il contient l'inventaire complet,
          les commandes (en attente et expédiées) et l'historique de stock. En cas de perte du
          téléphone ou de réinstallation, tout peut être restauré depuis ce fichier.
        </Text>
        <View style={styles.buttonsRow}>
          <Button title="Exporter la sauvegarde" icon="save-outline" onPress={handleBackup} style={{ flex: 1 }} />
        </View>
        <View style={styles.buttonsRow}>
          <Button
            title="Restaurer un fichier"
            icon="reload-outline"
            variant="secondary"
            onPress={handleRestore}
            loading={restoring}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* Derniers mouvements */}
      <Text style={styles.sectionTitle}>DERNIERS MOUVEMENTS DE STOCK</Text>
      <View style={styles.card}>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>Aucun mouvement enregistré pour le moment.</Text>
        ) : (
          history.map((h) => {
            const positive = h.delta > 0;
            return (
              <View key={h.id} style={styles.historyRow}>
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: positive ? COLORS.successSoft : COLORS.dangerSoft },
                  ]}
                >
                  <Ionicons
                    name={positive ? 'arrow-up' : 'arrow-down'}
                    size={13}
                    color={positive ? COLORS.success : COLORS.danger}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.historyName} numberOfLines={1}>
                    {h.product_name || 'Produit'}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {h.reason || 'ajustement'} · {h.date}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyDelta,
                    { color: positive ? COLORS.success : COLORS.danger },
                  ]}
                >
                  {positive ? '+' : ''}
                  {h.delta} → {h.new_stock}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.version}>LeBazare Manager · v2.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 50 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: SIZES.xs,
    fontWeight: '800', letterSpacing: 1.4,
    marginTop: 18, marginBottom: 10,
  },
  statsGrid: { flexDirection: 'row', gap: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14,
  },
  cardText: { color: COLORS.textSecondary, fontSize: SIZES.sm, lineHeight: 20, marginBottom: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  settingDesc: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 3, lineHeight: 18 },
  minInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  minInput: {
    color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800',
    minWidth: 28, textAlign: 'center',
  },
  minButtons: { flexDirection: 'row', gap: 5 },
  minBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonsRow: { flexDirection: 'row', marginTop: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  historyIcon: {
    width: 26, height: 26, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  historyName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600' },
  historyMeta: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 1 },
  historyDelta: { fontSize: SIZES.sm, fontWeight: '800' },
  emptyHistory: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', paddingVertical: 12 },
  version: {
    color: COLORS.textFaint, fontSize: SIZES.xs,
    textAlign: 'center', marginTop: 24,
  },
});
