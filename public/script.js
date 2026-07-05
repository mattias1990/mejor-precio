// ============================================================
// MEJOR PRECIO — Frontend
// Consulta el backend propio (server/index.js), que a su vez
// consulta la API pública de MercadoLibre.
// ============================================================

// Como el backend ahora sirve también el frontend, la URL es relativa:
// funciona igual en localhost que en el dominio de Render, sin tocar nada.
const API_BASE_URL = '';

let currentCategory = 'todas';
let currentSort = '';
let currentQuery = 'zapatillas running';
let currentResults = [];

function formatPrice(n, currency) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return symbol + Number(n).toLocaleString('es-AR');
}

function setLoading(isLoading) {
  const list = document.getElementById('productList');
  if (isLoading) {
    list.innerHTML = '<div class="empty-state">Buscando precios...</div>';
  }
}

function setError(message) {
  const list = document.getElementById('productList');
  list.innerHTML = `<div class="empty-state">${message}</div>`;
  document.getElementById('resultCount').textContent = '0';
}

async function fetchResults() {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      q: currentQuery,
      category: currentCategory,
      sort: currentSort,
    });
    const res = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
    if (!res.ok) throw new Error('Respuesta no válida del servidor');
    const data = await res.json();
    currentResults = data.results || [];
    renderResults();
  } catch (err) {
    console.error(err);
    setError(
      'No se pudo conectar con el backend. Si estás probando local, ¿corriste "npm start" en la carpeta server? Revisá la consola para más detalle.'
    );
  }
}

function renderResults() {
  const list = document.getElementById('productList');
  document.getElementById('resultCount').textContent = currentResults.length;
  document.getElementById('queryLabel').textContent = currentQuery;

  if (currentResults.length === 0) {
    list.innerHTML = '<div class="empty-state">No encontramos resultados para esta búsqueda.</div>';
    return;
  }

  const minPrice = Math.min(...currentResults.map(p => p.price));

  list.innerHTML = '';
  currentResults.forEach(p => {
    const isBest = p.price === minPrice;
    const card = document.createElement('div');
    card.className = 'product-card' + (isBest ? ' best' : '');
    card.innerHTML = `
      <div class="product-thumb">
        ${p.thumbnail ? `<img src="${p.thumbnail}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '🛒'}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="product-meta">
          <span class="store-tag">${p.store}</span>
          ${p.freeShipping ? '<span class="store-tag">Envío gratis</span>' : ''}
          ${isBest ? '<span class="best-badge">Mejor precio</span>' : ''}
        </div>
      </div>
      <div class="product-price">
        <span class="price-amount">${formatPrice(p.price, p.currency)}</span>
      </div>
      <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="product-cta" style="text-decoration:none; display:inline-block;">Ver oferta</a>
    `;
    list.appendChild(card);
  });
}

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCategory = chip.dataset.cat;
    fetchResults();
  });
});

document.getElementById('sortAsc').addEventListener('click', () => {
  currentSort = 'asc';
  document.getElementById('sortAsc').classList.add('active');
  document.getElementById('sortDesc').classList.remove('active');
  fetchResults();
});
document.getElementById('sortDesc').addEventListener('click', () => {
  currentSort = 'desc';
  document.getElementById('sortDesc').classList.add('active');
  document.getElementById('sortAsc').classList.remove('active');
  fetchResults();
});
document.getElementById('searchBtn').addEventListener('click', () => {
  currentQuery = document.getElementById('searchInput').value.trim();
  if (currentQuery) fetchResults();
});
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    currentQuery = e.target.value.trim();
    if (currentQuery) fetchResults();
  }
});

fetchResults();
