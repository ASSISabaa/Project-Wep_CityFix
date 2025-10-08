// contact.js — Production-grade submit with professional toasts (uses window.Toast)
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- API base (auto) ---------- */
  const API_BASE = `${location.origin}/api`;

  /* ---------- Elements ---------- */
  const form      = document.getElementById('contactForm');
  const firstName = document.getElementById('firstName');
  const lastName  = document.getElementById('lastName');
  const email     = document.getElementById('email');
  const subject   = document.getElementById('subject');
  const message   = document.getElementById('message');
  const submitBtn = document.getElementById('submitBtn');
  const charCount = document.getElementById('charCount');

  /* ---------- Validation helpers ---------- */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ZERO_WIDTH_RE = /[\u200B-\u200D\u200E\u200F\u061C\uFEFF]/g;

  /* ---------- Toast bridge (uses toast-notifications.js) ---------- */
  function notify(type, { title = null, message = '', duration = 6000 } = {}) {
    if (window.Toast && typeof window.Toast[type] === 'function') {
      return window.Toast[type](message, title, duration);
    }
    // Fallback
    const text = (title ? title + ' - ' : '') + message;
    if (type === 'error') return alert('Error: ' + text);
    if (type === 'success') return alert('Success: ' + text);
    console.log(type.toUpperCase() + ': ' + text);
  }
  // Back-compat for existing calls if any other scripts use showToast(type, text, {title,duration})
  window.showToast = (type, text, opts = {}) => notify(type, { message: text, ...opts });

  /* ---------- Normalization ---------- */
  const cleanText = v => String(v || '').normalize('NFC').replace(ZERO_WIDTH_RE, '').trim();
  function cleanNameField(el) {
    if (!el) return;
    const c = cleanText(el.value);
    if (c !== el.value) el.value = c;
  }

  /* ---------- Prefill ---------- */
  (function prefill() {
    try {
      const raw =
        localStorage.getItem('cityfix_user') ||
        sessionStorage.getItem('cityfix_user') ||
        localStorage.getItem('user') ||
        sessionStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      if (u.email && email) email.value = u.email;
      if (u.firstName && firstName) firstName.value = u.firstName;
      if (u.lastName && lastName) lastName.value = u.lastName;
      const nameSrc = u.username || u.name || '';
      if (nameSrc && (!firstName.value || !lastName.value)) {
        const parts = String(nameSrc).trim().split(/\s+/);
        if (parts[0] && !firstName.value) firstName.value = parts[0];
        if (parts.length > 1 && !lastName.value) lastName.value = parts.slice(1).join(' ');
      }
      cleanNameField(firstName);
      cleanNameField(lastName);
    } catch {}
  })();

  /* ---------- Character counter ---------- */
  if (message && charCount) {
    const updateCounter = () => {
      const n = message.value.length;
      charCount.textContent = String(n);
      charCount.style.color = n > 900 ? '#ff6b6b' : n > 800 ? '#ffa500' : '#666';
    };
    message.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* ---------- Field error UI ---------- */
  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
    const input = el.previousElementSibling;
    if (input?.classList) input.classList.toggle('error', Boolean(msg));
  }
  function clearAllErrors() {
    ['firstNameError','lastNameError','emailError','subjectError','messageError'].forEach(id => setFieldError(id, ''));
    form?.querySelectorAll('input,select,textarea').forEach(i => i.classList.remove('error'));
  }

  /* ---------- Business rules ---------- */
  function isValidName(v) {
    const s = cleanText(v);
    if (s.length < 2) return false;
    return !/[0-9@#$%^&*()_+=\[\]{};:"\\|,.<>\/?`~]/.test(s);
  }
  function fixAutofillConfusion() {
    cleanNameField(firstName);
    cleanNameField(lastName);
    if (!firstName || !lastName || !email) return;
    const fn = firstName.value.trim();
    const ln = lastName.value.trim();
    const em = email.value.trim();
    if (fn.includes('@') || EMAIL_REGEX.test(fn)) {
      if (!em) {
        email.value = fn;
        firstName.value = '';
        setFieldError('firstNameError', 'First name is required.');
        notify('info', { title: 'Adjusted fields', message: 'We moved your email to the correct field.' });
      } else {
        setFieldError('firstNameError', 'First name must contain letters only.');
      }
    }
    if (/[0-9@]/.test(ln)) setFieldError('lastNameError', 'Last name must contain letters only.');
  }

  function validate() {
    clearAllErrors();
    const fn = cleanText(firstName?.value);
    const ln = cleanText(lastName?.value);
    const em = (email?.value || '').trim();
    const sj = subject?.value || '';
    const ms = (message?.value || '').trim();

    if (!fn) return setErr('firstName','First name is required.');
    if (!isValidName(fn)) return setErr('firstName','First name must contain letters only.');
    if (!ln) return setErr('lastName','Last name is required.');
    if (!isValidName(ln)) return setErr('lastName','Last name must contain letters only.');
    if (!em) return setErr('email','Email is required.');
    if (!EMAIL_REGEX.test(em)) return setErr('email','Please enter a valid email address.');
    if (!sj) return setErr('subject','Please select a subject.');
    if (!ms) return setErr('message','Message is required.');
    if (ms.length < 10) return setErr('message','Message must be at least 10 characters.');
    if (ms.length > 1000) return setErr('message','Message must not exceed 1000 characters.');
    return { ok: true };

    function setErr(field, msg) {
      setFieldError(`${field}Error`, msg);
      return { ok: false, id: field, msg };
    }
  }

  /* ---------- Live validation ---------- */
  function bindLive() {
    firstName?.addEventListener('input', () => { cleanNameField(firstName); if (isValidName(firstName.value)) setFieldError('firstNameError',''); });
    firstName?.addEventListener('change', fixAutofillConfusion);
    lastName?.addEventListener('input', () => { cleanNameField(lastName); if (isValidName(lastName.value)) setFieldError('lastNameError',''); });
    lastName?.addEventListener('change', fixAutofillConfusion);
    email?.addEventListener('input', () => { if (EMAIL_REGEX.test(email.value.trim())) setFieldError('emailError',''); });
    email?.addEventListener('change', fixAutofillConfusion);
    subject?.addEventListener('change', () => setFieldError('subjectError',''));
    message?.addEventListener('input', () => {
      const v = message.value.trim();
      if (v.length >= 10 && v.length <= 1000) setFieldError('messageError','');
    });
  }
  bindLive();
  fixAutofillConfusion();

  /* ---------- Auth header (optional) ---------- */
  function getAuthToken() {
    return (
      window.CITYFIX?.getToken?.() ||
      localStorage.getItem('cityfix_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('cityfix_token') ||
      sessionStorage.getItem('token') ||
      ''
    );
  }

  /* ---------- UX helpers ---------- */
  function focusAndToast(msg, id) {
    notify('error', { message: msg, title: 'Validation error' });
    const el = document.getElementById(id);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setSubmitting(loading, originalText) {
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnIcon = submitBtn?.querySelector('.btn-icon');
    if (loading) {
      submitBtn && (submitBtn.disabled = true);
      btnText && (btnText.textContent = 'Sending...');
      btnIcon && (btnIcon.className = 'fas fa-spinner fa-spin btn-icon');
    } else {
      submitBtn && (submitBtn.disabled = false);
      btnText && (btnText.textContent = originalText || 'Send Message');
      btnIcon && (btnIcon.className = 'fas fa-paper-plane btn-icon');
    }
  }

  /* ---------- Network with timeout ---------- */
  async function fetchJSON(url, opts = {}, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } finally { clearTimeout(t); }
  }

  /* ---------- Prevent duplicate submits ---------- */
  let submitting = false;
  let lastHash = '';
  const hash = o => {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
    catch { return String(Date.now()); }
  };

  /* ---------- Submit ---------- */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;

    fixAutofillConfusion();
    const v = validate();
    if (!v.ok) { focusAndToast(v.msg, v.id); return; }

    const payload = {
      firstName: cleanText(firstName.value),
      lastName:  cleanText(lastName.value),
      email:     email.value.trim().toLowerCase(),
      subject:   subject.value,
      message:   message.value.trim(),
      source:    location.pathname || 'contact'
    };

    const h = hash(payload);
    if (h === lastHash) return;
    lastHash = h;

    const originalText = (submitBtn?.querySelector('.btn-text')?.textContent) || 'Send Message';
    setSubmitting(true, originalText);
    submitting = true;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { res, data } = await fetchJSON(`${API_BASE}/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok && data?.success) {
        const bodyHTML = `
          <ul class="list-disc ml-5">
            <li>Thanks, <strong>${payload.firstName}</strong>. Your message was sent.</li>
            ${data.trackingNumber ? `<li>Ticket: <strong>${data.trackingNumber}</strong></li>` : ''}
            <li>We’ll get back to you within 24 hours.</li>
          </ul>`;
        notify('success', { title: 'Message sent', message: bodyHTML, duration: 6500 });
        notify('info',    { title: 'Heads up', message: 'Our admin team has been notified.' });

        form.reset();
        if (charCount) { charCount.textContent = '0'; charCount.style.color = '#666'; }

        try {
          const key = 'contactSubmissions';
          const arr = JSON.parse(localStorage.getItem(key) || '[]');
          arr.push({ ...payload, id: Date.now(), timestamp: new Date().toISOString(), status: 'sent' });
          if (arr.length > 10) arr.shift();
          localStorage.setItem(key, JSON.stringify(arr));
        } catch {}
        return;
      }

      // Errors
      const msg = (data && data.message) || 'Unable to send your message.';
      if (res.status === 400) {
        if (/email/i.test(msg)) setFieldError('emailError', msg);
        if (/first name/i.test(msg)) setFieldError('firstNameError', msg);
        if (/last name/i.test(msg)) setFieldError('lastNameError', msg);
        if (/subject/i.test(msg)) setFieldError('subjectError', msg);
        if (/message/i.test(msg)) setFieldError('messageError', msg);
        notify('error', { title: 'Check your input', message: msg });
      } else if (res.status === 404) {
        notify('error', { title: 'Service unavailable', message: 'Contact endpoint not found. Please refresh and try again.' });
      } else if (res.status >= 500) {
        notify('error', { title: 'Server error', message: 'Something went wrong while sending your message. Try again shortly.' });
      } else {
        notify('error', { title: 'Error', message: msg });
      }
    } catch (err) {
      const timedOut = (err?.name === 'AbortError');
      notify('error', {
        title: timedOut ? 'Request timed out' : 'Network error',
        message: timedOut
          ? 'Please check your internet connection and try again.'
          : 'Cannot reach the server. Please try again.'
      });
    } finally {
      submitting = false;
      setTimeout(() => setSubmitting(false, originalText), 600);
    }
  });
});