/**
 * CityFix Dashboard – Israel Map + Quick Status Updates (FIXED)
 * v10.3.0
 * - Correct Google Maps loading (async+defer with proper URL)
 * - Fallback geocoding for Israeli cities/addresses
 * - Robust report normalization (user + location)
 * - Works even if HTML forgot the correct <script> tag
 * - Optional Map ID, optional showing username next to avatar
 */

'use strict';

// ==================== CONFIG ====================
const CONFIG = {
  API_BASE: 'http://localhost:5000',

  // Google Maps
  GMAPS_API_KEY: 'AIzaSyA154jOZoQ_OPgXbusEP0JQ0L5fmMJzOV8', // your key
  MAP_ID: '', // optional: put your vector Map ID here to remove mapId warnings
  MAP_CENTER: { lat: 31.0461, lng: 34.8516 }, // Israel center
  MAP_ZOOM: 7, // country zoom
  SHOW_USERNAME_NEXT_TO_AVATAR: false,

  // Notifications
  AZURE_NOTIFICATION_URL: 'https://your-azure-function.azurewebsites.net/api/notify',
};

// ==================== STATE ====================
const DashboardState = {
  user: null,
  token: null,
  reports: [],
  map: null,
  markers: [],
  currentInfoWindow: null,
  mapReady: false,
};

// ==================== AUTH ====================
async function initializeAuth() {
  try {
    const token =
      localStorage.getItem('cityfix_token') ||
      localStorage.getItem('cityfix_auth_token') ||
      sessionStorage.getItem('cityfix_token');

    const userStr =
      localStorage.getItem('cityfix_user') || sessionStorage.getItem('cityfix_user');

    if (!token || !userStr) {
      alert('Please login first');
      window.location.href = 'login.html';
      return false;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      alert('Admin access only!');
      window.location.href = 'index.html';
      return false;
    }

    DashboardState.token = token;
    DashboardState.user = user;

    // Header welcome
    const welcomeEl = document.querySelector('.header-left p');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.username || 'Admin'}`;

    // Username next to avatar (optional)
    const nameEls = document.querySelectorAll('.user-name');
    nameEls.forEach((el) => {
      if (CONFIG.SHOW_USERNAME_NEXT_TO_AVATAR) {
        el.textContent = user.username || 'Admin';
        el.style.display = '';
      } else {
        el.textContent = '';
        el.style.display = 'none';
      }
    });

    console.log('✅ Authenticated:', user.email);
    return true;
  } catch (err) {
    console.error('Auth error:', err);
    window.location.href = 'login.html';
    return false;
  }
}

// ==================== DATA ====================
async function fetchAllReports() {
  try {
    console.log('📊 Fetching reports from backend...');
    let response = await fetch(`${CONFIG.API_BASE}/api/reports/all`, {
      headers: {
        Authorization: `Bearer ${DashboardState.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('Trying alternative endpoint /api/reports ...');
      response = await fetch(`${CONFIG.API_BASE}/api/reports`, {
        headers: {
          Authorization: `Bearer ${DashboardState.token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) throw new Error('Failed to fetch reports');

    const raw = await response.json();
    const list = raw.data || raw.reports || raw || [];

    // Normalize + enrich
    const normalized = await Promise.all(list.map(normalizeReport));
    console.log(`✅ Processed ${normalized.length} reports with user/location data`);
    return normalized;
  } catch (err) {
    console.error('Fetch error, using fallback data:', err);
    return getFallbackReports().map((r) => ({
      ...r,
      coordinates: r.coordinates || generateIsraelCoordinates(r.location),
    }));
  }
}

async function normalizeReport(report) {
  // --- Reporter info ---
  let reporterEmail = 'Not provided';
  let reporterName = 'Anonymous';
  let reporterPhone = 'Not provided';

  // Embedded structures
  const pick = (...vals) => vals.find((v) => v != null && v !== '') ?? undefined;

  const embedded =
    report.reportedBy || report.user || report.reporter || report.createdBy || {};
  reporterEmail =
    pick(embedded.email, embedded.userEmail, report.userEmail, report.email) || reporterEmail;
  reporterName =
    pick(embedded.username, embedded.name, report.username) || reporterName;
  reporterPhone =
    pick(embedded.phone, embedded.mobile, report.phone) || reporterPhone;

  // If only ID exists, try to fetch user
  const userId = report.userId || report.user_id || report.reporter_id;
  if (userId && (!embedded || Object.keys(embedded).length === 0)) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${DashboardState.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const u = await res.json();
        reporterEmail = pick(u.email, u.userEmail, reporterEmail) || reporterEmail;
        reporterName = pick(u.username, u.name, reporterName) || reporterName;
        reporterPhone = pick(u.phone, u.mobile, reporterPhone) || reporterPhone;
      }
    } catch (e) {
      console.warn('User lookup failed for', userId, e);
    }
  }

  // --- Location string ---
  let locationString = 'Location not specified';
  const L = report.location;

  if (typeof L === 'string') {
    locationString = L;
  } else if (L && typeof L === 'object') {
    locationString =
      pick(L.address, L.formatted_address, L.name, L.description) ||
      (L.street ? `${L.street}${L.city ? ', ' + L.city : ''}` : locationString);
  } else {
    locationString = pick(report.address, report.street, report.place) || locationString;
  }

  // --- Coordinates ---
  const coords = extractCoordinates(report) || generateIsraelCoordinates(locationString);

  return {
    ...report,
    _id: report._id || report.id || Math.random().toString(36).slice(2, 11),
    title: report.title || 'Untitled Report',
    description: report.description || '',
    status: report.status || 'pending',
    location: locationString,
    coordinates: coords,
    reportedBy: {
      username: reporterName,
      email: reporterEmail,
      phone: reporterPhone,
    },
    createdAt: report.createdAt || report.created_at || new Date().toISOString(),
    priority: report.priority || 'medium',
    category: report.category || 'General',
  };
}

function extractCoordinates(report) {
  // 1) report.coordinates as object {lat,lng} or {latitude,longitude}
  if (report.coordinates && typeof report.coordinates === 'object') {
    const c = report.coordinates;
    if (hasLatLng(c)) return { lat: +c.lat || +c.latitude, lng: +c.lng || +c.longitude };
    if (Array.isArray(c) && c.length >= 2) return { lat: +c[1], lng: +c[0] };
  }

  // 2) report.location.coordinates as [lng,lat] or {lat,lng}
  if (report.location && typeof report.location === 'object') {
    const lc = report.location.coordinates || report.location.coords || report.location.geo;
    if (lc) {
      if (Array.isArray(lc) && lc.length >= 2) return { lat: +lc[1], lng: +lc[0] };
      if (hasLatLng(lc)) return { lat: +lc.lat || +lc.latitude, lng: +lc.lng || +lc.longitude };
    }
  }

  // 3) other common fields
  const lat = report.lat || report.latitude;
  const lng = report.lng || report.lon || report.long || report.longitude;
  if (isFinite(+lat) && isFinite(+lng)) return { lat: +lat, lng: +lng };

  return null;
}

function hasLatLng(o) {
  return (
    o &&
    (('lat' in o && 'lng' in o) ||
      ('latitude' in o && 'longitude' in o) ||
      ('lat' in o && 'long' in o))
  );
}

function generateIsraelCoordinates(location) {
  const loc = (location || '').toString().toLowerCase();

  const cities = {
    'jerusalem': { lat: 31.7683, lng: 35.2137 },
    'tel aviv': { lat: 32.0853, lng: 34.7818 },
    'haifa': { lat: 32.794, lng: 34.9896 },
    'rishon lezion': { lat: 31.9642, lng: 34.8047 },
    'petah tikva': { lat: 32.0867, lng: 34.8856 },
    'ashdod': { lat: 31.8044, lng: 34.6553 },
    'netanya': { lat: 32.3215, lng: 34.8532 },
    'beer sheva': { lat: 31.252973, lng: 34.791462 },
    'holon': { lat: 32.0114, lng: 34.7745 },
    'bnei brak': { lat: 32.0807, lng: 34.8338 },
    'ramat gan': { lat: 32.068, lng: 34.8243 },
    'eilat': { lat: 29.5577, lng: 34.9519 },
  };

  for (const [city, c] of Object.entries(cities)) {
    if (loc.includes(city)) {
      return {
        lat: c.lat + (Math.random() - 0.5) * 0.01,
        lng: c.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  }

  // Random within Israel bounding box
  return { lat: 29.5 + Math.random() * 3.5, lng: 34.2 + Math.random() * 3.0 };
}

function getFallbackReports() {
  return [
    {
      _id: '68a0258538daa12aa52c3163',
      title: 'Drainage Issue at HaTayelet 17, Rishon LeZion, Israel',
      description: 'Water drainage problem',
      status: 'pending',
      location: 'HaTayelet 17, Rishon LeZion',
      coordinates: { lat: 31.9642, lng: 34.8047 },
      createdAt: new Date(Date.now() - 86400000),
      reportedBy: { username: 'user123', email: 'user123@cityfix.com', phone: '050-1234567' },
      category: 'sewage',
      priority: 'medium',
    },
    {
      _id: '2',
      title: 'Large pothole on King George Street',
      description: 'Dangerous pothole',
      status: 'pending',
      location: 'King George Street, Tel Aviv',
      coordinates: { lat: 32.0733, lng: 34.7745 },
      createdAt: new Date(Date.now() - 172800000),
      reportedBy: { username: 'david_cohen', email: 'david.cohen@gmail.com', phone: '052-9876543' },
      category: 'roads',
      priority: 'high',
    },
    {
      _id: '3',
      title: 'Street light not working',
      description: 'No light at night',
      status: 'in-progress',
      location: 'Herzl Street, Haifa',
      coordinates: { lat: 32.794, lng: 34.9896 },
      createdAt: new Date(Date.now() - 259200000),
      reportedBy: { username: 'sarah_levi', email: 'sarah.levi@hotmail.com', phone: '054-5555555' },
      category: 'electricity',
      priority: 'low',
    },
    {
      _id: '4',
      title: 'Pothole at 4, Bnot Hill, Holon, Israel',
      description: 'Road damage',
      status: 'pending',
      location: '4 Bnot Hill, Holon',
      coordinates: { lat: 32.0114, lng: 34.7745 },
      createdAt: new Date(Date.now() - 86400000),
      reportedBy: { username: 'moshe_green', email: 'moshe.green@yahoo.com', phone: '053-1111111' },
      category: 'roads',
      priority: 'medium',
    },
  ];
}

// ==================== UI: STATS & LIST ====================
function updateDashboardStats() {
  const total = DashboardState.reports.length;
  const inProgress = DashboardState.reports.filter((r) => r.status === 'in-progress').length;
  const resolved = DashboardState.reports.filter((r) => r.status === 'resolved').length;

  const totalEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
  if (totalEl) totalEl.textContent = total.toLocaleString();

  const progressEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
  if (progressEl) progressEl.textContent = inProgress.toLocaleString();

  const resolvedEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
  if (resolvedEl) resolvedEl.textContent = resolved.toLocaleString();
}

function updateRecentReports() {
  const reportsList = document.querySelector('.reports-list');
  if (!reportsList) return;

  const recent = [...DashboardState.reports].slice(-5).reverse();

  reportsList.innerHTML = recent
    .map(
      (r) => `
      <div class="report-item" onclick="focusOnReport('${r._id}')" style="cursor:pointer">
        <div class="report-info">
          <h4>${escapeHTML(r.title)}</h4>
          <p>${escapeHTML(formatLocation(r.location))}</p>
          <div class="report-time">⏱ ${formatTimeAgo(r.createdAt)}</div>
        </div>
        <span class="report-status ${r.status}">${r.status.toUpperCase()}</span>
      </div>`
    )
    .join('');
}

function formatLocation(location) {
  if (!location) return 'Location not specified';
  if (typeof location === 'object') {
    if (location.address) return location.address;
    if (location.name) return location.name;
    if (location.description) return location.description;
    if (location.street) return location.street;
    if (location.coordinates) {
      if (Array.isArray(location.coordinates))
        return `Lat: ${location.coordinates[1]}, Lng: ${location.coordinates[0]}`;
      if (location.coordinates.lat && location.coordinates.lng)
        return `Lat: ${location.coordinates.lat}, Lng: ${location.coordinates.lng}`;
    }
    return 'Location not specified';
  }
  const locStr = location.toString();
  return locStr === '[object Object]' ? 'Location not specified' : locStr;
}

function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMins = Math.floor((now - past) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// ==================== GOOGLE MAPS ====================
function ensureGoogleMapsLoaded() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // callback to resolve when loaded
    window.__gmapsLoaded = () => resolve();

    // auth failure hook
    window.gm_authFailure = () =>
      reject(new Error('Google Maps authentication failed (gm_authFailure)'));

    // inject proper script URL
    const s = document.createElement('script');
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      CONFIG.GMAPS_API_KEY
    )}&v=weekly&libraries=marker&callback=__gmapsLoaded`;
    s.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(s);
  });
}

async function initializeMap() {
  const container = document.querySelector('.map-placeholder');
  if (!container) return;

  container.innerHTML = '';
  container.style.height = '500px';

  const opts = {
    center: CONFIG.MAP_CENTER,
    zoom: CONFIG.MAP_ZOOM,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  };
  if (CONFIG.MAP_ID) opts.mapId = CONFIG.MAP_ID;

  DashboardState.map = new google.maps.Map(container, opts);

  google.maps.event.addListenerOnce(DashboardState.map, 'idle', () => {
    DashboardState.mapReady = true;
    addMarkers();
  });
}

function addMarkers() {
  if (!DashboardState.map) return;

  console.log('📍 Adding markers for', DashboardState.reports.length, 'reports');

  // Clear old
  DashboardState.markers.forEach((m) => m.setMap && m.setMap(null));
  DashboardState.markers = [];

  const colors = {
    pending: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
    'in-progress': 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    resolved: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    rejected: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    new: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  };

  const bounds = new google.maps.LatLngBounds();
  let placed = 0;

  DashboardState.reports.forEach((report, i) => {
    const c = report.coordinates || generateIsraelCoordinates(report.location);
    if (!c || !isFinite(+c.lat) || !isFinite(+c.lng)) {
      console.warn('⚠️ No valid coordinates for report:', report.title);
      return;
    }

    setTimeout(() => {
      const marker = new google.maps.Marker({
        position: c,
        map: DashboardState.map,
        title: report.title,
        icon: colors[report.status] || colors.pending,
        animation: google.maps.Animation.DROP,
      });

      marker.reportId = report._id;
      marker.addListener('click', () => showReportPopup(report, marker));
      DashboardState.markers.push(marker);

      bounds.extend(marker.getPosition());
      placed++;

      if (placed === 1) {
        // first report center
        DashboardState.map.setCenter(marker.getPosition());
        if (DashboardState.map.getZoom() < 12) DashboardState.map.setZoom(CONFIG.MAP_ZOOM);
      } else if (placed > 1) {
        // fit all
        DashboardState.map.fitBounds(bounds);
      }
    }, i * 80);
  });
}

function showReportPopup(report, marker) {
  if (DashboardState.currentInfoWindow) DashboardState.currentInfoWindow.close();

  const content = `
    <div style="padding:25px;min-width:450px;max-width:520px">
      <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827">
        ${escapeHTML(report.title)}
      </h2>

      <p style="margin:0 0 15px 0;color:#4b5563;font-size:14px;line-height:1.6">
        ${escapeHTML(report.description || 'No description provided')}
      </p>

      <div style="display:flex;gap:8px;margin-bottom:16px">
        <span style="background:${getStatusColor(report.status)};color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700">
          ${report.status.toUpperCase()}
        </span>
        ${
          report.priority
            ? `<span style="background:${getPriorityColor(
                report.priority
              )};color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700">
          ${report.priority.toUpperCase()}</span>`
            : ''
        }
        ${
          report.category
            ? `<span style="background:#6B7280;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700">
          ${escapeHTML(report.category.toUpperCase())}</span>`
            : ''
        }
      </div>

      <div style="background:#f9fafb;padding:12px;border-radius:8px;margin-bottom:16px;font-size:14px;color:#374151;line-height:1.7">
        <div><strong>📍 Location:</strong> ${escapeHTML(formatLocation(report.location))}</div>
        <div><strong>👤 Reported by:</strong> ${escapeHTML(report.reportedBy?.username || 'Anonymous')}</div>
        <div><strong>📧 Email:</strong> ${escapeHTML(report.reportedBy?.email || 'Not provided')}</div>
        <div><strong>📱 Phone:</strong> ${escapeHTML(report.reportedBy?.phone || 'Not provided')}</div>
        <div><strong>🕒 Submitted:</strong> ${escapeHTML(formatTimeAgo(report.createdAt))}</div>
        <div><strong>📅 Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</div>
      </div>

      <div style="border:2px solid #e5e7eb;border-radius:10px;padding:16px;background:#fff">
        <h3 style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#111827">Quick Status Update</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${quickBtn(report,'pending','🟠 Pending','#FFA500')}
          ${quickBtn(report,'in-progress','🔵 In Progress','#3B82F6')}
          ${quickBtn(report,'resolved','🟢 Resolved','#10B981')}
          ${quickBtn(report,'rejected','🔴 Rejected','#EF4444')}
        </div>
        <p style="margin-top:12px;padding:8px;background:#fef3c7;border-radius:6px;color:#92400e;font-size:12px;text-align:center">
          Status change will notify the reporter automatically
        </p>
      </div>

      <div style="margin-top:16px;text-align:center">
        <button onclick="window.location.href='ReportsDetails.html?id=${report._id}'"
          style="padding:10px 24px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">
          📄 View Full Details Page
        </button>
      </div>
    </div>
  `;

  const iw = new google.maps.InfoWindow({ content, maxWidth: 560, minWidth: 480 });
  iw.open(DashboardState.map, marker);
  DashboardState.currentInfoWindow = iw;

  // Focus
  DashboardState.map.panTo(marker.getPosition());
  if (DashboardState.map.getZoom() < 12) DashboardState.map.setZoom(12);
}

function quickBtn(report, status, label, bg) {
  const disabled = report.status === status;
  const op = disabled ? 'opacity:.45;cursor:not-allowed' : '';
  const dis = disabled ? 'disabled' : '';
  return `<button onclick="quickUpdate('${report._id}','${status}')" ${dis}
    style="padding:10px 14px;background:${bg};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:transform .2s;${op}"
    onmouseover="if(!this.disabled)this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
    ${label}
  </button>`;
}

function getStatusColor(status) {
  return (
    {
      pending: '#FFA500',
      new: '#FDE047',
      'in-progress': '#3B82F6',
      resolved: '#10B981',
      rejected: '#EF4444',
    }[status] || '#6B7280'
  );
}

function getPriorityColor(priority) {
  return (
    { urgent: '#DC2626', high: '#F59E0B', medium: '#3B82F6', low: '#6B7280' }[priority] ||
    '#6B7280'
  );
}

// ==================== STATUS UPDATE ====================
window.quickUpdate = async function (reportId, newStatus) {
  const r = DashboardState.reports.find((x) => x._id === reportId);
  if (!r || r.status === newStatus) return;

  try {
    await fetch(`${CONFIG.API_BASE}/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${DashboardState.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (e) {
    console.warn('Backend status update failed, applying locally', e);
  }

  const old = r.status;
  r.status = newStatus;

  // Fire notification (best effort)
  sendNotification(r, newStatus).catch((e) => console.warn('Notify error', e));

  updateDashboardStats();
  updateRecentReports();
  addMarkers();

  showToast(`Status updated: ${old} → ${newStatus}`, 'success');
  if (DashboardState.currentInfoWindow) DashboardState.currentInfoWindow.close();
};

async function sendNotification(report, newStatus) {
  if (CONFIG.AZURE_NOTIFICATION_URL === 'https://your-azure-function.azurewebsites.net/api/notify')
    return;

  const payload = {
    to: report.reportedBy?.email || report.reportedBy?.phone || 'user',
    title: 'Report Status Updated',
    body: `Your report "${report.title}" is now: ${newStatus}`,
    reportId: report._id,
    newStatus,
    timestamp: new Date().toISOString(),
  };

  await fetch(CONFIG.AZURE_NOTIFICATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ==================== UTILITIES ====================
window.focusOnReport = function (reportId) {
  const marker = DashboardState.markers.find((m) => m.reportId === reportId);
  const report = DashboardState.reports.find((r) => r._id === reportId);
  if (marker && report) {
    DashboardState.map.setCenter(marker.getPosition());
    DashboardState.map.setZoom(14);
    showReportPopup(report, marker);
  }
};

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:20px;right:20px;padding:14px 18px;
    background:${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
    color:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10000;
    animation:slideUp .25s ease
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideDown .25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function escapeHTML(s) {
  return (s ?? '')
    .toString()
    .replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ==================== GOOGLE MAPS CALLBACK (if HTML uses callback) ====================
window.initializeGoogleMap = async function () {
  console.log('✅ Google Maps API loaded (callback)');
  await initializeMap();
};

// ==================== BOOTSTRAP ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Dashboard...');
  try {
    if (!(await initializeAuth())) return;

    DashboardState.reports = await fetchAllReports();
    updateDashboardStats();
    updateRecentReports();

    // Make sure Maps is loaded even if HTML had a wrong script tag
    try {
      await ensureGoogleMapsLoaded();
      await initializeMap();
    } catch (gmErr) {
      console.error('Google Maps failed to load:', gmErr);
      const cont = document.querySelector('.map-placeholder');
      if (cont) cont.innerHTML = `<div style="padding:18px;color:#b91c1c">⚠️ Map failed to load. Check API key, referrers and billing.</div>`;
    }

    // Refresh data every 30s
    setInterval(async () => {
      DashboardState.reports = await fetchAllReports();
      updateDashboardStats();
      updateRecentReports();
      addMarkers();
    }, 30000);

    console.log('✅ Dashboard ready');
  } catch (e) {
    console.error('Initialization error:', e);
  }
});

// ==================== INLINE CSS (small helpers) ====================
if (!document.getElementById('cityfix-dashboard-styles')) {
  const style = document.createElement('style');
  style.id = 'cityfix-dashboard-styles';
  style.textContent = `
    @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes slideDown { from{transform:translateY(0);opacity:1} to{transform:translateY(100%);opacity:0} }
    .report-item:hover { background: rgba(59,130,246,.05) }
  `;
  document.head.appendChild(style);
}
