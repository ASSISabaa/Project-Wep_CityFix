import { login, getToken, logout } from './auth.js';

function qs(sel) { return document.querySelector(sel); }

function showGlobalMessage(msg, ok = false) {
  let box = document.querySelector('.global-msg');
  if (!box) {
    box = document.createElement('div');
    box.className = 'global-msg';
    box.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${ok ? '#dcfce7' : '#fee2e2'};
      color: ${ok ? '#166534' : '#b91c1c'};
      padding: 10px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      font-size: 14px;
      z-index: 9999;
    `;
    document.body.appendChild(box);
  }
  box.textContent = msg;
  setTimeout(() => box.remove(), 3000);
}

function showFieldError(input, msg) {
  let err = input.parentNode.querySelector('.field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-error';
    err.style.cssText = 'color:#b91c1c;font-size:12px;margin-top:4px;';
    input.parentNode.appendChild(err);
  }
  err.textContent = msg;
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.remove());
}

async function doLogin(button, expectedRole) {
  clearFieldErrors();
  const emailInput = qs('.email-input');
  const passInput = qs('.password-input');
  const email = emailInput.value.trim();
  const pass = passInput.value;
  const remember = qs('#rememberMe').checked;

  let hasError = false;
  if (!email) { showFieldError(emailInput, 'Email is required'); hasError = true; }
  if (!pass) { showFieldError(passInput, 'Password is required'); hasError = true; }
  if (hasError) return;

  button.disabled = true;
  const label = button.querySelector('span') || button;
  const old = label.textContent;
  label.textContent = 'Logging in...';

  try {
    const { user } = await login(email, pass, remember);
    if (expectedRole && user.role !== expectedRole) {
      return showGlobalMessage(`This account is not ${expectedRole}.`);
    }
    showGlobalMessage('Login successful', true);
    location.href = user.role === 'admin' ? 'dashboard.html' : 'index.html';
  } catch (e) {
    showGlobalMessage(e.message || 'Login failed');
  } finally {
    button.disabled = false;
    label.textContent = old;
  }
}

function wireLogin() {
  qs('.admin-login-btn')?.addEventListener('click', e => {
    e.preventDefault();
    doLogin(e.currentTarget, 'admin');
  });
  qs('.user-login-btn')?.addEventListener('click', e => {
    e.preventDefault();
    doLogin(e.currentTarget, 'user');
  });

  qs('.forgot-password')?.addEventListener('click', e => {
    e.preventDefault();
    showGlobalMessage('Password reset feature coming soon');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireLogin();
});
