// header-User.js - Professional Header Management
(() => {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    PUBLIC_PAGES: new Set(['', 'index', 'home', 'contact', 'contacts', 'about']),
    GUARDED_PAGES: new Set(['submitreport', 'myimpact', 'browsereports', 'dashboard']),
    STORAGE_KEYS: {
      USER: 'cityfix_user',
      TOKEN: 'cityfix_token',
      NOTIFICATIONS: 'cityfix_notifications'
    },
    API_ENDPOINTS: {
      NOTIFICATIONS: ['/api/notifications', '/api/users/notifications', '/api/profile/notifications'],
      AUTH_ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout'
    },
    REFRESH_INTERVAL: 60000
  };

  const API_BASE = window.API_CONFIG?.BASE_URL || window.CITYFIX_API_BASE || location.origin;
  
  // ===== UTILITIES =====
  const Utils = {
    qs: (s, r = document) => r.querySelector(s),
    qsa: (s, r = document) => Array.from(r.querySelectorAll(s)),
    
    apiURL(path) {
      return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
    },
    
    pageName() {
      const path = location.pathname.split('/').pop() || '';
      return path.replace(/\.(html|htm)$/i, '').toLowerCase() || 'index';
    },
    
    isLoggedIn() {
      return Boolean(
        localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || 
        sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN)
      );
    },
    
    getToken() {
      return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || 
             sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    },
    
    readUser() {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 
                    sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
    
    writeUser(user) {
      const json = JSON.stringify(user || {});
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, json);
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER, json);
    },
    
    clearAuth() {
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    },
    
    toast(message, type = 'info') {
      if (window.CityToast?.show) return window.CityToast.show({ message, type });
      if (window.toast?.show) return window.toast.show(message, { type });
      
      const toast = document.createElement('div');
      toast.className = `hf-toast hf-toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('hf-toast-show'), 10);
      setTimeout(() => {
        toast.classList.remove('hf-toast-show');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    },
    
    formatTimeAgo(timestamp) {
      const now = new Date();
      const date = new Date(timestamp);
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    },
    
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  };

  // ===== STYLES =====
  function injectStyles() {
    if (document.getElementById('cityfix-header-styles')) return;
    
    const css = `
      /* Auth Section */
      .auth-section {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      
      /* Icon Buttons - Desktop Profile */
      .notification-bell,
      .user-icon-btn {
        position: relative;
        background: transparent;
        border: 0;
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .notification-bell:hover,
      .user-icon-btn:hover {
        background: rgba(21, 95, 160, 0.08);
        transform: scale(1.05);
      }
      
      .notification-bell:active,
      .user-icon-btn:active {
        transform: scale(0.95);
      }
      
      .notification-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
        border: 2px solid #fff;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      
      /* User Avatar Styles */
      .user-avatar-letter {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        border: 2px solid #fff;
        transition: all 0.3s ease;
      }
      
      .user-icon-btn:hover .user-avatar-letter {
        box-shadow: 0 4px 12px rgba(21, 95, 160, 0.3);
        transform: scale(1.05);
      }
      
      .user-avatar-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        border: 2px solid #fff;
        transition: all 0.3s ease;
      }
      
      .user-icon-btn:hover .user-avatar-img {
        box-shadow: 0 4px 12px rgba(21, 95, 160, 0.3);
        transform: scale(1.05);
      }
      
      /* Panels */
      .hf-panel {
        position: absolute;
        z-index: 10000;
        width: min(380px, calc(100vw - 24px));
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: none;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .hf-panel.is-open {
        display: block;
      }
      
      .panel-header {
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #f1f5f9;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      
      .panel-title {
        font-weight: 700;
        font-size: 16px;
        color: #111827;
      }
      
      .panel-body {
        max-height: 60vh;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      .panel-body::-webkit-scrollbar {
        width: 6px;
      }
      
      .panel-body::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      
      .panel-body::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      /* Notifications */
      .notifications-list {
        display: grid;
        gap: 8px;
        padding: 12px;
      }
      
      .notification-item {
        display: flex;
        gap: 12px;
        padding: 14px;
        border-radius: 12px;
        background: #fafafa;
        border: 1px solid #f1f5f9;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .notification-item:hover {
        background: #f8fafc;
        border-color: #e2e8f0;
        transform: translateX(2px);
      }
      
      .notification-item.unread {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-color: #bae6fd;
      }
      
      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #155FA0 0%, #344A75 100%);
        display: grid;
        place-items: center;
        color: #fff;
      }
      
      .notification-content {
        flex: 1;
        min-width: 0;
      }
      
      .notification-content h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }
      
      .notification-content p {
        margin: 0 0 6px 0;
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
      }
      
      .notification-time {
        font-size: 12px;
        color: #9ca3af;
      }
      
      .unread-dot {
        position: absolute;
        right: 12px;
        top: 14px;
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      
      /* Profile Card */
      .profile-card {
        padding: 20px;
        display: grid;
        gap: 14px;
      }
      
      .profile-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px;
        background: linear-gradient(135deg, rgba(21, 95, 160, 0.05) 0%, rgba(52, 74, 117, 0.05) 100%);
        border-radius: 12px;
      }
      
      .profile-avatar-large {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 700;
        font-size: 22px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 3px solid #fff;
      }
      
      .profile-avatar-img {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 3px solid #fff;
      }
      
      .role-badge {
        display: inline-block;
        background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
        color: #4338ca;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .role-badge.admin {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
      }
      
      .role-badge.official {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #1e40af;
      }
      
      /* Panel Actions */
      .panel-actions {
        padding: 14px 18px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        background: #fafbfc;
      }
      
      /* Mobile User Card */
      .mobile-user-card {
        padding: 16px 20px;
        background: linear-gradient(135deg, rgba(21, 95, 160, 0.08) 0%, rgba(52, 74, 117, 0.08) 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 12px 14px 0;
        border: 1px solid rgba(21, 95, 160, 0.15);
      }
      
      .mobile-user-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 700;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 2px solid #fff;
      }
      
      .mobile-user-avatar-img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 2px solid #fff;
      }
      
      .mobile-user-info {
        flex: 1;
        min-width: 0;
      }
      
      .mobile-user-name {
        font-weight: 700;
        font-size: 16px;
        color: #111827;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .mobile-user-email {
        font-size: 13px;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 6px;
      }
      
      /* Mobile Logout Button */
      .mobile-logout {
        display: block;
        margin: 12px 14px 18px;
        padding: 16px;
        border-radius: 12px;
        background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
        color: #b91c1c;
        text-align: center;
        font-weight: 700;
        font-size: 15px;
        border: 2px solid #fecdd3;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
      }
      
      .mobile-logout:hover {
        background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(185, 28, 28, 0.25);
      }
      
      /* Mobile Auth Wrap */
      .mobile-auth-wrap {
        display: none;
      }

      @media (max-width: 768px) {
        .mobile-auth-wrap {
          display: flex !important;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        .mobile-auth-wrap .nav-item {
          padding: 16px 24px;
          text-align: center;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .mobile-auth-wrap .mobile-login-btn {
          background: white;
          color: #155FA0;
          border: 2px solid #155FA0;
          box-shadow: 0 2px 8px rgba(21, 95, 160, 0.15);
        }
        
        .mobile-auth-wrap .mobile-login-btn:hover {
          background: #f0f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(21, 95, 160, 0.25);
        }
        
        .mobile-auth-wrap .mobile-signup-btn {
          background: linear-gradient(90deg, #155FA0 0%, #344A75 75%, #13243C 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(21, 95, 160, 0.3);
        }
        
        .mobile-auth-wrap .mobile-signup-btn:hover {
          background: linear-gradient(90deg, #1a6bb8 0%, #3d5586 75%, #1a2e4d 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(21, 95, 160, 0.4);
        }
      }

      @media (min-width: 769px) {
        .mobile-auth-wrap,
        .mobile-user-card {
          display: none !important;
        }
      }
      
      /* Toast Notifications */
      .hf-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 16px 24px;
        border-radius: 12px;
        background: #fff;
        color: #111827;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 100000;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
      }
      
      .hf-toast-show {
        opacity: 1;
        transform: translateX(0);
      }
      
      .hf-toast-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #fff;
      }
      
      .hf-toast-error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #fff;
      }
      
      .hf-toast-warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #fff;
      }
      
      .hf-toast-info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #fff;
      }
      
      /* Empty States */
      .panel-empty {
        padding: 40px 24px;
        text-align: center;
        color: #9ca3af;
      }
      
      .panel-empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }
      
      /* Loading States */
      .panel-loading {
        padding: 40px 24px;
        text-align: center;
        color: #6b7280;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .hf-panel {
          width: calc(100vw - 24px);
          max-height: 80vh;
        }
        
        .hf-toast {
          right: 12px;
          top: 12px;
          max-width: calc(100vw - 24px);
        }
        
        .notification-bell,
        .user-icon-btn {
          width: 40px;
          height: 40px;
        }
        
        .user-avatar-letter,
        .user-avatar-img {
          width: 36px;
          height: 36px;
          font-size: 14px;
        }
      }
    `.trim();
    
    const style = document.createElement('style');
    style.id = 'cityfix-header-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ===== PANELS MANAGEMENT =====
  const PanelManager = {
    current: null,
    
    open(anchor, panel) {
      this.closeAll();
      this.position(anchor, panel);
      panel.classList.add('is-open');
      
      setTimeout(() => {
        document.addEventListener('click', this._handleOutsideClick, { once: true });
        window.addEventListener('resize', this._handleResize);
        window.addEventListener('scroll', this._handleScroll, { passive: true });
      });
      
      this.current = { anchor, panel };
    },
    
    close(panel) {
      const target = panel || this.current?.panel;
      if (target) {
        target.classList.remove('is-open');
        window.removeEventListener('resize', this._handleResize);
        window.removeEventListener('scroll', this._handleScroll);
      }
      this.current = null;
    },
    
    closeAll() {
      document.querySelectorAll('.hf-panel.is-open').forEach(p => {
        p.classList.remove('is-open');
      });
      this.current = null;
    },
    
    position(anchor, panel) {
      const rect = anchor.getBoundingClientRect();
      const top = rect.bottom + 12 + window.scrollY;
      const right = window.innerWidth - rect.right;
      
      panel.style.top = `${top}px`;
      panel.style.right = `${right}px`;
      panel.style.left = 'auto';
    },
    
    _handleOutsideClick(e) {
      const { panel, anchor } = PanelManager.current || {};
      if (!panel) return;
      
      if (!panel.contains(e.target) && !anchor.contains(e.target)) {
        PanelManager.close();
      }
    },
    
    _handleResize: Utils.debounce(() => {
      if (PanelManager.current) {
        PanelManager.position(PanelManager.current.anchor, PanelManager.current.panel);
      }
    }, 150),
    
    _handleScroll: Utils.debounce(() => {
      if (PanelManager.current) {
        PanelManager.position(PanelManager.current.anchor, PanelManager.current.panel);
      }
    }, 100)
  };

  // ===== NOTIFICATIONS MANAGER =====
  const NotificationManager = {
    cache: [],
    lastFetch: 0,
    
    getIcon(type) {
      const icons = {
        report_status: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>',
        report_comment: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>',
        upvote: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"></path></svg>',
        default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>'
      };
      return icons[type] || icons.default;
    },
    
    async load() {
      const list = Utils.qs('#notificationsList');
      const badge = Utils.qs('#notifBadge');
      
      if (!list) return;
      
      list.innerHTML = `
        <div class="panel-loading">
          <div class="spinner"></div>
          <div style="margin-top: 12px">Loading...</div>
        </div>
      `;
      
      try {
        const token = Utils.getToken();
        const headers = {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        };
        
        let data = [];
        
        for (const endpoint of CONFIG.API_ENDPOINTS.NOTIFICATIONS) {
          try {
            const response = await fetch(Utils.apiURL(endpoint), { headers });
            if (response.ok) {
              const json = await response.json();
              data = json.notifications || json.data || json || [];
              break;
            }
            if (response.status !== 404) break;
          } catch (err) {
            console.warn(`Failed to fetch from ${endpoint}:`, err);
          }
        }
        
        if (data.length === 0) {
          const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS);
          data = cached ? JSON.parse(cached) : [];
        } else {
          localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data));
        }
        
        this.cache = data;
        this.lastFetch = Date.now();
        
        const unreadCount = data.filter(n => !n.isRead && !n.read).length;
        
        if (badge) {
          badge.textContent = unreadCount;
          badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        if (data.length === 0) {
          list.innerHTML = `
            <div class="panel-empty">
              <div class="panel-empty-icon">🔔</div>
              <div style="font-weight: 600; margin-bottom: 4px;">No notifications</div>
              <div style="font-size: 13px;">You're all caught up!</div>
            </div>
          `;
        } else {
          list.innerHTML = data.map(n => `
            <div class="notification-item ${n.isRead || n.read ? 'read' : 'unread'}" 
                 data-id="${n._id || n.id || ''}"
                 data-type="${n.type || ''}"
                 data-report-id="${n.reportId || ''}">
              <div class="notification-icon">
                ${this.getIcon(n.type)}
              </div>
              <div class="notification-content">
                <h4>${n.title || 'Notification'}</h4>
                <p>${n.message || n.body || ''}</p>
                <span class="notification-time">${Utils.formatTimeAgo(n.createdAt || n.created_at || Date.now())}</span>
              </div>
              ${!n.isRead && !n.read ? '<span class="unread-dot"></span>' : ''}
            </div>
          `).join('');
        }
        
      } catch (error) {
        console.error('Failed to load notifications:', error);
        list.innerHTML = `
          <div class="panel-empty">
            <div class="panel-empty-icon">⚠️</div>
            <div style="font-weight: 600; margin-bottom: 4px;">Failed to load</div>
            <div style="font-size: 13px;">Please try again</div>
          </div>
        `;
      }
    },
    
    async markAsRead(id) {
      if (!id) return;
      
      const token = Utils.getToken();
      const headers = {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      };
      
      const endpoints = CONFIG.API_ENDPOINTS.NOTIFICATIONS.map(e => `${e}/${id}/read`);
      
      for (const endpoint of endpoints) {
        try {
          await fetch(Utils.apiURL(endpoint), { method: 'PUT', headers });
          break;
        } catch (err) {
          console.warn(`Failed to mark notification as read:`, err);
        }
      }
      
      this.cache = this.cache.map(n => 
        (n._id === id || n.id === id) ? { ...n, isRead: true, read: true } : n
      );
      localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.cache));
      
      await this.load();
    },
    
    async handleClick(item) {
      const id = item.dataset.id;
      const type = item.dataset.type;
      const reportId = item.dataset.reportId;
      
      if (id) {
        await this.markAsRead(id);
      }
      
      if (type === 'report_status' && reportId) {
        location.href = `report-details.html?id=${reportId}`;
      } else if (type === 'report_comment' && reportId) {
        location.href = `report-details.html?id=${reportId}`;
      } else if (type === 'upvote') {
        location.href = 'MyImpact.html';
      } else if (reportId) {
        location.href = `report-details.html?id=${reportId}`;
      }
      
      PanelManager.closeAll();
    },
    
    async markAllAsRead() {
      const token = Utils.getToken();
      const headers = {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      };
      
      try {
        await fetch(Utils.apiURL('/api/notifications/mark-all-read'), {
          method: 'PUT',
          headers
        });
      } catch (err) {
        console.warn('Failed to mark all as read on server:', err);
      }
      
      this.cache = this.cache.map(n => ({ ...n, isRead: true, read: true }));
      localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.cache));
      
      await this.load();
      Utils.toast('All notifications marked as read', 'success');
    }
  };

  // ===== AVATAR GENERATOR =====
  function generateAvatar(user, large = false, mobile = false) {
    let size, fontSize, className;
    
    if (mobile) {
      size = 50;
      fontSize = 20;
      className = 'mobile-user-avatar';
    } else if (large) {
      size = 56;
      fontSize = 22;
      className = 'profile-avatar-large';
    } else {
      size = 40;
      fontSize = 16;
      className = 'user-avatar-letter';
    }
    
    if (user?.profilePhoto || user?.avatar) {
      return `<img src="${user.profilePhoto || user.avatar}" 
                   alt="${user.username || user.name || 'User'}" 
                   class="${mobile ? 'mobile-user-avatar-img' : large ? 'profile-avatar-img' : 'user-avatar-img'}" 
                   style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    }
    
    const source = user?.username || user?.name || user?.email || 'U';
    const firstLetter = source[0]?.toUpperCase() || 'U';
    
    const colors = [
      '#155FA0', '#f56565', '#48bb78', '#ed8936', '#9f7aea',
      '#38b2ac', '#ed64a6', '#4299e1', '#ecc94b', '#344A75'
    ];
    
    const charCode = source.charCodeAt(0) || 85;
    const bgColor = colors[charCode % colors.length];
    
    return `<div class="${className}" 
                 style="width:${size}px;
                        height:${size}px;
                        border-radius:50%;
                        display:grid;
                        place-items:center;
                        color:#fff;
                        font-weight:700;
                        font-size:${fontSize}px;
                        background:${bgColor};">
              ${firstLetter}
            </div>`;
  }

  // ===== MOBILE MENU FUNCTIONS =====
  
  function ensureMobileAuthLinks() {
    const nav = Utils.qs('.mobile-nav');
    if (!nav) return;
    
    removeMobileAuthLinks();
    removeMobileLogout();
    removeMobileUserCard();
    
    const wrap = document.createElement('div');
    wrap.className = 'mobile-auth-wrap';
    wrap.innerHTML = `
      <a href="login.html" class="nav-item mobile-login-btn">Log in</a>
      <a href="signup.html" class="nav-item mobile-signup-btn">Sign up</a>
    `;
    
    nav.appendChild(wrap);
  }

  function removeMobileAuthLinks() {
    Utils.qs('.mobile-auth-wrap')?.remove();
  }

  function ensureMobileUserCard() {
    const nav = Utils.qs('.mobile-nav');
    if (!nav) return;
    
    removeMobileUserCard();
    
    const user = Utils.readUser() || {};
    
    const userCard = document.createElement('div');
    userCard.className = 'mobile-user-card';
    userCard.innerHTML = `
      ${generateAvatar(user, false, true)}
      <div class="mobile-user-info">
        <div class="mobile-user-name">${user.username || user.name || 'User'}</div>
        <div class="mobile-user-email">${user.email || ''}</div>
        <span class="role-badge ${user.role || 'citizen'}">
          ${(user.role || 'citizen').toUpperCase()}
        </span>
      </div>
    `;
    
    nav.appendChild(userCard);
  }

  function removeMobileUserCard() {
    Utils.qs('.mobile-user-card')?.remove();
  }

  function ensureMobileLogout() {
    const nav = Utils.qs('.mobile-nav');
    if (!nav) return;
    
    removeMobileLogout();
    
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'mobile-logout';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
    
    nav.appendChild(logoutBtn);
  }

  function removeMobileLogout() {
    Utils.qs('.mobile-logout')?.remove();
  }

  // ===== MOBILE MENU CONTROLLER =====
  
  class MobileMenuController {
    constructor() {
      this.btn = Utils.qs('.mobile-menu-btn');
      this.nav = Utils.qs('.mobile-nav');
      this.overlay = Utils.qs('.mobile-menu-overlay');
      this.body = document.body;
      this.isOpen = false;
      
      this.init();
    }
    
    init() {
      if (!this.btn || !this.nav) return;
      
      this.btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
      
      if (this.overlay) {
        this.overlay.addEventListener('click', () => {
          this.close();
        });
      }
      
      document.addEventListener('click', (e) => {
        if (this.isOpen && 
            !this.nav.contains(e.target) && 
            !this.btn.contains(e.target)) {
          this.close();
        }
      });
      
      Utils.qsa('.mobile-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => {
          setTimeout(() => this.close(), 100);
        });
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
      
      this.highlightActive();
    }
    
    open() {
      this.isOpen = true;
      this.btn.classList.add('active');
      this.nav.classList.add('active');
      if (this.overlay) {
        this.overlay.classList.add('active');
      }
      this.body.classList.add('mobile-menu-open');
      
      const scrollY = window.scrollY;
      this.body.style.position = 'fixed';
      this.body.style.top = `-${scrollY}px`;
      this.body.style.width = '100%';
      this.body.setAttribute('data-scroll-position', scrollY);
    }
    
    close() {
      this.isOpen = false;
      this.btn.classList.remove('active');
      this.nav.classList.remove('active');
      if (this.overlay) {
        this.overlay.classList.remove('active');
      }
      this.body.classList.remove('mobile-menu-open');
      
      const scrollY = this.body.getAttribute('data-scroll-position') || '0';
      this.body.style.position = '';
      this.body.style.top = '';
      this.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY));
      this.body.removeAttribute('data-scroll-position');
    }
    
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    
    highlightActive() {
      const current = Utils.pageName();
      const isHome = current === 'index' || current === '';
      
      Utils.qsa('.nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const linkPage = href.replace(/\.(html|htm)$/i, '').toLowerCase();
        
        if (linkPage === current || 
            linkPage === `/${current}` ||
            (isHome && (href === '/' || href === 'index.html' || linkPage === 'index'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  // ===== AUTH AREA RENDERER =====
  
  // ===== AUTH AREA RENDERER =====

function renderAuthArea() {
  const host = Utils.qs('.auth-section');
  if (!host) return;
  
  const isLogged = Utils.isLoggedIn();
  
  if (!isLogged) {
    removePanels();
    removeMobileLogout();
    removeMobileUserCard();
    ensureMobileAuthLinks();
    
    // Ensure desktop buttons exist
    if (!host.querySelector('.login-btn') || !host.querySelector('.signup-btn')) {
      host.innerHTML = `
        <a href="login.html" class="login-btn">Login</a>
        <a href="signup.html" class="signup-btn">Sign Up</a>
      `;
    }
    return;
  }
  
  // User is logged in
  removeMobileAuthLinks();
  ensureMobileUserCard();
  ensureMobileLogout();
  
  const user = Utils.readUser() || {};
  
  host.innerHTML = `
    <div class="header-actions">
      <div style="position:relative">
        <button class="notification-bell" 
                id="notificationBell" 
                aria-label="Notifications" 
                title="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notification-badge" id="notifBadge" style="display:none">0</span>
        </button>
      </div>
      <div style="position:relative">
        <button class="user-icon-btn" 
                id="userIconBtn" 
                aria-label="Profile Menu" 
                title="Profile Menu">
          ${generateAvatar(user)}
        </button>
      </div>
    </div>
  `;
  
  ensurePanels(user);
  bindAuthEvents();
}

  // ===== PANELS CREATION =====
  
  function ensurePanels(user) {
    if (!Utils.qs('#notifPanel')) {
      const panel = document.createElement('div');
      panel.id = 'notifPanel';
      panel.className = 'hf-panel';
      panel.innerHTML = `
        <div class="panel-header">
          <div class="panel-title">Notifications</div>
          <button class="btn-link" 
                  id="markAllReadBtn" 
                  style="background:none;border:none;color:#155FA0;cursor:pointer;font-size:13px;font-weight:600;">
            Mark all read
          </button>
        </div>
        <div class="panel-body">
          <div class="notifications-list" id="notificationsList"></div>
        </div>
      `;
      document.body.appendChild(panel);
    }
    
    if (!Utils.qs('#profilePanel')) {
      const panel = document.createElement('div');
      panel.id = 'profilePanel';
      panel.className = 'hf-panel';
      panel.innerHTML = `
        <div class="panel-header">
          <div class="panel-title">My Account</div>
        </div>
        <div class="panel-body">
          <div class="profile-card">
            <div class="profile-row">
              ${generateAvatar(user, true)}
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:17px;color:#111827;margin-bottom:4px;">
                  ${user.username || user.name || 'User'}
                </div>
                <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">
                  ${user.email || ''}
                </div>
                <span class="role-badge ${user.role || 'citizen'}">
                  ${(user.role || 'citizen').toUpperCase()}
                </span>
              </div>
            </div>
            <a href="MyImpact.html" 
               class="btn btn-secondary" 
               style="width:100%;text-align:center;margin-top:8px;">
              📊 My Impact
            </a>
            ${user.role === 'admin' ? `
              <a href="dashboard.html" 
                 class="btn btn-primary" 
                 style="width:100%;text-align:center;">
                🎛️ Admin Dashboard
              </a>
            ` : ''}
          </div>
        </div>
        <div class="panel-actions">
          <button class="btn btn-secondary" id="logoutBtn">Logout</button>
        </div>
      `;
      document.body.appendChild(panel);
    }
  }

  function removePanels() {
    Utils.qs('#notifPanel')?.remove();
    Utils.qs('#profilePanel')?.remove();
  }

  // ===== EVENT BINDING =====
  
  function bindAuthEvents() {
    const bell = Utils.qs('#notificationBell');
    const bellPanel = Utils.qs('#notifPanel');
    
    bell?.addEventListener('click', (e) => {
      e.stopPropagation();
      PanelManager.open(bell, bellPanel);
      NotificationManager.load();
    });
    
    const userBtn = Utils.qs('#userIconBtn');
    const profPanel = Utils.qs('#profilePanel');
    
    userBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      PanelManager.open(userBtn, profPanel);
    });
    
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.notification-item');
      if (item) {
        NotificationManager.handleClick(item);
      }
    });
    
    Utils.qs('#markAllReadBtn')?.addEventListener('click', () => {
      NotificationManager.markAllAsRead();
    });
    
    Utils.qs('#logoutBtn')?.addEventListener('click', handleLogout);
  }

  // ===== LOGOUT HANDLER =====
  
  async function handleLogout() {
    try {
      const token = Utils.getToken();
      
      if (token) {
        try {
          await fetch(Utils.apiURL(CONFIG.API_ENDPOINTS.LOGOUT), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.warn('Server logout failed:', err);
        }
      }
      
      Utils.clearAuth();
      Utils.toast('Logged out successfully', 'success');
      
      setTimeout(() => {
        location.href = 'login.html';
      }, 500);
      
    } catch (error) {
      console.error('Logout error:', error);
      Utils.clearAuth();
      location.href = 'login.html';
    }
  }

  // ===== PAGE GUARD =====
  
  function guardPage() {
    if (Utils.isLoggedIn()) return;
    
    const page = Utils.pageName();
    
    if (CONFIG.PUBLIC_PAGES.has(page)) return;
    if (!CONFIG.GUARDED_PAGES.has(page)) return;
    
    Utils.toast('Please sign in to access this page', 'warning');
    
    setTimeout(() => {
      location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
    }, 1500);
  }

  // ===== AUTO-REFRESH =====
  
  function startAutoRefresh() {
    if (!Utils.isLoggedIn()) return;
    
    setInterval(() => {
      if (PanelManager.current?.panel?.id === 'notifPanel') {
        NotificationManager.load();
      }
    }, CONFIG.REFRESH_INTERVAL);
  }

  // ===== INITIALIZATION =====
  
  function initialize() {
    injectStyles();
    
    const mobileMenu = new MobileMenuController();
    
    renderAuthArea();
    
    guardPage();
    
    startAutoRefresh();
    
    window.CityFixHeader = {
      toggleMenu: () => mobileMenu.toggle(),
      closeMenu: () => mobileMenu.close(),
      openMenu: () => mobileMenu.open(),
      login: (user) => {
        if (user) {
          Utils.writeUser(user);
          if (user.token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, user.token);
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, user.token);
          }
        }
        location.reload();
      },
      logout: handleLogout,
      isLoggedIn: Utils.isLoggedIn,
      refresh: () => {
        renderAuthArea();
        mobileMenu.highlightActive();
      }
    };
    
    console.log('✅ CityFix Header initialized successfully');
  }

  // ===== BOOTSTRAP =====
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();