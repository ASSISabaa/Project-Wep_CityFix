// client/js/i18n.js - Translation System
(() => {
  'use strict';

  const translations = {
    he: {
      // Header & Navigation
      'app.name': 'CityFix',
      'nav.home': 'בית',
      'nav.reports': 'דיווחים',
      'nav.submit': 'שלח דיווח',
      'nav.impact': 'ההשפעה שלי',
      'nav.contact': 'צור קשר',
      
      // Auth
      'auth.welcome': 'CityFix ברוכים הבאים ל',
      'auth.subtitle': 'התחבר כדי לדווח ולעקוב אחר בעיות בעיר',
      'auth.email': 'כתובת אימייל',
      'auth.password': 'סיסמה',
      'auth.remember': 'זכור אותי',
      'auth.forgot': ' ?שכחת סיסמה',
      'auth.loginAdmin': 'התחבר כמנהל',
      'auth.loginCitizen': 'התחבר כאזרח',
      'auth.noAccount': 'אין לך חשבון?',
      'auth.signup': 'הירשם',
      'auth.authenticating': 'מאמת...',
      
      // Validation
      'validation.emailInvalid': 'נא להזין כתובת אימייל תקינה',
      'validation.passwordShort': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      
      // Errors
      'error.invalidCredentials': 'אימייל או סיסמה לא נכונים',
      'error.noAdminPrivileges': 'לחשבון זה אין הרשאות מנהל',
      'error.useAdminLogin': 'נא להשתמש בכפתור התחברות מנהל',
      'error.serverError': 'שגיאת שרת. נסה שוב מאוחר יותר',
      'error.accountLocked': 'החשבון נעול. נסה שוב מאוחר יותר',
      'error.invalidRequest': 'בקשה לא תקינה. בדוק את הפרטים',
      'error.accessDenied': 'גישה נדחתה. בדוק את הרשאות התפקיד',
      'error.loginFailed': 'התחברות נכשלה. נסה שוב',
      
      // Success
      'success.login': 'התחברות מוצלחת! מפנה...',
      'success.logout': 'התנתקת בהצלחה',
      'success.passwordReset': 'קישור לאיפוס סיסמה נשלח לאימייל',
      'success.resuming': 'ממשיך את ההפעלה...',
      
      // Warnings
      'warning.emailFirst': 'נא להזין כתובת אימייל תחילה',
      'warning.resetSent': 'אם החשבון קיים, נשלח קישור לאיפוס',
      
      // Footer
      'footer.tagline': 'הופכים את העיר שלנו לטובה יותר ביחד',
      'footer.quickLinks': 'קישורים מהירים',
      'footer.connect': 'התחבר',
      'footer.about': 'אודותינו',
      'footer.privacy': 'מדיניות פרטיות',
      'footer.followUs': 'עקוב אחרינו',
      'footer.rights': '© 2025 CityFix. כל הזכויות שמורות'
    },
    
    ar: {
      // Header & Navigation
      'app.name': 'CityFix',
      'nav.home': 'الرئيسية',
      'nav.reports': 'البلاغات',
      'nav.submit': 'إرسال بلاغ',
      'nav.impact': 'تأثيري',
      'nav.contact': 'اتصل بنا',
      
      // Auth
      'auth.welcome': ' CityFix مرحباً بك في ',
      'auth.subtitle': 'سجل الدخول للإبلاغ عن مشاكل المدينة وتتبعها',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.remember': 'تذكرني',
      'auth.forgot': 'نسيت كلمة المرور؟',
      'auth.loginAdmin': 'تسجيل دخول كمدير',
      'auth.loginCitizen': 'تسجيل دخول كمواطن',
      'auth.noAccount': 'ليس لديك حساب؟',
      'auth.signup': 'سجل الآن',
      'auth.authenticating': 'جاري المصادقة...',
      
      // Validation
      'validation.emailInvalid': 'الرجاء إدخال بريد إلكتروني صحيح',
      'validation.passwordShort': 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
      
      // Errors
      'error.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'error.noAdminPrivileges': 'هذا الحساب لا يمتلك صلاحيات المدير',
      'error.useAdminLogin': 'الرجاء استخدام زر تسجيل دخول المدير',
      'error.serverError': 'خطأ في الخادم. حاول مرة أخرى لاحقاً',
      'error.accountLocked': 'الحساب مقفل. حاول مرة أخرى لاحقاً',
      'error.invalidRequest': 'طلب غير صالح. تحقق من إدخالك',
      'error.accessDenied': 'تم رفض الوصول. تحقق من أذونات الدور',
      'error.loginFailed': 'فشل تسجيل الدخول. حاول مرة أخرى',
      
      // Success
      'success.login': 'تم تسجيل الدخول بنجاح! جاري التحويل...',
      'success.logout': 'تم تسجيل الخروج بنجاح',
      'success.passwordReset': 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      'success.resuming': 'استئناف الجلسة...',
      
      // Warnings
      'warning.emailFirst': 'الرجاء إدخال عنوان بريد إلكتروني أولاً',
      'warning.resetSent': 'إذا كان الحساب موجوداً، فسيتم إرسال رابط إعادة التعيين',
      
      // Footer
      'footer.tagline': 'نجعل مدينتنا أفضل معاً',
      'footer.quickLinks': 'روابط سريعة',
      'footer.connect': 'تواصل معنا',
      'footer.about': 'من نحن',
      'footer.privacy': 'سياسة الخصوصية',
      'footer.followUs': 'تابعنا',
      'footer.rights': '© 2025 CityFix. جميع الحقوق محفوظة'
    },
    
    en: {
      // Header & Navigation
      'app.name': 'CityFix',
      'nav.home': 'Home',
      'nav.reports': 'Reports',
      'nav.submit': 'Submit Report',
      'nav.impact': 'My Impact',
      'nav.contact': 'Contact',
      
      // Auth
      'auth.welcome': 'Welcome to CityFix',
      'auth.subtitle': 'Sign in to report and track city issues',
      'auth.email': 'Email address',
      'auth.password': 'Password',
      'auth.remember': 'Remember me',
      'auth.forgot': 'Forgot password?',
      'auth.loginAdmin': 'Login as Admin',
      'auth.loginCitizen': 'Login as Citizen',
      'auth.noAccount': "Don't have an account?",
      'auth.signup': 'Sign up',
      'auth.authenticating': 'Authenticating...',
      
      // Validation
      'validation.emailInvalid': 'Please enter a valid email address',
      'validation.passwordShort': 'Password must be at least 6 characters',
      
      // Errors
      'error.invalidCredentials': 'Invalid email or password',
      'error.noAdminPrivileges': 'This account does not have admin privileges',
      'error.useAdminLogin': 'Please use the Admin login button',
      'error.serverError': 'Server error. Please try again later',
      'error.accountLocked': 'Account is locked. Please try again later',
      'error.invalidRequest': 'Invalid request. Please check your input',
      'error.accessDenied': 'Access denied. Please check your role permissions',
      'error.loginFailed': 'Login failed. Please try again',
      
      // Success
      'success.login': 'Login successful! Redirecting...',
      'success.logout': 'Logged out successfully',
      'success.passwordReset': 'Password reset link sent to your email',
      'success.resuming': 'Resuming session...',
      
      // Warnings
      'warning.emailFirst': 'Please enter a valid email address first',
      'warning.resetSent': 'If the account exists, a reset link will be sent',
      
      // Footer
      'footer.tagline': 'Making our city better, together',
      'footer.quickLinks': 'Quick Links',
      'footer.connect': 'Connect',
      'footer.about': 'About Us',
      'footer.privacy': 'Privacy Policy',
      'footer.followUs': 'Follow Us',
      'footer.rights': '© 2025 CityFix. All rights reserved'
    },
    
    ru: {
      // Header & Navigation
      'app.name': 'CityFix',
      'nav.home': 'Главная',
      'nav.reports': 'Отчеты',
      'nav.submit': 'Подать отчет',
      'nav.impact': 'Мое влияние',
      'nav.contact': 'Контакты',
      
      // Auth
      'auth.welcome': 'Добро пожаловать в CityFix',
      'auth.subtitle': 'Войдите, чтобы сообщать о городских проблемах и отслеживать их',
      'auth.email': 'Электронная почта',
      'auth.password': 'Пароль',
      'auth.remember': 'Запомнить меня',
      'auth.forgot': 'Забыли пароль?',
      'auth.loginAdmin': 'Войти как администратор',
      'auth.loginCitizen': 'Войти как гражданин',
      'auth.noAccount': 'Нет аккаунта?',
      'auth.signup': 'Зарегистрироваться',
      'auth.authenticating': 'Аутентификация...',
      
      // Validation
      'validation.emailInvalid': 'Пожалуйста, введите действительный адрес электронной почты',
      'validation.passwordShort': 'Пароль должен содержать не менее 6 символов',
      
      // Errors
      'error.invalidCredentials': 'Неверный email или пароль',
      'error.noAdminPrivileges': 'У этой учетной записи нет прав администратора',
      'error.useAdminLogin': 'Пожалуйста, используйте кнопку входа администратора',
      'error.serverError': 'Ошибка сервера. Попробуйте позже',
      'error.accountLocked': 'Учетная запись заблокирована. Попробуйте позже',
      'error.invalidRequest': 'Неверный запрос. Проверьте ввод',
      'error.accessDenied': 'Доступ запрещен. Проверьте права роли',
      'error.loginFailed': 'Не удалось войти. Попробуйте снова',
      
      // Success
      'success.login': 'Успешный вход! Перенаправление...',
      'success.logout': 'Вы успешно вышли из системы',
      'success.passwordReset': 'Ссылка для сброса пароля отправлена на вашу почту',
      'success.resuming': 'Восстановление сеанса...',
      
      // Warnings
      'warning.emailFirst': 'Пожалуйста, сначала введите действительный адрес электронной почты',
      'warning.resetSent': 'Если учетная запись существует, будет отправлена ссылка для сброса',
      
      // Footer
      'footer.tagline': 'Делаем наш город лучше вместе',
      'footer.quickLinks': 'Быстрые ссылки',
      'footer.connect': 'Связаться',
      'footer.about': 'О нас',
      'footer.privacy': 'Политика конфиденциальности',
      'footer.followUs': 'Следите за нами',
      'footer.rights': '© 2025 CityFix. Все права защищены'
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