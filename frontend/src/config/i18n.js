import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        reports: 'Reports',
        submit: 'Submit Report',
        myImpact: 'My Impact',
        analytics: 'Analytics',
        team: 'Team',
        settings: 'Settings',
        contact: 'Contact',
        logout: 'Logout',
        login: 'Login',
        signup: 'Sign Up'
      },
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        upload: 'Upload',
        submit: 'Submit',
        close: 'Close',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No'
      },
      home: {
        title: 'Smart City Management',
        subtitle: 'Report, Track, and Resolve City Issues with AI',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
        features: {
          ai: 'AI-Powered Analysis',
          aiDesc: 'Automatic image recognition and problem classification',
          realtime: 'Real-time Tracking',
          realtimeDesc: 'Track your reports status in real-time',
          analytics: 'Advanced Analytics',
          analyticsDesc: 'Data-driven insights for better city management',
          multilingual: 'Multi-language Support',
          multilingualDesc: 'Available in Arabic, Hebrew, and English'
        }
      },
      report: {
        title: 'Submit Report',
        description: 'Report a city issue',
        type: 'Issue Type',
        category: 'Category',
        priority: 'Priority',
        location: 'Location',
        images: 'Images',
        details: 'Details',
        submit: 'Submit Report',
        status: {
          new: 'New',
          pending: 'Pending',
          inProgress: 'In Progress',
          resolved: 'Resolved',
          closed: 'Closed',
          rejected: 'Rejected'
        },
        types: {
          pothole: 'Pothole',
          streetlight: 'Street Light',
          garbage: 'Garbage',
          graffiti: 'Graffiti',
          traffic: 'Traffic',
          parks: 'Parks',
          other: 'Other'
        }
      },
      chatbot: {
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        welcome: 'Hello! I am your CityFix AI Assistant. How can I help you today?',
        typing: 'AI is typing...'
      },
      myImpact: {
        title: 'My Impact',
        reportsSubmitted: 'Reports Submitted',
        reportsResolved: 'Reports Resolved',
        impactScore: 'Impact Score',
        badges: 'Badges',
        achievements: 'Achievements',
        leaderboard: 'Leaderboard'
      },
      analytics: {
        title: 'Analytics',
        overview: 'Overview',
        trends: 'Trends',
        performance: 'Performance',
        reports: 'Reports',
        response: 'Response Time',
        resolution: 'Resolution Rate'
      }
    }
  },
  ar: {
    translation: {
      nav: {
        home: 'الرئيسية',
        dashboard: 'لوحة التحكم',
        reports: 'البلاغات',
        submit: 'تقديم بلاغ',
        myImpact: 'تأثيري',
        analytics: 'التحليلات',
        team: 'الفريق',
        settings: 'الإعدادات',
        contact: 'اتصل بنا',
        logout: 'تسجيل خروج',
        login: 'تسجيل دخول',
        signup: 'إنشاء حساب'
      },
      common: {
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجاح',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        search: 'بحث',
        filter: 'تصفية',
        export: 'تصدير',
        upload: 'رفع',
        submit: 'إرسال',
        close: 'إغلاق',
        confirm: 'تأكيد',
        yes: 'نعم',
        no: 'لا'
      },
      home: {
        title: 'إدارة المدينة الذكية',
        subtitle: 'أبلغ، تتبع، وحل مشاكل المدينة بالذكاء الاصطناعي',
        getStarted: 'ابدأ الآن',
        learnMore: 'اعرف المزيد',
        features: {
          ai: 'تحليل بالذكاء الاصطناعي',
          aiDesc: 'التعرف التلقائي على الصور وتصنيف المشاكل',
          realtime: 'تتبع فوري',
          realtimeDesc: 'تتبع حالة بلاغاتك في الوقت الفعلي',
          analytics: 'تحليلات متقدمة',
          analyticsDesc: 'رؤى قائمة على البيانات لإدارة أفضل للمدينة',
          multilingual: 'دعم متعدد اللغات',
          multilingualDesc: 'متوفر بالعربية والعبرية والإنجليزية'
        }
      },
      report: {
        title: 'تقديم بلاغ',
        description: 'أبلغ عن مشكلة في المدينة',
        type: 'نوع المشكلة',
        category: 'الفئة',
        priority: 'الأولوية',
        location: 'الموقع',
        images: 'الصور',
        details: 'التفاصيل',
        submit: 'إرسال البلاغ',
        status: {
          new: 'جديد',
          pending: 'قيد الانتظار',
          inProgress: 'قيد المعالجة',
          resolved: 'تم الحل',
          closed: 'مغلق',
          rejected: 'مرفوض'
        },
        types: {
          pothole: 'حفرة في الشارع',
          streetlight: 'إضاءة الشارع',
          garbage: 'قمامة',
          graffiti: 'كتابات جدارية',
          traffic: 'مرور',
          parks: 'حدائق',
          other: 'أخرى'
        }
      },
      chatbot: {
        title: 'المساعد الذكي',
        placeholder: 'اسألني أي شيء...',
        welcome: 'مرحباً! أنا مساعدك الذكي في CityFix. كيف يمكنني مساعدتك اليوم؟',
        typing: 'الذكاء الاصطناعي يكتب...'
      },
      myImpact: {
        title: 'تأثيري',
        reportsSubmitted: 'البلاغات المقدمة',
        reportsResolved: 'البلاغات المحلولة',
        impactScore: 'درجة التأثير',
        badges: 'الشارات',
        achievements: 'الإنجازات',
        leaderboard: 'لوحة المتصدرين'
      },
      analytics: {
        title: 'التحليلات',
        overview: 'نظرة عامة',
        trends: 'الاتجاهات',
        performance: 'الأداء',
        reports: 'البلاغات',
        response: 'وقت الاستجابة',
        resolution: 'معدل الحل'
      }
    }
  },
  he: {
    translation: {
      nav: {
        home: 'בית',
        dashboard: 'לוח בקרה',
        reports: 'דוחות',
        submit: 'שלח דוח',
        myImpact: 'ההשפעה שלי',
        analytics: 'אנליטיקה',
        team: 'צוות',
        settings: 'הגדרות',
        contact: 'צור קשר',
        logout: 'התנתק',
        login: 'התחבר',
        signup: 'הרשם'
      },
      common: {
        loading: 'טוען...',
        error: 'שגיאה',
        success: 'הצלחה',
        save: 'שמור',
        cancel: 'בטל',
        delete: 'מחק',
        edit: 'ערוך',
        view: 'צפה',
        search: 'חפש',
        filter: 'סנן',
        export: 'ייצא',
        upload: 'העלה',
        submit: 'שלח',
        close: 'סגור',
        confirm: 'אשר',
        yes: 'כן',
        no: 'לא'
      },
      home: {
        title: 'ניהול עיר חכמה',
        subtitle: 'דווח, עקוב ופתור בעיות עיר עם AI',
        getStarted: 'התחל',
        learnMore: 'למד עוד',
        features: {
          ai: 'ניתוח מבוסס AI',
          aiDesc: 'זיהוי תמונות אוטומטי וסיווג בעיות',
          realtime: 'מעקב בזמן אמת',
          realtimeDesc: 'עקוב אחר סטטוס הדוחות שלך בזמן אמת',
          analytics: 'אנליטיקה מתקדמת',
          analyticsDesc: 'תובנות מבוססות נתונים לניהול עיר טוב יותר',
          multilingual: 'תמיכה בריבוי שפות',
          multilingualDesc: 'זמין בערבית, עברית ואנגלית'
        }
      },
      report: {
        title: 'שלח דוח',
        description: 'דווח על בעיה בעיר',
        type: 'סוג בעיה',
        category: 'קטגוריה',
        priority: 'עדיפות',
        location: 'מיקום',
        images: 'תמונות',
        details: 'פרטים',
        submit: 'שלח דוח',
        status: {
          new: 'חדש',
          pending: 'ממתין',
          inProgress: 'בטיפול',
          resolved: 'נפתר',
          closed: 'סגור',
          rejected: 'נדחה'
        },
        types: {
          pothole: 'בור ברחוב',
          streetlight: 'פנס רחוב',
          garbage: 'אשפה',
          graffiti: 'גרפיטי',
          traffic: 'תנועה',
          parks: 'גנים',
          other: 'אחר'
        }
      },
      chatbot: {
        title: 'עוזר AI',
        placeholder: 'שאל אותי כל דבר...',
        welcome: 'שלום! אני העוזר החכם שלך ב-CityFix. איך אוכל לעזור לך היום?',
        typing: 'AI כותב...'
      },
      myImpact: {
        title: 'ההשפעה שלי',
        reportsSubmitted: 'דוחות שנשלחו',
        reportsResolved: 'דוחות שנפתרו',
        impactScore: 'ציון השפעה',
        badges: 'תגים',
        achievements: 'הישגים',
        leaderboard: 'לוח מובילים'
      },
      analytics: {
        title: 'אנליטיקה',
        overview: 'סקירה כללית',
        trends: 'מגמות',
        performance: 'ביצועים',
        reports: 'דוחות',
        response: 'זמן תגובה',
        resolution: 'שיעור פתרון'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'he'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
