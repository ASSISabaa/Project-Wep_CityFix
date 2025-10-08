(() => {
  const API = `${location.origin}/api`;

  function getToken() {
    if (window.CITYFIX && typeof window.CITYFIX.getToken === 'function') return window.CITYFIX.getToken();
    return (
      localStorage.getItem('cityfix_token') ||
      sessionStorage.getItem('cityfix_token') ||
      localStorage.getItem('token') ||
      ''
    );
  }

  const baseHeaders = () => {
    const t = getToken();
    return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const CANDIDATES = ['', '/admin', '/system'];
  const urlsFor = (p) => CANDIDATES.map((c) => `${API}${c}${p}`);

  async function req(path, opt = {}) {
    const urls = urlsFor(path);
    const errors = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { ...opt, headers: { ...baseHeaders(), ...(opt.headers || {}) } });
        if (res.status === 401) {
          try { await res.text(); } catch {}
          location.href = 'login.html';
          return Promise.reject(new Error('Unauthorized'));
        }
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          errors.push(`[${res.status}] ${url} => ${t.slice(0, 200)}`);
          continue;
        }
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : {};
      } catch (e) {
        errors.push(`${url} => ${e.message}`);
      }
    }
    throw new Error(`All endpoints failed for ${path}:\n${errors.join('\n')}`);
  }

  const q = (s) => document.querySelector(s);
  const safe = (el) => el || { textContent: '', value: '', checked: false, setAttribute(){} };

  function fixDuplicateIds() {
    const securityTimeout = document.querySelector('#security-settings input#session-timeout');
    if (securityTimeout) securityTimeout.id = 'session-timeout-security';
  }

  function applyAutocomplete() {
    const m = {
      '#full-name': 'name',
      '#email': 'email',
      '#current-password': 'current-password',
      '#new-password': 'new-password',
      '#confirm-password': 'new-password'
    };
    Object.entries(m).forEach(([sel, ac]) => {
      const el = q(sel);
      if (el) el.setAttribute('autocomplete', ac);
    });
  }

  function timeAgoShort(iso) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  fixDuplicateIds();
  applyAutocomplete();

  const cards = {
    profileSections: safe(q('.stats-container .stat-card:nth-child(1) .stat-number')),
    securityLevel:  safe(q('.stats-container .stat-card:nth-child(2) .stat-number')),
    securityNote:   safe(q('.stats-container .stat-card:nth-child(2) .stat-trend')),
    systemUptime:   safe(q('.stats-container .stat-card:nth-child(3) .stat-number')),
    lastBackup:     safe(q('.stats-container .stat-card:nth-child(4) .stat-number')),
    lastBackupNote: safe(q('.stats-container .stat-card:nth-child(4) .stat-trend')),
  };

  const inputs = {
    fullName: safe(q('#full-name')),
    email: safe(q('#email')),
    role: safe(q('#role')),
    sessionTimeoutGeneral: safe(q('#general-settings #session-timeout')),
    autoSave: safe(q('#auto-save')),
    soundAlerts: safe(q('#sound-alerts')),
    currentPassword: safe(q('#current-password')),
    newPassword: safe(q('#new-password')),
    confirmPassword: safe(q('#confirm-password')),
    twoFactor: safe(q('#two-factor')),
    rememberLogin: safe(q('#remember-login')),
    sessionTimeoutSecurity: safe(q('#session-timeout-security')) || safe(q('#security-settings #session-timeout')),
    emailAlerts: safe(q('#email-alerts')),
    dailyDigest: safe(q('#daily-digest')),
    weeklyReport: safe(q('#weekly-report')),
    browserNotifications: safe(q('#browser-notifications')),
    urgentOnly: safe(q('#urgent-only')),
    notificationSound: safe(q('#notification-sound')),
  };

  function toast(msg, ok = true) {
    if (window.showToast) return window.showToast(msg, ok ? 'success' : 'error');
    if (ok) console.log(msg);
    else console.error(msg);
  }

  function fillCards(d) {
    cards.profileSections.textContent = String(d.cards?.profileSections ?? '—');
    cards.securityLevel.textContent  = String(d.cards?.securityLevel ?? '—');
    cards.securityNote.textContent   = d.security?.twoFactor ? '2FA enabled' : '2FA disabled';
    cards.systemUptime.textContent   = `${d.cards?.systemUptimePct ?? 0}%`;

    const lb = d.cards?.lastBackup;
    const lbShort = timeAgoShort(lb);
    cards.lastBackup.textContent = lbShort || '--';
    cards.lastBackupNote.textContent = d.cards?.autoBackupEnabled ? 'Auto backup enabled' : 'Auto backup disabled';
  }

  function ensureRoleOption(role) {
    if (!role || !inputs.role || !inputs.role.querySelector) return;
    if (!inputs.role.querySelector(`option[value="${role}"]`)) {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role.charAt(0).toUpperCase() + role.slice(1);
      inputs.role.appendChild(opt);
    }
  }

  function fillGeneral(d) {
    inputs.fullName.value = d.general?.fullName || '';
    inputs.email.value    = d.general?.email || '';
    ensureRoleOption(d.general?.role);
    if (d.general?.role && inputs.role) inputs.role.value = d.general.role;

    inputs.sessionTimeoutGeneral.value = d.security?.sessionTimeout ?? 30;
    inputs.autoSave.checked   = !!d.preferences?.autoSave;
    inputs.soundAlerts.checked= !!d.preferences?.soundAlerts;

    const userNameEl = document.querySelector('.user-name');
    const name = d.general?.fullName || d.general?.email || '';
    if (userNameEl && name) userNameEl.textContent = name;
  }

  function fillSecurity(d) {
    inputs.twoFactor.checked = !!d.security?.twoFactor;
    inputs.rememberLogin.checked = !!d.security?.rememberLogin;
    inputs.sessionTimeoutSecurity.value = d.security?.sessionTimeout ?? 30;
    inputs.currentPassword.value = '';
    inputs.newPassword.value = '';
    inputs.confirmPassword.value = '';
  }

  function fillNotifications(d) {
    const n = d.notifications || {};
    inputs.emailAlerts.checked = !!n.emailAlerts;
    inputs.dailyDigest.checked = !!n.dailyDigest;
    inputs.weeklyReport.checked = !!n.weeklyReport;
    inputs.browserNotifications.checked = !!n.browserNotifications;
    inputs.urgentOnly.checked = !!n.urgentOnly;
    inputs.notificationSound.value = n.notificationSound || 'default';
  }

  async function load() {
    const data = await req('/settings');
    fillCards(data);
    fillGeneral(data);
    fillSecurity(data);
    fillNotifications(data);
  }

  function swapTab(target) {
    document.querySelectorAll('.settings-section').forEach((s) => s.classList.remove('active'));
    document.querySelectorAll('.settings-header .control-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.querySelector(`.settings-header .control-btn[data-section="${target}"]`);
    const sec = document.querySelector(
      target === 'general'
        ? '#general-settings'
        : target === 'security'
        ? '#security-settings'
        : '#notifications-settings'
    );
    if (btn) btn.classList.add('active');
    if (sec) sec.classList.add('active');
  }

  let saving = false;

  async function saveGeneral() {
    if (saving) return;
    saving = true;
    try {
      const body = {
        fullName: inputs.fullName.value.trim(),
        email: inputs.email.value.trim()
      };
      await req('/settings/general', { method: 'PUT', body: JSON.stringify(body) });
      await req('/settings/security', {
        method: 'PUT',
        body: JSON.stringify({
          sessionTimeout: Number(inputs.sessionTimeoutGeneral.value || 30),
          twoFactor: inputs.twoFactor.checked,
          rememberLogin: inputs.rememberLogin.checked
        })
      });
      toast('General settings saved');
    } finally {
      saving = false;
    }
  }

  async function saveSecurity() {
    if (saving) return;
    saving = true;
    try {
      if (inputs.newPassword.value) {
        if (inputs.newPassword.value !== inputs.confirmPassword.value) throw new Error('Passwords do not match');
        await req('/settings/change-password', {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: inputs.currentPassword.value,
            newPassword: inputs.newPassword.value
          })
        });
      }
      await req('/settings/security', {
        method: 'PUT',
        body: JSON.stringify({
          twoFactor: inputs.twoFactor.checked,
          rememberLogin: inputs.rememberLogin.checked,
          sessionTimeout: Number(inputs.sessionTimeoutSecurity.value || 30)
        })
      });
      toast('Security settings saved');
    } finally {
      saving = false;
    }
  }

  async function saveNotifications() {
    if (saving) return;
    saving = true;
    try {
      await req('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({
          emailAlerts: inputs.emailAlerts.checked,
          dailyDigest: inputs.dailyDigest.checked,
          weeklyReport: inputs.weeklyReport.checked,
          browserNotifications: inputs.browserNotifications.checked,
          urgentOnly: inputs.urgentOnly.checked,
          notificationSound: inputs.notificationSound.value
        })
      });
      toast('Notification settings saved');
    } finally {
      saving = false;
    }
  }

  async function saveAll() {
    const active = document.querySelector('.settings-header .control-btn.active');
    const tab = active?.dataset?.section || 'general';
    if (tab === 'general') await saveGeneral();
    else if (tab === 'security') await saveSecurity();
    else await saveNotifications();
    await load();
  }

  async function exportData() { await req('/settings/actions/export', { method: 'POST' }); toast('Export started'); }
  async function createBackup() { await req('/settings/actions/backup', { method: 'POST' }); toast('Backup started'); }
  async function clearCache() { await req('/settings/actions/clear-cache', { method: 'POST' }); toast('Cache cleared'); }
  async function resetSettings() { await req('/settings/actions/reset-preferences', { method: 'POST' }); await load(); toast('Preferences reset'); }
  function viewActivity() { toast('Opening activity log'); }

  function wire() {
    document.querySelectorAll('.settings-header .control-btn[data-section]').forEach((b) =>
      b.addEventListener('click', () => swapTab(b.dataset.section))
    );
    const saveBtn = document.querySelector('.settings-header .save-settings');
    if (saveBtn) saveBtn.addEventListener('click', () =>
      saveAll().catch((e) => toast(e.message || 'Save failed', false))
    );

    window.exportData = () => exportData().catch((e) => toast(e.message || 'Export failed', false));
    window.createBackup = () => createBackup().catch((e) => toast(e.message || 'Backup failed', false));
    window.clearCache = () => clearCache().catch((e) => toast(e.message || 'Clear failed', false));
    window.resetSettings = () => resetSettings().catch((e) => toast(e.message || 'Reset failed', false));
    window.viewActivity = viewActivity;
  }

  document.addEventListener('DOMContentLoaded', () => {
    wire();
    load().catch((e) => {
      console.error(e);
      toast('Failed to load settings', false);
    });
  });
})();