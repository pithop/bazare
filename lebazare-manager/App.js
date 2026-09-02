import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB, getPendingOrderCount, getLowStockProducts } from './database';
import OrdersScreen from './src/screens/OrdersScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import WavePickScreen from './src/screens/WavePickScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';

const Tab = createBottomTabNavigator();

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

function TabIcon({ emoji, label, focused, badgeCount }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
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
  }, [ready]);

  if (errorMsg) {
    return (
      <View style={styles.splash}>
        <Text style={[styles.splashTitle, { fontSize: 24, color: COLORS.danger }]}>Erreur ⚠️</Text>
        <Text style={{ color: 'white', textAlign: 'center', margin: 20 }}>{errorMsg}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>LeBazare</Text>
        <Text style={styles.splashSub}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: COLORS.primary,
            background: COLORS.bg,
            card: COLORS.card,
            text: COLORS.text,
            border: COLORS.border,
            notification: COLORS.danger,
          },
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
            headerTitleStyle: { color: COLORS.primary, fontWeight: '800', fontSize: 20 },
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              height: 70,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarShowLabel: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
          }}
          screenListeners={{
            state: () => { refreshCounts(); },
          }}
        >
          <Tab.Screen
            name="Commandes"
            component={OrdersScreen}
            options={{
              headerTitle: '📋 Commandes',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📋" label="Commandes" focused={focused} badgeCount={orderCount} />
              ),
            }}
          />
          <Tab.Screen
            name="Stock"
            component={InventoryScreen}
            options={{
              headerTitle: '📦 Inventaire',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📦" label="Stock" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Ramassage"
            component={WavePickScreen}
            options={{
              headerTitle: '🧺 Ramassage',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🧺" label="Ramassage" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Courses"
            component={ShoppingScreen}
            options={{
              headerTitle: '🛒 Courses',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🛒" label="Courses" focused={focused} badgeCount={lowStockCount} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { color: COLORS.primary, fontSize: 36, fontWeight: '900' },
  splashSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabEmoji: { fontSize: 22 },
  tabLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabLabelActive: { color: COLORS.primary },
  badge: {
    position: 'absolute', top: -6, right: -14, backgroundColor: COLORS.danger,
    borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});
