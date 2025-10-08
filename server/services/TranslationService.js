// server/services/TranslationService.js
const OpenAI = require('openai');

class TranslationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Cache للترجمات المكررة
    this.translationCache = new Map();
    
    // اللغات المدعومة
    this.supportedLanguages = {
      en: { name: 'English', rtl: false, code: 'en-US' },
      ar: { name: 'العربية', rtl: true, code: 'ar-SA' },
      he: { name: 'עברית', rtl: true, code: 'he-IL' },
      ru: { name: 'Русский', rtl: false, code: 'ru-RU' }
    };
  }

  // ترجمة نص واحد
  async translate(text, fromLang, toLang) {
    if (fromLang === toLang) return text;

    const cacheKey = `${text}:${fromLang}:${toLang}`;
    
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Translate this text from ${fromLang} to ${toLang}. Return only the translation, no explanations:\n\n${text}`
        }],
        temperature: 0.3,
        max_tokens: 500
      });

      const translation = response.choices[0].message.content.trim();
      
      // حفظ في الـ cache
      this.translationCache.set(cacheKey, translation);
      
      // تنظيف الـ cache إذا كبر كثير (احتفظ بآخر 1000)
      if (this.translationCache.size > 1000) {
        const firstKey = this.translationCache.keys().next().value;
        this.translationCache.delete(firstKey);
      }

      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original if translation fails
    }
  }

  // ترجمة كائن كامل (مثل بلاغ أو إشعار)
  async translateObject(obj, fieldsToTranslate, fromLang, toLang) {
    if (fromLang === toLang) return obj;

    const translated = { ...obj };

    for (const field of fieldsToTranslate) {
      if (this.getNestedValue(obj, field)) {
        const originalText = this.getNestedValue(obj, field);
        const translatedText = await this.translate(originalText, fromLang, toLang);
        this.setNestedValue(translated, field, translatedText);
      }
    }

    return translated;
  }

  // ترجمة مجموعة من الكائنات (batch translation)
  async translateBatch(items, fieldsToTranslate, fromLang, toLang) {
    if (fromLang === toLang) return items;

    const translated = [];

    for (const item of items) {
      translated.push(
        await this.translateObject(item, fieldsToTranslate, fromLang, toLang)
      );
    }

    return translated;
  }

  // كشف اللغة تلقائياً
  async detectLanguage(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Detect the language of this text and respond with only the language code (en, ar, he, or ru):\n\n${text}`
        }],
        temperature: 0,
        max_tokens: 10
      });

      const detectedLang = response.choices[0].message.content.trim().toLowerCase();
      
      if (this.supportedLanguages[detectedLang]) {
        return detectedLang;
      }

      return 'en'; // Default fallback
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((current, prop) => {
      if (!current[prop]) current[prop] = {};
      return current[prop];
    }, obj);
    target[last] = value;
  }

  isRTL(language) {
    return this.supportedLanguages[language]?.rtl || false;
  }

  getLanguageInfo(code) {
    return this.supportedLanguages[code] || this.supportedLanguages.en;
  }

  getAllLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, info]) => ({
      code,
      ...info
    }));
  }
}

// Middleware لترجمة الـ responses تلقائياً
const autoTranslateMiddleware = (fieldsToTranslate = []) => {
  return async (req, res, next) => {
    const userLanguage = req.user?.profile?.language || 
                        req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                        'en';

    // Override json method
    const originalJson = res.json;
    res.json = async function(data) {
      if (data.data && fieldsToTranslate.length > 0) {
        const translationService = new TranslationService();
        
        if (Array.isArray(data.data)) {
          data.data = await translationService.translateBatch(
            data.data,
            fieldsToTranslate,
            'en', // Assuming stored in English
            userLanguage
          );
        } else {
          data.data = await translationService.translateObject(
            data.data,
            fieldsToTranslate,
            'en',
            userLanguage
          );
        }
      }

      originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  TranslationService,
  autoTranslateMiddleware
};


// ============================================
// ملفات الترجمة الكاملة
// ============================================

// server/locales/en.complete.json
const enTranslations = {
  "app": {
    "name": "CityFix",
    "tagline": "Making Cities Better Together"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "signup": "Sign Up",
    "email": "Email Address",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "rememberMe": "Remember Me",
    "loginSuccess": "Logged in successfully",
    "logoutSuccess": "Logged out successfully",
    "invalidCredentials": "Invalid email or password",
    "accountDeactivated": "Your account has been deactivated"
  },
  "roles": {
    "SUPER_SUPER_ADMIN": "System Administrator",
    "MUNICIPALITY_ADMIN": "Municipality Administrator",
    "DEPARTMENT_MANAGER": "Department Manager",
    "SUPERVISOR": "Supervisor",
    "EMPLOYEE": "Employee",
    "CITIZEN": "Citizen"
  },
  "reports": {
    "new": "New Report",
    "title": "Report Title",
    "description": "Description",
    "type": "Issue Type",
    "status": "Status",
    "priority": "Priority",
    "location": "Location",
    "submit": "Submit Report",
    "update": "Update Report",
    "delete": "Delete Report",
    "view": "View Report",
    "assignTo": "Assign To",
    "reportNumber": "Report Number",
    "createdAt": "Created At",
    "updatedAt": "Updated At",
    "resolvedAt": "Resolved At",
    "uploadImages": "Upload Images",
    "addComment": "Add Comment"
  },
  "reportTypes": {
    "pothole": "Pothole",
    "streetlight": "Street Light",
    "drainage": "Drainage Issue",
    "garbage": "Garbage Collection",
    "trafficSignal": "Traffic Signal",
    "sidewalk": "Sidewalk Damage",
    "graffiti": "Graffiti",
    "noise": "Noise Complaint",
    "abandonedVehicle": "Abandoned Vehicle",
    "waterLeak": "Water Leak",
    "parkMaintenance": "Park Maintenance",
    "other": "Other"
  },
  "status": {
    "new": "New",
    "assigned": "Assigned",
    "inProgress": "In Progress",
    "pending": "Pending",
    "resolved": "Resolved",
    "closed": "Closed",
    "rejected": "Rejected"
  },
  "priority": {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "urgent": "Urgent"
  },
  "dashboard": {
    "welcome": "Welcome",
    "overview": "Overview",
    "statistics": "Statistics",
    "recentActivity": "Recent Activity",
    "totalReports": "Total Reports",
    "resolvedReports": "Resolved Reports",
    "pendingReports": "Pending Reports",
    "inProgressReports": "In Progress"
  },
  "chatbot": {
    "title": "CityFix Assistant",
    "placeholder": "Ask me anything...",
    "send": "Send",
    "thinking": "Thinking...",
    "errorMessage": "Sorry, I'm having trouble responding. Please try again.",
    "startConversation": "Start a conversation"
  },
  "errors": {
    "unauthorized": "Unauthorized access",
    "forbidden": "Access denied",
    "notFound": "Resource not found",
    "serverError": "Server error occurred",
    "networkError": "Network connection error",
    "validationError": "Validation error",
    "insufficient_permissions": "You don't have permission to perform this action"
  },
  "success": {
    "reportCreated": "Report created successfully",
    "reportUpdated": "Report updated successfully",
    "reportDeleted": "Report deleted successfully",
    "profileUpdated": "Profile updated successfully",
    "settingsSaved": "Settings saved successfully"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "loading": "Loading...",
    "noData": "No data available",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close"
  }
};

// تصدير الترجمات
module.exports = {
  enTranslations,
  // يمكن إضافة ملفات ar, he, ru بنفس الهيكل
};