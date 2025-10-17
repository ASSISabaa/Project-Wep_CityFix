// client/js/i18n-signup.js - Professional Header Translation (Desktop & Mobile)
(() => {
  'use strict';

  const translations = {
    he: {
      'app.name': 'CityFix',
      'nav.home': 'בית',
      'nav.reports': 'דיווחים',
      'nav.submit': 'שלח דיווח',
      'nav.impact': 'ההשפעה שלי',
      'nav.contact': 'צור קשר',
      
      'auth.join': 'CityFix- הצטרף ל',
      'auth.createAccount': 'צור חשבון כדי להתחיל לדווח',
      'auth.username': 'שם משתמש',
      'auth.enterUsername': 'הזן את שם המשתמש שלך',
      'auth.email': 'כתובת אימייל',
      'auth.enterEmail': 'הזן את האימייל שלך',
      'auth.password': 'סיסמה',
      'auth.createPassword': 'צור סיסמה',
      'auth.userId': 'מזהה משתמש (אופציונלי)',
      'auth.enterUserId': 'הזן את מזהה המשתמש שלך',
      'auth.profilePhoto': 'תמונת פרופיל (אופציונלי)',
      'auth.iAmA': 'אני:',
      'auth.citizen': 'אזרח',
      'auth.admin': 'מנהל',
      'auth.signup': 'הירשם',
      'auth.haveAccount': 'כבר יש לך חשבון?',
      'auth.login': 'התחבר',
      'auth.creating': 'יוצר חשבון...',
   
      
      'validation.emailInvalid': 'נא להזין כתובת אימייל תקינה',
      'validation.usernameShort': 'שם המשתמש חייב להכיל לפחות 3 תווים',
      'validation.passwordShort': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      
      'error.emailExists': 'האימייל כבר רשום. נא להשתמש באימייל אחר',
      'error.registrationFailed': 'ההרשמה נכשלה. נסה שוב',
      
      'success.accountCreated': 'ברוך הבא! החשבון נוצר בהצלחה',
      
      'footer.tagline': 'הופכים את העיר שלנו לטובה יותר ביחד',
      'footer.quickLinks': 'קישורים מהירים',
      'footer.connect': 'התחבר',
      'footer.about': 'אודותינו',
      'footer.privacy': 'מדיניות פרטיות',
      'footer.followUs': 'עקוב אחרינו',
      'footer.rights': '© 2025 CityFix. כל הזכויות שמורות',
      'footer.home': 'הבית',
      'footer.reports': 'דיווחים',
      'footer.submitReport': 'שלח דיווח',
      'footer.aboutUs': 'אודותינו',
      'footer.contact': 'צור קשר',
      'footer.privacyPolicy': 'מדיניות פרטיות'
    },
    
    ar: {
      'app.name': 'CityFix',
      'nav.home': 'الرئيسية',
      'nav.reports': 'البلاغات',
      'nav.submit': 'إرسال بلاغ',
      'nav.impact': 'تأثيري',
      'nav.contact': 'اتصل بنا',
      
      'auth.join': ' CityFix انضم إلى ',
      'auth.createAccount': 'أنشئ حسابك لبدء الإبلاغ',
      'auth.username': 'اسم المستخدم',
      'auth.enterUsername': 'أدخل اسم المستخدم',
      'auth.email': 'البريد الإلكتروني',
      'auth.enterEmail': 'أدخل بريدك الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.createPassword': 'أنشئ كلمة مرور',
      'auth.userId': 'معرف المستخدم (اختياري)',
      'auth.enterUserId': 'أدخل معرف المستخدم',
      'auth.profilePhoto': 'صورة الملف الشخصي (اختياري)',
      'auth.iAmA': 'أنا:',
      'auth.citizen': 'مواطن',
      'auth.admin': 'مدير',
      'auth.signup': 'تسجيل',
      'auth.haveAccount': 'هل لديك حساب؟',
      'auth.login': 'تسجيل الدخول',
      'auth.creating': 'جاري إنشاء الحساب...',
      
      'validation.emailInvalid': 'الرجاء إدخال بريد إلكتروني صحيح',
      'validation.usernameShort': 'يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل',
      'validation.passwordShort': 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
      
      'error.emailExists': 'البريد الإلكتروني مسجل بالفعل. استخدم بريداً آخر',
      'error.registrationFailed': 'فشل التسجيل. حاول مرة أخرى',
      
      'success.accountCreated': 'مرحباً! تم إنشاء الحساب بنجاح',
      
      'footer.tagline': 'نجعل مدينتنا أفضل معاً',
      'footer.quickLinks': 'روابط سريعة',
      'footer.connect': 'تواصل معنا',
      'footer.about': 'من نحن',
      'footer.privacy': 'سياسة الخصوصية',
      'footer.followUs': 'تابعنا',
      'footer.rights': '© 2025 CityFix. جميع الحقوق محفوظة',
      'footer.home': 'الرئيسية',
      'footer.reports': 'البلاغات',
      'footer.submitReport': 'إرسال بلاغ',
      'footer.aboutUs': 'من نحن',
      'footer.contact': 'اتصل بنا',
      'footer.privacyPolicy': 'سياسة الخصوصية'
    },
    
    en: {
      'app.name': 'CityFix',
      'nav.home': 'Home',
      'nav.reports': 'Reports',
      'nav.submit': 'Submit Report',
      'nav.impact': 'My Impact',
      'nav.contact': 'Contact',
      
      'auth.join': 'Join CityFix',
      'auth.createAccount': 'Create your account to start reporting',
      'auth.username': 'Username',
      'auth.enterUsername': 'Enter your username',
      'auth.email': 'Email address',
      'auth.enterEmail': 'Enter your email',
      'auth.password': 'Password',
      'auth.createPassword': 'Create a password',
      'auth.userId': 'User ID (optional)',
      'auth.enterUserId': 'Enter your User ID',
      'auth.profilePhoto': 'Profile Photo (optional)',
      'auth.iAmA': 'I am a:',
      'auth.citizen': 'Citizen',
      'auth.admin': 'Admin',
      'auth.signup': 'Sign Up',
      'auth.haveAccount': 'Already have an account?',
      'auth.login': 'Log in',
      'auth.creating': 'Creating account...',
      
      'validation.emailInvalid': 'Please enter a valid email address',
      'validation.usernameShort': 'Username must be at least 3 characters',
      'validation.passwordShort': 'Password must be at least 6 characters',
      
      'error.emailExists': 'Email already registered. Please use a different email',
      'error.registrationFailed': 'Registration failed. Please try again',
      
      'success.accountCreated': 'Welcome! Account created successfully',
      
      'footer.tagline': 'Making our city better, together',
      'footer.quickLinks': 'Quick Links',
      'footer.connect': 'Connect',
      'footer.about': 'About Us',
      'footer.privacy': 'Privacy Policy',
      'footer.followUs': 'Follow Us',
      'footer.rights': '© 2025 CityFix. All rights reserved',
      'footer.home': 'Home',
      'footer.reports': 'Reports',
      'footer.submitReport': 'Submit Report',
      'footer.aboutUs': 'About Us',
      'footer.contact': 'Contact',
      'footer.privacyPolicy': 'Privacy Policy'
    },
    
    ru: {
      'app.name': 'CityFix',
      'nav.home': 'Главная',
      'nav.reports': 'Отчеты',
      'nav.submit': 'Подать отчет',
      'nav.impact': 'Мое влияние',
      'nav.contact': 'Контакты',
      
      'auth.join': 'Присоединяйтесь к CityFix',
      'auth.createAccount': 'Создайте учетную запись для начала отчетов',
      'auth.username': 'Имя пользователя',
      'auth.enterUsername': 'Введите ваше имя пользователя',
      'auth.email': 'Электронная почта',
      'auth.enterEmail': 'Введите вашу электронную почту',
      'auth.password': 'Пароль',
      'auth.createPassword': 'Создайте пароль',
      'auth.userId': 'ID пользователя (необязательно)',
      'auth.enterUserId': 'Введите ваш ID пользователя',
      'auth.profilePhoto': 'Фото профиля (необязательно)',
      'auth.iAmA': 'Я:',
      'auth.citizen': 'Гражданин',
      'auth.admin': 'Администратор',
      'auth.signup': 'Зарегистрироваться',
      'auth.haveAccount': 'Уже есть аккаунт?',
      'auth.login': 'Войти',
      'auth.creating': 'Создание аккаунта...',
      
      
      'validation.emailInvalid': 'Пожалуйста, введите действительный адрес электронной почты',
      'validation.usernameShort': 'Имя пользователя должно содержать не менее 3 символов',
      'validation.passwordShort': 'Пароль должен содержать не менее 6 символов',
      
      'error.emailExists': 'Email уже зарегистрирован. Используйте другой',
      'error.registrationFailed': 'Регистрация не удалась. Попробуйте снова',
      
      'success.accountCreated': 'Добро пожаловать! Аккаунт успешно создан',
      
      'footer.tagline': 'Делаем наш город лучше вместе',
      'footer.quickLinks': 'Быстрые ссылки',
      'footer.connect': 'Связаться',
      'footer.about': 'О нас',
      'footer.privacy': 'Политика конфиденциальности',
      'footer.followUs': 'Следите за нами',
      'footer.rights': '© 2025 CityFix. Все права защищены',
      'footer.home': 'Главная',
      'footer.reports': 'Отчеты',
      'footer.submitReport': 'Подать отчет',
      'footer.aboutUs': 'О нас',
      'footer.contact': 'Контакты',
      'footer.privacyPolicy': 'Политика конфиденциальности'
    }
  };
  class I18n {
    constructor() {
      this.currentLang = this.detectLanguage();
      this.translations = translations;
      localStorage.setItem('cityfix_language', this.currentLang);
    }

    detectLanguage() {
      const saved = localStorage.getItem('cityfix_language');
      if (saved && translations[saved]) return saved;
      
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) return browserLang;
      
      return 'he'; // Default Hebrew
    }

    t(key) {
      return this.translations[this.currentLang]?.[key] || key;
    }

    setLanguage(lang) {
      if (translations[lang]) {
        this.currentLang = lang;
        localStorage.setItem('cityfix_language', lang);
        this.translatePage();
        this.updateDirection();
      }
    }

    translatePage() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = this.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = this.t(key);
      });
    }

    updateDirection() {
    // ALWAYS keep LTR layout - only translate text
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = this.currentLang;
    
    // Remove RTL class
    document.body.classList.remove('rtl');
    
    // Add language class for styling if needed
    document.body.className = document.body.className.replace(/lang-\w+/g, '');
    document.body.classList.add(`lang-${this.currentLang}`);
}

createLanguageSwitcher() {
  const languages = {
    he: { name: 'עברית', flag: '🇮🇱' },
    ar: { name: 'العربية', flag: '🇸🇦' },
    en: { name: 'English', flag: '🇺🇸' },
    ru: { name: 'Русский', flag: '🇷🇺' }
  };

  return `
    <div class="language-switcher">
      <button class="lang-toggle" id="langToggle" aria-label="Change Language">
        <span class="lang-flag">${languages[this.currentLang].flag}</span>
        <span class="lang-name">${languages[this.currentLang].name}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.5 6L8 9.5L11.5 6"/>
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
        // Find the best place to add switcher
        let targetElement = document.querySelector('.auth-section');
        
        // If auth-section doesn't exist, try nav-section
        if (!targetElement) {
            targetElement = document.querySelector('.nav-section');
        }
        
        // If still not found, try header
        if (!targetElement) {
            targetElement = document.querySelector('.header');
        }
        
        if (targetElement) {
            const temp = document.createElement('div');
            temp.innerHTML = this.createLanguageSwitcher();
            
            // Insert before first child in auth-section or after last child in nav
            if (targetElement.classList.contains('auth-section')) {
            targetElement.insertBefore(temp.firstElementChild, targetElement.firstChild);
            } else {
            targetElement.appendChild(temp.firstElementChild);
            }

            // Add event listeners
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

  window.i18n = new I18n();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.i18n.translatePage();
      window.i18n.updateDirection();
      window.i18n.initLanguageSwitcher();
    });
  } else {
    window.i18n.translatePage();
    window.i18n.updateDirection();
    window.i18n.initLanguageSwitcher();
  }
})();