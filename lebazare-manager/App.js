import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDB, getPendingOrderCount, getShoppingList } from './database';
import OrdersScreen from './src/screens/OrdersScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import WavePickScreen from './src/screens/WavePickScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS, SIZES } from './src/theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Commandes: { focused: 'receipt', unfocused: 'receipt-outline' },
  Stock: { focused: 'cube', unfocused: 'cube-outline' },
  Ramassage: { focused: 'basket', unfocused: 'basket-outline' },
  Courses: { focused: 'cart', unfocused: 'cart-outline' },
  Plus: { focused: 'settings', unfocused: 'settings-outline' },
};

function TabIcon({ routeName, focused, badgeCount }) {
  const icons = ICONS[routeName] || { focused: 'ellipse', unfocused: 'ellipse-outline' };
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? icons.focused : icons.unfocused}
        size={22}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
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
        console.error('Initialization error:', e);
        setErrorMsg(e.message || JSON.stringify(e));
      }
    };
    init();
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const [oc, shopping] = await Promise.all([getPendingOrderCount(), getShoppingList()]);
      setOrderCount(oc);
      setLowStockCount(shopping.length);
    } catch (e) {
      console.error('Refresh error:', e);
    }
  }, []);

  useEffect(() => {
    if (ready) refreshCounts();
  }, [ready, refreshCounts]);

  if (errorMsg) {
    return (
      <View style={styles.splash}>
        <Text style={[styles.splashTitle, { fontSize: 24, color: COLORS.danger }]}>Erreur ⚠️</Text>
        <Text style={styles.splashError}>{errorMsg}</Text>
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
            card: COLORS.surface,
            text: COLORS.text,
            border: COLORS.border,
            notification: COLORS.danger,
          },
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.bg,
              elevation: 0, shadowOpacity: 0,
              borderBottomWidth: 1, borderBottomColor: COLORS.border,
            },
            headerTitleStyle: { color: COLORS.text, fontWeight: '800', fontSize: SIZES.xl },
            headerTintColor: COLORS.primary,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopWidth: 1, borderTopColor: COLORS.border,
              height: SIZES.tabBarHeight,
              paddingBottom: 8, paddingTop: 6,
            },
            tabBarShowLabel: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
          }}
          screenListeners={{
            state: () => {
              refreshCounts();
            },
          }}
        >
          <Tab.Screen
            name="Commandes"
            component={OrdersScreen}
            options={{
              headerTitle: 'Commandes',
              tabBarIcon: ({ focused }) => (
                <TabIcon routeName="Commandes" focused={focused} badgeCount={orderCount} />
              ),
            }}
          />
          <Tab.Screen
            name="Stock"
            component={InventoryScreen}
            options={{
              headerTitle: 'Inventaire',
              tabBarIcon: ({ focused }) => (
                <TabIcon routeName="Stock" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Ramassage"
            component={WavePickScreen}
            options={{
              headerTitle: 'Ramassage',
              tabBarIcon: ({ focused }) => (
                <TabIcon routeName="Ramassage" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Courses"
            component={ShoppingScreen}
            options={{
              headerTitle: 'Liste de courses',
              tabBarIcon: ({ focused }) => (
                <TabIcon routeName="Courses" focused={focused} badgeCount={lowStockCount} />
              ),
            }}
          />
          <Tab.Screen
            name="Plus"
            component={SettingsScreen}
            options={{
              headerTitle: 'Réglages & données',
              tabBarIcon: ({ focused }) => (
                <TabIcon routeName="Plus" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  splashTitle: { color: COLORS.primary, fontSize: SIZES.big, fontWeight: '900' },
  splashSub: { color: COLORS.textMuted, fontSize: SIZES.md, marginTop: 8 },
  splashError: { color: COLORS.text, textAlign: 'center', margin: 20, lineHeight: 20 },
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -5, right: -10,
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
});
