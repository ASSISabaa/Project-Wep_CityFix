/**
 * CityFix - Page Guard (No UI)
 * Enforces role-based access and link protection without adding buttons.
 * v2.2.0
 */
'use strict';

// ==== Config ====
const PAGE_CONFIG = {
  admin: [
    'dashboard.html',
    'notifications.html',
    'analytics.html',
    'reports.html',
    'reportsdetails.html',
    'settings.html',
    'team.html'
  ],
  user: [
    'myimpact.html',
    'submitreport.html',
    'browsereports.html'
  ],
  public: [
    'index.html',
    'login.html',
    'signup.html',
    'contact.html'
  ],
  redirects: {
    adminHome: 'dashboard.html',
    userHome: 'index.html',
    loginPage: 'login.html',
    signupPage: 'signup.html'
  }
};

const AUTHORIZED_ADMIN_IDS = [
  '123456789',
  '987654321',
  '111222333',
  '444555666',
  '777888999'
];

// ==== Helpers ====
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

class CityFixGuard {
  constructor() {
    this.token = '';
    this.user = null;
    this.role = null;
    this.loadUser();
    this.enforceAccess();
    this.protectLinks();
    window.addEventListener('storage', () => {
      this.loadUser();
      this.enforceAccess();
    });
  }

  // Session
  loadUser() {
    this.token =
      localStorage.getItem('cityfix_token') ||
      localStorage.getItem('cityfix_auth_token') ||
      sessionStorage.getItem('cityfix_token') ||
      '';

    const userStr =
      localStorage.getItem('cityfix_user') ||
      sessionStorage.getItem('cityfix_user') ||
      '';

    this.user = null;
    this.role = null;

    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const candidateRole = u.role || localStorage.getItem('cityfix_role') || 'citizen';
        const isAdminById = u.userId && AUTHORIZED_ADMIN_IDS.includes(String(u.userId));
        this.role = (candidateRole === 'admin' || isAdminById) ? 'admin' : (candidateRole === 'citizen' ? 'citizen' : 'user');
        this.user = u;
      } catch {
        this.clearSession();
      }
    }

    // Soft JWT expiry check
    if (this.token) {
      const p = decodeJwt(this.token);
      if (p && p.exp && Date.now() >= p.exp * 1000) this.clearSession();
    }
  }

  clearSession() {
    localStorage.removeItem('cityfix_token');
    localStorage.removeItem('cityfix_auth_token');
    localStorage.removeItem('cityfix_user');
    localStorage.removeItem('cityfix_role');
    localStorage.removeItem('cityfix_admin_id');
    sessionStorage.removeItem('cityfix_redirect_after_login');
  }

  // State
  isAuthed() { return Boolean(this.token && this.user); }
  isAdmin() { return this.isAuthed() && this.role === 'admin'; }
  currentPage() { return (location.pathname.split('/').pop() || 'index.html').toLowerCase(); }

  // Enforcement
  enforceAccess() {
    const page = this.currentPage();

    // Admin pages
    if (PAGE_CONFIG.admin.includes(page)) {
      if (!this.isAdmin()) {
        if (this.isAuthed()) {
          location.replace(PAGE_CONFIG.redirects.userHome);
        } else {
          location.replace(PAGE_CONFIG.redirects.loginPage);
        }
        return;
      }
    }

    // User pages
    if (PAGE_CONFIG.user.includes(page)) {
      if (!this.isAuthed()) {
        sessionStorage.setItem('cityfix_redirect_after_login', page);
        location.replace(PAGE_CONFIG.redirects.loginPage);
        return;
      }
    }

    // Public pages: avoid login/signup when already authed
    if (PAGE_CONFIG.public.includes(page)) {
      if (this.isAuthed() && (page === 'login.html' || page === 'signup.html')) {
        this.redirectHome();
      }
    }
  }

  // Link protection (no UI)
  protectLinks() {
    const guard = () => {
      document.querySelectorAll('a[href]').forEach((a) => {
        if (a.dataset.cfxGuard) return;
        const href = a.getAttribute('href') || '';
        const page = href.split('/').pop().toLowerCase();
        const needsAdmin = PAGE_CONFIG.admin.includes(page);
        const needsUser = PAGE_CONFIG.user.includes(page);
        if (!needsAdmin && !needsUser) return;

        a.dataset.cfxGuard = '1';
        a.addEventListener('click', (e) => {
          if (needsAdmin && !this.isAdmin()) {
            e.preventDefault();
            if (this.isAuthed()) {
              location.href = PAGE_CONFIG.redirects.userHome;
            } else {
              sessionStorage.setItem('cityfix_redirect_after_login', page);
              location.href = PAGE_CONFIG.redirects.loginPage;
            }
            return;
          }
          if (needsUser && !this.isAuthed()) {
            e.preventDefault();
            sessionStorage.setItem('cityfix_redirect_after_login', page);
            location.href = PAGE_CONFIG.redirects.loginPage;
          }
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', guard);
    } else {
      guard();
    }

    const mo = new MutationObserver(guard);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Redirect helpers
  redirectHome() {
    location.replace(this.isAdmin() ? PAGE_CONFIG.redirects.adminHome : PAGE_CONFIG.redirects.userHome);
  }

  // Exposed minimal API (no UI)
  logout() {
    this.clearSession();
    location.replace(PAGE_CONFIG.redirects.loginPage);
  }
}

// Init
const cityFixAuth = new CityFixGuard();
window.cityFixAuth = cityFixAuth;
window.logout = () => cityFixAuth.logout();
