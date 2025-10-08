// MyImpact.js
'use strict';

const API_BASE = `${location.origin}/api`;


const ImpactState = {
  user: null,
  stats: null,
  activities: [],
  badges: [],
  map: null,
  geocoder: null,
  markers: [],
  markersById: new Map(),
  infoWindows: [],
  clusterer: null
};

/* --------------- identity --------------- */
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

function decodeJWT() {
  const t = getToken();
  if (!t || !t.includes('.')) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload || null;
  } catch { return null; }
}

function fallbackEmail() {
  return (
    window.USER_PROFILE?.email ||
    localStorage.getItem('user_email') ||
    localStorage.getItem('email') ||
    sessionStorage.getItem('user_email') ||
    sessionStorage.getItem('email') ||
    ''
  );
}

async function getMe() {
  const j = decodeJWT();
  if (j) {
    return {
      id: j.userId || j.id || j.sub || null,
      role: (j.role || 'citizen').toLowerCase(),
      name: j.name || j.username || '',
      email: j.email || j.user_email || fallbackEmail() || ''
    };
  }
  const email = fallbackEmail();
  if (email) return { id: null, role: 'citizen', name: '', email };
  return null;
}

/* --------------- http --------------- */
async function apiGET(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, x));
    else if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  
  console.log('Fetching:', url.toString());
  
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include'
  });
  
  if (!res.ok) {
    console.error(`API Error ${res.status} for ${path}`);
    throw new Error(`HTTP ${res.status}`);
  }
  
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

/* --------------- formatting --------------- */
function S(v) { return String(v ?? '').trim(); }

function formatLocation(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return S(loc);
  const parts = [
    loc.address || loc.formattedAddress || '',
    [loc.houseNumber || loc.housenumber, loc.street || loc.streetName || loc.road].filter(Boolean).join(' '),
    loc.neighborhood || loc.district || '',
    loc.city || loc.town || loc.village || loc.municipality || '',
    loc.state || '',
    loc.country || '',
    loc.postcode || loc.zip || ''
  ].flat().map(S).filter(Boolean);
  const seen = new Set();
  return parts.filter(p => (p && !seen.has(p) && seen.add(p))).join(', ');
}

function asLocationText(x) { return typeof x === 'string' ? S(x) : formatLocation(x); }

function titleWithAt(base, address) {
  const b = S(base), a = S(address);
  if (!a) return b || 'Report';
  return b.includes(' at ') ? b : `${b} at ${a}`;
}

/* --------------- normalize --------------- */
function normalizeReport(a) {
  const type = (a.issueType || a.type || 'report').toLowerCase();
  const lat = a.coordinates?.lat ?? a.location?.lat ?? a.lat ?? null;
  const lng = a.coordinates?.lng ?? a.location?.lng ?? a.lng ?? a.lon ?? null;

  const ownerObj = a.createdBy || a.user || a.owner || a.reporter || a.author || null;
  const ownerId = ownerObj?._id || ownerObj?.id || a.userId || a.ownerId || a.createdById || null;
  const ownerEmail = ownerObj?.email || a.reporterEmail || a.userEmail || a.email || a.contactEmail || null;

  const addressRaw = a.address || a.location?.address || a.location?.name || a.location || '';
  const address = formatLocation(addressRaw);

  const baseTitle = a.title || a.issueTitle || type.charAt(0).toUpperCase() + type.slice(1);
  const title = titleWithAt(baseTitle, address);

  return {
    id: a._id || a.id,
    title,
    type,
    location: address || (lat != null && lng != null ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Unknown'),
    address,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    status: (a.status || 'pending').toLowerCase(),
    timestamp: a.updatedAt || a.createdAt || a.timestamp || a.date || new Date().toISOString(),
    description: a.description || '',
    ownerId: ownerId ? String(ownerId) : null,
    ownerEmail: ownerEmail ? String(ownerEmail).toLowerCase() : null,
    _raw: a
  };
}

function isMine(item, me) {
  // Always return true to show all reports
  return true;
}

/* --------------- data --------------- */
async function fetchReportsFor(me) {
  const candidates = [
    ['/reports', null],
    ['/reports', { limit: 500, sort: 'desc' }],
    ['/issues', null],
    ['/data/reports', null]
  ];
  
  for (const [path, params] of candidates) {
    try {
      const r = await apiGET(path, params);
      const arr = (r?.data?.reports || r?.reports || r?.data || r) || [];
      if (Array.isArray(arr)) {
        console.log(`Success: Found ${arr.length} reports from ${path}`);
        return arr;
      }
    } catch (err) {
      console.log(`Failed ${path}:`, err.message);
    }
  }
  
  console.warn('All API endpoints failed, returning empty array');
  return [];
}

async function loadActivities() {
  try {
    console.log('Loading activities...');
    const rawList = await fetchReportsFor(ImpactState.user);
    
    if (!rawList || rawList.length === 0) {
      console.log('No reports found');
      ImpactState.activities = [];
      renderActivities([]);
      return;
    }
    
    const formatted = rawList.map(a => normalizeReport(a));
    ImpactState.activities = formatted;
    
    console.log(`Loaded ${formatted.length} activities`);
    renderActivities(formatted);
    
    if (ImpactState.map) {
      drawMarkers(formatted);
      if (formatted.length > 0) {
        focusLatest(formatted);
      }
    }
  } catch (err) {
    console.error('Error loading activities:', err);
    ImpactState.activities = [];
    renderActivities([]);
  }
}

async function loadStats() {
  try {
    console.log('Loading stats...');
    
    // Try to get stats from API first
    try {
      const raw = await apiGET('/reports/statistics', null);
      const s = raw?.data || raw || {};
      
      ImpactState.stats = {
        totalReports: Number(s.totalReports || s.total || 0),
        resolvedIssues: Number(s.resolvedIssues || s.resolved || 0),
        communityImpact: Number(s.communityImpact || (s.totalReports || 0) * 50 || 0),
        rating: Number(s.rating || 0)
      };
      
      renderStats(ImpactState.stats);
      return;
    } catch {}
    
    // Calculate from activities if API fails
    await loadActivities();
    const list = ImpactState.activities;
    const stats = {
      totalReports: list.length,
      resolvedIssues: list.filter(r => r.status === 'resolved').length,
      communityImpact: list.length * 50,
      rating: 0
    };
    
    ImpactState.stats = stats;
    renderStats(stats);
  } catch (err) {
    console.error('Error loading stats:', err);
    const zeros = { totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 };
    ImpactState.stats = zeros;
    renderStats(zeros);
  }
}

async function loadBadges() {
  const s = ImpactState.stats || { totalReports: 0, resolvedIssues: 0, communityImpact: 0 };
  const defs = [
    { key: 'first', title: 'First Reporter', earned: s.totalReports > 0, progress: s.totalReports ? 100 : 0 },
    { key: 'resolved10', title: '10 Resolved Issues', earned: s.resolvedIssues >= 10, progress: Math.min(100, (s.resolvedIssues / 10) * 100) },
    { key: 'impact1k', title: 'Community Hero', earned: s.communityImpact >= 1000, progress: Math.min(100, (s.communityImpact / 1000) * 100) },
    { key: 'top50', title: 'Top Reporter', earned: s.totalReports >= 50, progress: Math.min(100, (s.totalReports / 50) * 100) }
  ];
  ImpactState.badges = defs.sort((a,b) => (Number(b.earned) - Number(a.earned)) || (b.progress - a.progress));
  renderBadges(ImpactState.badges);
}

/* --------------- map --------------- */
function ensureMapContainer() {
  let el = document.getElementById('impact-map');
  if (!el) {
    const ph = document.querySelector('.map-placeholder');
    if (ph) {
      ph.textContent = '';
      const d = document.createElement('div');
      d.id = 'impact-map';
      d.style.cssText = 'width:100%;height:380px;border-radius:12px;overflow:hidden;background:#fff;border:1px solid #e5e7eb';
      ph.appendChild(d);
      el = d;
    }
  }
  return el;
}

function initMap() {
  const el = ensureMapContainer();
  if (!el || typeof google === 'undefined' || !google.maps) {
    console.warn('Google Maps not available');
    return;
  }

  ImpactState.map = new google.maps.Map(el, {
    center: { lat: 32.0853, lng: 34.7818 },
    zoom: 12,
    gestureHandling: 'greedy',
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ]
  });

  ImpactState.geocoder = new google.maps.Geocoder();

  if (ImpactState.activities.length) {
    drawMarkers(ImpactState.activities);
    focusLatest(ImpactState.activities);
  }
}

function drawMarkers(activities) {
  if (!ImpactState.map) return;
  
  ImpactState.markers.forEach(m => m.marker?.setMap?.(null));
  ImpactState.markers = [];
  ImpactState.markersById.clear();
  ImpactState.infoWindows.forEach(iw => iw.close());
  ImpactState.infoWindows = [];
  if (ImpactState.clusterer?.clearMarkers) ImpactState.clusterer.clearMarkers();

  const bounds = new google.maps.LatLngBounds();
  let hasValidMarkers = false;

  activities.forEach(a => {
    if (a.lat == null || a.lng == null) return;
    const pos = { lat: Number(a.lat), lng: Number(a.lng) };
    
    const marker = new google.maps.Marker({ 
      position: pos, 
      map: ImpactState.map, 
      title: a.title || 'Report', 
      icon: legacyIcon(a.type, a.status), 
      animation: google.maps.Animation.DROP 
    });

    const iw = new google.maps.InfoWindow({ content: infoContent(a), maxWidth: 320 });
    marker.addListener('click', () => {
      ImpactState.infoWindows.forEach(x => x.close());
      iw.open(ImpactState.map, marker);
    });

    ImpactState.markers.push({ marker, a, iw });
    ImpactState.markersById.set(String(a.id), { marker, iw, a });
    ImpactState.infoWindows.push(iw);
    bounds.extend(pos);
    hasValidMarkers = true;

    if (!a.address && ImpactState.geocoder) {
      ImpactState.geocoder.geocode({ location: pos }, (res, status) => {
        if (status === 'OK' && res?.[0]?.formatted_address) {
          a.address = res[0].formatted_address;
          a.location = a.address;
          iw.setContent(infoContent(a));
          renderActivities(ImpactState.activities);
        }
      });
    }
  });

  if (window.markerClusterer && ImpactState.markers.length > 0) {
    ImpactState.clusterer = new markerClusterer.MarkerClusterer({
      map: ImpactState.map,
      markers: ImpactState.markers.map(m => m.marker)
    });
  }

  if (hasValidMarkers && !bounds.isEmpty()) {
    ImpactState.map.fitBounds(bounds);
    google.maps.event.addListenerOnce(ImpactState.map, 'bounds_changed', () => {
      if (ImpactState.map.getZoom() > 15) ImpactState.map.setZoom(15);
    });
  }
}

function focusLatest(list) {
  if (!list?.length || !ImpactState.map) return;
  const latest = [...list].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  const ref = ImpactState.markersById.get(String(latest.id));
  if (ref?.marker && latest.lat != null && latest.lng != null) {
    ImpactState.map.panTo({ lat: Number(latest.lat), lng: Number(latest.lng) });
    ImpactState.map.setZoom(Math.max(14, ImpactState.map.getZoom() || 14));
    setTimeout(() => {
      ImpactState.infoWindows.forEach(x => x.close());
      ref.iw.open(ImpactState.map, ref.marker);
    }, 500);
  }
}

function colorForType(type) {
  const palette = { 
    pothole: '#ff6b35', 
    lighting: '#ffd23f', 
    streetlight: '#ffd23f', 
    drainage: '#4dabf7', 
    traffic: '#28a745', 
    garbage: '#9b59b6', 
    water: '#00bcd4', 
    sidewalk: '#8d6e63', 
    park: '#2ecc71', 
    other: '#868e96' 
  };
  return palette[(type || 'other').toLowerCase()] || palette.other;
}

function legacyIcon(type, status) {
  const c = colorForType(type);
  const sizes = { new: 10, pending: 10, 'in-progress': 8, resolved: 6, rejected: 6 };
  const s = sizes[(status || 'pending').toLowerCase()] || 8;
  return { 
    path: google.maps.SymbolPath.CIRCLE, 
    fillColor: c, 
    fillOpacity: 0.95, 
    strokeColor: '#fff', 
    strokeWeight: 2, 
    scale: s 
  };
}

function infoContent(a) {
  const clr = { 
    new: '#dc3545', 
    pending: '#fd7e14', 
    'in-progress': '#0d6efd', 
    resolved: '#198754', 
    rejected: '#6c757d' 
  }[(a.status || '').toLowerCase()] || '#6c757d';
  
  return `
    <div style="max-width:300px;font-family:Inter,Arial,sans-serif">
      <h4 style="margin:0 0 6px 0;font-size:16px;color:#111827">${a.title || 'Report'}</h4>
      ${a.description ? `<p style="margin:0 0 6px 0;color:#6b7280;font-size:13px">${a.description}</p>` : ''}
      <div style="margin:6px 0 8px 0">
        <span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${clr};color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">
          ${a.status || 'Unknown'}
        </span>
      </div>
      <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Type:</strong> ${String(a.type || 'other').replace(/^\w/, c => c.toUpperCase())}</p>
      <p style="margin:2px 0;color:#374151;font-size:13px"><strong>Location:</strong> ${S(a.address) || asLocationText(a.location)}</p>
      <p style="margin:2px 0;color:#9ca3af;font-size:12px"><strong>Reported:</strong> ${timeAgo(a.timestamp)}</p>
    </div>
  `;
}

/* --------------- render --------------- */
function renderStats(s) {
  const cards = document.querySelectorAll('.stat-card');
  const safe = s || { totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 };

  if (cards[0]) {
    cards[0].querySelector('.stat-number').textContent = (safe.totalReports || 0).toString();
    const lastTs = (ImpactState.activities || []).map(a => +new Date(a.timestamp)).sort((a,b)=>b-a)[0];
    const lastText = lastTs ? `Last report: ${timeAgo(lastTs)}` : 'Last report: —';
    const c = cards[0].querySelector('.stat-change'); 
    if (c) c.textContent = lastText;
  }
  
  if (cards[1]) {
    cards[1].querySelector('.stat-number').textContent = (safe.resolvedIssues || 0).toString();
    const rate = safe.totalReports ? Math.round((safe.resolvedIssues / safe.totalReports) * 100) : 0;
    const c = cards[1].querySelector('.stat-change'); 
    if (c) c.textContent = `${rate}% success rate`;
  }
  
  if (cards[2]) {
    cards[2].querySelector('.stat-number').textContent =
      safe.communityImpact >= 1000 ? `${(safe.communityImpact / 1000).toFixed(1)}k` : (safe.communityImpact || 0).toString();
  }
  
  if (cards[3]) {
    const ratingNum = Number(safe.rating || 0);
    cards[3].querySelector('.stat-number').textContent = ratingNum ? ratingNum.toFixed(1) : '—';
    const ch = cards[3].querySelector('.stat-change'); 
    if (ch) ch.textContent = ratingNum ? ch.textContent : '—';
  }
}

function renderActivities(list) {
  const box = document.querySelector('.activity-list');
  if (!box) return;
  box.innerHTML = '';
  
  const data = (list || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  
  if (!data.length) {
    box.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#9ca3af">
        <div style="font-size:48px;margin-bottom:16px">📝</div>
        <p style="font-size:16px;font-weight:500;margin-bottom:8px">No activities yet</p>
        <p style="font-size:14px">Start reporting issues to see your activity here</p>
      </div>
    `;
    return;
  }
  
  data.forEach(a => {
    const el = document.createElement('div');
    el.className = 'activity-item';
    el.dataset.id = String(a.id);
    el.style.cursor = 'pointer';
    const locText = S(a.address) || asLocationText(a.location);
    el.innerHTML = `
      <div class="activity-icon">
        <div class="activity-icon-inner">${iconFor(a.type)}</div>
      </div>
      <div class="activity-details">
        <div class="activity-title">${a.title}</div>
        <div class="activity-location">${locText}</div>
      </div>
      <div class="activity-time">
        <span>${timeAgo(a.timestamp)}</span>
      </div>
    `;
    el.addEventListener('click', () => focusActivityById(String(a.id)));
    box.appendChild(el);
  });
}

function renderBadges(badges) {
  const grid = document.querySelector('.badges-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.badge-card');
  grid.querySelectorAll('.badge-progress').forEach(n => n.remove());

  if (!badges?.length) {
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
    
    if (b.earned) { 
      c.classList.add('earned'); 
      c.style.opacity = '1'; 
    } else { 
      c.classList.remove('earned'); 
      c.style.opacity = '0.4'; 
    }
    
    const t = c.querySelector('.badge-title'); 
    if (t && b.title) t.textContent = b.title;
    
    const d = c.querySelector('.badge-date'); 
    if (d) d.textContent = b.earned ? 'Earned' : 'Not earned yet';
    
    if (!b.earned && b.progress >= 0) {
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

/* --------------- utils --------------- */
function iconFor(type) {
  const m = { 
    pothole: '🕳️', 
    streetlight: '💡', 
    lighting: '💡', 
    garbage: '🗑️', 
    traffic: '🚦', 
    water: '💧', 
    sidewalk: '🚶', 
    park: '🌳', 
    drainage: '💧' 
  };
  return m[(type || '').toLowerCase()] || '📍';
}

function timeAgo(ts) {
  const t = typeof ts === 'number' ? ts : (ts ? new Date(ts).getTime() : Date.now());
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  
  if (d > 7) return new Date(t).toLocaleDateString();
  if (d > 0) return `${d} day${d>1?'s':''} ago`;
  if (h > 0) return `${h} hour${h>1?'s':''} ago`;
  if (m > 0) return `${m} min ago`;
  return 'Just now';
}

function focusActivityById(id) {
  const ref = ImpactState.markersById.get(String(id));
  if (!ref?.marker || !ImpactState.map) return;
  const a = ref.a || ImpactState.activities.find(x => String(x.id) === String(id));
  if (a?.lat != null && a?.lng != null) {
    ImpactState.map.panTo({ lat: Number(a.lat), lng: Number(a.lng) });
    ImpactState.map.setZoom(Math.max(15, ImpactState.map.getZoom() || 15));
    ImpactState.infoWindows.forEach(x => x.close());
    ref.iw.open(ImpactState.map, ref.marker);
  }
}

/* --------------- boot --------------- */
async function boot() {
  console.log('Starting MyImpact initialization...');
  
  renderStats({ totalReports: 0, resolvedIssues: 0, communityImpact: 0, rating: 0 });
  renderActivities([]);
  renderBadges([]);

  ImpactState.user = await getMe().catch(() => null);
  console.log('User:', ImpactState.user);

  await Promise.all([
    loadStats().catch(err => console.error('Stats error:', err)),
    loadActivities().catch(err => console.error('Activities error:', err)),
    loadBadges().catch(err => console.error('Badges error:', err))
  ]);

  if (typeof google !== 'undefined' && google.maps) {
    initMap();
  } else {
    console.warn('Google Maps not loaded');
  }

  setInterval(async () => {
    if (document.hidden) return;
    await Promise.all([
      loadStats().catch(() => {}),
      loadActivities().catch(() => {}),
      loadBadges().catch(() => {})
    ]);
  }, 30000);
}

document.addEventListener('DOMContentLoaded', boot);

function initImpactMap() { initMap(); }
window.initImpactMap = initImpactMap;
window.initializeGoogleMap = initImpactMap;
window.ImpactState = ImpactState;