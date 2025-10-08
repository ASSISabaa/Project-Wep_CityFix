// CityFix Admin Profile & Notifications Manager
// English-only comments. Solid dropdown UX, backend-driven notifications,
// safe URL builder (never /api/api), single-click open/close.
// v3.7.0

'use strict';

/* ===================== Config ===================== */
const CFG = {
  API_BASE:
    (window.CITYFIX && window.CITYFIX.API_BASE) ||
      location.origin,
  NOTIF_REFRESH_MS: 30000 // polling fallback; no streaming calls
};

/* ===================== URL & Auth helpers ===================== */
function getToken() {
  const keys = [
    'cityfix_token',
    'cityfix_auth_token',
    'authToken',
    'token',
    'jwt',
    'accessToken'
  ];
  for (const s of [localStorage, sessionStorage]) {
    for (const k of keys) {
      const v = s.getItem(k);
      if (v) return v;
    }
  }
  const m = document.cookie.match(/(?:^|;)\s*(cityfix_token|authToken|token)=([^;]+)/);
  return m ? decodeURIComponent(m[2]) : '';
}

/** Build a safe URL with a single `/api` segment regardless of inputs. */
function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(CFG.API_BASE || '').replace(/\/+$/g, '');
  const baseHasApi = /\/api$/i.test(base);
  const p = String(path || '').trim();
  if (p.startsWith('/api') && baseHasApi) return base + p.replace(/^\/api/, '');
  if (!p.startsWith('/api') && !baseHasApi) return base + '/api' + (p.startsWith('/') ? p : '/' + p);
  return base + (p.startsWith('/') ? p : '/' + p);
}

function authHeaders(json = true) {
  const t = getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json', Accept: 'application/json' } : {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  };
}

async function apiGet(path) {
  const res = await fetch(buildUrl(path), { headers: authHeaders(false) });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(buildUrl(path), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(buildUrl(path), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
  return res.json();
}

/* ===================== DOM utils ===================== */
const $ = (s) => document.querySelector(s);

function ensureBadge() {
  const bell = $('.notification-container');
  if (!bell) return null;
  let badge = bell.querySelector('.notification-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.cssText =
      'position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;font:700 11px/18px Inter,system-ui;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:none;justify-content:center;align-items:center;box-shadow:0 0 0 2px #fff';
    bell.style.position = 'relative';
    bell.appendChild(badge);
  }
  return badge;
}

function toast(msg, tone = 'info') {
  const bg = tone === 'success' ? '#10B981' : tone === 'warn' ? '#F59E0B' : tone === 'error' ? '#EF4444' : '#3B82F6';
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;right:20px;bottom:20px;z-index:99999;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-weight:600';
  el.style.background = bg;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/* ===================== Manager ===================== */
class AdminProfileManager {
  constructor() {
    this.token = getToken();
    this.user = this.loadLocalUser();

    this.ddProfile = null;
    this.ddNotifs = null;
    this.overlay = null;

    this.notifications = [];
    this.unreadCount = 0;
    this.pollTimer = null;

    this.modal = null;
    this.isEditing = false;

    this._wired = false;

    this.init();
  }

  async init() {
    this.injectStyles();
    await this.fetchUser().catch(() => {});
    this.paintHeaderUser();
    this.buildDropdowns();
    this.wireOnce();

    if (this.token) {
      await this.loadNotifications().catch(() => {});
      this.startPolling();
    } else {
      this.renderNotifications([]); // empty for guests
    }
  }

  /* ---------- User ---------- */
  loadLocalUser() {
    try {
      const raw = localStorage.getItem('cityfix_user');
      return raw ? JSON.parse(raw) : { username: 'Admin', email: 'admin@cityfix.com', role: 'admin' };
    } catch {
      return { username: 'Admin', email: 'admin@cityfix.com', role: 'admin' };
    }
  }

  async fetchUser() {
    if (!this.token) return;
    const data = await apiGet('/users/profile');
    const u = data.user || data.profile || data;
    if (u && typeof u === 'object') {
      this.user = u;
      localStorage.setItem('cityfix_user', JSON.stringify(u));
      this.paintHeaderUser();
    }
  }

  get displayName() {
    return this.user?.username || this.user?.name || 'Admin';
  }

  get initials() {
    const n = this.displayName.trim();
    return (n[0] || 'A' + (n[1] || 'D')).toUpperCase();
  }

  paintHeaderUser() {
    document.querySelectorAll('.user-name').forEach((el) => (el.textContent = this.displayName));
    document.querySelectorAll('.user-avatar').forEach((avatar) => {
      avatar.innerHTML = `<span>${this.initials}</span>`;
      avatar.style.cssText =
        'width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:700';
    });
  }

  /* ---------- Dropdowns ---------- */
  buildDropdowns() {
    // Profile
    const pId = 'profile-dropdown-menu';
    document.getElementById(pId)?.remove();
    const p = document.createElement('div');
    p.id = pId;
    p.className = 'cf-dropdown';
    p.innerHTML = `
      <div class="cf-dd-section cf-dd-hero">
        <div class="cf-hero-avatar">${this.user?.profilePicture ? `<img src="${this.user.profilePicture}" alt="">` : this.initials}</div>
        <div class="cf-hero-meta">
          <div class="cf-hero-name">${this.escape(this.displayName)}</div>
          <div class="cf-hero-sub">${this.escape(this.user?.email || '')}</div>
          <div class="cf-role-badge">Administrator</div>
        </div>
      </div>
      <div class="cf-dd-section">
        <a href="#" class="cf-dd-item" data-act="profile"><span>My Profile</span></a>
        <a href="settings.html" class="cf-dd-item"><span>Settings</span></a>
      </div>
      <div class="cf-dd-section">
        <a href="#" class="cf-dd-item danger" data-act="logout"><span>Logout</span></a>
      </div>
    `;
    document.body.appendChild(p);
    this.ddProfile = p;

    // Notifications
    const nId = 'notifications-dropdown-menu';
    document.getElementById(nId)?.remove();
    const n = document.createElement('div');
    n.id = nId;
    n.className = 'cf-dropdown';
    n.innerHTML = `
      <div class="cf-dd-header">
        <h3>Notifications</h3>
        <button class="cf-link" data-act="mark-all">Mark all as read</button>
      </div>
      <div id="notifications-list" class="cf-notifs-list">
        <div class="cf-loading"><div class="cf-spinner"></div> Loading…</div>
      </div>
      <div class="cf-dd-footer"><a class="cf-link" href="notifications.html">View All →</a></div>
    `;
    document.body.appendChild(n);
    this.ddNotifs = n;
  }

  wireOnce() {
    if (this._wired) return;
    this._wired = true;

    const profileBtn = $('.user-profile');
    const notifBtn = $('.notification-container');

    profileBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown('profile');
    });

    notifBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown('notifs');
      // fetch on open for freshness
      this.loadNotifications().catch(() => {});
    });

    // inside dropdown actions
    this.ddProfile.addEventListener('click', (e) => {
      const actEl = e.target.closest('[data-act]');
      if (!actEl) return;
      e.preventDefault();
      const act = actEl.dataset.act;
      if (act === 'profile') this.showProfileModal();
      if (act === 'logout') this.logout();
    });

    this.ddNotifs.addEventListener('click', (e) => {
      const actEl = e.target.closest('[data-act]');
      if (!actEl) return;
      e.preventDefault();
      const act = actEl.dataset.act;
      if (act === 'mark-all') this.markAllRead();
    });

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDropdowns();
    });

    // Ensure badge exists
    ensureBadge();
  }

  toggleDropdown(which) {
    if (which === 'profile') {
      const open = this.ddProfile.classList.contains('show');
      this.closeDropdowns();
      if (!open) this.openDropdown(this.ddProfile, $('.user-profile'));
      return;
    }
    if (which === 'notifs') {
      const open = this.ddNotifs.classList.contains('show');
      this.closeDropdowns();
      if (!open) this.openDropdown(this.ddNotifs, $('.notification-container'));
    }
  }

  openDropdown(dd, anchorEl) {
    if (!dd || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    dd.style.position = 'fixed';
    dd.style.top = rect.bottom + 10 + 'px';
    dd.style.right = '20px';
    dd.classList.add('show');

    // overlay to keep it open until user intentionally closes
    this.ensureOverlay(() => this.closeDropdowns());
  }

  closeDropdowns() {
    this.ddProfile?.classList.remove('show');
    this.ddNotifs?.classList.remove('show');
    this.removeOverlay();
  }

  ensureOverlay(onClick) {
    if (this.overlay) return;
    const ov = document.createElement('div');
    ov.id = 'apn-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9998;background:transparent;';
    ov.addEventListener('click', onClick, { once: true });
    document.body.appendChild(ov);
    this.overlay = ov;
  }

  removeOverlay() {
    this.overlay?.remove();
    this.overlay = null;
  }

  /* ---------- Notifications ---------- */
  async loadNotifications() {
    if (!this.token) {
      this.renderNotifications([]);
      this.updateBadge(0);
      return;
    }
    const data = await apiGet('/notifications?limit=20&sort=priority');
    const list = (data.notifications || data.data || []).map((n) => this.enrich(n));
    // priority then newest
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      const p = (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
      if (p !== 0) return p;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    this.notifications = list;
    const unread = data.unreadCount ?? list.filter((x) => !x.read).length;
    this.renderNotifications(list);
    this.updateBadge(unread);
  }

  startPolling() {
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.loadNotifications().catch(() => {}), CFG.NOTIF_REFRESH_MS);
  }

  enrich(n) {
    const out = { ...n };
    if (!out.priority) {
      const txt = `${out.title || ''} ${out.message || ''}`.toLowerCase();
      if (/(urgent|emergency|water leak|gas leak|danger|fire|explosion|flood)/.test(txt)) out.priority = 'urgent';
      else if (/(pothole|outage|road)/.test(txt)) out.priority = 'high';
      else if (/(street.?light|noise)/.test(txt)) out.priority = 'medium';
      else out.priority = 'low';
    }
    if (!out.icon) {
      const map = {
        report_update: '📝',
        report_resolved: '✅',
        report_rejected: '❌',
        report_comment: '💬',
        system: '⚙️',
        admin_message: '📢',
        user: '👤'
      };
      out.icon = map[out.type] || '🔔';
    }
    return out;
  }

  renderNotifications(items) {
    const listEl = $('#notifications-list');
    if (!listEl) return;

    if (!items.length) {
      listEl.innerHTML = `<div class="cf-empty">No notifications</div>`;
      return;
    }

    listEl.innerHTML = items
      .map((n) => {
        const cls =
          n.priority === 'urgent'
            ? 'urgent'
            : n.priority === 'high'
            ? 'high'
            : n.priority === 'medium'
            ? 'medium'
            : 'low';
        return `
          <div class="cf-notif ${cls} ${n.read ? '' : 'unread'}" data-id="${n._id}">
            <div class="cf-left"></div>
            <div class="cf-ico">${n.icon}</div>
            <div class="cf-main">
              <div class="cf-top">
                <div class="cf-title">${this.escape(n.title || '')}</div>
                <div class="cf-chips">
                  <span class="chip chip-${cls}">${n.priority.toUpperCase()}</span>
                  ${!n.read ? '<span class="chip chip-new">NEW</span>' : ''}
                </div>
              </div>
              <div class="cf-msg">${this.escape(n.message || '')}</div>
              <div class="cf-bot">
                <span class="cf-time">${this.timeAgo(n.createdAt)}</span>
                <div class="cf-actions">
                  ${n?.data?.url ? `<button class="link" data-act="open">Open</button>` : ''}
                  ${
                    n.read
                      ? `<button class="link subtle" data-act="unread">Mark unread</button>`
                      : `<button class="link subtle" data-act="read">Mark read</button>`
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // bind actions
    listEl.querySelectorAll('.cf-notif').forEach((row) => {
      row.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        const id = row.dataset.id;
        if (!btn) {
          this.markRead(id);
          return;
        }
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'open') this.openItem(id);
        if (act === 'read') this.markRead(id);
        if (act === 'unread') this.markUnread(id);
      });
    });
  }

  updateBadge(n) {
    this.unreadCount = Number(n || 0);
    const badge = ensureBadge();
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = String(this.unreadCount);
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  async markAllRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.updateBadge(0);
    this.renderNotifications(this.notifications);
    if (this.token) {
      try {
        await apiPut('/notifications/mark-all-read', {});
      } catch {}
    }
  }

  async markRead(id) {
    const n = this.notifications.find((x) => x._id === id);
    if (!n || n.read) return;
    n.read = true;
    this.updateBadge(Math.max(0, this.unreadCount - 1));
    this.renderNotifications(this.notifications);
    if (this.token) {
      try {
        await apiPut(`/notifications/${encodeURIComponent(id)}/read`, {});
      } catch {}
    }
  }

  markUnread(id) {
    const n = this.notifications.find((x) => x._id === id);
    if (!n || !n.read) return;
    n.read = false;
    this.updateBadge(this.unreadCount + 1);
    this.renderNotifications(this.notifications);
  }

  openItem(id) {
    const n = this.notifications.find((x) => x._id === id);
    if (!n) return;
    const href = n?.data?.url;
    if (href) location.href = href;
  }

  /* ---------- Profile Modal ---------- */
  showProfileModal() {
    this.closeDropdowns();

    const id = 'profile-modal';
    document.getElementById(id)?.remove();

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'cf-modal';
    const since = this.formatDate(this.user?.createdAt);
    modal.innerHTML = `
      <div class="cf-modal-backdrop"></div>
      <div class="cf-modal-card">
        <div class="cf-modal-head">
          <h3>My Profile</h3>
          <button class="cf-x" aria-label="Close">&times;</button>
        </div>
        <div class="cf-modal-body">
          <div class="cf-profile-hero">
            <div class="avatar-lg">${this.user?.profilePicture ? `<img src="${this.user.profilePicture}" alt="">` : this.initials}</div>
            <input id="cf-avatar-file" type="file" accept="image/*" hidden />
            <button id="cf-change-photo" class="btn ghost">Change Photo</button>
          </div>
          <div class="grid">
            <label>Username<input id="cf-u" type="text" value="${this.escape(this.displayName)}" readonly></label>
            <label>Email<input id="cf-e" type="email" value="${this.escape(this.user?.email || '')}" readonly></label>
            <label>Role<input type="text" value="${this.user?.role === 'admin' ? 'Administrator' : (this.user?.role || 'User')}" readonly></label>
            <label>Member Since<input type="text" value="${since}" readonly></label>
          </div>
        </div>
        <div class="cf-modal-foot">
          <button class="btn" data-close>Close</button>
          <div class="right">
            <button id="cf-cancel" class="btn ghost hidden">Cancel</button>
            <button id="cf-save" class="btn primary hidden">Save</button>
            <button id="cf-edit" class="btn primary">Edit Profile</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
    this.isEditing = false;

    const close = () => this.closeModal();
    modal.querySelector('.cf-modal-backdrop')?.addEventListener('click', close);
    modal.querySelector('[data-close]')?.addEventListener('click', close);
    modal.querySelector('.cf-x')?.addEventListener('click', close);

    const editBtn = modal.querySelector('#cf-edit');
    const saveBtn = modal.querySelector('#cf-save');
    const cancelBtn = modal.querySelector('#cf-cancel');
    const u = modal.querySelector('#cf-u');
    const e = modal.querySelector('#cf-e');
    const changePhoto = modal.querySelector('#cf-change-photo');
    const file = modal.querySelector('#cf-avatar-file');

    const toggleEdit = (on) => {
      this.isEditing = !!on;
      u.readOnly = e.readOnly = !on;
      editBtn.classList.toggle('hidden', on);
      saveBtn.classList.toggle('hidden', !on);
      cancelBtn.classList.toggle('hidden', !on);
      if (on) u.focus();
    };

    editBtn.addEventListener('click', () => toggleEdit(true));
    cancelBtn.addEventListener('click', () => {
      u.value = this.displayName;
      e.value = this.user?.email || '';
      toggleEdit(false);
    });
    saveBtn.addEventListener('click', async () => {
      const payload = {};
      if (u.value.trim() && u.value.trim() !== this.displayName) payload.username = u.value.trim();
      if (e.value.trim() && e.value.trim() !== (this.user?.email || '')) payload.email = e.value.trim();
      if (!Object.keys(payload).length) return toggleEdit(false);
      try {
        const data = await apiPut('/users/profile', payload);
        const nu = data.user || this.user;
        this.user = nu;
        localStorage.setItem('cityfix_user', JSON.stringify(nu));
        this.paintHeaderUser();
        toast('Profile updated', 'success');
      } catch {
        toast('Update failed', 'error');
      } finally {
        toggleEdit(false);
      }
    });

    changePhoto.addEventListener('click', () => file.click());
    file.addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) return toast('Image too large (max 2MB)', 'warn');
      const base64 = await this.fileToBase64(f);
      const hero = modal.querySelector('.avatar-lg');
      hero.innerHTML = `<img src="${base64}" alt="">`;
      try {
        const data = await apiPut('/users/profile', { profilePicture: base64 });
        const nu = data.user || this.user;
        this.user = nu;
        localStorage.setItem('cityfix_user', JSON.stringify(nu));
        this.paintHeaderUser();
        toast('Photo updated', 'success');
      } catch {
        toast('Photo update failed', 'error');
      }
    });

    requestAnimationFrame(() => modal.classList.add('show'));
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('show');
    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
      this.isEditing = false;
    }, 200);
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    location.href = 'login.html';
  }

  /* ---------- Misc ---------- */
  injectStyles() {
    if (document.getElementById('admin-profile-styles')) return;
    const s = document.createElement('style');
    s.id = 'admin-profile-styles';
    s.textContent = `
      .cf-dropdown{position:fixed;right:20px;top:70px;width:420px;max-width:92vw;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.18);z-index:9999;opacity:0;transform:translateY(-8px);transition:.2s;display:none}
      .cf-dropdown.show{display:block;opacity:1;transform:translateY(0)}
      .cf-dd-section{padding:10px 12px;border-bottom:1px solid #f1f5f9}
      .cf-dd-hero{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
      .cf-hero-avatar{width:56px;height:56px;border-radius:50%;background:#fff;color:#667eea;display:flex;align-items:center;justify-content:center;font-weight:800;overflow:hidden}
      .cf-hero-avatar img{width:100%;height:100%;object-fit:cover}
      .cf-hero-meta{display:flex;flex-direction:column;gap:4px}
      .cf-hero-name{font-weight:700}
      .cf-hero-sub{font-size:12px;opacity:.9}
      .cf-role-badge{font-size:11px;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:999px;width:max-content}

      .cf-dd-item{display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;color:#111827;text-decoration:none}
      .cf-dd-item:hover{background:#f1f5f9}
      .cf-dd-item.danger{color:#ef4444}

      .cf-dd-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#fff}
      .cf-dd-header h3{margin:0;font-size:16px}
      .cf-notifs-list{max-height:440px;overflow:auto;background:#fafafa}
      .cf-loading{padding:18px;text-align:center;color:#6b7280}
      .cf-spinner{width:26px;height:26px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;margin:0 auto 10px;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .cf-dd-footer{padding:10px 16px;border-top:1px solid #e5e7eb;background:#fff;text-align:right}
      .cf-link{background:none;border:none;color:#3b82f6;font-weight:700;cursor:pointer}

      .cf-notif{position:relative;display:grid;grid-template-columns:6px 36px 1fr;gap:12px;padding:12px 14px;background:#fff;border-bottom:1px solid #eee;align-items:flex-start}
      .cf-notif.unread{background:#eef5ff}
      .cf-notif .cf-left{border-radius:4px}
      .cf-notif.urgent .cf-left{background:#ef4444}
      .cf-notif.high .cf-left{background:#f59e0b}
      .cf-notif.medium .cf-left{background:#3b82f6}
      .cf-notif.low .cf-left{background:#9ca3af}
      .cf-ico{width:36px;height:36px;border-radius:10px;background:#f3f4f6;display:flex;align-items:center;justify-content:center}
      .cf-main{min-width:0}
      .cf-top{display:flex;justify-content:space-between;gap:10px}
      .cf-title{font-weight:800}
      .cf-chips{display:flex;gap:6px;flex-wrap:wrap}
      .chip{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:900}
      .chip-urgent{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
      .chip-high{background:#ffedd5;color:#9a3412;border:1px solid #fed7aa}
      .chip-medium{background:#dbeafe;color:#1e3a8a;border:1px solid #bfdbfe}
      .chip-low{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}
      .chip-new{background:#111827;color:#fff}
      .cf-msg{color:#4b5563;margin-top:3px}
      .cf-bot{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
      .cf-time{font-size:12px;color:#9ca3af}
      .link{background:none;border:none;color:#3b82f6;font-weight:700;cursor:pointer}
      .link.subtle{color:#6b7280}

      .cf-empty{padding:40px;text-align:center;color:#9ca3af;background:#fff}

      .cf-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s}
      .cf-modal.show{opacity:1}
      .cf-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45)}
      .cf-modal-card{position:relative;background:#fff;border-radius:16px;width:560px;max-width:92vw;box-shadow:0 30px 70px rgba(0,0,0,.3);transform:translateY(10px);transition:.2s}
      .cf-modal.show .cf-modal-card{transform:translateY(0)}
      .cf-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #eef2f7}
      .cf-modal-head h3{margin:0}
      .cf-x{width:32px;height:32px;border:none;border-radius:10px;background:#f3f4f6;font-size:18px;cursor:pointer}
      .cf-modal-body{padding:18px}
      .cf-profile-hero{display:flex;gap:12px;align-items:center;margin-bottom:12px}
      .avatar-lg{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;overflow:hidden}
      .avatar-lg img{width:100%;height:100%;object-fit:cover}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .grid label{display:flex;flex-direction:column;font-size:12px;color:#6b7280;font-weight:800;text-transform:uppercase}
      .grid input{padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc}
      .cf-modal-foot{padding:12px 18px;border-top:1px solid #eef2f7;display:flex;justify-content:space-between;align-items:center}
      .btn{padding:8px 14px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6;cursor:pointer}
      .btn.primary{background:#3b82f6;border-color:#3b82f6;color:#fff}
      .btn.ghost{background:#fff}
      .btn.hidden{display:none}
      @keyframes spin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(s);
  }

  timeAgo(ts) {
    const t = new Date(ts).getTime();
    if (!t) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(t).toLocaleDateString();
  }

  formatDate(v) {
    if (!v) return 'Unknown';
    try {
      return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  }

  escape(str) {
    return (str ?? '').toString().replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  async fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
}

/* ===================== Bootstrap ===================== */
let adminProfileManager = null;
document.addEventListener('DOMContentLoaded', () => {
  adminProfileManager = new AdminProfileManager();
  window.adminProfileManager = adminProfileManager;
});