(() => {
  'use strict';

  const CONFIG = {
    API_ENDPOINT: 'http://localhost:5000/api/ai/translate',
    STORAGE_KEY: 'cityfix_language',
    CACHE_KEY: 'cityfix_translations_cache',
    SUPPORTED_LANGUAGES: {
      en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
      ar: { name: 'العربية', flag: '🇸🇦', dir: 'ltr' },
      he: { name: 'עברית', flag: '🇮🇱', dir: 'ltr' },
      ru: { name: 'Русский', flag: '🇷🇺', dir: 'ltr' }
    }
  };

  const PROFESSIONAL_TRANSLATIONS = {
    ar: {
      'Home': 'الرئيسية',
      'Reports': 'البلاغات',
      'Submit Report': 'إرسال بلاغ',
      'My Impact': 'تأثيري',
      'Contact': 'اتصل بنا',
      'Sign Up': 'إنشاء حساب',
      'Log in': 'تسجيل الدخول',
      'Login': 'تسجيل الدخول',
      'Username': 'اسم المستخدم',
      'Email': 'البريد الإلكتروني',
      'Email address': 'البريد الإلكتروني',
      'Password': 'كلمة المرور',
      'User ID (optional)': 'معرّف المستخدم (اختياري)',
      'Profile Photo (optional)': 'صورة الملف الشخصي (اختياري)',
      'I am a :': 'أنا :',
      'Citizen': 'مواطن',
      'Admin': 'مدير',
      'Welcome to CityFix': 'مرحباً بك في CityFix',
      'Join CityFix': 'انضم إلى CityFix',
      'Create your account to start reporting': 'أنشئ حسابك لبدء الإبلاغ',
      'Sign in to report and track city issues': 'سجّل الدخول للإبلاغ عن مشاكل المدينة وتتبعها',
      'Making our city better, together.': 'نجعل مدينتنا أفضل معاً',
      'Already have an account?': 'لديك حساب بالفعل؟',
      "Don't have an account?": 'ليس لديك حساب؟',
      'Enter your username': 'أدخل اسم المستخدم',
      'Enter your email': 'أدخل بريدك الإلكتروني',
      'Create a password': 'أنشئ كلمة مرور',
      'Enter your User ID': 'أدخل معرّف المستخدم',
      'Choose Photo': 'اختر صورة',
      'No file chosen': 'لم يتم اختيار ملف',
      'Quick Links': 'روابط سريعة',
      'Connect': 'تواصل',
      'Follow Us': 'تابعنا',
      'About Us': 'من نحن',
      'Privacy Policy': 'سياسة الخصوصية',
      'All rights reserved': 'جميع الحقوق محفوظة',
      'CityFix': 'CityFix'
    },
    he: {
      'Home': 'בית',
      'Reports': 'דיווחים',
      'Submit Report': 'שלח דיווח',
      'My Impact': 'ההשפעה שלי',
      'Contact': 'צור קשר',
      'Sign Up': 'הירשם',
      'Log in': 'התחבר',
      'Login': 'התחברות',
      'Username': 'שם משתמש',
      'Email': 'אימייל',
      'Email address': 'כתובת אימייל',
      'Password': 'סיסמה',
      'User ID (optional)': 'מזהה משתמש (אופציונלי)',
      'Profile Photo (optional)': 'תמונת פרופיל (אופציונלי)',
      'I am a :': 'אני :',
      'Citizen': 'אזרח',
      'Admin': 'מנהל',
      'Welcome to CityFix': 'ברוכים הבאים ל-CityFix',
      'Join CityFix': 'הצטרף ל-CityFix',
      'Create your account to start reporting': 'צור חשבון כדי להתחיל לדווח',
      'Sign in to report and track city issues': 'התחבר כדי לדווח ולעקוב אחר בעיות בעיר',
      'Making our city better, together.': 'הופכים את העיר שלנו לטובה יותר ביחד',
      'Already have an account?': 'כבר יש לך חשבון?',
      "Don't have an account?": 'אין לך חשבון?',
      'Enter your username': 'הזן שם משתמש',
      'Enter your email': 'הזן את האימייל שלך',
      'Create a password': 'צור סיסמה',
      'Enter your User ID': 'הזן מזהה משתמש',
      'Choose Photo': 'בחר תמונה',
      'No file chosen': 'לא נבחר קובץ',
      'Quick Links': 'קישורים מהירים',
      'Connect': 'התחבר',
      'Follow Us': 'עקוב אחרינו',
      'About Us': 'אודותינו',
      'Privacy Policy': 'מדיניות פרטיות',
      'All rights reserved': 'כל הזכויות שמורות',
      'CityFix': 'CityFix'
    },
    ru: {
      'Home': 'Главная',
      'Reports': 'Отчеты',
      'Submit Report': 'Подать отчет',
      'My Impact': 'Мое влияние',
      'Contact': 'Контакты',
      'Sign Up': 'Регистрация',
      'Log in': 'Войти',
      'Login': 'Вход',
      'Username': 'Имя пользователя',
      'Email': 'Email',
      'Email address': 'Электронная почта',
      'Password': 'Пароль',
      'User ID (optional)': 'ID пользователя (необязательно)',
      'Profile Photo (optional)': 'Фото профиля (необязательно)',
      'I am a :': 'Я :',
      'Citizen': 'Гражданин',
      'Admin': 'Администратор',
      'Welcome to CityFix': 'Добро пожаловать в CityFix',
      'Join CityFix': 'Присоединяйтесь к CityFix',
      'Create your account to start reporting': 'Создайте аккаунт, чтобы начать',
      'Sign in to report and track city issues': 'Войдите, чтобы сообщать о проблемах',
      'Making our city better, together.': 'Делаем наш город лучше вместе',
      'Already have an account?': 'Уже есть аккаунт?',
      "Don't have an account?": 'Нет аккаунта?',
      'Enter your username': 'Введите имя пользователя',
      'Enter your email': 'Введите вашу почту',
      'Create a password': 'Создайте пароль',
      'Enter your User ID': 'Введите ID пользователя',
      'Choose Photo': 'Выбрать фото',
      'No file chosen': 'Файл не выбран',
      'Quick Links': 'Быстрые ссылки',
      'Connect': 'Связаться',
      'Follow Us': 'Следите за нами',
      'About Us': 'О нас',
      'Privacy Policy': 'Политика конфиденциальности',
      'All rights reserved': 'Все права защищены',
      'CityFix': 'CityFix'
    }
  };

  class AITranslator {
    constructor() {
      this.currentLang = this.detectLanguage();
      this.cache = this.loadCache();
      this.originalTexts = new Map();
      this.isTranslating = false;
      this.addStyles();
    }

    detectLanguage() {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved && CONFIG.SUPPORTED_LANGUAGES[saved]) return saved;
      
      const browserLang = navigator.language.split('-')[0];
      return CONFIG.SUPPORTED_LANGUAGES[browserLang] ? browserLang : 'en';
    }

    loadCache() {
      try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }

    saveCache() {
      try {
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn('Cache save failed:', e);
      }
    }

    translate(text, targetLang) {
      const trimmed = text.trim();
      
      if (targetLang === 'en') return trimmed;
      
      const translations = PROFESSIONAL_TRANSLATIONS[targetLang];
      return translations?.[trimmed] || trimmed;
    }

    shouldSkipElement(element) {
      if (!element || !element.tagName) return true;

      const skipSelectors = [
        'script', 'style', 'code', 'pre', 'svg',
        '.language-switcher', '.lang-dropdown', '.lang-toggle',
        '[data-no-translate]'
      ];

      return skipSelectors.some(selector => {
        if (selector.startsWith('.') || selector.startsWith('[')) {
          return element.matches(selector) || element.closest(selector);
        }
        return element.tagName.toLowerCase() === selector;
      });
    }

    translateElement(element) {
      if (this.shouldSkipElement(element)) return;

      if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        const originalText = element.textContent.trim();
        if (originalText && originalText.length > 1) {
          if (!this.originalTexts.has(element)) {
            this.originalTexts.set(element, originalText);
          }
          element.textContent = this.translate(originalText, this.currentLang);
        }
      } else {
        Array.from(element.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.textContent.trim();
            if (originalText && originalText.length > 1) {
              if (!this.originalTexts.has(node)) {
                this.originalTexts.set(node, originalText);
              }
              node.textContent = this.translate(originalText, this.currentLang);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.translateElement(node);
          }
        });
      }
    }

    translatePage() {
      if (this.currentLang === 'en' || this.isTranslating) return;

      this.isTranslating = true;

      const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span:not(.lang-flag):not(.check)', 'a', 'button:not(.lang-toggle):not(.lang-option)',
        'label', 'li', '.nav-item', '.overlay-title', '.overlay-subtitle',
        '.welcome-title', '.welcome-subtitle', '.footer-description',
        '.radio-label', '.login-prompt', '.signup-prompt'
      ];

      document.querySelectorAll(selectors.join(',')).forEach(el => {
        this.translateElement(el);
      });

      this.translatePlaceholders();
      this.updateDirection();

      this.isTranslating = false;
    }

    translatePlaceholders() {
      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      
      inputs.forEach(input => {
        const original = input.placeholder;
        if (!original || original.length < 2) return;

        if (!input.dataset.originalPlaceholder) {
          input.dataset.originalPlaceholder = original;
        }

        input.placeholder = this.translate(original, this.currentLang);
      });
    }

    restoreOriginalTexts() {
      this.originalTexts.forEach((original, node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.parentElement) {
            node.textContent = original;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          node.textContent = original;
        }
      });

      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      inputs.forEach(input => {
        if (input.dataset.originalPlaceholder) {
          input.placeholder = input.dataset.originalPlaceholder;
        }
      });
    }

    setLanguage(lang) {
      if (!CONFIG.SUPPORTED_LANGUAGES[lang]) return;

      this.currentLang = lang;
      localStorage.setItem(CONFIG.STORAGE_KEY, lang);

      if (lang === 'en') {
        this.restoreOriginalTexts();
        this.updateDirection();
      } else {
        this.translatePage();
      }
    }

    updateDirection() {
      const langInfo = CONFIG.SUPPORTED_LANGUAGES[this.currentLang];
      document.documentElement.dir = langInfo.dir;
      document.documentElement.lang = this.currentLang;
      document.body.className = document.body.className.replace(/lang-\w+/g, '');
      document.body.classList.add(`lang-${this.currentLang}`);
    }

    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .language-switcher {
          position: relative;
          display: inline-flex;
          align-items: center;
          margin-left: auto;
        }

        .lang-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 14px;
          color: white;
          min-width: 150px;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .lang-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .lang-toggle:active {
          transform: translateY(0);
        }

        .lang-flag {
          font-size: 22px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lang-name {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        .lang-toggle svg {
          width: 12px;
          height: 12px;
          transition: transform 0.3s ease;
          flex-shrink: 0;
          opacity: 0.9;
          margin-left: 4px;
        }

        .lang-dropdown.show ~ .lang-toggle svg {
          transform: rotate(180deg);
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10000;
          overflow: hidden;
          max-height: 0;
        }

        .lang-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          max-height: 400px;
        }

        .lang-dropdown::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 20px;
          width: 12px;
          height: 12px;
          background: white;
          border-left: 1px solid #e5e7eb;
          border-top: 1px solid #e5e7eb;
          transform: rotate(45deg);
          z-index: 1;
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 18px;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: #374151;
          text-align: left;
          font-weight: 500;
          position: relative;
          z-index: 2;
        }

        .lang-option:hover {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        }

        .lang-option:active {
          background: #e5e7eb;
        }

        .lang-option.active {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #2563eb;
          font-weight: 700;
        }

        .lang-option .lang-flag {
          font-size: 24px;
          width: 28px;
        }

        .lang-option .lang-name {
          flex: 1;
          font-size: 14px;
        }

        .lang-option .check {
          color: #2563eb;
          font-weight: 700;
          font-size: 18px;
          margin-left: auto;
        }

        @media (max-width: 768px) {
          .lang-toggle {
            padding: 8px 14px;
            min-width: 130px;
            gap: 8px;
          }

          .lang-flag {
            font-size: 20px;
          }

          .lang-name {
            font-size: 13px;
          }

          .lang-dropdown {
            min-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .lang-toggle {
            min-width: 110px;
            padding: 7px 12px;
          }

          .lang-flag {
            font-size: 18px;
          }

          .lang-name {
            font-size: 12px;
          }

          .lang-dropdown {
            min-width: 180px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    createLanguageSwitcher() {
      const languages = CONFIG.SUPPORTED_LANGUAGES;

      return `
        <div class="language-switcher">
          <button class="lang-toggle" id="langToggle" aria-label="Change Language">
            <span class="lang-flag">${languages[this.currentLang].flag}</span>
            <span class="lang-name">${languages[this.currentLang].name}</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.5 6L8 9.5L11.5 6" stroke="white" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <div class="lang-dropdown" id="langDropdown">
            ${Object.entries(languages).map(([code, info]) => `
              <button class="lang-option ${code === this.currentLang ? 'active' : ''}" 
                      data-lang="${code}"
                      aria-label="Switch to ${info.name}">
                <span class="lang-flag">${info.flag}</span>
                <span class="lang-name">${info.name}</span>
                ${code === this.currentLang ? '<span class="check">✓</span>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    initLanguageSwitcher() {
      let targetElement = document.querySelector('.header-content');
      
      if (!targetElement) {
        targetElement = document.querySelector('.header');
      }

      if (!targetElement) {
        targetElement = document.querySelector('body');
      }
      
      if (targetElement) {
        const temp = document.createElement('div');
        temp.innerHTML = this.createLanguageSwitcher();
        targetElement.appendChild(temp.firstElementChild);

        const toggle = document.getElementById('langToggle');
        const dropdown = document.getElementById('langDropdown');

        toggle?.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown?.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
          if (!e.target.closest('.language-switcher')) {
            dropdown?.classList.remove('show');
          }
        });

        document.querySelectorAll('.lang-option').forEach(btn => {
          btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            this.setLanguage(lang);
            location.reload();
          });
        });
      }
    }
  }

  const translator = new AITranslator();
  window.aiTranslator = translator;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      translator.initLanguageSwitcher();
      translator.translatePage();
    });
  } else {
    translator.initLanguageSwitcher();
    translator.translatePage();
  }
})();