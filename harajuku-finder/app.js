let allRestaurants = [];
let activeArea = 'all';
let activeCategory = 'all';
let searchQuery = '';

async function loadData() {
  const res = await fetch('restaurants.json');
  allRestaurants = await res.json();
  buildCategoryChips();
  renderCards(allRestaurants);
}

function buildCategoryChips() {
  const categories = ['all', ...new Set(allRestaurants.map(r => r.category))];
  const container = document.getElementById('categoryChips');
  container.innerHTML = categories.map(cat => {
    const label = cat === 'all' ? 'すべて' : cat;
    const active = cat === 'all' ? 'chip--active' : '';
    return `<button class="chip ${active}" data-category="${cat}">${label}</button>`;
  }).join('');
  container.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => onCategoryChip(btn));
  });
}

function matchesSearch(restaurant, query) {
  if (!query) return { match: true, matchedTerms: [] };
  const terms = query.trim().toLowerCase().split(/[\s　,、]+/).filter(Boolean);
  const searchable = [
    restaurant.name,
    restaurant.category,
    ...restaurant.tags,
    ...restaurant.menu.map(m => m.name),
  ].map(s => s.toLowerCase()).join(' ');

  const matched = terms.filter(t => searchable.includes(t));
  return { match: matched.length === terms.length, matchedTerms: terms };
}

function filterRestaurants() {
  return allRestaurants.filter(r => {
    const areaOk = activeArea === 'all' || r.area === activeArea;
    const catOk = activeCategory === 'all' || r.category === activeCategory;
    const { match } = matchesSearch(r, searchQuery);
    return areaOk && catOk && match;
  });
}

function renderCards(restaurants) {
  const grid = document.getElementById('restaurantGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultsCount');
  count.textContent = `${restaurants.length}件`;

  if (restaurants.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const terms = searchQuery.trim().toLowerCase().split(/[\s　,、]+/).filter(Boolean);

  grid.innerHTML = restaurants.map(r => {
    const previewMenu = r.menu.slice(0, 2);
    const extraCount = r.menu.length - 2;
    const highlightedTags = r.tags.map(tag => {
      const isMatch = terms.some(t => tag.toLowerCase().includes(t));
      return `<span class="card-tag ${isMatch ? 'card-tag--match' : ''}">${tag}</span>`;
    }).join('');

    return `
      <div class="card" data-id="${r.id}" role="button" tabindex="0" aria-label="${r.name}の詳細を見る">
        <div class="card-banner" style="background:${r.color}"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-name">${r.name}</div>
            <div class="card-rating">⭐ ${r.rating}</div>
          </div>
          <div class="card-meta">
            <span class="card-area">${r.area}</span>
            <span class="card-category">${r.category}</span>
            <span class="card-price">${r.priceRange}</span>
          </div>
          <div class="card-tags">${highlightedTags}</div>
          <div class="card-menu-preview">
            <div class="card-menu-label">人気メニュー</div>
            ${previewMenu.map(m => `
              <div class="card-menu-item">
                <span>${m.name}</span>
                <span class="card-menu-price">¥${m.price.toLocaleString()}</span>
              </div>
            `).join('')}
            ${extraCount > 0 ? `<div class="card-menu-more">他${extraCount}品…</div>` : ''}
          </div>
        </div>
        <div class="card-footer">
          <span class="card-hours">🕐 ${r.hours}</span>
          <a class="card-map-link" href="${r.googleMapsUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📍 地図</a>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(Number(card.dataset.id)));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openModal(Number(card.dataset.id));
    });
  });
}

function openModal(id) {
  const r = allRestaurants.find(x => x.id === id);
  if (!r) return;

  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="modal-banner" style="background:${r.color}"></div>
    <div class="modal-inner">
      <span class="modal-category-chip">${r.category}</span>
      <div class="modal-name">${r.name}</div>
      <div class="modal-row">
        <span class="modal-area-badge">${r.area}</span>
        <span class="modal-rating">⭐ ${r.rating}</span>
        <span class="modal-price">${r.priceRange}</span>
      </div>
      <div class="modal-tags">
        ${r.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}
      </div>
      <div class="modal-section-title">メニュー</div>
      <ul class="modal-menu-list">
        ${r.menu.map(m => `
          <li>
            <span class="modal-menu-name">${m.name}</span>
            <span class="modal-menu-price">¥${m.price.toLocaleString()}</span>
          </li>
        `).join('')}
      </ul>
      <div class="modal-section-title">店舗情報</div>
      <div class="modal-info-grid">
        <span class="modal-info-key">住所</span><span class="modal-info-val">${r.address}</span>
        <span class="modal-info-key">営業時間</span><span class="modal-info-val">${r.hours}</span>
      </div>
      <a class="modal-map-btn" href="${r.googleMapsUrl}" target="_blank" rel="noopener">📍 Googleマップで見る</a>
    </div>
  `;

  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function onAreaChip(btn) {
  activeArea = btn.dataset.area;
  document.querySelectorAll('#areaChips .chip').forEach(c => c.classList.remove('chip--active'));
  btn.classList.add('chip--active');
  renderCards(filterRestaurants());
}

function onCategoryChip(btn) {
  activeCategory = btn.dataset.category;
  document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('chip--active'));
  btn.classList.add('chip--active');
  renderCards(filterRestaurants());
}

function resetAll() {
  activeArea = 'all';
  activeCategory = 'all';
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('#areaChips .chip').forEach(c => c.classList.toggle('chip--active', c.dataset.area === 'all'));
  document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.toggle('chip--active', c.dataset.category === 'all'));
  document.getElementById('searchClear').classList.add('hidden');
  renderCards(allRestaurants);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  const clearBtn = document.getElementById('searchClear');
  clearBtn.classList.toggle('hidden', !searchQuery);
  renderCards(filterRestaurants());
});

document.getElementById('searchClear').addEventListener('click', () => {
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').classList.add('hidden');
  document.getElementById('searchInput').focus();
  renderCards(filterRestaurants());
});

document.querySelectorAll('#areaChips .chip').forEach(btn => {
  btn.addEventListener('click', () => onAreaChip(btn));
});

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('resetBtn').addEventListener('click', resetAll);
document.getElementById('searchClear').classList.add('hidden');

loadData();
