// server/middleware/translationMiddleware.js
const TranslationService = require('../services/AdvancedTranslationService');

/**
 * Middleware للترجمة التلقائية للـ API responses
 * 
 * Usage:
 * router.get('/reports', autoTranslate(['title', 'description']), getReports);
 */
const autoTranslate = (fieldsToTranslate = []) => {
  return async (req, res, next) => {
    // الحصول على لغة المستخدم
    const userLanguage = 
      req.user?.profile?.language || 
      req.query.lang ||
      req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
      'en';

    // إذا كانت اللغة إنجليزية، لا داعي للترجمة
    if (userLanguage === 'en') {
      return next();
    }

    // Override res.json method
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      try {
        // ترجمة البيانات إذا كانت موجودة
        if (data && data.data && fieldsToTranslate.length > 0) {
          
          // إذا كانت البيانات array
          if (Array.isArray(data.data)) {
            data.data = await TranslationService.translateObjects(
              data.data,
              fieldsToTranslate,
              'en',
              userLanguage,
              { model: 'fast', useCache: true }
            );
          } 
          // إذا كانت البيانات object
          else if (typeof data.data === 'object') {
            data.data = await TranslationService.translateObject(
              data.data,
              fieldsToTranslate,
              'en',
              userLanguage,
              { model: 'fast', useCache: true }
            );
          }
        }

        // إضافة معلومات اللغة للـ response
        data.language = userLanguage;
        data.translated = true;

      } catch (error) {
        console.error('Auto-translation error:', error);
        // إذا فشلت الترجمة، نرسل البيانات كما هي
      }

      // إرسال الـ response
      originalJson(data);
    };

    next();
  };
};

/**
 * Middleware لإضافة معلومات اللغة للـ request
 */
const addLanguageInfo = (req, res, next) => {
  const userLanguage = 
    req.user?.profile?.language || 
    req.query.lang ||
    req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
    'en';

  req.userLanguage = userLanguage;
  req.isRTL = TranslationService.isRTL(userLanguage);
  req.languageInfo = TranslationService.supportedLanguages[userLanguage];

  next();
};

/**
 * Middleware لحفظ تفضيلات اللغة
 */
const saveLanguagePreference = async (req, res, next) => {
  try {
    const { language } = req.body;
    
    if (language && req.user) {
      const User = require('../models/User');
      
      await User.findByIdAndUpdate(req.user._id, {
        'profile.language': language
      });

      console.log(`✅ User language preference updated: ${language}`);
    }
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }

  next();
};

/**
 * Middleware للترجمة التلقائية للـ errors
 */
const translateErrors = async (err, req, res, next) => {
  const userLanguage = req.userLanguage || 'en';

  if (err.message && userLanguage !== 'en') {
    try {
      err.message = await TranslationService.translate(
        err.message,
        'en',
        userLanguage,
        { model: 'fast', useCache: true }
      );
    } catch (translationError) {
      console.error('Error translation failed:', translationError);
    }
  }

  next(err);
};

module.exports = {
  autoTranslate,
  addLanguageInfo,
  saveLanguagePreference,
  translateErrors
};