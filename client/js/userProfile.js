/* header-userprofile.js */
(() => {
  if (window.__CITYFIX_USERPROFILE_INITIALIZED__) return;
  window.__CITYFIX_USERPROFILE_INITIALIZED__ = true;

  const CITYFIX_API_BASE =
    (window.API_CONFIG && window.API_CONFIG.BASE_URL) ||
    window.CITYFIX_API_BASE ||
    'http://localhost:5000';

  const apiURL = (path) => `${CITYFIX_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  async function tryEndpoints(method, candidates, fetchInit = {}) {
    for (const path of candidates) {
      try {
        const res = await fetch(apiURL(path), { method, ...fetchInit });
        if (res.ok) return { ok: true, res, path };
        if (res.status !== 404) return { ok: false, res, path };
      } catch {}
    }
    return { ok: false, res: null, path: null };
  }

  function toast(message, type = 'info') {
    if (window.CityToast?.show) return void window.CityToast.show({ message, type });
    if (window.CityToast?.push) return void window.CityToast.push({ message, type });
    if (window.toast?.show) return void window.toast.show(message, { type });
    if (window.pushToast) return void window.pushToast(message, type);
    if (window.showToast) return void window.showToast(message, type);
    if (window.createToast) return void window.createToast({ message, type });
    window.dispatchEvent(new CustomEvent('toast:show', { detail: { message, type } }));
  }

  function normName(pathname = location.pathname) {
    const last = (pathname.split('/').pop() || '').toLowerCase();
    const name = last.replace(/\.(html|htm)$/, '');
    return name || 'index';
  }

  class UserProfile {
    constructor() {
      this.user = null;
      this.tempAvatar = null;
      this.guardTimer = null;

      try {
        const userData =
          localStorage.getItem('cityfix_user') ||
          sessionStorage.getItem('cityfix_user');
        if (userData) this.user = JSON.parse(userData);
      } catch {}

      document.addEventListener('DOMContentLoaded', () => {
        this.guardPage();
        this.render();
        this.bindDelegatedEvents();
        this.interceptProtectedClicks();
        if (this.isLoggedIn()) this.loadNotifications();
      });
    }

    isLoggedIn() {
      return Boolean(
        localStorage.getItem('cityfix_token') ||
        sessionStorage.getItem('cityfix_token')
      );
    }

    isPublicPath() {
      const name = normName();
      const whitelist = new Set(['index', '', 'home', 'contact', 'contacts', 'count', 'counct']);
      return whitelist.has(name);
    }

    isGuardedPath() {
      const name = normName();
      const guarded = new Set(['submitreport', 'myimpact', 'browsereports']);
      return guarded.has(name);
    }

    guardPage() {
      if (this.isLoggedIn()) return;
      if (this.isPublicPath()) return;
      if (!this.isGuardedPath()) return;
      clearTimeout(this.guardTimer);
      this.guardTimer = setTimeout(() => {
        toast('Please sign in to view this page.', 'warning');
      }, 20000);
    }

    render() {
      const host = document.querySelector('.auth-section');
      if (!host) return;
      if (!this.isLoggedIn()) return;

      host.innerHTML = `
        <div class="header-actions" data-auth="user-only">
          <div class="notification-bell-wrapper">
            <button class="notification-bell" id="notificationBell" aria-label="Notifications">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="notification-badge" id="notifBadge" style="display:none">0</span>
            </button>
            <div class="notifications-dropdown" id="notificationsDropdown">
              <div class="notifications-header">
                <h3>Notifications</h3>
                <button class="mark-all-read" id="markAllReadBtn">Mark all as read</button>
              </div>
              <div class="notifications-list" id="notificationsList"></div>
              <div class="notifications-footer">
                <a href="#" id="notifSettingsLink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M21 12h-6m-6 0H3m13.22 4.22l4.24 4.24M1.54 21.54l4.24-4.24"></path>
                  </svg>
                  Notification Settings
                </a>
              </div>
            </div>
          </div>

          <div class="user-profile-container">
            <div class="user-avatar-wrapper" id="userAvatar">${this.createAvatar()}</div>
            <div class="user-dropdown" id="userDropdown">
              <div class="dropdown-header">
                <div class="dropdown-avatar">${this.createAvatar(true)}</div>
                <div class="dropdown-info">
                  <div class="dropdown-name">${this.user?.username || 'User'}</div>
                  <div class="dropdown-email">${this.user?.email || ''}</div>
                  <div class="dropdown-role"><span class="role-badge ${this.user?.role || 'citizen'}">${this.user?.role || 'citizen'}</span></div>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-menu">
                <a href="#" class="dropdown-item" id="viewProfileItem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  My Profile
                </a>
                ${this.user?.role === 'admin' ? `
                <a href="dashboard.html" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Admin Dashboard
                </a>` : ''}
                <a href="MyImpact.html" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  My Impact
                </a>
                <a href="#" class="dropdown-item" id="openSettingsItem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M21 12h-6m-6 0H3m13.22 4.22l4.24 4.24M1.54 21.54l4.24-4.24"></path>
                  </svg>
                  Settings
                </a>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-footer">
                <button class="logout-btn" id="logoutBtn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }

    bindDelegatedEvents() {
      document.addEventListener('click', (e) => {
        const bell = e.target.closest('#notificationBell');
        if (bell) { e.stopPropagation(); this.toggleNotifications(); return; }

        const markAll = e.target.closest('#markAllReadBtn');
        if (markAll) { e.preventDefault(); this.markAllAsRead(); return; }

        const notifSettings = e.target.closest('#notifSettingsLink');
        if (notifSettings) { e.preventDefault(); this.openNotificationSettings(); return; }

        const avatar = e.target.closest('#userAvatar');
        if (avatar) {
          e.stopPropagation();
          const dd = document.getElementById('userDropdown');
          const nd = document.getElementById('notificationsDropdown');
          if (dd) dd.classList.toggle('is-open');
          if (nd) nd.classList.remove('is-open');
          return;
        }

        const openProfile = e.target.closest('#viewProfileItem');
        if (openProfile) { e.preventDefault(); this.viewProfile(); return; }

        const openSettings = e.target.closest('#openSettingsItem');
        if (openSettings) { e.preventDefault(); this.openSettingsPage(); return; }

        const logout = e.target.closest('#logoutBtn');
        if (logout) { e.preventDefault(); this.logout(); return; }

        const notifItem = e.target.closest('.notification-item');
        if (notifItem?.dataset.id) { this.openNotification(notifItem.dataset.id); return; }

        const uDD = document.getElementById('userDropdown');
        const nDD = document.getElementById('notificationsDropdown');
        if (uDD && !uDD.contains(e.target) && !e.target.closest('#userAvatar')) uDD.classList.remove('is-open');
        if (nDD && !nDD.contains(e.target) && !e.target.closest('#notificationBell')) nDD.classList.remove('is-open');
      });
    }

    interceptProtectedClicks() {
      document.addEventListener('click', (e) => {
        if (this.isLoggedIn()) return;
        const el = e.target.closest('[data-requires-auth], .requires-auth');
        if (!el) return;
        e.preventDefault();
        toast('Login required to continue.', 'warning');
      });
    }

    toggleNotifications() {
      const dropdown = document.getElementById('notificationsDropdown');
      const userDropdown = document.getElementById('userDropdown');
      if (!dropdown) return;
      dropdown.classList.toggle('is-open');
      if (userDropdown) userDropdown.classList.remove('is-open');
      if (dropdown.classList.contains('is-open')) this.loadNotifications();
    }

    async loadNotifications() {
      const list = document.getElementById('notificationsList');
      const badge = document.getElementById('notifBadge');
      if (!list) return;

      const token =
        localStorage.getItem('cityfix_token') ||
        sessionStorage.getItem('cityfix_token');

      list.innerHTML = `
        <div class="loading-notifications">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>`;

      const fetchInit = { headers: { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' } };
      const candidates = ['/api/notifications', '/api/users/notifications', '/api/profile/notifications'];

      try {
        const probe = await tryEndpoints('GET', candidates, fetchInit);
        if (!probe.ok) {
          const local = JSON.parse(localStorage.getItem('cityfix_notifications')||'[]');
          this.renderNotifications(local, badge, list);
          return;
        }
        const data = await probe.res.json();
        const items = (data.notifications || data || []);
        this.renderNotifications(items, badge, list);
      } catch {
        list.innerHTML = `
          <div class="error-notifications" style="padding:24px;text-align:center;color:#6b7280">
            <p>Failed to load notifications</p>
            <button class="mark-all-read" id="retryNotifBtn">Retry</button>
          </div>`;
        document.getElementById('retryNotifBtn')?.addEventListener('click', () => this.loadNotifications());
      }
    }

    renderNotifications(items, badge, list) {
      const unread = items.filter(n => !n.isRead).length;
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }
      list.innerHTML = items.length
        ? items.map(n => `
            <div class="notification-item ${n.isRead ? 'read' : 'unread'}" data-id="${n._id || n.id || ''}">
              <div class="notification-icon">${this.getNotificationIcon(n.type)}</div>
              <div class="notification-content">
                <h4>${n.title || ''}</h4>
                <p>${n.message || ''}</p>
                <span class="notification-time">${this.formatTime(n.createdAt || Date.now())}</span>
              </div>
              ${!n.isRead ? '<span class="unread-dot"></span>' : ''}
            </div>`).join('')
        : `<div class="no-notifications"><p>No new notifications</p></div>`;
    }

    async markAllAsRead() {
      const token =
        localStorage.getItem('cityfix_token') ||
        sessionStorage.getItem('cityfix_token');

      const fetchInit = {
        headers: { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' }
      };
      const candidates = ['/api/notifications/mark-all-read','/api/users/notifications/mark-all-read','/api/profile/notifications/mark-all-read'];

      try {
        const probe = await tryEndpoints('PUT', candidates, fetchInit);
        if (!probe.ok) {
          localStorage.setItem('cityfix_notifications', JSON.stringify([]));
        }
        document.querySelectorAll('.notification-item.unread').forEach(el => {
          el.classList.remove('unread'); el.classList.add('read');
          el.querySelector('.unread-dot')?.remove();
        });
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
        toast('All notifications marked as read.', 'success');
      } catch {
        toast('Failed to mark notifications as read.', 'error');
      }
    }

    async openNotification(id) {
      try {
        const token =
          localStorage.getItem('cityfix_token') ||
          sessionStorage.getItem('cityfix_token');

        const headers = { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' };

        await tryEndpoints('PUT', [
          `/api/notifications/${id}/read`,
          `/api/users/notifications/${id}/read`,
          `/api/profile/notifications/${id}/read`
        ], { headers });

        const getOne = await tryEndpoints('GET', [
          `/api/notifications/${id}`,
          `/api/users/notifications/${id}`,
          `/api/profile/notifications/${id}`
        ], { headers });

        if (!getOne.ok) return;
        const n = await getOne.res.json();

        const type = n.type || '';
        if (['report_status','report_comment','report_resolved'].includes(type)) {
          if (n.reportId) window.location.href = `report-details.html?id=${n.reportId}`;
        } else if (type === 'upvote') {
          window.location.href = 'MyImpact.html';
        }
      } catch {
        toast('Failed to open notification.', 'error');
      }
    }

    openNotificationSettings() {
      this.openSettingsPage();
      setTimeout(() => {
        document.querySelector('.settings-section h2:nth-of-type(4)')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }

    viewProfile() {
      const modal = document.createElement('div');
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-content">
          <div class="profile-modal-header">
            <h2>User Profile</h2>
            <button class="modal-close" id="closeProfileBtn">×</button>
          </div>
          <div class="profile-modal-body">
            <div class="profile-avatar-section">
              ${this.createAvatar(true)}
              <button class="change-avatar-btn" id="changeAvatarDummy">Change Photo</button>
            </div>
            <div class="profile-info-section">
              <div class="info-row"><label>Username:</label><span>${this.user?.username || 'Not set'}</span></div>
              <div class="info-row"><label>Email:</label><span>${this.user?.email || ''}</span></div>
              <div class="info-row"><label>Role:</label><span class="role-badge ${this.user?.role}">${this.user?.role || ''}</span></div>
              ${this.user?.userId ? `<div class="info-row"><label>User ID:</label><span>${this.user.userId}</span></div>` : ''}
              <div class="info-row"><label>Member Since:</label><span>${new Date(this.user?.createdAt || Date.now()).toLocaleDateString()}</span></div>
            </div>
          </div>
          <div class="profile-modal-footer">
            <button class="btn-primary" id="openSettingsFromProfile">Edit Profile</button>
            <button class="btn-secondary" id="closeProfileBtn2">Close</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('closeProfileBtn')?.addEventListener('click', () => this.closeProfileModal());
      document.getElementById('closeProfileBtn2')?.addEventListener('click', () => this.closeProfileModal());
      document.getElementById('openSettingsFromProfile')?.addEventListener('click', () => { this.openSettingsPage(); this.closeProfileModal(); });
    }

    closeSettingsPage() {
      const s = document.querySelector('.settings-page-overlay');
      if (!s) return;
      s.classList.remove('active');
      setTimeout(() => s.remove(), 200);
    }

    openSettingsPage() {
      this.closeProfileModal();
      const page = document.createElement('div');
      page.className = 'settings-page-overlay';
      page.innerHTML = `
        <div class="settings-container">
          <div class="settings-header">
            <button class="back-btn" id="closeSettingsBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <h1>Profile Settings</h1>
            <button class="save-btn" id="saveSettingsBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Changes
            </button>
          </div>
          <div class="settings-content">
            <div class="settings-section">
              <h2>Profile Picture</h2>
              <div class="avatar-upload-section">
                <div class="current-avatar" id="currentAvatar">${this.createAvatar(true)}</div>
                <div class="avatar-actions">
                  <input type="file" id="avatarInput" accept="image/*" style="display:none;">
                  <button class="upload-btn" id="avatarUploadBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload New Photo
                  </button>
                  <button class="remove-btn" id="avatarRemoveBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h2>Basic Information</h2>
              <div class="form-grid">
                <div class="form-group"><label for="username">Username</label><input type="text" id="username" value="${this.user?.username || ''}" placeholder="Enter username"></div>
                <div class="form-group"><label for="email">Email Address</label><input type="email" id="email" value="${this.user?.email || ''}" placeholder="Enter email"></div>
                <div class="form-group"><label for="phone">Phone Number</label><input type="tel" id="phone" value="${this.user?.phone || ''}" placeholder="+1 (555) 000-0000"></div>
                <div class="form-group"><label for="location">Location</label><input type="text" id="location" value="${this.user?.location || ''}" placeholder="City, Country"></div>
              </div>
            </div>

            <div class="settings-section">
              <h2>Personal Details</h2>
              <div class="form-grid">
                <div class="form-group"><label for="firstName">First Name</label><input type="text" id="firstName" value="${this.user?.firstName || ''}" placeholder="Enter first name"></div>
                <div class="form-group"><label for="lastName">Last Name</label><input type="text" id="lastName" value="${this.user?.lastName || ''}" placeholder="Enter last name"></div>
                <div class="form-group full-width"><label for="bio">Bio</label><textarea id="bio" rows="4" placeholder="Tell us about yourself...">${this.user?.bio || ''}</textarea></div>
              </div>
            </div>

            <div class="settings-section">
              <h2>Security</h2>
              <div class="form-grid">
                <div class="form-group"><label for="currentPassword">Current Password</label><input type="password" id="currentPassword" placeholder="Enter current password"></div>
                <div class="form-group"><label for="newPassword">New Password</label><input type="password" id="newPassword" placeholder="Enter new password"></div>
                <div class="form-group"><label for="confirmPassword">Confirm New Password</label><input type="password" id="confirmPassword" placeholder="Confirm new password"></div>
              </div>
            </div>

            <div class="settings-section">
              <h2>Preferences</h2>
              <div class="preferences-grid">
                <div class="preference-item">
                  <div class="preference-info"><h3>Email Notifications</h3><p>Receive email updates about your reports</p></div>
                  <label class="toggle-switch"><input type="checkbox" id="emailNotifications" ${this.user?.emailNotifications ? 'checked' : ''}><span class="toggle-slider"></span></label>
                </div>
                <div class="preference-item">
                  <div class="preference-info"><h3>SMS Notifications</h3><p>Get SMS alerts for urgent updates</p></div>
                  <label class="toggle-switch"><input type="checkbox" id="smsNotifications" ${this.user?.smsNotifications ? 'checked' : ''}><span class="toggle-slider"></span></label>
                </div>
                <div class="preference-item">
                  <div class="preference-info"><h3>Public Profile</h3><p>Make your profile visible to other users</p></div>
                  <label class="toggle-switch"><input type="checkbox" id="publicProfile" ${this.user?.publicProfile ? 'checked' : ''}><span class="toggle-slider"></span></label>
                </div>
              </div>
            </div>

            <div class="settings-section danger-zone">
              <h2>Danger Zone</h2>
              <div class="danger-actions">
                <div class="danger-item"><div><h3>Deactivate Account</h3><p>Temporarily disable your account</p></div><button class="btn-warning" id="deactivateBtn">Deactivate</button></div>
                <div class="danger-item"><div><h3>Delete Account</h3><p>Permanently delete your account and all data</p></div><button class="btn-danger" id="deleteBtn">Delete Account</button></div>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(page);

      document.getElementById('avatarUploadBtn')?.addEventListener('click', () => document.getElementById('avatarInput').click());
      document.getElementById('avatarInput')?.addEventListener('change', (e) => this.previewAvatar(e));
      document.getElementById('avatarRemoveBtn')?.addEventListener('click', () => this.removeAvatar());
      document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettingsPage());
      document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
      document.getElementById('deactivateBtn')?.addEventListener('click', () => this.deactivateAccount());
      document.getElementById('deleteBtn')?.addEventListener('click', () => this.deleteAccount());
    }

    closeProfileModal() {
      const m = document.querySelector('.profile-modal');
      if (!m) return;
      m.classList.add('closing');
      setTimeout(() => m.remove(), 200);
    }

    previewAvatar(e) {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const el = document.getElementById('currentAvatar');
        if (el) {
          el.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="width:100px;height:100px;border-radius:50%;object-fit:cover;">`;
          this.tempAvatar = ev.target.result;
        }
      };
      reader.readAsDataURL(file);
    }

    removeAvatar() {
      const el = document.getElementById('currentAvatar');
      if (el) { el.innerHTML = this.createAvatar(true); this.tempAvatar = null; }
    }

    async saveSettings() {
      const formData = {
        username: document.getElementById('username')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        location: document.getElementById('location')?.value || '',
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        bio: document.getElementById('bio')?.value || '',
        emailNotifications: document.getElementById('emailNotifications')?.checked,
        smsNotifications: document.getElementById('smsNotifications')?.checked,
        publicProfile: document.getElementById('publicProfile')?.checked,
        notifFrequency: document.querySelector('input[name="frequency"]:checked')?.value || 'instant'
      };
      if (this.tempAvatar) formData.profilePhoto = this.tempAvatar;

      const currentPassword = document.getElementById('currentPassword')?.value || '';
      const newPassword = document.getElementById('newPassword')?.value || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value || '';

      if (newPassword) {
        if (newPassword !== confirmPassword) { toast('New passwords do not match!', 'error'); return; }
        if (!currentPassword) { toast('Enter your current password to change it.', 'error'); return; }
        formData.currentPassword = currentPassword;
        formData.newPassword = newPassword;
      }

      const btn = document.getElementById('saveSettingsBtn');
      const prev = btn?.innerHTML;
      if (btn) { btn.innerHTML = '<span class="spinner"></span> Saving...'; btn.disabled = true; }

      try {
        const token =
          localStorage.getItem('cityfix_token') ||
          sessionStorage.getItem('cityfix_token');

        const headers = { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' };
        const body = JSON.stringify(formData);

        const candidates = [
          '/api/user/profile',
          '/api/users/me',
          '/api/profile',
          '/api/profiles/me',
          '/api/users/profile'
        ];
        const probe = await tryEndpoints('PUT', candidates, { headers, body });

        if (!probe.ok) {
          const merged = { ...(this.user||{}), ...formData };
          localStorage.setItem('cityfix_user', JSON.stringify(merged));
          sessionStorage.setItem('cityfix_user', JSON.stringify(merged));
          this.user = merged;
          toast('Saved locally (no backend route).', 'info');
          this.render();
          return;
        }

        const data = await probe.res.json().catch(() => ({}));
        const updatedUser = { ...this.user, ...(data.user || formData) };
        localStorage.setItem('cityfix_user', JSON.stringify(updatedUser));
        sessionStorage.setItem('cityfix_user', JSON.stringify(updatedUser));
        this.user = updatedUser;
        toast('Settings saved successfully.', 'success');
        this.render();
      } catch (err) {
        toast(err?.message || 'Failed to save settings.', 'error');
      } finally {
        if (btn) { btn.innerHTML = prev; btn.disabled = false; }
        ['currentPassword','newPassword','confirmPassword'].forEach(id => { const i = document.getElementById(id); if (i) i.value = ''; });
      }
    }

    async deactivateAccount() {
      if (!confirm('Are you sure you want to deactivate your account? You can reactivate it by logging in again.')) return;
      try {
        const token =
          localStorage.getItem('cityfix_token') ||
          sessionStorage.getItem('cityfix_token');
        const res = await tryEndpoints('PUT', ['/api/user/deactivate','/api/users/deactivate'], {
          headers: { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error();
        toast('Account deactivated.', 'info');
        setTimeout(() => this.logout(), 800);
      } catch {
        toast('Failed to deactivate account.', 'error');
      }
    }

    async deleteAccount() {
      const ok = prompt('WARNING: This action cannot be undone. Type "DELETE" to confirm:');
      if (ok !== 'DELETE') return;
      try {
        const token =
          localStorage.getItem('cityfix_token') ||
          sessionStorage.getItem('cityfix_token');
        const res = await tryEndpoints('DELETE', ['/api/user/delete','/api/users/delete'], {
          headers: { 'Authorization': `Bearer ${token||''}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error();
        toast('Account deleted permanently.', 'info');
        setTimeout(() => this.logout(), 800);
      } catch {
        toast('Failed to delete account.', 'error');
      }
    }

    async logout() {
      localStorage.removeItem('cityfix_token');
      localStorage.removeItem('cityfix_user');
      sessionStorage.clear();
      setTimeout(() => { window.location.href = 'login.html'; }, 700);
    }

    createAvatar(large = false) {
      const size = large ? 50 : 35;
      if (this.user?.profilePhoto) {
        return `<img src="${this.user.profilePhoto}" alt="${this.user?.username || 'User'}" class="user-avatar-img" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
      }
      const src = (this.user?.username || this.user?.email || 'U');
      const first = src[0]?.toUpperCase() || 'U';
      const colors = ['#667eea','#f56565','#48bb78','#ed8936','#9f7aea','#38b2ac','#ed64a6','#4299e1','#ecc94b','#a0aec0'];
      const code = src.charCodeAt(0) || 'U'.charCodeAt(0);
      const bg = colors[code % colors.length];
      return `<div class="user-avatar-letter" style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;background:${bg};">${first}</div>`;
    }

    formatTime(ts) {
      const now = new Date();
      const date = new Date(ts);
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
      return date.toLocaleDateString();
    }

    getNotificationIcon() {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    }
  }

  if (!window.userProfile) window.userProfile = new UserProfile();
})();
