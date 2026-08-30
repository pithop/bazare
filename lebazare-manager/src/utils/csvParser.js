/**
 * Parse une chaîne CSV en tableau d'objets.
 * Gère les guillemets, les virgules dans les champs, etc.
 */
export function parseCSV(csvString) {
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Cherche le meilleur match pour un nom de produit dans la liste de produits DB.
 * Retourne le produit le plus similaire ou null.
 */
export function findBestProductMatch(itemName, dbProducts) {
  if (!itemName || !dbProducts.length) return null;

  const normalizedInput = itemName.toLowerCase().trim();

  // 1. Exact match
  const exact = dbProducts.find(p => p.name.toLowerCase().trim() === normalizedInput);
  if (exact) return exact;

  // 2. Contains match
  const contains = dbProducts.find(p =>
    p.name.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(p.name.toLowerCase())
  );
  if (contains) return contains;

  // 3. Word overlap match (fuzzy)
  const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 3);
  let bestMatch = null;
  let bestScore = 0;

  for (const product of dbProducts) {
    const productWords = product.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const overlap = inputWords.filter(w => productWords.some(pw => pw.includes(w) || w.includes(pw)));
    const score = overlap.length / Math.max(inputWords.length, 1);
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return bestMatch;
}
