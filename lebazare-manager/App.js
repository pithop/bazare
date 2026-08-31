import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { initDB, getPendingOrderCount, getLowStockProducts } from './database';
import OrdersScreen from './src/screens/OrdersScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import WavePickScreen from './src/screens/WavePickScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';

const COLORS = {
  bg: '#0F0F1A',
  card: '#1A1A2E',
  primary: '#D35400',
  text: '#FFFFFF',
  textMuted: '#5C5C70',
  danger: '#E74C3C',
  warning: '#F39C12',
  border: '#2A2A40',
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('Commandes');
  const [orderCount, setOrderCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        setReady(true);
      } catch (e) {
        console.error("Initialization error:", e);
        setErrorMsg(e.message || JSON.stringify(e));
      }
    };
    init();
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const oc = await getPendingOrderCount();
      const ls = await getLowStockProducts(5);
      setOrderCount(oc);
      setLowStockCount(ls.length);
    } catch (e) {
      console.error("Refresh error:", e);
    }
  }, []);

  useEffect(() => {
    if (ready) refreshCounts();
  }, [ready, activeTab]);

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.splash}>
        <Text style={{ fontSize: 24, color: COLORS.danger, fontWeight: 'bold' }}>Erreur ⚠️</Text>
        <Text style={{ color: 'white', textAlign: 'center', margin: 20 }}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.splash}>
        <Text style={styles.splashTitle}>LeBazare</Text>
        <Text style={styles.splashSub}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Commandes': return <OrdersScreen />;
      case 'Stock': return <InventoryScreen />;
      case 'Ramassage': return <WavePickScreen />;
      case 'Courses': return <ShoppingScreen />;
      default: return <OrdersScreen />;
    }
  };

  const TabButton = ({ name, emoji, label, badge }) => {
    const isActive = activeTab === name;
    return (
      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => setActiveTab(name)}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <Text style={styles.tabEmoji}>{emoji}</Text>
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.card} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'Commandes' ? '📋 Commandes' :
           activeTab === 'Stock' ? '📦 Inventaire' :
           activeTab === 'Ramassage' ? '🧺 Ramassage' : '🛒 Courses'}
        </Text>
      </View>

      <View style={styles.content}>
        {renderScreen()}
      </View>

      <View style={styles.tabBar}>
        <TabButton name="Commandes" emoji="📋" label="Commandes" badge={orderCount} />
        <TabButton name="Stock" emoji="📦" label="Stock" badge={0} />
        <TabButton name="Ramassage" emoji="🧺" label="Ramassage" badge={0} />
        <TabButton name="Courses" emoji="🛒" label="Courses" badge={lowStockCount} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  splash: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { color: COLORS.primary, fontSize: 36, fontWeight: '900' },
  splashSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  
  header: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '800' },
  
  content: { flex: 1 },
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconContainer: { position: 'relative', alignItems: 'center' },
  tabEmoji: { fontSize: 22 },
  tabLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 4 },
  tabLabelActive: { color: COLORS.primary },
  
  badge: {
    position: 'absolute', top: -6, right: -12, backgroundColor: COLORS.danger,
    borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: COLORS.card
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});
