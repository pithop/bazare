import * as SQLite from 'expo-sqlite';
import etsyProducts from './etsy_products.json';

let dbPromise = null;

// Exécute une migration sans échouer si la colonne/table existe déjà
const safeExec = async (db, sql) => {
  try {
    await db.execAsync(sql);
  } catch (e) {
    // "duplicate column name" ou "already exists" → migration déjà appliquée
  }
};

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('lebazare.db');
      await database.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          stock INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          etsy_id TEXT,
          customer_name TEXT,
          status TEXT DEFAULT 'PENDING',
          date TEXT,
          shipped_date TEXT
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          product_id INTEGER,
          quantity INTEGER,
          product_name TEXT,
          FOREIGN KEY(order_id) REFERENCES orders(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        );
      `);

      // Migrations incrémentales (données existantes conservées)
      await safeExec(database, `ALTER TABLE products ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 5;`);
      await safeExec(database, `ALTER TABLE orders ADD COLUMN shipped_date TEXT;`);
      await safeExec(database, `ALTER TABLE order_items ADD COLUMN product_name TEXT;`);
      await safeExec(database, `
        CREATE TABLE IF NOT EXISTS stock_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER,
          product_name TEXT,
          delta INTEGER,
          new_stock INTEGER,
          reason TEXT,
          date TEXT
        );
      `);
      await safeExec(database, `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      // Initialisation du seuil par défaut
      const threshold = await database.getFirstAsync(
        `SELECT value FROM settings WHERE key = 'default_min_stock'`
      );
      if (!threshold) {
        await database.runAsync(
          `INSERT INTO settings (key, value) VALUES ('default_min_stock', '5')`
        );
      }

      // Données initiales (première installation uniquement)
      const countResult = await database.getAllAsync('SELECT COUNT(*) as count FROM products');
      if (countResult[0]?.count === 0) {
        for (const product of etsyProducts) {
          await database.runAsync(
            `INSERT INTO products (name, category, stock, min_stock) VALUES (?, ?, ?, ?)`,
            [product.name, product.category, product.stock, 5]
          );
        }
      }
      return database;
    })();
  }
  return dbPromise;
};

// ──────────────────────────────────
// SETTINGS
// ──────────────────────────────────

export const getSetting = async (key, fallback = null) => {
  const db = await initDB();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : fallback;
};

export const setSetting = async (key, value) => {
  const db = await initDB();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value)]
  );
};

export const getDefaultMinStock = async () => {
  const v = await getSetting('default_min_stock', '5');
  const n = parseInt(v);
  return Number.isFinite(n) && n > 0 ? n : 5;
};

// ──────────────────────────────────
// PRODUITS — CRUD complet
// ──────────────────────────────────

export const getProducts = async () => {
  const db = await initDB();
  return await db.getAllAsync(
    'SELECT * FROM products ORDER BY category ASC, name ASC'
  );
};

export const getProduct = async (id) => {
  const db = await initDB();
  return await db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
};

export const addProduct = async ({ name, category, stock = 0, min_stock = 5 }) => {
  const db = await initDB();
  const result = await db.runAsync(
    'INSERT INTO products (name, category, stock, min_stock) VALUES (?, ?, ?, ?)',
    [name.trim(), category, Math.max(0, parseInt(stock) || 0), Math.max(1, parseInt(min_stock) || 1)]
  );
  await logStock(db, result.lastInsertRowId, name.trim(), stock, stock, 'création');
  return result.lastInsertRowId;
};

export const updateProduct = async (id, { name, category, min_stock }) => {
  const db = await initDB();
  await db.runAsync(
    'UPDATE products SET name = ?, category = ?, min_stock = ? WHERE id = ?',
    [name.trim(), category, Math.max(1, parseInt(min_stock) || 1), id]
  );
};

// Modifie le stock d'un coup (saisie directe) + historique
export const setStock = async (id, newStock, reason = 'ajustement') => {
  const db = await initDB();
  const product = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return;
  const value = Math.max(0, parseInt(newStock) || 0);
  await db.runAsync('UPDATE products SET stock = ? WHERE id = ?', [value, id]);
  await logStock(db, id, product.name, value - product.stock, value, reason);
};

// Incrément/décrément rapide + historique
export const adjustStock = async (id, delta, reason = 'ajustement') => {
  const db = await initDB();
  const product = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return;
  const value = Math.max(0, product.stock + delta);
  await db.runAsync('UPDATE products SET stock = ? WHERE id = ?', [value, id]);
  await logStock(db, id, product.name, delta, value, reason);
};

// Suppression bloquée si le produit est utilisé dans une commande en attente
export const deleteProduct = async (id) => {
  const db = await initDB();
  const usage = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.product_id = ? AND o.status = 'PENDING'`,
    [id]
  );
  if (usage?.count > 0) {
    throw new Error(
      `Ce produit est utilisé dans ${usage.count} article(s) de commandes en attente. Expédiez ou supprimez d'abord ces commandes.`
    );
  }
  await db.runAsync('DELETE FROM stock_history WHERE product_id = ?', [id]);
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const getStockHistory = async (limit = 50) => {
  const db = await initDB();
  return await db.getAllAsync(
    'SELECT * FROM stock_history ORDER BY id DESC LIMIT ?',
    [limit]
  );
};

const logStock = async (db, productId, productName, delta, newStock, reason) => {
  const now = new Date();
  const date = `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  await db.runAsync(
    'INSERT INTO stock_history (product_id, product_name, delta, new_stock, reason, date) VALUES (?, ?, ?, ?, ?, ?)',
    [productId, productName, delta, newStock, reason, date]
  );
};

// ──────────────────────────────────
// COMMANDES — CRUD complet + cycle de vie
// ──────────────────────────────────

const attachItems = async (db, orders) => {
  for (let order of orders) {
    order.items = await db.getAllAsync(
      `SELECT oi.id as item_id, oi.quantity, oi.product_name,
              p.id as product_id, p.name, p.stock, p.category
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY p.category ASC, p.name ASC`,
      [order.id]
    );
    // Produit supprimé : on garde le nom dénormalisé pour l'historique
    for (const item of order.items) {
      if (!item.name) {
        item.name = item.product_name || 'Produit supprimé';
        item.stock = 0;
        item.category = null;
      }
    }
  }
  return orders;
};

export const getOrders = async (status = 'PENDING') => {
  const db = await initDB();
  const orders = await db.getAllAsync(
    status === 'PENDING'
      ? "SELECT * FROM orders WHERE status = 'PENDING' ORDER BY id DESC"
      : "SELECT * FROM orders WHERE status != 'PENDING' ORDER BY shipped_date DESC, id DESC"
  );
  return await attachItems(db, orders);
};

export const getOrder = async (id) => {
  const db = await initDB();
  const orders = await db.getAllAsync('SELECT * FROM orders WHERE id = ?', [id]);
  const withItems = await attachItems(db, orders);
  return withItems[0] || null;
};

export const getPendingOrderCount = async () => {
  const db = await initDB();
  const result = await db.getFirstAsync("SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'");
  return result?.count || 0;
};

export const addOrder = async (etsyId, customerName, items) => {
  const db = await initDB();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.runAsync(
    `INSERT INTO orders (etsy_id, customer_name, status, date) VALUES (?, ?, 'PENDING', ?)`,
    [etsyId || '', customerName || 'Client', today]
  );
  const orderId = result.lastInsertRowId;
  await replaceOrderItems(db, orderId, items);
  return orderId;
};

export const updateOrder = async (orderId, etsyId, customerName, items) => {
  const db = await initDB();
  await db.runAsync(
    'UPDATE orders SET etsy_id = ?, customer_name = ? WHERE id = ?',
    [etsyId || '', customerName || 'Client', orderId]
  );
  await db.runAsync('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  await replaceOrderItems(db, orderId, items);
};

// items : [{ product_id, quantity, name }]
const replaceOrderItems = async (db, orderId, items) => {
  for (const item of items) {
    const product = await db.getFirstAsync('SELECT name FROM products WHERE id = ?', [item.product_id]);
    await db.runAsync(
      'INSERT INTO order_items (order_id, product_id, quantity, product_name) VALUES (?, ?, ?, ?)',
      [orderId, item.product_id, item.quantity, product ? product.name : (item.name || '')]
    );
  }
};

// Expédier : décrémente le stock (avec historique) et marque SHIPPED
export const fulfillOrder = async (orderId) => {
  const db = await initDB();
  const order = await getOrder(orderId);
  if (!order) return;
  for (const item of order.items) {
    if (!item.product_id) continue;
    await adjustStock(item.product_id, -item.quantity, `commande #${order.etsy_id || order.id}`);
  }
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync("UPDATE orders SET status = 'SHIPPED', shipped_date = ? WHERE id = ?", [today, orderId]);
};

// Annuler une expédition : restaure le stock et repasse en PENDING
export const unshipOrder = async (orderId) => {
  const db = await initDB();
  const order = await getOrder(orderId);
  if (!order) return;
  for (const item of order.items) {
    if (!item.product_id) continue;
    await adjustStock(item.product_id, item.quantity, `annulation commande #${order.etsy_id || order.id}`);
  }
  await db.runAsync("UPDATE orders SET status = 'PENDING', shipped_date = NULL WHERE id = ?", [orderId]);
};

export const deleteOrder = async (orderId) => {
  const db = await initDB();
  await db.runAsync('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  await db.runAsync('DELETE FROM orders WHERE id = ?', [orderId]);
};

// N° Etsy déjà connus (détection de doublons à l'import CSV)
export const getExistingEtsyIds = async () => {
  const db = await initDB();
  const rows = await db.getAllAsync("SELECT etsy_id FROM orders WHERE etsy_id IS NOT NULL AND etsy_id != ''");
  return new Set(rows.map((r) => r.etsy_id));
};

// ──────────────────────────────────
// RAMASSAGE (wave picking)
// ──────────────────────────────────

export const getWavePickList = async () => {
  const db = await initDB();
  return await db.getAllAsync(`
    SELECT p.id, p.name, p.category, p.stock, SUM(oi.quantity) as total_needed
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'PENDING'
    GROUP BY p.id
    ORDER BY p.category ASC, p.name ASC
  `);
};

// ──────────────────────────────────
// LISTE DE COURSES
// ──────────────────────────────────

// Produits sous leur seuil, avec la quantité à racheter
export const getShoppingList = async () => {
  const db = await initDB();
  return await db.getAllAsync(`
    SELECT id, name, category, stock, min_stock,
           MAX(0, min_stock - stock) AS to_buy
    FROM products
    WHERE stock < min_stock
    ORDER BY (stock = 0) DESC, to_buy DESC, category ASC, name ASC
  `);
};

export const setMinStock = async (id, minStock) => {
  const db = await initDB();
  await db.runAsync('UPDATE products SET min_stock = ? WHERE id = ?', [Math.max(1, parseInt(minStock) || 1), id]);
};

// ──────────────────────────────────
// STATISTIQUES
// ──────────────────────────────────

export const getGlobalStats = async () => {
  const db = await initDB();
  const products = await db.getFirstAsync(
    'SELECT COUNT(*) as refs, COALESCE(SUM(stock), 0) as units FROM products'
  );
  const pending = await db.getFirstAsync("SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'");
  const shipped = await db.getFirstAsync("SELECT COUNT(*) as count FROM orders WHERE status = 'SHIPPED'");
  return {
    productCount: products?.refs || 0,
    totalUnits: products?.units || 0,
    pendingOrders: pending?.count || 0,
    shippedOrders: shipped?.count || 0,
  };
};

// ──────────────────────────────────
// EXPORT CSV
// ──────────────────────────────────

export const exportInventoryCSV = async () => {
  const db = await initDB();
  const products = await db.getAllAsync('SELECT * FROM products ORDER BY category, name');
  let csv = 'Nom;Categorie;Stock;Seuil\n';
  for (const p of products) {
    csv += `"${p.name}";"${p.category}";${p.stock};${p.min_stock}\n`;
  }
  return csv;
};

// ──────────────────────────────────
// SAUVEGARDE / RESTAURATION COMPLÈTE
// ──────────────────────────────────

export const exportBackup = async () => {
  const db = await initDB();
  const products = await db.getAllAsync('SELECT * FROM products');
  const orders = await db.getAllAsync('SELECT * FROM orders');
  const orderItems = await db.getAllAsync('SELECT * FROM order_items');
  const history = await db.getAllAsync('SELECT * FROM stock_history');
  const settings = await db.getAllAsync('SELECT * FROM settings');
  return {
    app: 'lebazare-manager',
    backup_version: 2,
    exported_at: new Date().toISOString(),
    products,
    orders,
    order_items: orderItems,
    stock_history: history,
    settings,
  };
};

export const restoreBackup = async (data) => {
  if (!data || data.app !== 'lebazare-manager' || !Array.isArray(data.products) || !Array.isArray(data.orders)) {
    throw new Error('Fichier de sauvegarde invalide.');
  }
  const db = await initDB();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM order_items');
    await tx.runAsync('DELETE FROM orders');
    await tx.runAsync('DELETE FROM stock_history');
    await tx.runAsync('DELETE FROM products');
    await tx.runAsync("DELETE FROM sqlite_sequence WHERE name IN ('products','orders','order_items','stock_history')");

    for (const p of data.products) {
      await tx.runAsync(
        'INSERT INTO products (id, name, category, stock, min_stock) VALUES (?, ?, ?, ?, ?)',
        [p.id, p.name, p.category, p.stock || 0, p.min_stock || 5]
      );
    }
    for (const o of data.orders) {
      await tx.runAsync(
        'INSERT INTO orders (id, etsy_id, customer_name, status, date, shipped_date) VALUES (?, ?, ?, ?, ?, ?)',
        [o.id, o.etsy_id, o.customer_name, o.status || 'PENDING', o.date, o.shipped_date || null]
      );
    }
    for (const oi of (data.order_items || [])) {
      await tx.runAsync(
        'INSERT INTO order_items (id, order_id, product_id, quantity, product_name) VALUES (?, ?, ?, ?, ?)',
        [oi.id, oi.order_id, oi.product_id, oi.quantity, oi.product_name || null]
      );
    }
    for (const h of (data.stock_history || [])) {
      await tx.runAsync(
        'INSERT INTO stock_history (id, product_id, product_name, delta, new_stock, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [h.id, h.product_id, h.product_name, h.delta, h.new_stock, h.reason, h.date]
      );
    }
    for (const s of (data.settings || [])) {
      if (s?.key === 'default_min_stock' && s.value) {
        await tx.runAsync(
          "INSERT INTO settings (key, value) VALUES ('default_min_stock', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          [s.value]
        );
      }
    }
  });
  return {
    products: data.products.length,
    orders: data.orders.length,
  };
};
