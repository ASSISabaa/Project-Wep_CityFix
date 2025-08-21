// js/Notifications.js
const API =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : location.origin + '/api';

const state = {
  token: null,
  filter: 'all',
  page: 1,
  limit: 20,
  prefs: null
};

function authHeaders() {
  state.token = localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token');
  if (!state.token) {
    location.href = 'login.html';
    return {};
  }
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeAgo(ts) {
  if (!ts) return '';
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function severity(n) {
  if (n.priority === 'high' || (n.data && n.data.actionRequired)) return { item: 'urgent', badge: 'urgent-badge' };
  if (n.type === 'system') return { item: 'system', badge: 'system-badge' };
  if (n.type === 'report_resolved') return { item: 'success', badge: 'success-badge' };
  if (n.type === 'report_update' || n.type === 'report_comment') return { item: 'high', badge: 'high-badge' };
  return { item: 'info', badge: 'info-badge' };
}

/* ------------ Overview Cards ------------ */
async function loadOverview() {
  try {
    const res = await fetch(`${API}/notifications/overview`, { headers: authHeaders() });
    if (!res.ok) throw new Error('overview');
    const { stats } = await res.json();

    const numbers = document.querySelectorAll('.stat-card .stat-number');
    if (numbers[0]) numbers[0].textContent = String(stats.unread ?? 0);
    if (numbers[1]) numbers[1].textContent = String(stats.urgent ?? 0);
    if (numbers[2]) numbers[2].textContent = String(stats.systemUpdates ?? 0);
    if (numbers[3]) numbers[3].textContent = String(stats.activeSubscriptions ?? 0);

    const trends = document.querySelectorAll('.stat-card .stat-trend');
    if (trends[0]) trends[0].textContent = stats.unread > 0 ? `+${stats.unread} pending` : 'Up to date';
    if (trends[1]) trends[1].textContent = stats.urgent > 0 ? 'Requires attention' : 'No urgent alerts';
    if (trends[2]) trends[2].textContent = 'All systems operational';
    if (trends[3]) trends[3].textContent = 'Notification types';
  } catch (e) {
    console.error(e);
  }
}

/* ------------ List ------------ */
async function loadList() {
  const box = document.querySelector('.notifications-list');
  if (!box) return;

  try {
    const url = new URL(`${API}/notifications`, location.origin);
    url.searchParams.set('filter', state.filter);
    url.searchParams.set('page', String(state.page));
    url.searchParams.set('limit', String(state.limit));

    const res = await fetch(url.toString().replace(location.origin, ''), { headers: authHeaders() });
    if (!res.ok) throw new Error('list');
    const data = await res.json();
    const items = data.notifications || data.data || [];
    renderList(items);
  } catch (e) {
    console.error(e);
    box.innerHTML = `
      <div class="notification-item info read">
        <div class="notification-content">
          <div class="notification-header">
            <h4>Could not load notifications</h4>
            <span class="notification-time"></span>
          </div>
          <p>Try again later.</p>
        </div>
      </div>`;
  }
}

function renderList(items) {
  const box = document.querySelector('.notifications-list');
  if (!box) return;
  box.innerHTML = '';

  if (!items.length) {
    box.innerHTML = `
      <div class="notification-item info read">
        <div class="notification-content">
          <div class="notification-header">
            <h4>No notifications</h4>
            <span class="notification-time"></span>
          </div>
          <p>You are all caught up.</p>
        </div>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const n of items) {
    const sev = severity(n);
    const readClass = n.read ? 'read' : 'unread';
    const link = n?.data?.url;

    const el = document.createElement('div');
    el.className = `notification-item ${sev.item} ${readClass}`;
    el.dataset.id = n._id;
    if (link) el.dataset.link = link;

    const primaryLabel = link ? (n.type === 'report_update' ? 'View Case' : 'View') : 'Open';
    const secondaryLabel = n.read ? 'Archive' : 'Mark Read';
    const secondaryAction = n.read ? 'archive' : 'read';

    el.innerHTML = `
      <div class="notification-badge ${sev.badge}"></div>
      <div class="notification-content">
        <div class="notification-header">
          <h4>${esc(n.title)}</h4>
          <span class="notification-time">${esc(timeAgo(n.createdAt))}</span>
        </div>
        <p>${esc(n.message)}</p>
        <div class="notification-actions">
          ${link ? `<button class="action-btn primary" data-action="open" data-id="${n._id}">${esc(primaryLabel)}</button>` : ''}
          <button class="action-btn secondary" data-action="${secondaryAction}" data-id="${n._id}">${esc(secondaryLabel)}</button>
          <button class="action-btn secondary" data-action="dismiss" data-id="${n._id}">Dismiss</button>
        </div>
      </div>`;
    frag.appendChild(el);
  }
  box.appendChild(frag);
}

/* ------------ Settings ------------ */
const settingKeyMap = {
  'Email Notifications': 'email',
  'Push Notifications': 'push',
  'SMS Alerts': 'sms',
  'Daily Digest': 'dailyDigest',
  'Team Updates': 'teamUpdates'
};

function formatHour(h) {
  const hour = Number(h);
  if (Number.isNaN(hour)) return '8 AM';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

async function loadSettings() {
  try {
    const res = await fetch(`${API}/notifications/preferences`, { headers: authHeaders() });
    if (!res.ok) throw new Error('prefs');
    const data = await res.json();
    state.prefs = data.preferences;
    renderSettings();
  } catch (e) {
    console.error(e);
  }
}

function renderSettings() {
  if (!state.prefs) return;

  const items = document.querySelectorAll('.reports-section .report-item');
  items.forEach((item) => {
    const titleEl = item.querySelector('.report-info h4');
    const statusEl = item.querySelector('.report-status');
    const timeEl = item.querySelector('.report-time');
    if (!titleEl || !statusEl) return;

    const key = settingKeyMap[titleEl.textContent.trim()];
    if (!key) return;

    let enabled = false;
    let lastSent = null;

    if (key === 'email') {
      enabled = !!state.prefs.email?.enabled;
      lastSent = state.prefs.email?.lastSentAt;
      if (timeEl) timeEl.textContent = lastSent ? `Last email sent ${timeAgo(lastSent)}` : 'No emails sent yet';
    } else if (key === 'push') {
      enabled = !!state.prefs.push?.enabled;
      if (timeEl) timeEl.textContent = 'Real-time delivery';
    } else if (key === 'sms') {
      enabled = !!state.prefs.sms?.enabled;
      if (timeEl) timeEl.textContent = 'Emergency notifications only';
    } else if (key === 'dailyDigest') {
      enabled = !!state.prefs.dailyDigest?.enabled;
      const hour = state.prefs.dailyDigest?.hourLocal ?? 8;
      if (timeEl) timeEl.textContent = `Delivered every morning at ${formatHour(hour)}`;
    } else if (key === 'teamUpdates') {
      enabled = !!state.prefs.teamUpdates?.enabled;
      if (timeEl) timeEl.textContent = 'Assignment and status updates';
    }

    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.classList.toggle('enabled', enabled);
    statusEl.classList.toggle('disabled', !enabled);

    item.dataset.key = key;
  });

  wireSettingsToggles();
}

function wireSettingsToggles() {
  const chips = document.querySelectorAll('.reports-section .report-item .report-status');
  chips.forEach((chip) => {
    chip.style.cursor = 'pointer';
    chip.onclick = async (e) => {
      const item = e.currentTarget.closest('.report-item');
      const key = item?.dataset?.key;
      if (!key) return;

      const enabled = chip.classList.contains('enabled');
      await updateSetting(key, !enabled);
    };
  });
}

async function updateSetting(key, value) {
  const payload = {};
  if (key === 'email') payload.email = { enabled: value };
  else if (key === 'push') payload.push = { enabled: value };
  else if (key === 'sms') payload.sms = { enabled: value };
  else if (key === 'teamUpdates') payload.teamUpdates = { enabled: value };
  else if (key === 'dailyDigest') payload.dailyDigest = { enabled: value };

  try {
    const res = await fetch(`${API}/notifications/preferences`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('update');
    const data = await res.json();
    state.prefs = {
      email: { enabled: data.preferences?.emailNotifications ?? state.prefs.email?.enabled },
      push: { enabled: data.preferences?.pushNotifications ?? state.prefs.push?.enabled },
      sms: { enabled: data.preferences?.smsAlerts ?? state.prefs.sms?.enabled },
      dailyDigest: {
        enabled: data.preferences?.dailyDigest?.enabled ?? state.prefs.dailyDigest?.enabled,
        hourLocal: data.preferences?.dailyDigest?.hourLocal ?? state.prefs.dailyDigest?.hourLocal
      },
      teamUpdates: { enabled: data.preferences?.teamUpdates ?? state.prefs.teamUpdates?.enabled }
    };
    await loadSettings();
    await loadOverview();
  } catch (e) {
    console.error(e);
    alert('Failed to update preference');
  }
}

/* ------------ Wiring ------------ */
function wireUI() {
  const filterBtns = document.querySelectorAll('.control-btn[data-filter]');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter || 'all';
      state.page = 1;
      loadList().then(loadOverview);
    });
  });

  const markAll = document.querySelector('.mark-all-read');
  if (markAll) {
    markAll.addEventListener('click', async () => {
      try {
        await fetch(`${API}/notifications/mark-all-read`, { method: 'PUT', headers: authHeaders() });
        await loadList();
        await loadOverview();
      } catch (e) {
        console.error(e);
      }
    });
  }

  const list = document.querySelector('.notifications-list');
  if (list) {
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest && e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      try {
        if (action === 'read') {
          await fetch(`${API}/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
        } else if (action === 'archive') {
          await fetch(`${API}/notifications/${id}/archive`, { method: 'PUT', headers: authHeaders() });
        } else if (action === 'dismiss') {
          await fetch(`${API}/notifications/${id}/dismiss`, { method: 'PUT', headers: authHeaders() });
        } else if (action === 'open') {
          const row = btn.closest('.notification-item');
          const href = row?.dataset?.link;
          if (href) location.href = href;
        }
        await loadList();
        await loadOverview();
      } catch (err) {
        console.error(err);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  authHeaders();
  wireUI();
  loadList().then(loadOverview);
  loadSettings();
});
