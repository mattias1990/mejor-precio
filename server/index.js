// ============================================================
// MEJOR PRECIO — Backend
// Consulta la API pública de MercadoLibre y devuelve resultados
// normalizados y ordenables por precio.
// ============================================================

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function searchMercadoLibre(query, categoryKey, limit = 30) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const url = `https://api.mercadolibre.com/sites/MLA/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-AR,es;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`MercadoLibre API respondió ${response.status}`);
  }

  const json = await response.json();
  return (json.results || []).map(normalizeMLItem);
}

function normalizeMLItem(item) {
  return {
    id: item.id,
    name: item.title,
    price: item.price,
    currency: item.currency_id,
    store: 'MercadoLibre',
    link: item.permalink,
    thumbnail: (item.thumbnail || '').replace('http://', 'https://'),
    freeShipping: !!(item.shipping && item.shipping.free_shipping),
    condition: item.condition,
  };
}

const PROVIDERS = [
  { name: 'mercadolibre', search: searchMercadoLibre },
];

app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  const category = (req.query.category || 'todas').trim();
  const sort = (req.query.sort || '').trim();

  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda "q".' });
  }

  const cacheKey = `${query}::${category}`;
  let results = getCached(cacheKey);

  if (!results) {
    try {
      const resultsByProvider = await Promise.all(
        PROVIDERS.map(p =>
          p.search(query, category === 'todas' ? null : category).catch(err => {
            console.error(`Error consultando ${p.name}:`, err.message);
            return [];
          })
        )
      );
      results = resultsByProvider.flat();
      setCached(cacheKey, results);
    } catch (err) {
      return res.status(502).json({ error: 'Error consultando proveedores externos.' });
    }
  }

  let sorted = [...results];
  if (sort === 'asc') sorted.sort((a, b) => a.price - b.price);
  if (sort === 'desc') sorted.sort((a, b) => b.price - a.price);

  res.json({ query, category, count: sorted.length, results: sorted });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`MEJOR PRECIO corriendo en http://localhost:${PORT}`);
  console.log(`Frontend servido desde /public — API en /api/search`);
});
