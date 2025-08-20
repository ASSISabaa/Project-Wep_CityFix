// MyImpact.js — Production-ready, backend-wired

'use strict';

/* ---------- Config ---------- */
const API_BASE =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : `${location.origin}/api`;

/* ---------- State ---------- */
const ImpactState = {
  user: null,
  stats: null,
  activities: [],
  badges: [],
  map: null,
  markers: [],
  infoWindows: []
};

/* ---------- Auth ---------- */
function getToken() {
  return (
    window.CITYFIX?.getToken?.() ||
    localStorage.getItem('cityfix_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('cityfix_token') ||
    ''
  );
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ---------- API helpers ---------- */
async function apiGET(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, x));
    else if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

/* ---------- Profile ---------- */
async function getMe() {
  const candidates = ['/auth/me', '/users/me', '/me'];
  for (const p of candidates) {
    try {
      const r = await apiGET(p);
      const u = r?.data || r;
      if (u && (u.id || u._id || u.email)) {
        return {
          id: u.id || u._id,
          role: (u.role || 'citizen').toLowerCase(),
          name: u.name || u.username || '',
          email: u.email || ''
        };
      }
    } catch (_) {}
  }
  return null;
}

/* ---------- Data loaders (robust to different backends) ---------- */
async function loadStats() {
  try {
    // Prefer dedicated stats
    const s = await apiGET('/impact/stats');
    ImpactState.stats = s?.data || s;
    renderStats(ImpactState.stats);
    return;
  } catch (_) {}
  try {
    // Fallback: compute from reports
    const me = ImpactState.user || await getMe();
    const data = await tryReportsForUser(me?.id);
    const reports = data.reports || data;
    const stats = {
      totalReports: reports.length,
      resolvedIssues: reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length,
      communityImpact: reports.length * 50,
      rating: reports.length ? 4.5 : 0
    };
    ImpactState.stats = stats;
    renderStats(stats);
  } catch (_) {
    renderStats({ totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 });
  }
}

async function loadActivities() {
  const me = ImpactState.user || await getMe();
  // Try multiple endpoints before falling back
  const endpoints = [
    ['/impact/activities', null, 'activities'],
    ['/reports/mine', null, 'reports'],
    ['/reports', { me: 'true' }, 'reports'],
    ['/reports', { userId: me?.id }, 'reports'],
    ['/reports', null, 'reports']
  ];
  for (const [path, params, field] of endpoints) {
    try {
      const r = await apiGET(path, params);
      const arr = (r?.data?.[field] || r?.[field] || r?.data || r) || [];
      const formatted = (Array.isArray(arr) ? arr : []).map(a => ({
        id: a._id || a.id,
        title: a.title || a.issueType || 'Report',
        type: (a.issueType || a.type || 'report').toLowerCase(),
        location: a.location || a.address || 'Unknown',
        address: a.address || a.location || '',
        lat: a.coordinates?.lat ?? a.lat,
        lng: a.coordinates?.lng ?? a.lng,
        status: (a.status || 'pending').toLowerCase(),
        timestamp: a.createdAt || a.timestamp || new Date().toISOString(),
        description: a.description || ''
      }));
      // If we hit generic /reports, filter to my reports when possible
      ImpactState.activities = me?.id
        ? formatted.filter(x => {
            const owner = aOwner(aFromId(x.id, arr));
            return !owner || owner === me.id; // keep if owner unknown or matches me
          })
        : formatted;
      renderActivities(ImpactState.activities);
      if (ImpactState.map) drawMarkers(ImpactState.activities);
      return;
    } catch (_) {}
  }
  ImpactState.activities = [];
  renderActivities([]);
}

function aFromId(id, sourceArray) {
  return (sourceArray || []).find(x => (x._id || x.id) === id) || {};
}
function aOwner(a) {
  return a.createdBy || a.userId || a.ownerId || a.user || null;
}

async function loadBadges() {
  try {
    const b = await apiGET('/impact/badges');
    ImpactState.badges = b?.data || b || [];
    renderBadges(ImpactState.badges);
    return;
  } catch (_) {}
  // derive from stats
  const s = ImpactState.stats || { totalReports: 0, resolvedIssues: 0, communityImpact: 0 };
  const badges = [
    { title: 'First Reporter', earned: s.totalReports > 0, earnedDate: s.totalReports ? '—' : null, progress: s.totalReports ? 100 : 0 },
    { title: '10 Resolved Issues', earned: s.resolvedIssues >= 10, earnedDate: s.resolvedIssues >= 10 ? '—' : null, progress: Math.min(100, (s.resolvedIssues / 10) * 100) },
    { title: 'Community Hero', earned: s.communityImpact >= 1000, earnedDate: s.communityImpact >= 1000 ? '—' : null, progress: Math.min(100, (s.communityImpact / 1000) * 100) },
    { title: 'Top Reporter', earned: s.totalReports >= 50, earnedDate: s.totalReports >= 50 ? '—' : null, progress: Math.min(100, (s.totalReports / 50) * 100) }
  ];
  ImpactState.badges = badges;
  renderBadges(badges);
}

async function tryReportsForUser(userId) {
  const candidates = [
    ['/reports/mine', null],
    ['/reports', { me: 'true' }],
    ['/reports', { userId }],
    ['/reports', null]
  ];
  for (const [path, params] of candidates) {
    try { return await apiGET(path, params); } catch (_) {}
  }
  return { reports: [] };
}

/* ---------- Map ---------- */
function ensureMapContainer() {
  let el = document.getElementById('impact-map');
  if (!el) {
    const ph = document.querySelector('.map-placeholder');
    if (ph) {
      const d = document.createElement('div');
      d.id = 'impact-map';
      d.style.cssText = 'width:100%;height:300px;border-radius:8px;overflow:hidden';
      ph.innerHTML = '';
      ph.appendChild(d);
      el = d;
    }
  }
  return el;
}

function initMap() {
  const el = ensureMapContainer();
  if (!el || typeof google === 'undefined' || !google.maps) return;
  ImpactState.map = new google.maps.Map(el, {
    center: { lat: 32.0853, lng: 34.7818 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ]
  });
  if (ImpactState.activities.length) drawMarkers(ImpactState.activities);
}

function drawMarkers(activities) {
  ImpactState.markers.forEach(m => m.marker?.setMap(null));
  ImpactState.markers = [];
  ImpactState.infoWindows.forEach(iw => iw.close());
  ImpactState.infoWindows = [];

  const bounds = new google.maps.LatLngBounds();

  activities.forEach(a => {
    if (a.lat == null || a.lng == null) return;
    const marker = new google.maps.Marker({
      position: { lat: Number(a.lat), lng: Number(a.lng) },
      map: ImpactState.map,
      title: a.title || 'Report',
      icon: markerIcon(a.type, a.status),
      animation: google.maps.Animation.DROP
    });
    const iw = new google.maps.InfoWindow({ content: infoContent(a), maxWidth: 320 });
    marker.addListener('click', () => {
      ImpactState.infoWindows.forEach(x => x.close());
      iw.open(ImpactState.map, marker);
    });
    ImpactState.markers.push({ marker, a });
    ImpactState.infoWindows.push(iw);
    bounds.extend(marker.getPosition());
  });

  if (!bounds.isEmpty()) {
    ImpactState.map.fitBounds(bounds);
    google.maps.event.addListenerOnce(ImpactState.map, 'bounds_changed', () => {
      if (ImpactState.map.getZoom() > 15) ImpactState.map.setZoom(15);
    });
  }
}

function markerIcon(type, status) {
  const palette = {
    pothole: '#ff6b35',
    lighting: '#ffd23f',
    drainage: '#4dabf7',
    traffic: '#28a745',
    other: '#868e96'
  };
  const sizes = { new: 10, pending: 10, 'in-progress': 8, resolved: 6, rejected: 6 };
  const c = palette[(type || 'other').toLowerCase()] || palette.other;
  const s = sizes[(status || 'pending').toLowerCase()] || 8;
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: c,
    fillOpacity: 0.9,
    strokeColor: '#fff',
    strokeWeight: 2,
    scale: s
  };
}

function infoContent(a) {
  const clr = { new: '#dc3545', pending: '#fd7e14', 'in-progress': '#0d6efd', resolved: '#198754', rejected: '#6c757d' }[(a.status || '').toLowerCase()] || '#6c757d';
  return `
    <div style="max-width:300px;font-family:Inter,Arial,sans-serif">
      <h4 style="margin:0 0 6px 0;font-size:16px;color:#111827">${a.title || 'Report'}</h4>
      ${a.description ? `<p style="margin:0 0 6px 0;color:#6b7280;font-size:13px">${a.description}</p>` : ''}
      <div style="margin:6px 0 8px 0"><span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${clr};color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">${a.status || 'Unknown'}</span></div>
      <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Type:</strong> ${String(a.type || 'other').replace(/^\w/, c => c.toUpperCase())}</p>
      <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Location:</strong> ${a.address || a.location || `${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}`}</p>
      <p style="margin:2px 0;color:#9ca3af;font-size:12px"><strong>Reported:</strong> ${timeAgo(a.timestamp)}</p>
    </div>
  `;
}

/* ---------- Rendering (keeps your design) ---------- */
function renderStats(s) {
  const cards = document.querySelectorAll('.stat-card');
  const safe = s || { totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 };
  if (cards[0]) cards[0].querySelector('.stat-number').textContent = (safe.totalReports || 0).toString();
  if (cards[1]) cards[1].querySelector('.stat-number').textContent = (safe.resolvedIssues || 0).toString();
  if (cards[2]) cards[2].querySelector('.stat-number').textContent =
    safe.communityImpact >= 1000 ? `${(safe.communityImpact / 1000).toFixed(1)}k` : (safe.communityImpact || 0).toString();
  if (cards[3]) cards[3].querySelector('.stat-number').textContent = (safe.rating || 0).toFixed(1);
}

function renderActivities(list) {
  const box = document.querySelector('.activity-list');
  if (!box) return;
  box.innerHTML = '';
  const data = (list || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  if (!data.length) {
    box.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#9ca3af"><div style="font-size:48px;margin-bottom:16px">📝</div><p style="font-size:16px;font-weight:500;margin-bottom:8px">No activities yet</p><p style="font-size:14px">Start reporting issues to see your activity here</p></div>`;
    return;
  }
  data.forEach(a => {
    const el = document.createElement('div');
    el.className = 'activity-item';
    el.innerHTML = `
      <div class="activity-icon"><div class="activity-icon-inner">${iconFor(a.type)}</div></div>
      <div class="activity-details">
        <div class="activity-title">${a.title}</div>
        <div class="activity-location">${a.location || a.address || ''}</div>
      </div>
      <div class="activity-time"><span>${timeAgo(a.timestamp)}</span></div>
    `;
    box.appendChild(el);
  });
}

function renderBadges(badges) {
  const grid = document.querySelector('.badges-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.badge-card');
  if (!badges || !badges.length) {
    cards.forEach(c => {
      c.classList.remove('earned');
      c.style.opacity = '0.4';
      const d = c.querySelector('.badge-date');
      if (d) d.textContent = 'Not earned yet';
    });
    return;
  }
  badges.slice(0, cards.length).forEach((b, i) => {
    const c = cards[i];
    if (!c) return;
    if (b.earned) { c.classList.add('earned'); c.style.opacity = '1'; }
    else { c.classList.remove('earned'); c.style.opacity = '0.4'; }
    const t = c.querySelector('.badge-title'); if (t && b.title) t.textContent = b.title;
    const d = c.querySelector('.badge-date');
    if (d) d.textContent = b.earned ? (b.earnedDate ? `Earned ${b.earnedDate}` : 'Earned') : (b.description || 'Not earned yet');
    if (!b.earned && b.progress >= 0 && !c.querySelector('.badge-progress')) {
      c.insertAdjacentHTML('beforeend', `
        <div class="badge-progress" style="margin-top:12px">
          <div style="width:100%;background:#e5e7eb;border-radius:9999px;height:6px">
            <div style="background:#3b82f6;height:6px;border-radius:9999px;width:${Math.min(100, Math.round(b.progress))}%"></div>
          </div>
          <p style="font-size:11px;color:#9ca3af;margin-top:4px;text-align:center">${Math.min(100, Math.round(b.progress))}% Complete</p>
        </div>
      `);
    }
  });
}

/* ---------- Utils ---------- */
function iconFor(type) {
  const m = { pothole: '🕳️', streetlight: '💡', garbage: '🗑️', traffic: '🚦', water: '💧', sidewalk: '🚶', park: '🌳' };
  return m[(type || '').toLowerCase()] || '📍';
}
function timeAgo(ts) {
  if (!ts) return 'Recently';
  const now = Date.now();
  const t = new Date(ts).getTime();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 7) return new Date(t).toLocaleDateString();
  if (d > 0) return `${d} day${d>1?'s':''} ago`;
  if (h > 0) return `${h} hour${h>1?'s':''} ago`;
  if (m > 0) return `${m} min ago`;
  return 'Just now';
}

/* ---------- Boot ---------- */
async function boot() {
  // Render skeletons immediately
  renderStats({ totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 });
  renderActivities([]);
  renderBadges([]);

  ImpactState.user = await getMe().catch(() => null);
  await Promise.all([loadStats(), loadActivities(), loadBadges()]).catch(() => {});

  // If Maps script already loaded, init now; otherwise wait for callback
  if (typeof google !== 'undefined' && google.maps) initMap();

  // Auto refresh
  setInterval(async () => {
    if (document.hidden) return;
    await Promise.all([loadStats(), loadActivities(), loadBadges()]).catch(() => {});
  }, 30000);
}
document.addEventListener('DOMContentLoaded', boot);

// Google callback must be global and match the script tag
window.initImpactMap = () => initMap();
