/* CityFix Login - Updated with i18n Support */
(() => {
  if (window.__CITYFIX_LOGIN__) return;
  window.__CITYFIX_LOGIN__ = true;

  const API_BASE = 'http://localhost:5000/api';
  
  const EP = {
    LOGIN: '/auth/login',
    VERIFY: '/auth/verify',
    FORGOT: '/auth/forgot-password'
  };
  
  const ST = {
    TOKEN: 'cityfix_token',
    USER: 'cityfix_user',
    ROLE: 'cityfix_role',
    REM: 'cityfix_remember',
    EMAIL: 'remembered_email'
  };
  
  const RD = {
    SUPER_SUPER_ADMIN: 'dashboard-super-admin.html',
    MUNICIPALITY_ADMIN: 'dashboard-admin.html',
    DEPARTMENT_MANAGER: 'dashboard-manager.html',
    SUPERVISOR: 'dashboard-supervisor.html',
    EMPLOYEE: 'dashboard-employee.html',
    CITIZEN: 'index.html'
  };

  let ACTIVE_TOAST = null;

  function getToastLib() {
    return window.Toast || window.toast || window.cityToast || window.toastr || window.Notifier || null;
  }

  function closeToast() {
    const t = getToastLib();
    if (t?.dismissAll) t.dismissAll();
    if (t?.clear) t.clear();
    if (ACTIVE_TOAST?.remove) ACTIVE_TOAST.remove();
    ACTIVE_TOAST = null;
  }

  function toast(message, type = 'info') {
    closeToast();
    
    // Translate message if i18n is available
    const text = window.i18n?.t(message) || message;
    const t = getToastLib();
    
    if (t?.[type]) return t[type](text);
    if (t?.show) return t.show(text, { type, duration: 3200 });
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 16px;
      background: ${colors[type] || colors.info};
      color: #fff;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(div);
    ACTIVE_TOAST = div;
    setTimeout(closeToast, 3500);
  }

  const q = (selector, root = document) => root.querySelector(selector);
  const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

  async function httpRequest(path, { method = 'GET', body = null, token = null } = {}) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(API_BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      const text = await response.text();
      let json = {};
      
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('JSON parse error:', e);
      }

      if (!response.ok) {
        const error = new Error(json.message || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return json;
    } catch (error) {
      console.error('HTTP Request Error:', error);
      throw error;
    }
  }

  async function verifyToken(token) {
    const result = await httpRequest(EP.VERIFY, { token });
    const user = result.user || result.data?.user || {};
    const role = user.role || result.role;
    
    if (!role) throw new Error('Invalid token - no role');
    
    return { user: { ...user, role } };
  }

  function saveSession(token, user, remember) {
    const storage = remember ? localStorage : sessionStorage;
    
    if (remember) {
      localStorage.setItem(ST.REM, 'true');
      sessionStorage.removeItem(ST.TOKEN);
      sessionStorage.removeItem(ST.USER);
      sessionStorage.removeItem(ST.ROLE);
    } else {
      localStorage.removeItem(ST.REM);
    }
    
    storage.setItem(ST.TOKEN, token || '');
    storage.setItem(ST.USER, JSON.stringify(user || {}));
    storage.setItem(ST.ROLE, user?.role || '');
    
    localStorage.setItem(ST.TOKEN, token || '');
    localStorage.setItem(ST.USER, JSON.stringify(user || {}));
    localStorage.setItem(ST.ROLE, user?.role || '');
  }

  function clearSession() {
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(ST.TOKEN);
      storage.removeItem(ST.USER);
      storage.removeItem(ST.ROLE);
    });
  }

  function getToken() {
    return localStorage.getItem(ST.TOKEN) || sessionStorage.getItem(ST.TOKEN) || '';
  }

  function getRedirectUrl(role) {
    return RD[role] || RD.CITIZEN;
  }

  function mapLoginError(error) {
    const status = error?.status;
    const message = String(error?.message || '').toLowerCase();
    
    if (status === 401 || message.includes('invalid') || message.includes('credentials')) {
      return 'error.invalidCredentials';
    }
    if (status === 403) {
      return 'error.accessDenied';
    }
    if (status === 423) {
      return 'error.accountLocked';
    }
    if (status === 400) {
      return 'error.invalidRequest';
    }
    if (status === 500) {
      return 'error.serverError';
    }
    
    return 'error.loginFailed';
  }

  class LoginUI {
    constructor() {
      this.email = q('#email');
      this.password = q('#password');
      this.remember = q('#rememberMe');
      this.btnAdmin = q('.admin-login-btn');
      this.btnUser = q('.user-login-btn');
      this.linkForgot = q('.forgot-password, #forgotPassword, a[href*="forgot"]');
      
      this.bind();
      this.prefillEmail();
      this.checkExistingSession();
    }

    setBusy(button, isBusy) {
      if (!button) return;
      
      button.disabled = isBusy;
      const textEl = button.querySelector('.admin-btn-text, .user-btn-text');
      
      if (isBusy) {
        button.dataset._originalText = textEl ? textEl.textContent : button.textContent;
        const authText = window.i18n?.t('auth.authenticating') || 'Authenticating...';
        
        if (textEl) {
          textEl.textContent = authText;
        } else {
          button.textContent = authText;
        }
        [this.email, this.password, this.remember].forEach(el => {
          if (el) el.disabled = true;
        });
      } else {
        if (textEl && button.dataset._originalText) {
          textEl.textContent = button.dataset._originalText;
        } else if (button.dataset._originalText) {
          button.textContent = button.dataset._originalText;
        }
        [this.email, this.password, this.remember].forEach(el => {
          if (el) el.disabled = false;
        });
      }
    }

    validateInputs() {
      const email = (this.email?.value || '').trim();
      const password = (this.password?.value || '').trim();

      if (!emailValid(email)) {
        toast('validation.emailInvalid', 'error');
        return false;
      }

      if (password.length < 6) {
        toast('validation.passwordShort', 'error');
        return false;
      }

      return true;
    }

    async performLogin(loginType, button) {
      if (!this.validateInputs()) return;
      
      const remember = !!(this.remember && this.remember.checked);
      const email = (this.email?.value || '').trim();
      const password = this.password?.value || '';
      
      this.setBusy(button, true);
      
      try {
        const response = await httpRequest(EP.LOGIN, {
          method: 'POST',
          body: { email, password }
        });
        
        const token = response.token || response.accessToken || response.data?.token;
        const user = response.user || response.data?.user || {};
        
        if (!token) {
          throw new Error('No authentication token received');
        }
        
        console.log('Login successful:', { role: user.role, loginType });
        
        if (loginType === 'admin') {
          const adminRoles = ['SUPER_SUPER_ADMIN', 'MUNICIPALITY_ADMIN', 'DEPARTMENT_MANAGER'];
          if (!adminRoles.includes(user.role)) {
            toast('error.noAdminPrivileges', 'error');
            clearSession();
            return;
          }
        }
        
        if (loginType === 'citizen' && user.role !== 'CITIZEN') {
          toast('error.useAdminLogin', 'warning');
          clearSession();
          return;
        }
        
        saveSession(token, user, remember);
        
        if (remember) {
          localStorage.setItem(ST.EMAIL, email);
        } else {
          localStorage.removeItem(ST.EMAIL);
        }
        
        toast('success.login', 'success');
        
        setTimeout(() => {
          const redirectUrl = getRedirectUrl(user.role);
          console.log('Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
        }, 800);
        
      } catch (error) {
        console.error('Login error:', error);
        toast(mapLoginError(error), 'error');
      } finally {
        this.setBusy(button, false);
      }
    }

    async handleForgotPassword() {
      const email = (this.email?.value || '').trim();
      
      if (!emailValid(email)) {
        toast('warning.emailFirst', 'warning');
        this.email?.focus();
        return;
      }
      
      try {
        await httpRequest(EP.FORGOT, {
          method: 'POST',
          body: { email }
        });
        toast('success.passwordReset', 'success');
      } catch (error) {
        toast('warning.resetSent', 'info');
      }
    }

    bind() {
      if (this.btnAdmin) {
        this.btnAdmin.addEventListener('click', (e) => {
          e.preventDefault();
          this.performLogin('admin', this.btnAdmin);
        });
      }
      
      if (this.btnUser) {
        this.btnUser.addEventListener('click', (e) => {
          e.preventDefault();
          this.performLogin('citizen', this.btnUser);
        });
      }
      
      if (this.linkForgot) {
        this.linkForgot.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleForgotPassword();
        });
      }
      
      if (this.email) {
        this.email.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.password?.focus();
          }
        });
      }
      
      if (this.password) {
        this.password.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (this.btnUser || this.btnAdmin)?.click();
          }
        });
      }
    }

    prefillEmail() {
      const savedEmail = localStorage.getItem(ST.EMAIL);
      if (savedEmail && this.email) {
        this.email.value = savedEmail;
        if (this.remember) {
          this.remember.checked = true;
        }
      }
    }

    async checkExistingSession() {
      const token = getToken();
      if (!token) return;
      
      try {
        const { user } = await verifyToken(token);
        console.log('Existing session found:', user.role);
        
        toast('success.resuming', 'info');
        
        setTimeout(() => {
          const redirectUrl = getRedirectUrl(user.role);
          window.location.href = redirectUrl;
        }, 500);
        
      } catch (error) {
        console.log('Session expired or invalid');
        clearSession();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new LoginUI();
    });
  } else {
    new LoginUI();
  }
})();