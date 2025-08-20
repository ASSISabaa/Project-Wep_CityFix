(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000';
  const api = (p) => `${API_BASE}${p.startsWith('/api') ? p : `/api${p}`}`;
  const authHeader = () => {
    const t = localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const state = {
    page: 1,
    limit: 9,
    pages: 1,
    total: 0,
    sort: 'newest',
    filters: { type: 'all', district: 'all', q: '' },
    loading: false,
    cacheAll: null
  };

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    els.typeFilter = qs('#typeFilter');
    els.districtFilter = qs('#districtFilter');
    els.searchInput = qs('#searchInput');
    els.sortContainer = qs('.sort-buttons');
    els.list = qs('#reportsList');
    els.pagination = qs('.pagination');

    bindDropdown(els.typeFilter, (val, label) => {
      state.filters.type = val; setDropText(els.typeFilter, label); refresh();
    });
    bindDropdown(els.districtFilter, (val, label) => {
      state.filters.district = val; setDropText(els.districtFilter, label); refresh();
    });
    bindSearch();
    bindSort();

    await Promise.all([fillTypes(), fillDistricts()]);
    await loadReports();
  }

  function bindDropdown(root, onSelect) {
    if (!root) return;
    const btn = root.querySelector('.filter-btn');
    const menu = root.querySelector('.dropdown-content');
    const open = () => { closeAllDropdowns(); menu.style.display = 'block'; };
    const close = () => { menu.style.display = 'none'; };
    btn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display === 'block' ? close() : open(); });
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(); });
    menu.addEventListener('click', (e) => {
      const it = e.target.closest('.dropdown-item'); if (!it) return;
      const val = String(it.dataset.value || 'all');
      const label = it.textContent.trim();
      onSelect(val, label);
      close();
    });
  }
  function closeAllDropdowns() { qsa('.filter-dropdown .dropdown-content').forEach((m) => (m.style.display = 'none')); }
  function setDropText(root, label) { const s = root?.querySelector('.filter-btn span'); if (s) s.textContent = label; }

  function bindSearch() {
    if (!els.searchInput) return;
    let t;
    els.searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.filters.q = els.searchInput.value.trim();
        state.page = 1;
        loadReports();
      }, 300);
    });
  }

  function bindSort() {
    if (!els.sortContainer) return;
    els.sortContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.sort-btn'); if (!btn) return;
      qsa('.sort-btn', els.sortContainer).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.sort = btn.dataset.sort || 'newest';
      refresh();
    });
  }
  function refresh() { state.page = 1; loadReports(); }
  function sortParam(k) {
    if (k === 'most-reported') return 'similar_desc';
    if (k === 'resolved-first') return 'resolved_first';
    return 'newest';
  }

  async function fillTypes() {
    const menu = els.typeFilter?.querySelector('.dropdown-content'); if (!menu) return;
    try {
      const r = await fetch(api('/report-types'), { headers: { ...authHeader() } });
      const j = await r.json();
      const list = Array.isArray(j?.data) ? j.data : [];
      const items = [{ key: 'all', name: 'All Types' }].concat(
        list.map((t) => ({ key: String(t.id || t.value || t.name).toLowerCase(), name: t.name || 'Type' }))
      );
      menu.innerHTML = items.map((it) => `<button class="dropdown-item" data-value="${escAttr(it.key)}" tabindex="0">${esc(it.name)}</button>`).join('');
    } catch {}
  }

  async function fillDistricts() {
    const menu = els.districtFilter?.querySelector('.dropdown-content'); if (!menu) return;
    try {
      const r = await fetch(api('/districts'), { headers: { ...authHeader() } });
      const j = await r.json();
      const list = Array.isArray(j?.data) ? j.data : [];
      const items = [{ key: 'all', name: 'All Districts' }].concat(
        list.map((d) => ({ key: String(d.value || d.id || d.name).toLowerCase(), name: d.name || 'District' }))
      );
      menu.innerHTML = items.map((it) => `<button class="dropdown-item" data-value="${escAttr(it.key)}" tabindex="0">${esc(it.name)}</button>`).join('');
    } catch {}
  }

  async function loadReports() {
    if (state.loading) return;
    state.loading = true;

    const params = new URLSearchParams();
    if (state.filters.type !== 'all') params.set('type', state.filters.type);
    if (state.filters.district !== 'all') params.set('district', state.filters.district);
    if (state.filters.q) params.set('q', state.filters.q);
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));
    params.set('sort', sortParam(state.sort));

    try {
      const res = await fetch(api(`/reports?${params.toString()}`), { headers: { 'Content-Type': 'application/json', ...authHeader() } });
      const json = await res.json();

      let payload = json.data || json;
      let items = toArray(payload.items || payload.results || payload.reports || payload.docs);
      let total = num(payload.total ?? payload.totalCount ?? payload.count ?? payload.pagination?.total);
      let pages = num(payload.pages ?? payload.totalPages ?? payload.pagination?.pages);
      let page = num(payload.page ?? payload.currentPage ?? payload.pagination?.page);

      if (!Array.isArray(items)) items = [];

      if ((state.filters.q || state.filters.type !== 'all' || state.filters.district !== 'all') && items.length < state.limit) {
        if (!state.cacheAll) state.cacheAll = await fetchAll();
        items = clientFilter(state.cacheAll);
        total = items.length;
        pages = Math.max(1, Math.ceil(total / state.limit));
        const start = (state.page - 1) * state.limit;
        items = items.slice(start, start + state.limit);
      } else {
        if (!total) total = items.length;
        if (!pages) pages = Math.max(1, Math.ceil(total / state.limit));
        if (!page) page = state.page;
      }

      state.total = total || items.length;
      state.pages = pages || 1;
      state.page = Math.min(Math.max(1, page || 1), state.pages);

      renderList(items);
      renderPagination();
    } catch {
      if (els.list) els.list.innerHTML = '';
      if (els.pagination) els.pagination.innerHTML = '';
    } finally {
      state.loading = false;
    }
  }

  async function fetchAll() {
    const params = new URLSearchParams({ page: '1', limit: '1000' });
    const r = await fetch(api(`/reports?${params.toString()}`), { headers: { ...authHeader() } });
    const j = await r.json();
    const payload = j.data || j;
    return toArray(payload.items || payload.results || payload.reports || payload.docs);
  }

  function clientFilter(all) {
    const t = state.filters.type;
    const d = state.filters.district;
    const q = (state.filters.q || '').toLowerCase();
    const filtered = all.filter((r) => {
      const typeKey = (r.type?.key || r.type?.slug || r.type?.id || r.issueType || r.type || '').toString().toLowerCase();
      const districtKey = (r.district?.key || r.district?.slug || r.district?.value || r.district || '').toString().toLowerCase();
      const title = (r.title || r.summary || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const addr = (typeof r.location === 'string' ? r.location : r.location?.formattedAddress || r.address || '').toLowerCase();
      const okType = t === 'all' || typeKey === t;
      const okDist = d === 'all' || districtKey === d;
      const okQ = !q || title.includes(q) || desc.includes(q) || addr.includes(q);
      return okType && okDist && okQ;
    });
    if (state.sort === 'resolved-first') {
      filtered.sort((a, b) => (isResolved(b) - isResolved(a)) || dateVal(b) - dateVal(a));
    } else if (state.sort === 'most-reported') {
      filtered.sort((a, b) => (num(b.similarCount || b.duplicates) - num(a.similarCount || a.duplicates)) || dateVal(b) - dateVal(a));
    } else {
      filtered.sort((a, b) => dateVal(b) - dateVal(a));
    }
    return filtered;
  }

  function renderList(items) {
    if (!els.list) return;
    if (!Array.isArray(items) || items.length === 0) { els.list.innerHTML = ''; return; }
    els.list.innerHTML = items.map(cardHtml).join('');
    qsa('.report-card').forEach((c) => (c.onclick = null));
  }

  function renderPagination() {
    if (!els.pagination) return;

    const makeBtn = (label, opts = {}) => {
      const b = document.createElement('button');
      b.className = 'page-link' + (opts.active ? ' active' : '');
      if (opts.id) b.id = opts.id;
      b.textContent = label;
      if (opts.disabled) b.disabled = true;
      b.addEventListener('click', () => {
        if (opts.page && opts.page !== state.page) { state.page = opts.page; loadReports(); }
      });
      return b;
    };

    els.pagination.innerHTML = '';
    els.pagination.appendChild(makeBtn('Previous', { id: 'prevPage', disabled: state.page <= 1, page: state.page - 1 }));

    const windowSize = 7;
    let start = Math.max(1, state.page - Math.floor(windowSize / 2));
    let end = Math.min(state.pages, start + windowSize - 1);
    if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
    for (let p = start; p <= end; p++) els.pagination.appendChild(makeBtn(String(p), { active: p === state.page, page: p }));

    els.pagination.appendChild(makeBtn('Next', { id: 'nextPage', disabled: state.page >= state.pages, page: state.page + 1 }));
  }

  function cardHtml(r) {
    const typeKey = (r.type?.key || r.type?.slug || r.type?.id || r.issueType || r.type || '').toString().toLowerCase();
    const districtKey = (r.district?.key || r.district?.slug || r.district?.value || r.district || '').toString().toLowerCase();

    const imgs = normalizeImgs(r.images || r.photos || r.media || r.attachments || r.image || r.photo || []);
    const photo = imgs[0] || '';

    const coords = getCoords(r);
    const mapImg = coords ? staticMapURL(coords.lat, coords.lng) : '';

    const stRaw = String(r.status || '').toLowerCase();
    const stText = stRaw === 'resolved' ? 'Resolved'
                 : (stRaw === 'in-progress' || stRaw === 'in_progress') ? 'In Progress'
                 : stRaw ? cap(stRaw) : 'Pending';
    const stClass = stRaw === 'resolved' ? 'resolved'
                  : (stRaw === 'in-progress' || stRaw === 'in_progress') ? 'in-progress' : 'pending';

    const title = r.title || r.summary || (r.type?.name ? `${r.type.name} Issue` : 'Issue');
    const addr = formatAddr(r.address || r.location || r.geoAddress);
    const similar = Number(r.similarCount || r.duplicates || r.relatedCount || 0);
    const when = r.createdAt || r.reportedAt || Date.now();

    const smallIcon = smallIconFor(typeKey);
    const bigFallback = bigIconFor(typeKey);

    const media =
      photo
        ? `<img class="report-photo" src="${escAttr(photo)}" alt="report" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()">`
        : mapImg
          ? `<img class="report-photo" src="${escAttr(mapImg)}" alt="map" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()">`
          : `<img src="${bigFallback}" alt="" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:64px;max-height:64px;opacity:.9;">`;

    return `
      <div class="report-card" data-type="${escAttr(typeKey || 'other')}" data-district="${escAttr(districtKey || 'unknown')}" data-status="${escAttr(stRaw || 'pending')}">
        <div class="report-image" style="position:relative;">
          <div class="report-icon"><img src="assets/${smallIcon}" alt="" width="27" height="36"></div>
          ${media}
        </div>
        <div class="report-content">
          <div class="report-header">
            <h3>${esc(title)}</h3>
            <div class="report-priority ${stClass}">${esc(stText)}</div>
          </div>
          <p class="location">${esc(addr)}</p>
          <div class="status-section">
            <p class="time">${esc(timeAgo(when))}</p>
            <span class="similar-count">${similar > 0 ? `${similar} similar reports` : 'No duplicates'}</span>
          </div>
        </div>
      </div>`;
  }

  function smallIconFor(t) {
    const map = {
      lighting: 'Broken Light.svg',
      roads: 'Large Pothole.svg',
      drainage: 'Drainage Issue.svg',
      waste: 'Large Pothole.svg',
      sanitation: 'Large Pothole.svg',
      parks: 'Large Pothole.svg'
    };
    return map[t] || 'Large Pothole.svg';
  }
  function bigIconFor(t) {
    const map = {
      lighting: 'assets/Broken Light.svg',
      roads: 'assets/Large Pothole.svg',
      drainage: 'assets/Drainage Issue.svg',
      waste: 'assets/Large Pothole.svg',
      sanitation: 'assets/Large Pothole.svg',
      parks: 'assets/Large Pothole.svg'
    };
    return map[t] || 'assets/Large Pothole.svg';
  }

  function getCoords(r) {
    const c = r.coordinates || r.coords || r.location?.coordinates || r.location;
    if (!c) return null;
    const lat = Number(c.lat ?? c.latitude ?? (Array.isArray(c) ? c[1] : undefined));
    const lng = Number(c.lng ?? c.lon ?? c.long ?? c.longitude ?? (Array.isArray(c) ? c[0] : undefined));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }
  function staticMapURL(lat, lng) {
    const z = 15, w = 600, h = 300;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${z}&size=${w}x${h}&maptype=mapnik&markers=${lat},${lng},lightblue1`;
  }

  function timeAgo(ts) {
    const d = new Date(ts); if (isNaN(d)) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return d.toLocaleDateString();
  }
  function formatAddr(loc) {
    if (!loc) return 'Unknown location';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [];
      const push = (v) => { if (v && String(v).trim()) parts.push(String(v).trim()); };
      push(loc.formattedAddress || loc.full);
      push([loc.street || loc.streetName, loc.city || loc.town].filter(Boolean).join(', '));
      push([loc.district, loc.city].filter(Boolean).join(', '));
      push(loc.address || loc.name);
      return parts.find(Boolean) || 'Unknown location';
    }
    return 'Unknown location';
  }
  function normalizeImgs(src) {
    const arr = Array.isArray(src) ? src : (src ? [src] : []);
    return arr.map((x) => {
      if (!x) return '';
      if (typeof x === 'string') return resolve(x);
      if (typeof x === 'object') return resolve(x.url || x.path || x.filename || x.file || x.key || '');
      return '';
    }).filter(Boolean);
  }
  function resolve(p) {
    if (!p) return '';
    if (p.startsWith('data:')) return p;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/uploads')) return `${API_BASE}${p}`;
    if (p.startsWith('uploads/')) return `${API_BASE}/${p}`;
    const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(p);
    return `${API_BASE}/${hasExt ? `uploads/reports/${p}` : p}`;
  }
  function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }
  function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function escAttr(s) { return esc(s).replace(/"/g,'&quot;'); }
  function cap(s) { const x = String(s||''); return x ? x[0].toUpperCase()+x.slice(1) : ''; }
  function isResolved(r) { return String(r.status || '').toLowerCase() === 'resolved'; }
  function dateVal(r) { const d = new Date(r.createdAt || r.reportedAt || 0); return d.getTime() || 0; }
})();
