// client/js/toast-notifications.js
// Professional Toast Notification System (CSS now external)

class ToastNotification {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
    // NOTE: CSS is now loaded via link tag (css/toast.css). No inline injection.
  }

  show(message, type = 'info', duration = 5000, title = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const defaults = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };
    const toastTitle = title || defaults[type];

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        ${toastTitle ? `<div class="toast-title">${toastTitle}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
      <div class="toast-progress"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    toast.addEventListener('click', () => this.remove(toast));

    this.container.appendChild(toast);

    if (duration > 0) setTimeout(() => this.remove(toast), duration);
    return toast;
  }

  remove(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.parentNode?.removeChild(toast), 300);
  }

  success(message, title = null, duration = 5000) { return this.show(message, 'success', duration, title); }
  error(message, title = null, duration = 7000)    { return this.show(message, 'error', duration, title); }
  warning(message, title = null, duration = 5000)  { return this.show(message, 'warning', duration, title); }
  info(message, title = null, duration = 5000)     { return this.show(message, 'info', duration, title); }

  clear() { if (this.container) this.container.innerHTML = ''; }
}

window.Toast = new ToastNotification();
if (typeof module !== 'undefined' && module.exports) module.exports = ToastNotification;
