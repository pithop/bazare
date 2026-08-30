# 🚀 MISSION BRIEFING POUR CLAUDE OPUS 4.6
**Projet :** LeBazare Manager (Application Android WMS / Pick & Pack)
**Contexte :** Le client gère une boutique Etsy ("LeBazare" - artisanat marocain : malles en osier, cabas, trophées) et prépare ses commandes dans un **petit garage n'ayant aucune connexion internet**.
**Objectif :** Poursuivre le développement d'une application Android 100% hors-ligne pour la gestion des stocks et la préparation de colis, avec une refonte UI/UX majeure ("créative, simple, professionnelle").

---

## 🛠 STACK TECHNIQUE
- **Framework :** React Native (généré via Expo SDK 57)
- **Base de données :** `expo-sqlite` (SQLite en local)
- **Fichiers :** L'application est déjà générée et les dépendances sont installées.

---

## 📊 ÉTAT ACTUEL DU PROJET
Nous avons déjà posé les fondations. L'application possède :
1. Une base de données SQLite fonctionnelle (`database.js`) avec 3 tables : `products`, `orders`, `order_items`.
2. Le catalogue de produits Etsy ("Créations") et d'emballages ("Matériel") est déjà injecté.
3. Une logique de déduction de stock lors de la validation d'une commande (Fulfill) est en place.
4. Un fichier `App.js` qui contient 3 onglets rudimentaires (Commandes, Créations, Matériel).

---

## 🎯 TES MISSIONS (CLAUDE)

### Mission 1 : Refonte Totale UI/UX
Le client souhaite une interface **"créative, simple et professionnelle"**. 
Tu dois réécrire l'interface (actuellement basique) pour la rendre ergonomique, fluide, avec de belles animations si possible, de belles icônes, et une navigation agréable (Bottom Navigation Bar ou Drawer). Pense à un design orienté "travail en entrepôt/garage" (Boutons larges, contrastes élevés pour la lisibilité).

### Mission 2 : Implémentation des 4 Fonctionnalités "Game Changer"
Le code actuel manque de certaines fonctionnalités industrielles pour être parfait. Tu dois intégrer :

1. **Wave Picking (Résumé de Ramassage Global) :** Un écran qui additionne les quantités de TOUS les articles et emballages nécessaires pour TOUTES les commandes en attente. Objectif : faire un seul trajet dans les allées du garage pour tout rassembler sur la table d'emballage.
2. **Bouton d'Import CSV (Commandes Etsy) :** Créer une logique avec `expo-document-picker` et un parseur CSV pour permettre au client de charger son fichier "EtsyOrders.csv" (téléchargé sur son téléphone en Wi-Fi au préalable). Le script doit lire le CSV et insérer les nouvelles commandes dans SQLite.
3. **Liste de Courses Automatique :** Un écran générant automatiquement une liste d'achats pour tout article/emballage dont le stock est < 5.
4. **(Bonus) Scanner de Code-barres :** Prévoir l'intégration de la caméra (ex: `expo-barcode-scanner` ou `expo-camera`) dans la Checklist pour éviter les erreurs de préparation si le client utilise des codes-barres.

---

## 💻 CODE SOURCE ACTUEL (Pour ton contexte)

### 1. `database.js` (La logique actuelle)
```javascript
import * as SQLite from 'expo-sqlite';
import etsyProducts from './etsy_products.json';

let db = null;
export const initDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('lebazare.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, stock INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, etsy_id TEXT, customer_name TEXT, status TEXT DEFAULT 'PENDING', date TEXT);
      CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, quantity INTEGER, FOREIGN KEY(order_id) REFERENCES orders(id), FOREIGN KEY(product_id) REFERENCES products(id));
    `);
    // Le catalogue Etsy a déjà été inséré initialement ici.
  }
  return db;
};

export const getProducts = async () => {
  const database = await initDB();
  return await database.getAllAsync('SELECT * FROM products ORDER BY category DESC, name ASC');
};

export const updateStock = async (id, newStock) => {
  const database = await initDB();
  await database.runAsync('UPDATE products SET stock = ? WHERE id = ?', [newStock, id]);
};

export const getPendingOrders = async () => {
  const database = await initDB();
  const orders = await database.getAllAsync("SELECT * FROM orders WHERE status = 'PENDING' ORDER BY id DESC");
  for (let order of orders) {
    order.items = await database.getAllAsync('SELECT oi.quantity, p.name, p.id as product_id FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [order.id]);
  }
  return orders;
};

export const fulfillOrder = async (orderId, items) => {
  const database = await initDB();
  for (let item of items) {
    await database.runAsync('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
  }
  await database.runAsync("UPDATE orders SET status = 'SHIPPED' WHERE id = ?", [orderId]);
};
```

### 2. Contraintes de Développement pour Claude :
- Ne casse pas la structure de la base de données SQLite. 
- Fournis un code propre et modulaire (sépare l'UI en différents composants/fichiers).
- Utilise des bibliothèques compatibles avec Expo SDK 57.
- L'application doit obligatoirement rester 100% Hors-Ligne (Pas de Cloud, Firebase, Supabase).
