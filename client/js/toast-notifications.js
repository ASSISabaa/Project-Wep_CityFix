/**
 * Toast Notification System for CityFix
 * Supports: English, Arabic, Hebrew, Russian
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.currentLanguage = this.detectLanguage();
        this.init();
        this.translations = {
            en: {
                'login_success': 'Login successful',
                'invalid_credentials': 'Invalid credentials',
                'fill_all_fields': 'Please enter email and password',
                'access_denied': 'Access denied',
                'session_expired': 'Session expired',
                'welcome_back': 'Welcome back',
                'logout_success': 'Logout successful',
                'permission_denied': 'Permission denied',
                'report_submitted': 'Report submitted successfully',
                'report_error': 'Error submitting report',
                'profile_updated': 'Profile updated',
                'password_changed': 'Password changed successfully',
                'email_exists': 'Email already exists',
                'network_error': 'Network error',
                'loading': 'Loading...',
                'data_saved': 'Data saved',
                'operation_completed': 'Operation completed',
                'invalid_email': 'Invalid email format',
                'password_short': 'Password too short',
                'password_mismatch': 'Passwords do not match',
                'registration_success': 'User registered successfully',
                'registration_failed': 'Registration failed',
                'fill_required': 'Please fill all required fields',
                'server_error': 'Server error',
                'unauthorized': 'Unauthorized access',
                'municipality_only': 'Municipality admin access only',
                'super_admin_only': 'Super admin access only',
                'welcome_admin': 'Welcome Administrator',
                'welcome_user': 'Welcome User',
                'redirecting': 'Redirecting...',
                'please_wait': 'Please wait...',
                'action_success': 'Action completed successfully',
                'action_failed': 'Action failed',
                'confirm_logout': 'Are you sure you want to logout?',
                'data_loading': 'Loading data...',
                'no_permission': 'You do not have permission to access this page'
            },
            ar: {
                'login_success': 'تم تسجيل الدخول بنجاح',
                'invalid_credentials': 'بيانات الدخول غير صحيحة',
                'fill_all_fields': 'الرجاء إدخال البريد الإلكتروني وكلمة المرور',
                'access_denied': 'الوصول مرفوض',
                'session_expired': 'انتهت صلاحية الجلسة',
                'welcome_back': 'مرحباً بعودتك',
                'logout_success': 'تم تسجيل الخروج بنجاح',
                'permission_denied': 'ليس لديك صلاحية',
                'report_submitted': 'تم إرسال البلاغ بنجاح',
                'report_error': 'خطأ في إرسال البلاغ',
                'profile_updated': 'تم تحديث الملف الشخصي',
                'password_changed': 'تم تغيير كلمة المرور بنجاح',
                'email_exists': 'البريد الإلكتروني مستخدم مسبقاً',
                'network_error': 'خطأ في الاتصال',
                'loading': 'جاري التحميل...',
                'data_saved': 'تم حفظ البيانات',
                'operation_completed': 'تمت العملية بنجاح',
                'invalid_email': 'صيغة البريد الإلكتروني غير صحيحة',
                'password_short': 'كلمة المرور قصيرة جداً',
                'password_mismatch': 'كلمات المرور غير متطابقة',
                'registration_success': 'تم تسجيل المستخدم بنجاح',
                'registration_failed': 'فشل التسجيل',
                'fill_required': 'الرجاء ملء جميع الحقول المطلوبة',
                'server_error': 'خطأ في الخادم',
                'unauthorized': 'وصول غير مصرح',
                'municipality_only': 'للمسؤولين فقط',
                'super_admin_only': 'للمدير العام فقط',
                'welcome_admin': 'مرحباً بالمسؤول',
                'welcome_user': 'مرحباً بالمستخدم',
                'redirecting': 'جاري التحويل...',
                'please_wait': 'الرجاء الانتظار...',
                'action_success': 'تمت العملية بنجاح',
                'action_failed': 'فشلت العملية',
                'confirm_logout': 'هل أنت متأكد من تسجيل الخروج؟',
                'data_loading': 'جاري تحميل البيانات...',
                'no_permission': 'ليس لديك صلاحية للوصول لهذه الصفحة'
            },
            he: {
                'login_success': 'התחברות הצליחה',
                'invalid_credentials': 'פרטי התחברות שגויים',
                'fill_all_fields': 'אנא הזן דוא״ל וסיסמה',
                'access_denied': 'הגישה נדחתה',
                'session_expired': 'תוקף ההפעלה פג',
                'welcome_back': 'ברוך שובך',
                'logout_success': 'התנתקת בהצלחה',
                'permission_denied': 'אין לך הרשאה',
                'report_submitted': 'הדיווח נשלח בהצלחה',
                'report_error': 'שגיאה בשליחת הדיווח',
                'profile_updated': 'הפרופיל עודכן',
                'password_changed': 'הסיסמה שונתה בהצלחה',
                'email_exists': 'כתובת הדוא״ל כבר קיימת',
                'network_error': 'שגיאת רשת',
                'loading': 'טוען...',
                'data_saved': 'הנתונים נשמרו',
                'operation_completed': 'הפעולה הושלמה',
                'invalid_email': 'פורמט דוא״ל לא תקין',
                'password_short': 'הסיסמה קצרה מדי',
                'password_mismatch': 'הסיסמאות אינן תואמות',
                'registration_success': 'המשתמש נרשם בהצלחה',
                'registration_failed': 'ההרשמה נכשלה',
                'fill_required': 'אנא מלא את כל השדות הנדרשים',
                'server_error': 'שגיאת שרת',
                'unauthorized': 'גישה לא מורשית',
                'municipality_only': 'למנהלי עירייה בלבד',
                'super_admin_only': 'למנהל ראשי בלבד',
                'welcome_admin': 'ברוך הבא מנהל',
                'welcome_user': 'ברוך הבא משתמש',
                'redirecting': 'מעביר...',
                'please_wait': 'אנא המתן...',
                'action_success': 'הפעולה הושלמה בהצלחה',
                'action_failed': 'הפעולה נכשלה',
                'confirm_logout': 'האם אתה בטוח שברצונך להתנתק?',
                'data_loading': 'טוען נתונים...',
                'no_permission': 'אין לך הרשאה לגשת לדף זה'
            },
            ru: {
                'login_success': 'Вход выполнен успешно',
                'invalid_credentials': 'Неверные учетные данные',
                'fill_all_fields': 'Пожалуйста, введите email и пароль',
                'access_denied': 'Доступ запрещен',
                'session_expired': 'Сессия истекла',
                'welcome_back': 'С возвращением',
                'logout_success': 'Выход выполнен успешно',
                'permission_denied': 'Нет разрешения',
                'report_submitted': 'Отчет отправлен успешно',
                'report_error': 'Ошибка отправки отчета',
                'profile_updated': 'Профиль обновлен',
                'password_changed': 'Пароль успешно изменен',
                'email_exists': 'Email уже существует',
                'network_error': 'Ошибка сети',
                'loading': 'Загрузка...',
                'data_saved': 'Данные сохранены',
                'operation_completed': 'Операция завершена',
                'invalid_email': 'Неверный формат email',
                'password_short': 'Пароль слишком короткий',
                'password_mismatch': 'Пароли не совпадают',
                'registration_success': 'Пользователь успешно зарегистрирован',
                'registration_failed': 'Регистрация не удалась',
                'fill_required': 'Пожалуйста, заполните все обязательные поля',
                'server_error': 'Ошибка сервера',
                'unauthorized': 'Несанкционированный доступ',
                'municipality_only': 'Только для администраторов муниципалитета',
                'super_admin_only': 'Только для главного администратора',
                'welcome_admin': 'Добро пожаловать, Администратор',
                'welcome_user': 'Добро пожаловать, Пользователь',
                'redirecting': 'Перенаправление...',
                'please_wait': 'Пожалуйста, подождите...',
                'action_success': 'Действие выполнено успешно',
                'action_failed': 'Действие не выполнено',
                'confirm_logout': 'Вы уверены, что хотите выйти?',
                'data_loading': 'Загрузка данных...',
                'no_permission': 'У вас нет разрешения на доступ к этой странице'
            }
        };
    }

    detectLanguage() {
        // Check localStorage first
        const savedLang = localStorage.getItem('cityfix_language');
        if (savedLang) return savedLang;
        
        // Check HTML lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang && ['en', 'ar', 'he', 'ru'].includes(htmlLang.toLowerCase())) {
            return htmlLang.toLowerCase();
        }
        
        // Check browser language
        const browserLang = navigator.language.substring(0, 2).toLowerCase();
        if (['en', 'ar', 'he', 'ru'].includes(browserLang)) {
            return browserLang;
        }
        
        // Default to English
        return 'en';
    }

    setLanguage(lang) {
        if (['en', 'ar', 'he', 'ru'].includes(lang)) {
            this.currentLanguage = lang;
            localStorage.setItem('cityfix_language', lang);
            document.documentElement.lang = lang;
            
            // Set text direction for RTL languages
            if (lang === 'ar' || lang === 'he') {
                document.documentElement.dir = 'rtl';
            } else {
                document.documentElement.dir = 'ltr';
            }
        }
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || this.translations['en'][key] || key;
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message key or direct message
     * @param {string} type - Type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icons for different types
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        // Translate message if it's a key
        const translatedMessage = this.translate(message) || message;

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${translatedMessage}</span>
            <button class="toast-close">&times;</button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
        });

        // Add to container
        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    loading(message = 'loading', duration = 0) {
        return this.show(message, 'info', duration);
    }

    clear() {
        this.container.innerHTML = '';
    }
}

// Initialize global toast manager
const toast = new ToastManager();

// Export for use in other modules
window.toast = toast;