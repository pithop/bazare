import csv, json, os

csv_path = '/home/idriss/Documents/antigravity/focused-bohr/EtsyListingsDownload.csv'
json_path = '/home/idriss/Documents/antigravity/focused-bohr/lebazare-manager/etsy_products.json'

products = []
try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('TITRE', '').strip()
            if title:
                qty = row.get('QUANTITÉ', '0')
                if not qty.isdigit(): qty = 0
                products.append({
                    "name": title,
                    "category": "Produits",
                    "stock": int(qty)
                })
except Exception as e:
    print(f"Error: {e}")

# Ajouter les emballages par défaut
products.extend([
    {"name": "Carton d'expédition S", "category": "Emballages", "stock": 50},
    {"name": "Carton d'expédition L", "category": "Emballages", "stock": 50},
    {"name": "Rouleau de Scotch", "category": "Emballages", "stock": 10},
    {"name": "Étiquettes d'envoi", "category": "Emballages", "stock": 100}
])

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print("JSON généré avec succès!")
