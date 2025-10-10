/* CityFix Signup - Updated for New Backend API */
(() => {
  if (window.__CITYFIX_SIGNUP__) return;
  window.__CITYFIX_SIGNUP__ = true;

  const API_BASE = 'http://localhost:5000/api';
  const EP = { SIGNUP: '/auth/signup' };
  
  const ST = {
    TOKEN: 'cityfix_token',
    USER: 'cityfix_user',
    ROLE: 'cityfix_role'
  };
  
  const RD = {
    MUNICIPALITY_ADMIN: 'dashboard-admin.html',
    CITIZEN: 'index.html'
  };

  function getToastLib() {
    return window.Toast || window.toast || window.toastr || window.Notifier || null;
  }

  function toast(message, type = 'info') {
    const t = getToastLib();
    if (t?.dismissAll) t.dismissAll();
    if (t?.clear) t.clear();
    
    const text = typeof message === 'string' ? message : message?.message || 'Something went wrong';
    
    if (t?.[type]) return t[type](text);
    if (t?.show) return t.show(text, { type, duration: 3200 });
    
    alert(text);
  }

  const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  const q = (selector, root = document) => root.querySelector(selector);

  async function httpRequest(path, { method = 'POST', body }) {
    try {
      const response = await fetch(API_BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

  function disableButton(button, isDisabled) {
    if (!button) return;
    
    button.disabled = isDisabled;
    
    if (isDisabled) {
      button.dataset._originalText = button.textContent;
      button.innerHTML = '<span class="spinner"></span> Creating account...';
    } else {
      button.textContent = button.dataset._originalText || 'Sign Up';
    }
  }

  function saveSession(token, user) {
    if (token) {
      localStorage.setItem(ST.TOKEN, token);
      sessionStorage.setItem(ST.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(ST.USER, JSON.stringify(user));
      sessionStorage.setItem(ST.USER, JSON.stringify(user));
    }
    if (user?.role) {
      localStorage.setItem(ST.ROLE, user.role);
      sessionStorage.setItem(ST.ROLE, user.role);
    }
  }

  function getRedirectUrl(role) {
    const adminRoles = ['MUNICIPALITY_ADMIN', 'SUPER_SUPER_ADMIN', 'DEPARTMENT_MANAGER'];
    return adminRoles.includes(role) ? RD.MUNICIPALITY_ADMIN : RD.CITIZEN;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm') || q('form');
    if (!form) {
      console.error('Signup form not found');
      return;
    }

    const elements = {
      username: q('input[name="username"]', form),
      email: q('input[name="email"]', form),
      password: q('input[name="password"]', form),
      userId: q('input[name="userId"]', form),
      roleRadios: form.querySelectorAll('input[name="role"]'),
      submitBtn: q('button[type="submit"]', form)
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = elements.username?.value?.trim();
      const email = elements.email?.value?.trim();
      const password = elements.password?.value || '';
      const userId = elements.userId?.value?.trim();
      
      let selectedRole = 'CITIZEN';
      elements.roleRadios?.forEach(radio => {
        if (radio.checked) {
          const val = radio.value.toLowerCase();
          // Map old role values to new backend roles
          if (val === 'admin') {
            selectedRole = 'MUNICIPALITY_ADMIN';
          } else {
            selectedRole = 'CITIZEN';
          }
        }
      });

      // Validation
      if (!username || !email || !password) {
        return toast('Please fill in all required fields', 'error');
      }

      if (!emailValid(email)) {
        return toast('Please enter a valid email address', 'error');
      }

      if (password.length < 6) {
        return toast('Password must be at least 6 characters', 'error');
      }

      // Build payload
      const payload = {
        username,
        email,
        password,
        role: selectedRole
      };

      // Add optional userId
      if (userId) {
        payload.userId = userId;
      }

      console.log('Signup payload:', { ...payload, password: '***' });

      disableButton(elements.submitBtn, true);

      try {
        const response = await httpRequest(EP.SIGNUP, { body: payload });
        
        console.log('Signup response:', response);

        const success = response.success !== false;
        if (!success) {
          throw new Error(response.message || 'Registration failed');
        }

        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user || {};
        
        if (token || user) {
          saveSession(token, user);
        }

        toast(`Account created successfully! Welcome ${username}!`, 'success');

        const finalRole = user?.role || selectedRole;
        const redirectUrl = getRedirectUrl(finalRole);
        
        console.log('Redirecting to:', redirectUrl);

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);

      } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Registration failed';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid registration data';
        } else if (error.status === 409) {
          errorMessage = 'Email already registered';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again';
        }
        
        toast(errorMessage, 'error');
        
        // Shake animation
        form.style.animation = 'shake 0.4s';
        setTimeout(() => {
          form.style.animation = '';
        }, 420);
        
      } finally {
        disableButton(elements.submitBtn, false);
      }
    });
  });
})();