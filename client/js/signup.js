(() => {
  'use strict';
  
  if (window.__CITYFIX_SIGNUP__) return;
  window.__CITYFIX_SIGNUP__ = true;

  const CONFIG = {
    API: {
      BASE: 'http://localhost:5000/api',
      ENDPOINTS: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
        VERIFY: '/auth/verify',
        CHECK_EMAIL: '/auth/check-email'
      },
      TIMEOUT: 15000
    },
    
    STORAGE: {
      TOKEN: 'cityfix_token',
      USER: 'cityfix_user',
      ROLE: 'cityfix_role',
      TENANT: 'cityfix_tenant',
      LANGUAGE: 'cityfix_language',
      THEME: 'cityfix_theme'
    },
    
    ROLES: {
      SUPER_SUPER_ADMIN: {
        value: 'SUPER_SUPER_ADMIN',
        redirect: '/super-admin/dashboard.html',
        permissions: ['*'],
        level: 100
      },
      MUNICIPALITY_ADMIN: {
        value: 'MUNICIPALITY_ADMIN',
        redirect: '/admin/dashboard-admin.html',
        permissions: ['manage_municipality', 'view_all_reports', 'manage_users'],
        level: 80
      },
      DEPARTMENT_MANAGER: {
        value: 'DEPARTMENT_MANAGER',
        redirect: '/manager/dashboard-manager.html',
        permissions: ['manage_department', 'assign_tasks', 'view_department_reports'],
        level: 60
      },
      SUPERVISOR: {
        value: 'SUPERVISOR',
        redirect: '/supervisor/dashboard-supervisor.html',
        permissions: ['monitor_employees', 'view_assigned_reports'],
        level: 40
      },
      EMPLOYEE: {
        value: 'EMPLOYEE',
        redirect: '/employee/dashboard-employee.html',
        permissions: ['view_my_tasks', 'update_report_status'],
        level: 20
      },
      CITIZEN: {
        value: 'CITIZEN',
        redirect: '/index.html',
        permissions: ['submit_reports', 'view_my_reports'],
        level: 10
      }
    },

    VALIDATION: {
      USERNAME_MIN: 3,
      USERNAME_MAX: 50,
      PASSWORD_MIN: 6,
      PASSWORD_MAX: 128,
      EMAIL_REGEX: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    }
  };

  class SessionManager {
    static save(token, user) {
      const data = {
        token,
        user: {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenant: user.tenant,
          profile: user.profile || {},
          permissions: this.getRolePermissions(user.role)
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(data.user));
      localStorage.setItem(CONFIG.STORAGE.ROLE, user.role);
      
      if (user.tenant) {
        localStorage.setItem(CONFIG.STORAGE.TENANT, user.tenant);
      }

      sessionStorage.setItem(CONFIG.STORAGE.TOKEN, token);
      sessionStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(data.user));

      return data;
    }

    static clear() {
      Object.values(CONFIG.STORAGE).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }

    static get() {
      const token = localStorage.getItem(CONFIG.STORAGE.TOKEN);
      const userStr = localStorage.getItem(CONFIG.STORAGE.USER);
      
      if (!token || !userStr) return null;

      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch {
        this.clear();
        return null;
      }
    }

    static getRolePermissions(role) {
      return CONFIG.ROLES[role]?.permissions || [];
    }

    static hasPermission(permission) {
      const session = this.get();
      if (!session) return false;

      const permissions = session.user.permissions || [];
      return permissions.includes('*') || permissions.includes(permission);
    }
  }

  class APIClient {
    static async request(endpoint, options = {}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

      try {
        const url = CONFIG.API.BASE + endpoint;
        const defaultHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        const session = SessionManager.get();
        if (session?.token) {
          defaultHeaders['Authorization'] = `Bearer ${session.token}`;
        }

        const config = {
          method: options.method || 'GET',
          headers: { ...defaultHeaders, ...options.headers },
          signal: controller.signal,
          ...options
        };

        if (options.body && config.method !== 'GET') {
          config.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text ? { message: text } : {};
        }

        if (!response.ok) {
          throw new APIError(
            data.message || `HTTP ${response.status}`,
            response.status,
            data
          );
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new APIError('Request timeout', 408);
        }
        
        if (error instanceof APIError) {
          throw error;
        }
        
        throw new APIError(
          error.message || 'Network error',
          0,
          { originalError: error }
        );
      }
    }

    static async signup(data) {
      return this.request(CONFIG.API.ENDPOINTS.SIGNUP, {
        method: 'POST',
        body: data
      });
    }

    static async checkEmailAvailability(email) {
      try {
        return await this.request(`${CONFIG.API.ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`);
      } catch {
        return { available: true };
      }
    }
  }

  class APIError extends Error {
    constructor(message, status, data) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.data = data;
    }
  }

  class NotificationManager {
    static toast(message, type = 'info') {
      const toastLib = window.Toast || window.toast || window.toastr || window.Notifier;
      
      if (toastLib?.dismissAll) toastLib.dismissAll();
      if (toastLib?.clear) toastLib.clear();

      const text = typeof message === 'string' ? message : message?.message || 'Something went wrong';

      if (toastLib?.[type]) {
        return toastLib[type](text);
      }
      
      if (toastLib?.show) {
        return toastLib.show(text, { type, duration: 3200 });
      }

      this.fallbackNotification(text, type);
    }

    static fallbackNotification(message, type) {
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };

      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      `;
      container.textContent = message;

      document.body.appendChild(container);

      setTimeout(() => {
        container.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => container.remove(), 300);
      }, 3000);
    }

    static success(message) {
      this.toast(message, 'success');
    }

    static error(message) {
      this.toast(message, 'error');
    }

    static warning(message) {
      this.toast(message, 'warning');
    }

    static info(message) {
      this.toast(message, 'info');
    }
  }

  class Validator {
    static email(email) {
      if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
      }

      const trimmed = email.trim();
      
      if (!CONFIG.VALIDATION.EMAIL_REGEX.test(trimmed)) {
        return { valid: false, error: 'Please enter a valid email address' };
      }

      return { valid: true, value: trimmed };
    }

    static username(username) {
      if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required' };
      }

      const trimmed = username.trim();
      
      if (trimmed.length < CONFIG.VALIDATION.USERNAME_MIN) {
        return { 
          valid: false, 
          error: `Username must be at least ${CONFIG.VALIDATION.USERNAME_MIN} characters` 
        };
      }

      if (trimmed.length > CONFIG.VALIDATION.USERNAME_MAX) {
        return { 
          valid: false, 
          error: `Username must not exceed ${CONFIG.VALIDATION.USERNAME_MAX} characters` 
        };
      }

      return { valid: true, value: trimmed };
    }

    static password(password) {
      if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
      }

      if (password.length < CONFIG.VALIDATION.PASSWORD_MIN) {
        return { 
          valid: false, 
          error: `Password must be at least ${CONFIG.VALIDATION.PASSWORD_MIN} characters` 
        };
      }

      if (password.length > CONFIG.VALIDATION.PASSWORD_MAX) {
        return { 
          valid: false, 
          error: `Password must not exceed ${CONFIG.VALIDATION.PASSWORD_MAX} characters` 
        };
      }

      return { valid: true, value: password };
    }

    static confirmPassword(password, confirmPassword) {
      if (password !== confirmPassword) {
        return { valid: false, error: 'Passwords do not match' };
      }

      return { valid: true };
    }

    static role(role) {
      if (!role) {
        return { valid: true, value: 'CITIZEN' };
      }

      if (!CONFIG.ROLES[role]) {
        return { valid: false, error: 'Invalid role selected' };
      }

      return { valid: true, value: role };
    }
  }

  class SignupForm {
    constructor(formElement) {
      this.form = formElement;
      this.elements = this.getFormElements();
      this.isSubmitting = false;
      this.init();
    }

    getFormElements() {
      return {
        username: this.form.querySelector('input[name="username"]'),
        email: this.form.querySelector('input[name="email"]'),
        password: this.form.querySelector('input[name="password"]'),
        confirmPassword: this.form.querySelector('input[name="confirmPassword"]'),
        userId: this.form.querySelector('input[name="userId"]'),
        roleRadios: this.form.querySelectorAll('input[name="role"]'),
        submitBtn: this.form.querySelector('button[type="submit"]')
      };
    }

    init() {
      this.attachEventListeners();
      this.checkExistingSession();
    }

    attachEventListeners() {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      
      if (this.elements.email) {
        this.elements.email.addEventListener('blur', () => this.validateEmailField());
      }

      if (this.elements.password && this.elements.confirmPassword) {
        this.elements.confirmPassword.addEventListener('input', () => {
          this.validatePasswordMatch();
        });
      }

      this.elements.roleRadios.forEach(radio => {
        radio.addEventListener('change', () => this.handleRoleChange());
      });
    }

    checkExistingSession() {
      const session = SessionManager.get();
      if (session?.token) {
        const role = session.user.role;
        const redirect = CONFIG.ROLES[role]?.redirect || '/index.html';
        
        NotificationManager.info('You are already logged in. Redirecting...');
        setTimeout(() => {
          window.location.href = redirect;
        }, 1500);
      }
    }

    async validateEmailField() {
      const email = this.elements.email?.value?.trim();
      if (!email) return;

      const validation = Validator.email(email);
      if (!validation.valid) {
        this.showFieldError(this.elements.email, validation.error);
        return;
      }

      try {
        const result = await APIClient.checkEmailAvailability(email);
        if (result.available === false) {
          this.showFieldError(this.elements.email, 'This email is already registered');
        } else {
          this.clearFieldError(this.elements.email);
        }
      } catch (error) {
        console.warn('Email check failed:', error);
      }
    }

    validatePasswordMatch() {
      const password = this.elements.password?.value;
      const confirmPassword = this.elements.confirmPassword?.value;

      if (confirmPassword && password !== confirmPassword) {
        this.showFieldError(this.elements.confirmPassword, 'Passwords do not match');
      } else {
        this.clearFieldError(this.elements.confirmPassword);
      }
    }

    handleRoleChange() {
      const selectedRole = this.getSelectedRole();
      const roleInfo = CONFIG.ROLES[selectedRole];
      
      if (roleInfo && roleInfo.level > 10) {
        console.log(`Selected role: ${selectedRole} (Level ${roleInfo.level})`);
      }
    }

    getSelectedRole() {
      let selectedRole = 'CITIZEN';
      
      this.elements.roleRadios.forEach(radio => {
        if (radio.checked) {
          const value = radio.value.toUpperCase();
          
          if (value === 'ADMIN' || value === 'MUNICIPALITY_ADMIN') {
            selectedRole = 'MUNICIPALITY_ADMIN';
          } else if (value === 'EMPLOYEE') {
            selectedRole = 'EMPLOYEE';
          } else if (value === 'MANAGER' || value === 'DEPARTMENT_MANAGER') {
            selectedRole = 'DEPARTMENT_MANAGER';
          } else if (value === 'SUPERVISOR') {
            selectedRole = 'SUPERVISOR';
          } else if (CONFIG.ROLES[value]) {
            selectedRole = value;
          } else {
            selectedRole = 'CITIZEN';
          }
        }
      });

      return selectedRole;
    }

    async handleSubmit(e) {
      e.preventDefault();

      if (this.isSubmitting) {
        return;
      }

      const validationResult = this.validateForm();
      if (!validationResult.valid) {
        NotificationManager.error(validationResult.error);
        return;
      }

      this.isSubmitting = true;
      this.setButtonState(true);

      try {
        const payload = validationResult.data;
        console.log('Signup attempt:', { ...payload, password: '***' });

        const response = await APIClient.signup(payload);

        if (response.success === false) {
          throw new APIError(response.message || 'Registration failed', 400);
        }

        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user || {};

        if (!token && !user._id) {
          throw new APIError('Invalid server response', 500);
        }

        SessionManager.save(token, user);

        NotificationManager.success(`Welcome ${user.username || payload.username}! Account created successfully.`);

        const finalRole = user.role || payload.role;
        const redirect = CONFIG.ROLES[finalRole]?.redirect || '/index.html';

        console.log(`Redirecting to: ${redirect}`);

        setTimeout(() => {
          window.location.href = redirect;
        }, 1200);

      } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Registration failed. Please try again.';

        if (error instanceof APIError) {
          errorMessage = error.message;
          
          if (error.status === 409) {
            errorMessage = 'Email already registered. Please use a different email.';
          } else if (error.status === 400) {
            errorMessage = error.data?.message || 'Invalid registration data';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }

        NotificationManager.error(errorMessage);
        this.shakeForm();

      } finally {
        this.isSubmitting = false;
        this.setButtonState(false);
      }
    }

    validateForm() {
      const username = this.elements.username?.value?.trim();
      const email = this.elements.email?.value?.trim();
      const password = this.elements.password?.value;
      const confirmPassword = this.elements.confirmPassword?.value;
      const userId = this.elements.userId?.value?.trim();

      const usernameValidation = Validator.username(username);
      if (!usernameValidation.valid) {
        return { valid: false, error: usernameValidation.error };
      }

      const emailValidation = Validator.email(email);
      if (!emailValidation.valid) {
        return { valid: false, error: emailValidation.error };
      }

      const passwordValidation = Validator.password(password);
      if (!passwordValidation.valid) {
        return { valid: false, error: passwordValidation.error };
      }

      if (this.elements.confirmPassword) {
        const confirmValidation = Validator.confirmPassword(password, confirmPassword);
        if (!confirmValidation.valid) {
          return { valid: false, error: confirmValidation.error };
        }
      }

      const selectedRole = this.getSelectedRole();
      const roleValidation = Validator.role(selectedRole);
      if (!roleValidation.valid) {
        return { valid: false, error: roleValidation.error };
      }

      const data = {
        username: usernameValidation.value,
        email: emailValidation.value,
        password: passwordValidation.value,
        role: roleValidation.value
      };

      if (userId) {
        data.userId = userId;
      }

      return { valid: true, data };
    }

    showFieldError(field, message) {
      if (!field) return;

      field.classList.add('error');
      field.setAttribute('aria-invalid', 'true');

      let errorElement = field.parentElement.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem; display: block;';
        field.parentElement.appendChild(errorElement);
      }

      errorElement.textContent = message;
    }

    clearFieldError(field) {
      if (!field) return;

      field.classList.remove('error');
      field.removeAttribute('aria-invalid');

      const errorElement = field.parentElement.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }

    setButtonState(isDisabled) {
      const btn = this.elements.submitBtn;
      if (!btn) return;

      btn.disabled = isDisabled;

      if (isDisabled) {
        btn.dataset._originalText = btn.textContent;
        btn.innerHTML = `
          <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
          <span style="margin-left: 8px;">Creating account...</span>
        `;
      } else {
        btn.textContent = btn.dataset._originalText || 'Sign Up';
      }
    }

    shakeForm() {
      this.form.style.animation = 'shake 0.4s';
      setTimeout(() => {
        this.form.style.animation = '';
      }, 400);
    }
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      input.error {
        border-color: #ef4444 !important;
      }

      .error-message {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', () => {
    addStyles();

    const form = document.getElementById('signupForm') || document.querySelector('form');
    
    if (!form) {
      console.error('Signup form not found');
      return;
    }

    new SignupForm(form);
  });

  window.CityFix = {
    SessionManager,
    APIClient,
    NotificationManager,
    Validator,
    CONFIG
  };

})();