// CityFix Homepage — Pro, backend-adaptive, admin/user aware
'use strict';

/* ============ Config ============ */
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : `${location.origin}/api`;

const API_CANDIDATES = {
  HEALTH: ['/health'],
  ME: ['/auth/me', '/users/me', '/me'],

  DASHBOARD_STATS: [
    '/dashboard/stats',
    '/reports/statistics',
    '/reports/stats',
    '/stats/dashboard',
    '/stats'
  ],
  ISSUE_TYPE_STATS: [
    '/issues/stats',
    '/report-types/stats',
    '/reports/issues/stats',
    '/issues/summary'
  ],
  DISTRICT_STATS: [
    '/districts/stats',
    '/reports/districts/stats',
    '/districts/summary',
    '/districts/overview'
  ],
  MAP_MARKERS: [
    '/reports/markers',
    '/reports/map-markers',
    '/markers',
    '/reports/geo',
    '/reports/list?only=coords'
  ]
};

const GOOGLE_MAPS_CONFIG = {
  DEFAULT_CENTER: { lat: 32.0853, lng: 34.7818 },
  DEFAULT_ZOOM: 13,
  MAP_STYLES: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
  ]
};

/* ============ App State ============ */
const AppState = {
  user: null,
  backendAvailable: false,
  endpoints: {},         // resolved endpoints
  dashboardStats: null,
  mapMarkers: [],
  googleMap: null
};

let currentFilters = {
  startDate: '',
  endDate: '',
  district: '',
  issueTypes: ['pothole', 'lighting', 'drainage', 'traffic', 'other']
};

/* ============ Utils ============ */
function getToken() {
  return (
    window.CITYFIX?.getToken?.() ||
    localStorage.getItem('cityfix_token') ||
    sessionStorage.getItem('cityfix_token') ||
    ''
  );
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}
function mmddyyyyToISO(d) {
  if (!d || !/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return '';
  const [mm, dd, yyyy] = d.split('/');
  return `${yyyy}-${mm}-${dd}`;
}
function ttlCacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { v, exp } = JSON.parse(raw);
    if (exp && Date.now() > exp) { localStorage.removeItem(key); return null; }
    return v;
  } catch { return null; }
}
function ttlCacheSet(key, v, ms = 5 * 60 * 1000) {
  try { localStorage.setItem(key, JSON.stringify({ v, exp: Date.now() + ms })); } catch {}
}
function normalizeDashboard(data) {
  // Accept {success,data}, plain, or nested
  const d = data?.data || data || {};
  let total = d.totalReports ?? d.total ?? d.count ?? 0;
  let resolved = d.resolved ?? d.done ?? d.closed ?? 0;
  let inProgress = d.inProgress ?? d.processing ?? d.open ?? 0;

  // If not provided, derive from status breakdown
  if (!total && d.byStatus) {
    total = Object.values(d.byStatus).reduce((a, b) => a + Number(b || 0), 0);
  }
  if (!resolved && d.byStatus) {
    resolved = Number(d.byStatus.resolved || d.byStatus.done || 0);
  }
  if (!inProgress && d.byStatus) {
    inProgress = Number(d.byStatus['in-progress'] || d.byStatus.open || d.byStatus.pending || 0);
  }
  const resolutionRate = total ? Math.round((resolved / total) * 100) : (d.resolutionRate || 0);
  const weeklyTrend = d.weeklyTrend ?? d.trend ?? '—';
  return { totalReports: Number(total || 0), resolved: Number(resolved || 0), inProgress: Number(inProgress || 0), resolutionRate, weeklyTrend };
}
function normalizeIssues(data) {
  const raw = data?.data || data || {};
  const obj = {};
  // Accept arrays or objects
  if (Array.isArray(raw)) {
    raw.forEach(it => {
      const key = (it.key || it.slug || it.type || it.name || 'other').toString().toLowerCase();
      obj[key] = { name: it.name || key, count: Number(it.count ?? it.reports ?? 0), resolved: Number(it.resolved || 0) };
    });
  } else {
    Object.entries(raw).forEach(([k, v]) => {
      const key = (k || v?.key || v?.slug || v?.type || 'other').toString().toLowerCase();
      obj[key] = { name: v?.name || key, count: Number(v?.count ?? v?.reports ?? 0), resolved: Number(v?.resolved || 0) };
    });
  }
  return obj;
}
function normalizeDistricts(data) {
  const raw = data?.data || data || {};
  const out = {};
  (Array.isArray(raw) ? raw : Object.values(raw)).forEach(d => {
    const key = (d.key || d.slug || d.name || '').toString().toLowerCase();
    if (!key) return;
    out[key] = { name: d.displayName || d.name || key, reports: Number(d.reports ?? d.count ?? 0), resolved: Number(d.resolved || 0) };
  });
  return out;
}

/* ============ Core fetch with endpoint discovery ============ */
async function tryEndpoints(kind, buildUrlFn, opts = {}) {
  // kind = 'DASHBOARD_STATS' | 'MAP_MARKERS' | ...
  const cacheKey = `cityfix_endpoint_${kind}`;
  const cached = ttlCacheGet(cacheKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout || 10000);

  const runRequest = async (endpointPath) => {
    const url = buildUrlFn(endpointPath);
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'include',
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
  };

  try {
    if (cached) {
      const data = await runRequest(cached);
      clearTimeout(timeout);
      return { data, endpoint: cached };
    }
  } catch {
    // fall through to probe candidates
  }

  let lastErr = null;
  for (const path of API_CANDIDATES[kind]) {
    try {
      const data = await runRequest(path);
      ttlCacheSet(cacheKey, path, 60 * 60 * 1000); // cache 1h
      clearTimeout(timeout);
      return { data, endpoint: path };
    } catch (e) {
      lastErr = e;
    }
  }
  clearTimeout(timeout);
  throw lastErr || new Error(`No working endpoint for ${kind}`);
}

/* ============ API Service ============ */
class ApiService {
  constructor(baseUrl) { this.baseUrl = baseUrl; }

  async checkHealth() {
    try {
      const url = `${this.baseUrl}${API_CANDIDATES.HEALTH[0]}`;
      const res = await fetch(url, { headers: authHeaders() });
      AppState.backendAvailable = res.ok;
      return res.ok;
    } catch { AppState.backendAvailable = false; return false; }
  }

  async getMe() {
    for (const path of API_CANDIDATES.ME) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include' });
        if (!res.ok) continue;
        const me = await res.json().catch(() => ({}));
        const data = me?.data || me;
        if (data && (data.role || data.username || data.email)) {
          return { id: data.id || data._id || null, role: (data.role || 'citizen').toLowerCase(), name: data.name || data.username || '', email: data.email || '' };
        }
      } catch {}
    }
    const t = getToken(), p = t ? decodeJwtPayload(t) : null;
    return p ? { id: p.id || p.sub || null, role: (p.role || p.roles?.[0] || 'citizen').toLowerCase(), name: p.name || p.username || '', email: p.email || '' } : null;
  }

  async getDashboardStats(params = {}) {
    const role = (AppState.user?.role || 'public').toLowerCase();
    const q = new URLSearchParams({ ...(role === 'admin' ? { viewer: 'admin' } : { viewer: 'public' }), ...params }).toString();
    const { data } = await tryEndpoints('DASHBOARD_STATS', (p) => `${this.baseUrl}${p}${q ? `?${q}` : ''}`);
    return normalizeDashboard(data);
  }

  async getIssueTypeStats() {
    const { data } = await tryEndpoints('ISSUE_TYPE_STATS', (p) => `${this.baseUrl}${p}`);
    return normalizeIssues(data);
  }

  async getDistrictStats() {
    const { data } = await tryEndpoints('DISTRICT_STATS', (p) => `${this.baseUrl}${p}`);
    return normalizeDistricts(data);
  }

  async getMapMarkers(filters = {}) {
    const isoStart = mmddyyyyToISO(filters.startDate);
    const isoEnd = mmddyyyyToISO(filters.endDate);
    const types = Array.isArray(filters.issueTypes) && filters.issueTypes.length
      ? filters.issueTypes : ['pothole','lighting','drainage','traffic','other'];
    const district = (filters.district || '').trim();
    const viewer = (filters.viewer || ((AppState.user?.role || '') === 'admin' ? 'admin' : 'public')).trim();

    // 3 query styles to satisfy different servers
    const buildQueryVariants = () => ([
      (() => { // A: repeated keys
        const q = new URLSearchParams();
        types.forEach(t => q.append('issueTypes', t));
        if (isoStart) q.append('startDate', isoStart);
        if (isoEnd) q.append('endDate', isoEnd);
        if (district) q.append('district', district);
        if (viewer) q.append('viewer', viewer);
        return q.toString();
      })(),
      (() => { // B: comma list + canonical names
        const q = new URLSearchParams();
        q.set('types', types.join(','));
        if (isoStart) q.set('from', isoStart);
        if (isoEnd) q.set('to', isoEnd);
        if (district) q.set('district', district);
        if (viewer) q.set('viewer', viewer);
        return q.toString();
      })(),
      (() => { // C: array style
        const q = new URLSearchParams();
        types.forEach(t => q.append('types[]', t));
        if (isoStart) q.append('start', isoStart);
        if (isoEnd) q.append('end', isoEnd);
        if (district) q.append('district', district);
        if (viewer) q.append('viewer', viewer);
        return q.toString();
      })()
    ]);

    let lastErr = null;
    const { v: cachedPath } = { v: ttlCacheGet('cityfix_endpoint_MAP_MARKERS') || null };
    const list = cachedPath ? [cachedPath] : API_CANDIDATES.MAP_MARKERS.slice();

    // try each endpoint with the 3 variants
    for (const path of list) {
      for (const q of buildQueryVariants()) {
        try {
          const url = `${this.baseUrl}${path}${path.includes('?') ? '&' : '?'}${q}`;
          const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const arr = (data?.data || data);
          if (!Array.isArray(arr)) throw new Error('Invalid markers payload');
          ttlCacheSet('cityfix_endpoint_MAP_MARKERS', path, 60 * 60 * 1000);
          return arr.map(m => ({
            _id: m._id || m.id,
            title: m.title || m.name || 'Report',
            description: m.description || '',
            type: (m.type || m.category || 'other').toLowerCase(),
            status: (m.status || 'pending').toLowerCase(),
            lat: Number(m.lat || m.latitude || (m.location?.lat) || (m.coords?.[0])),
            lng: Number(m.lng || m.longitude || (m.location?.lng) || (m.coords?.[1])),
            address: m.address || m.locationName || '',
            createdAt: m.createdAt || m.created_at || m.date
          }));
        } catch (e) { lastErr = e; }
      }
    }
    throw lastErr || new Error('Markers request failed');
  }
}

const api = new ApiService(API_BASE);

/* ============ Google Maps ============ */
class GoogleMapsController {
  constructor() {
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.isInitialized = false;
  }

  async initializeMap() {
    if (typeof google === 'undefined' || !google.maps) return this.showMapFallback();
    const el = document.getElementById('google-map') || document.querySelector('.map-container');
    if (!el) return;
    el.innerHTML = '';
    el.style.height = '320px';
    el.style.width = '100%';

    this.map = new google.maps.Map(el, {
      center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
      zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
      styles: GOOGLE_MAPS_CONFIG.MAP_STYLES,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      scrollwheel: true
    });

    this.infoWindow = new google.maps.InfoWindow();
    this.isInitialized = true;
    AppState.googleMap = this.map;
    await this.loadMarkers();
  }

  async loadMarkers() {
    try {
      const payload = await api.getMapMarkers(this._withRoleFilter(currentFilters));
      this.clear();
      payload.forEach(m => this._addMarker(m));
      AppState.mapMarkers = payload;
      if (this.markers.length) this._fit();
    } catch (err) {
      console.error('Markers error:', err);
      this.clear();
      this.showMapError();
    }
  }

  _withRoleFilter(filters) {
    const isAdmin = (AppState.user?.role || '').toLowerCase() === 'admin';
    return { ...filters, viewer: isAdmin ? 'admin' : 'public' };
  }

  _addMarker(d) {
    if (!this.map || !d || isNaN(d.lat) || isNaN(d.lng)) return;
    const marker = new google.maps.Marker({
      position: { lat: d.lat, lng: d.lng },
      map: this.map,
      title: d.title,
      icon: this._icon(d.type, d.status),
      animation: google.maps.Animation.DROP
    });
    marker.addListener('click', () => this._info(marker, d));
    this.markers.push(marker);
  }

  _icon(type, status) {
    const colors = { pothole: '#ff6b35', lighting: '#ffd23f', drainage: '#4dabf7', traffic: '#28a745', other: '#868e96' };
    const sizes = { new: 10, pending: 10, 'in-progress': 8, resolved: 6, rejected: 6 };
    const c = colors[(type || 'other').toLowerCase()] || colors.other;
    const s = sizes[(status || 'pending').toLowerCase()] || 8;
    return { path: google.maps.SymbolPath.CIRCLE, fillColor: c, fillOpacity: 0.85, strokeColor: '#fff', strokeWeight: 2, scale: s };
  }

  _info(marker, d) {
    const color = { new: '#dc3545', pending: '#fd7e14', 'in-progress': '#0d6efd', resolved: '#198754', rejected: '#6c757d' }[(d.status || '').toLowerCase()] || '#6c757d';
    const content = `
      <div style="max-width:300px;font-family:Inter,Arial,sans-serif">
        <h4 style="margin:0 0 6px 0;font-size:16px;color:#111827">${d.title || 'Report'}</h4>
        ${d.description ? `<p style="margin:0 0 6px 0;color:#6b7280;font-size:13px">${d.description}</p>` : ''}
        <div style="margin:6px 0 8px 0"><span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${color};color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">${d.status || 'Unknown'}</span></div>
        <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Type:</strong> ${String(d.type || 'other').replace(/^\w/, c => c.toUpperCase())}</p>
        <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Location:</strong> ${d.address || `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`}</p>
        <p style="margin:2px 0;color:#9ca3af;font-size:12px"><strong>Reported:</strong> ${this._ago(d.createdAt)}</p>
        ${d._id ? `<a href="${location.origin}/reportsdetails.html?id=${encodeURIComponent(d._id)}" style="display:inline-block;margin-top:6px;font-size:12px;color:#0d6efd;text-decoration:underline">Open details</a>` : ''}
      </div>`;
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  _ago(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return `${d} day${d > 1 ? 's' : ''} ago`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''} ago`;
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }

  _fit() {
    const b = new google.maps.LatLngBounds();
    this.markers.forEach(m => b.extend(m.getPosition()));
    this.map.fitBounds(b);
    google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => { if (this.map.getZoom() > 15) this.map.setZoom(15); });
  }

  clear() { this.markers.forEach(m => m.setMap(null)); this.markers = []; }

  showMapFallback() {
    const el = document.getElementById('google-map') || document.querySelector('.map-container');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:320px;background:#f3f4f6;border-radius:10px;border:2px dashed #e5e7eb"><div style="text-align:center;color:#6b7280"><div style="font-size:42px;margin-bottom:8px">🗺️</div><div>Google Maps is loading…</div></div></div>`;
  }
  showMapError() {
    const el = document.getElementById('google-map') || document.querySelector('.map-container');
    if (!el) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#dc3545;color:#fff;padding:10px 14px;border-radius:8px;z-index:10;font-size:13px';
    overlay.textContent = 'Failed to load map markers';
    el.style.position = 'relative';
    el.appendChild(overlay);
    setTimeout(() => overlay.remove(), 4000);
  }
  refreshWithFilters() { if (this.isInitialized) this.loadMarkers(); }
}
const mapsController = new GoogleMapsController();

/* ============ Homepage ============ */
class HomepageController {
  constructor() { this.refreshInterval = null; }

  async initialize() {
    try {
      this._wireUI();
      this._clearTopStats();
      const ok = await api.checkHealth();
      if (!ok) throw new Error('Backend down');

      AppState.user = await api.getMe();
      this._applyRole(AppState.user);

      await Promise.all([this._loadDashboard(), this._loadMapStats()]);
      this._initMapsWithRetry();
      this._autoRefresh();
    } catch {
      this._topError();
      this._initMapsWithRetry();
    }
  }

  _initMapsWithRetry() {
    let tries = 0; const max = 10;
    const loop = async () => {
      if (typeof google !== 'undefined' && google.maps) return mapsController.initializeMap();
      tries++; if (tries < max) setTimeout(loop, 800); else mapsController.showMapFallback();
    }; loop();
  }

  async _loadDashboard() {
    const stats = await api.getDashboardStats();
    AppState.dashboardStats = stats;
    this._renderTopStats(stats);
    const issues = await api.getIssueTypeStats();
    this._renderCommonIssueCounts(issues);
  }

  async _loadMapStats() {
    const [districts, issues] = await Promise.all([api.getDistrictStats(), api.getIssueTypeStats()]);
    this._renderMapStats(districts, issues);
  }

  /* UI wiring */
  _wireUI() { this._initDateInputs(); this._initFilters(); this._initButtons(); this._observeCounters(); }

  _initDateInputs() {
    const inputs = document.querySelectorAll('.date-input');
    inputs.forEach((input, idx) => {
      input.type = 'text'; input.maxLength = 10;
      input.placeholder = idx === 0 ? 'Start Date (mm/dd/yyyy)' : 'End Date (mm/dd/yyyy)';
      input.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length >= 2) v = v.slice(0,2)+'/'+v.slice(2);
        if (v.length >= 5) v = v.slice(0,5)+'/'+v.slice(5,9);
        e.target.value = v;
      });
      input.addEventListener('blur', e => {
        const ok = /^\d{2}\/\d{2}\/\d{4}$/.test(e.target.value);
        if (ok) { if (idx === 0) currentFilters.startDate = e.target.value; else currentFilters.endDate = e.target.value;
          mapsController.refreshWithFilters(); this._loadMapStats(); }
      });
    });
  }

  _initFilters() {
    const districtSelect = document.querySelector('.district-select');
    if (districtSelect) {
      districtSelect.addEventListener('change', e => {
        currentFilters.district = e.target.value || '';
        mapsController.refreshWithFilters(); this._loadMapStats();
      });
    }
    const boxes = document.querySelectorAll('input[name="issue-type"]');
    boxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const selected = Array.from(boxes).filter(x => x.checked).map(x => x.value);
        if (!selected.length) return;
        currentFilters.issueTypes = selected;
        mapsController.refreshWithFilters(); this._loadMapStats();
      });
    });
  }

  _initButtons() {
    const shareBtn = document.querySelector('.share-report-btn');
    const pdfBtn = document.querySelector('.export-pdf-btn');
    if (shareBtn) shareBtn.addEventListener('click', () => this._share());
    if (pdfBtn) pdfBtn.addEventListener('click', () => this._exportPDF());
  }

  /* Rendering */
  _clearTopStats() { document.querySelectorAll('.stat-card .stat-number').forEach(n => { n.textContent='--'; n.style.color='#dc2626'; }); }

  _renderTopStats(s) {
    const nums = document.querySelectorAll('.stat-card .stat-number');
    const vals = [s.totalReports ?? 0, s.resolved ?? 0, s.inProgress ?? 0];
    nums.forEach((el,i)=>this._animateNumber(el, Number(vals[i]||0)));
  }

  _renderMapStats(districts, issues) {
    const cards = document.querySelectorAll('.map-stat-card .map-stat-content');
    if (cards.length < 4) return;

    const actKey = (currentFilters.district || Object.keys(districts)[0] || '').toLowerCase();
    const act = districts[actKey];
    cards[0].innerHTML = `<div class="resolution-percentage">${act ? (act.name || 'District') : 'No data'}</div>`;

    let topName = 'No data', max = -1;
    Object.entries(issues).forEach(([k, v]) => {
      if (currentFilters.issueTypes.includes(k) && (v.count || 0) > max) { max = v.count; topName = v.name; }
    });
    cards[1].innerHTML = `<div class="resolution-percentage">${topName}</div>`;

    let total = 0, done = 0;
    Object.entries(issues).forEach(([k, v]) => {
      if (currentFilters.issueTypes.includes(k)) { total += v.count || 0; done += v.resolved || 0; }
    });
    const rate = total ? Math.round((done / total) * 100) : 0;
    cards[2].innerHTML = `<div class="resolution-percentage">${rate}%</div>`;

    const trend = AppState.dashboardStats?.weeklyTrend || '—';
    cards[3].innerHTML = `<div class="resolution-percentage">${trend}</div>`;
  }

  _renderCommonIssueCounts(issueData) {
    if (!issueData) return;
    const setIfExists = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = typeof val==='number' ? val.toLocaleString() : (val || '--'); };
    setIfExists('#count-potholes, .issue-count[data-type="pothole"]', issueData.pothole?.count);
    setIfExists('#count-lighting, .issue-count[data-type="lighting"]', issueData.lighting?.count);
    setIfExists('#count-drainage, .issue-count[data-type="drainage"]', issueData.drainage?.count);
    setIfExists('#count-traffic, .issue-count[data-type="traffic"]', issueData.traffic?.count);
  }

  /* Role & UX */
  _applyRole(user) {
    const role = (user?.role || 'public').toLowerCase();
    document.documentElement.setAttribute('data-role', role);
    const badge = document.querySelector('.user-role-badge');
    if (badge) badge.textContent = role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'Visitor';
  }

  /* Share & PDF */
  _share() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: 'CityFix', text: 'CityFix dashboard', url }).catch(()=>{});
    else navigator.clipboard.writeText(url).then(()=>this._toast('Link copied','success')).catch(()=>this._toast('Copy failed','error'));
  }
  async _exportPDF() {
    try {
      if (!window.jspdf) await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      if (!window.html2canvas) await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      const [stats, issues, districts] = await Promise.all([api.getDashboardStats(), api.getIssueTypeStats(), api.getDistrictStats()]);
      const { jsPDF } = window.jspdf; const pdf = new jsPDF('p','mm','a4');
      let y = 20;
      pdf.setFontSize(24); pdf.setTextColor(79,70,229); pdf.text('CityFix',20,y);
      pdf.setFontSize(16); pdf.setTextColor(124,58,237); pdf.text('Community Report Dashboard',20,y+10); y+=25;
      pdf.setFontSize(12); pdf.setTextColor(100,116,139); pdf.text(`Generated: ${new Date().toLocaleString()}`,20,y); y+=14;
      pdf.setFontSize(18); pdf.setTextColor(30,41,59); pdf.text('Issue Statistics Overview',20,y); y+=12;
      pdf.setFontSize(12);
      [['Total Reports', (stats.totalReports||0).toLocaleString()],['Resolved',(stats.resolved||0).toLocaleString()],['In Progress',(stats.inProgress||0).toLocaleString()],['Resolution Rate',`${stats.resolutionRate||0}%`]].forEach(([k,v])=>{pdf.text(k+':',20,y);pdf.text(String(v),80,y);y+=7;});
      y+=6; pdf.setFontSize(18); pdf.text('Issue Categories Breakdown',20,y); y+=12; pdf.setFontSize(12);
      Object.values(issues).forEach(it=>{ const pct = it.count ? Math.round((it.resolved/it.count)*100) : 0; pdf.text(`${it.name}: ${it.count} total (${pct}% resolved)`,20,y); y+=7; });
      y+=6; pdf.setFontSize(18); pdf.text('District Performance',20,y); y+=12; pdf.setFontSize(12);
      Object.values(districts).forEach(d=>{ const r = d.reports ? Math.round((d.resolved/d.reports)*100) : 0; pdf.text(`${d.name}: ${d.reports} reports, ${r}% resolved`,20,y); y+=7; });
      if (y>200){ pdf.addPage(); y=20; }
      pdf.setFontSize(16); pdf.text('Issue Distribution Map',20,y); y+=10;
      const mapEl = document.getElementById('google-map') || document.querySelector('.map-container');
      if (mapEl && window.html2canvas){ const canvas = await window.html2canvas(mapEl,{useCORS:true,backgroundColor:'#fff',scale:1}); const img = canvas.toDataURL('image/png'); const w=170; const h=(canvas.height*w)/canvas.width; pdf.addImage(img,'PNG',20,y,w,Math.min(h,140)); y+=Math.min(h,140)+6; }
      pdf.setFontSize(10); pdf.setTextColor(156,163,175); pdf.text('Generated by CityFix',105,290,{align:'center'});
      pdf.save(`CityFix_Report_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`);
      this._toast('PDF exported','success');
    } catch { this._toast('PDF export failed','error'); }
  }

  /* Helpers */
  _observeCounters() {
    const els = document.querySelectorAll('.stat-number');
    const io = new IntersectionObserver(entries => {
      const s = AppState.dashboardStats;
      entries.forEach(e => {
        if (!e.isIntersecting || !s) return;
        const idx = Array.from(els).indexOf(e.target);
        const vals = [s.totalReports, s.resolved, s.inProgress];
        this._animateNumber(e.target, Number(vals[idx] || 0));
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }
  _animateNumber(el, target, duration = 1200) {
    if (!el) return;
    const steps = Math.max(1, Math.floor(duration / 16)); let i = 0;
    const step = () => { i++; const val = Math.round(target * (i / steps)); el.textContent = val.toLocaleString(); if (i < steps) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  _autoRefresh() {
    if (!AppState.backendAvailable) return;
    this.refreshInterval = setInterval(async () => {
      try { await this._loadDashboard(); if (mapsController.isInitialized) await mapsController.refreshWithFilters(); await this._loadMapStats(); }
      catch { clearInterval(this.refreshInterval); }
    }, 30000);
  }
  _loadScript(src) {
    return new Promise((resolve, reject) => { const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  }
  _topError() {
    const banner = document.createElement('div');
    banner.textContent = 'Cannot connect to server. Make sure the backend is running.';
    banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#fee2e2;color:#dc2626;padding:10px 16px;border-radius:10px;z-index:999;box-shadow:0 6px 20px rgba(220,38,38,.25);font-weight:600';
    document.body.appendChild(banner); setTimeout(()=>banner.remove(),6000);
  }
  _toast(msg, type='info') {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:20px;right:20px;padding:10px 14px;border-radius:8px;color:#fff;z-index:1000;background:${type==='success'?'#10b981':type==='error'?'#ef4444':'#3b82f6'};box-shadow:0 8px 20px rgba(0,0,0,.15)`;
    document.body.appendChild(el); setTimeout(()=>el.remove(),3000);
  }
}
const homepage = new HomepageController();

/* ============ Boot ============ */
window.initializeGoogleMap = () => mapsController.initializeMap();
window.initMap = window.initializeGoogleMap;

document.addEventListener('DOMContentLoaded', () => {
  // preload optional libs for PDF
  const s1 = document.createElement('script'); s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(s1);
  const s2 = document.createElement('script'); s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; document.head.appendChild(s2);
  homepage.initialize();
});

// expose (optional)
window.homepage = homepage;
window.mapsController = mapsController;
window.apiService = api;
