// contact.js — unicode-safe validation + clear toasts + autofill fix
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE =
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : `${location.origin}/api`;

  const form      = document.getElementById('contactForm');
  const firstName = document.getElementById('firstName');
  const lastName  = document.getElementById('lastName');
  const email     = document.getElementById('email');
  const subject   = document.getElementById('subject');
  const message   = document.getElementById('message');
  const submitBtn = document.getElementById('submitBtn');
  const charCount = document.getElementById('charCount');

  // Enhanced Unicode name regex that supports all languages
  const NAME_REGEX = (() => {
    try { 
      // Use Unicode property escapes for better language support
      return new RegExp("^[\\p{L}\\p{M}''\\-\\s]+$", "u"); 
    }
    catch { 
      // Fallback with explicit Hebrew, Arabic and other language ranges
      return /^[A-Za-z\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF''\\-\\s]+$/; 
    }
  })();
  
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ZERO_WIDTH_RE = /[\u200B-\u200D\u200E\u200F\u061C\uFEFF]/g;

  function toast(type, text) {
    if (typeof window.showToast === 'function') {
      window.showToast(type, text);
    } else {
      console.log(`${type.toUpperCase()}: ${text}`);
    }
  }

  function cleanText(v) {
    return String(v || '').normalize('NFC').replace(ZERO_WIDTH_RE, '').trim();
  }

  function cleanNameField(inputEl) {
    if (!inputEl) return;
    const cleaned = cleanText(inputEl.value);
    if (cleaned !== inputEl.value) inputEl.value = cleaned;
  }

  // Prefill user data from storage
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
    } catch (err) {
      console.error('Prefill error:', err);
    }
  })();

  // Character counter for message
  if (message && charCount) {
    const updateCounter = () => {
      const len = message.value.length;
      charCount.textContent = String(len);
      charCount.style.color = len > 900 ? '#ff6b6b' : len > 800 ? '#ffa500' : '#666';
    };
    message.addEventListener('input', updateCounter);
    updateCounter();
  }

  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
    const input = el.previousElementSibling;
    if (input && input.classList) {
      if (msg) input.classList.add('error');
      else input.classList.remove('error');
    }
  }

  function clearAllErrors() {
    ['firstNameError','lastNameError','emailError','subjectError','messageError']
      .forEach(k => setFieldError(k, ''));
    if (form) form.querySelectorAll('input,select,textarea').forEach(i => i.classList.remove('error'));
  }

  function isLettersOnly(v) {
    const s = cleanText(v);
    // Check minimum length
    if (s.length < 2) return false;
    
    // Check if string contains any numbers or invalid special characters
    const hasInvalidChars = /[0-9@#$%^&*()_+=\[\]{};:"\\|,.<>\/?`~]/.test(s);
    if (hasInvalidChars) return false;
    
    // Allow all Unicode letters (Hebrew, Arabic, English, etc.)
    return true;
  }

  function fixAutofillConfusion() {
    cleanNameField(firstName);
    cleanNameField(lastName);
    if (!firstName || !lastName || !email) return;

    const fn = firstName.value.trim();
    const ln = lastName.value.trim();
    const em = email.value.trim();

    // Check if first name looks like an email
    if (fn.includes('@') || EMAIL_REGEX.test(fn)) {
      if (!em) {
        email.value = fn;
        firstName.value = '';
        setFieldError('firstNameError', 'First name is required');
        toast('info', 'Moved detected email into the Email field. Please enter your first name.');
      } else {
        setFieldError('firstNameError', 'First name looks like an email. Use letters only.');
      }
    }

    // Check if last name contains numbers or @ symbol
    if (/[0-9@]/.test(ln)) {
      setFieldError('lastNameError', 'Last name should contain letters only');
    }
  }

  function validate() {
    clearAllErrors();

    const fn = cleanText(firstName?.value);
    const ln = cleanText(lastName?.value);
    const em = (email?.value || '').trim();
    const sj = (subject?.value || '');
    const ms = (message?.value || '').trim();

    // First Name validation
    if (!fn) { 
      setFieldError('firstNameError','First name is required'); 
      return { ok:false, id:'firstName', msg:'Please enter your first name' }; 
    }
    if (!isLettersOnly(fn)) { 
      setFieldError('firstNameError','First name should contain letters only'); 
      return { ok:false, id:'firstName', msg:'First name: letters only' }; 
    }

    // Last Name validation
    if (!ln) { 
      setFieldError('lastNameError','Last name is required'); 
      return { ok:false, id:'lastName', msg:'Please enter your last name' }; 
    }
    if (!isLettersOnly(ln)) { 
      setFieldError('lastNameError','Last name should contain letters only'); 
      return { ok:false, id:'lastName', msg:'Last name: letters only' }; 
    }

    // Email validation
    if (!em) { 
      setFieldError('emailError','Email is required'); 
      return { ok:false, id:'email', msg:'Please enter your email' }; 
    }
    if (!EMAIL_REGEX.test(em)) { 
      setFieldError('emailError','Please enter a valid email address'); 
      return { ok:false, id:'email', msg:'Email is invalid' }; 
    }

    // Subject validation
    if (!sj) { 
      setFieldError('subjectError','Please select a subject'); 
      return { ok:false, id:'subject', msg:'Choose a subject' }; 
    }

    // Message validation
    if (!ms) { 
      setFieldError('messageError','Message is required'); 
      return { ok:false, id:'message', msg:'Please write your message' }; 
    }
    if (ms.length < 10) { 
      setFieldError('messageError','Message must be at least 10 characters'); 
      return { ok:false, id:'message', msg:'Message too short' }; 
    }
    if (ms.length > 1000) { 
      setFieldError('messageError','Message must not exceed 1000 characters'); 
      return { ok:false, id:'message', msg:'Message too long' }; 
    }

    return { ok: true };
  }

  // Live validation bindings
  function bindLive() {
    if (firstName) {
      firstName.addEventListener('input', () => {
        cleanNameField(firstName);
        if (isLettersOnly(firstName.value)) setFieldError('firstNameError','');
      });
      firstName.addEventListener('change', fixAutofillConfusion);
    }
    if (lastName) {
      lastName.addEventListener('input', () => {
        cleanNameField(lastName);
        if (isLettersOnly(lastName.value)) setFieldError('lastNameError','');
      });
      lastName.addEventListener('change', fixAutofillConfusion);
    }
    if (email) {
      email.addEventListener('input', () => {
        if (EMAIL_REGEX.test(email.value.trim())) setFieldError('emailError','');
      });
      email.addEventListener('change', fixAutofillConfusion);
    }
    if (subject) {
      subject.addEventListener('change', () => setFieldError('subjectError',''));
    }
    if (message) {
      message.addEventListener('input', () => {
        const v = message.value.trim();
        if (v.length >= 10 && v.length <= 1000) setFieldError('messageError','');
      });
    }
  }
  
  bindLive();
  fixAutofillConfusion();

  function getAuthToken() {
    return (
      localStorage.getItem('cityfix_token') ||
      sessionStorage.getItem('cityfix_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      ''
    );
  }

  function focusAndToast(msg, id) {
    toast('error', msg);
    const el = document.getElementById(id);
    if (el && typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      fixAutofillConfusion();
      const v = validate();
      if (!v.ok) { 
        focusAndToast(v.msg || 'Please fix the errors in the form', v.id); 
        return; 
      }

      const btnText = submitBtn?.querySelector('.btn-text');
      const btnIcon = submitBtn?.querySelector('.btn-icon');
      const originalText = btnText ? btnText.textContent : 'Send Message';

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Sending...';
        if (btnIcon) btnIcon.className = 'fas fa-spinner fa-spin btn-icon';

        const body = {
          firstName: cleanText(firstName.value),
          lastName:  cleanText(lastName.value),
          email:     email.value.trim().toLowerCase(),
          subject:   subject.value,
          message:   message.value.trim()
        };

        const headers = { 'Content-Type': 'application/json' };
        const token = getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        const data = await resp.json().catch(() => ({}));
        
        if (resp.ok && data && data.success) {
          toast('success', data.message || 'Message sent successfully!');
          form.reset();
          if (charCount) { 
            charCount.textContent = '0'; 
            charCount.style.color = '#666'; 
          }
          
          // Store submission for reference
          try {
            const key = 'contactSubmissions';
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            arr.push({ 
              ...body, 
              id: Date.now(), 
              timestamp: new Date().toISOString(), 
              status: 'sent' 
            });
            if (arr.length > 10) arr.shift();
            localStorage.setItem(key, JSON.stringify(arr));
          } catch (err) {
            console.error('Storage error:', err);
          }
        } else {
          const msg = (data && data.message) || 'Failed to send message. Please try again.';
          toast('error', msg);
        }
      } catch (err) {
        console.error('Submit error:', err);
        toast('error', 'Network error. Please check your connection and try again.');
      } finally {
        setTimeout(() => {
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.textContent = originalText || 'Send Message';
          if (btnIcon) btnIcon.className = 'fas fa-paper-plane btn-icon';
        }, 600);
      }
    });
  }
});