import * as SQLite from 'expo-sqlite';
import etsyProducts from './etsy_products.json';

let dbPromise = null;

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
          date TEXT
        );
        
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          product_id INTEGER,
          quantity INTEGER,
          FOREIGN KEY(order_id) REFERENCES orders(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        );
      `);
      
      const countResult = await database.getAllAsync('SELECT COUNT(*) as count FROM products');
      if (countResult[0]?.count === 0) {
        for (const product of etsyProducts) {
          await database.runAsync(
            `INSERT INTO products (name, category, stock) VALUES (?, ?, ?)`,
            [product.name, product.category, product.stock]
          );
        }
      }
      return database;
    })();
  }
  return dbPromise;
};

// ──────────────────────────────────
// PRODUCTS
// ──────────────────────────────────

export const getProducts = async () => {
  const database = await initDB();
  return await database.getAllAsync('SELECT * FROM products ORDER BY category DESC, name ASC');
};

export const getProductsByCategory = async (category) => {
  const database = await initDB();
  return await database.getAllAsync('SELECT * FROM products WHERE category = ? ORDER BY name ASC', [category]);
};

export const updateStock = async (id, newStock) => {
  const database = await initDB();
  await database.runAsync('UPDATE products SET stock = ? WHERE id = ?', [Math.max(0, newStock), id]);
};

export const addProduct = async (name, category, stock = 0) => {
  const database = await initDB();
  await database.runAsync('INSERT INTO products (name, category, stock) VALUES (?, ?, ?)', [name, category, stock]);
};

export const deleteProduct = async (id) => {
  const database = await initDB();
  await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const searchProducts = async (query) => {
  const database = await initDB();
  return await database.getAllAsync(
    "SELECT * FROM products WHERE name LIKE ? ORDER BY category DESC, name ASC",
    [`%${query}%`]
  );
};

// ──────────────────────────────────
// ORDERS
// ──────────────────────────────────

export const getPendingOrders = async () => {
  const database = await initDB();
  const orders = await database.getAllAsync("SELECT * FROM orders WHERE status = 'PENDING' ORDER BY id DESC");
  for (let order of orders) {
    order.items = await database.getAllAsync(`
      SELECT oi.id as item_id, oi.quantity, p.name, p.id as product_id, p.stock
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [order.id]);
  }
  return orders;
};

export const getPendingOrderCount = async () => {
  const database = await initDB();
  const result = await database.getFirstAsync("SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'");
  return result?.count || 0;
};

export const addOrder = async (etsyId, customerName, items) => {
  const database = await initDB();
  const today = new Date().toISOString().split('T')[0];
  const result = await database.runAsync(
    `INSERT INTO orders (etsy_id, customer_name, status, date) VALUES (?, ?, 'PENDING', ?)`,
    [etsyId || '', customerName || 'Client', today]
  );
  const orderId = result.lastInsertRowId;
  for (const item of items) {
    await database.runAsync(
      'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
      [orderId, item.product_id, item.quantity]
    );
  }
  return orderId;
};

export const fulfillOrder = async (orderId, items) => {
  const database = await initDB();
  for (let item of items) {
    await database.runAsync('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
  }
  await database.runAsync("UPDATE orders SET status = 'SHIPPED' WHERE id = ?", [orderId]);
};

export const deleteOrder = async (orderId) => {
  const database = await initDB();
  await database.runAsync('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  await database.runAsync('DELETE FROM orders WHERE id = ?', [orderId]);
};

// ──────────────────────────────────
// WAVE PICKING (Résumé de ramassage)
// ──────────────────────────────────

export const getWavePickList = async () => {
  const database = await initDB();
  return await database.getAllAsync(`
    SELECT p.id, p.name, p.category, p.stock, SUM(oi.quantity) as total_needed
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'PENDING'
    GROUP BY p.id
    ORDER BY p.category DESC, p.name ASC
  `);
};

// ──────────────────────────────────
// LISTE DE COURSES
// ──────────────────────────────────

export const getLowStockProducts = async (threshold = 5) => {
  const database = await initDB();
  return await database.getAllAsync(
    'SELECT * FROM products WHERE stock < ? ORDER BY stock ASC, category DESC, name ASC',
    [threshold]
  );
};

// ──────────────────────────────────
// EXPORT
// ──────────────────────────────────

export const exportInventoryCSV = async () => {
  const database = await initDB();
  const products = await database.getAllAsync('SELECT * FROM products ORDER BY category, name');
  let csv = 'Nom,Catégorie,Stock\n';
  for (const p of products) {
    csv += `"${p.name}","${p.category}",${p.stock}\n`;
  }
  return csv;
};
