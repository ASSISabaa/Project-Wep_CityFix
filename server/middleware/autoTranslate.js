// server/middleware/autoTranslate.js
const TranslationService = require('../services/GoogleTranslateService');

const autoTranslate = (options = {}) => {
  const {
    enabled = true,
    defaultLanguage = 'en',
    sourceLanguage = 'en'
  } = options;

  return async (req, res, next) => {
    if (!enabled) return next();

    const userLanguage = 
      req.user?.profile?.language || 
      req.query.lang ||
      req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
      defaultLanguage;

    req.userLanguage = userLanguage;
    req.isRTL = TranslationService.isRTL(userLanguage);

    if (userLanguage === sourceLanguage) {
      return next();
    }

    const originalJson = res.json.bind(res);
    
   res.json = async function(data) {
  console.log('🔍 Before translation:', JSON.stringify(data, null, 2));
  console.log('🌍 User language:', userLanguage);
  
  try {
    const translated = await TranslationService.autoTranslateResponse(
      data, 
      userLanguage, 
      sourceLanguage
    );

    console.log('✅ After translation:', JSON.stringify(translated, null, 2));

    translated._meta = {
      language: userLanguage,
      rtl: req.isRTL,
      translated: true,
      source: sourceLanguage
    };

    originalJson(translated);
  } catch (error) {
    console.error('❌ Translation failed:', error);
    originalJson(data);
  }
};

    next();
  };
};

const addLanguageInfo = (req, res, next) => {
  const userLanguage = 
    req.user?.profile?.language || 
    req.query.lang ||
    req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
    'en';

  req.userLanguage = userLanguage;
  req.isRTL = TranslationService.isRTL(userLanguage);
  req.languageInfo = TranslationService.getLanguageInfo(userLanguage);

  next();
};

const detectLanguage = async (req, res, next) => {
  if (req.body && req.body.text && !req.body.language) {
    try {
      req.body.detectedLanguage = await TranslationService.detectLanguage(req.body.text);
    } catch (error) {
      console.error('Language detection failed:', error.message);
    }
  }
  next();
};

module.exports = {
  autoTranslate,
  addLanguageInfo,
  detectLanguage
};