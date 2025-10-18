// server/controllers/translationController.js
const TranslationService = require('../services/AdvancedTranslationService');
const Translation = require('../models/Translation');

/**
 * ترجمة نص واحد
 * POST /api/translations/translate
 */
exports.translateText = async (req, res, next) => {
  try {
    const { text, fromLang, toLang, options = {} } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (!fromLang || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'Source and target languages are required'
      });
    }

    const startTime = Date.now();
    const translatedText = await TranslationService.translate(
      text,
      fromLang,
      toLang,
      options
    );
    const translationTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLang: fromLang,
        targetLang: toLang,
        translationTime: `${translationTime}ms`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ترجمة مجموعة نصوص
 * POST /api/translations/batch
 */
exports.translateBatch = async (req, res, next) => {
  try {
    const { texts, fromLang, toLang, options = {} } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 texts per batch'
      });
    }

    const startTime = Date.now();
    const translations = await TranslationService.translateBatch(
      texts,
      fromLang,
      toLang,
      options
    );
    const translationTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        translations,
        count: translations.length,
        translationTime: `${translationTime}ms`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * كشف اللغة تلقائياً
 * POST /api/translations/detect
 */
exports.detectLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const detectedLang = await TranslationService.detectLanguage(text);
    const langInfo = TranslationService.supportedLanguages[detectedLang];

    res.json({
      success: true,
      data: {
        language: detectedLang,
        ...langInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على اللغات المدعومة
 * GET /api/translations/languages
 */
exports.getSupportedLanguages = async (req, res, next) => {
  try {
    const languages = TranslationService.getSupportedLanguages();

    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * إحصائيات الترجمة
 * GET /api/translations/stats
 */
exports.getTranslationStats = async (req, res, next) => {
  try {
    const [
      totalTranslations,
      languagePairStats,
      mostUsed,
      recentTranslations
    ] = await Promise.all([
      Translation.countDocuments(),
      Translation.getLanguagePairStats(),
      Translation.getMostUsed(10),
      Translation.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('originalText sourceLang targetLang createdAt')
    ]);

    res.json({
      success: true,
      data: {
        total: totalTranslations,
        languagePairs: languagePairStats,
        mostUsed,
        recent: recentTranslations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * احصائيات الكاش
 * GET /api/translations/cache/stats
 */
exports.getCacheStats = async (req, res, next) => {
  try {
    const TranslationCacheService = require('../services/TranslationCacheService');
    const cacheService = new TranslationCacheService();
    
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * مسح الكاش
 * DELETE /api/translations/cache
 */
exports.clearCache = async (req, res, next) => {
  try {
    const TranslationCacheService = require('../services/TranslationCacheService');
    const cacheService = new TranslationCacheService();
    
    await cacheService.clearAll();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * تنظيف الترجمات القديمة
 * DELETE /api/translations/cleanup
 */
exports.cleanupOldTranslations = async (req, res, next) => {
  try {
    const { daysOld = 90 } = req.query;
    
    const deletedCount = await Translation.cleanupOldTranslations(parseInt(daysOld));

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old translations`,
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ترجمة كائن كامل
 * POST /api/translations/object
 */
exports.translateObject = async (req, res, next) => {
  try {
    const { object, fields, fromLang, toLang, options = {} } = req.body;

    if (!object || !fields || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Object and fields array are required'
      });
    }

    const translatedObject = await TranslationService.translateObject(
      object,
      fields,
      fromLang,
      toLang,
      options
    );

    res.json({
      success: true,
      data: translatedObject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * البحث في الترجمات
 * GET /api/translations/search
 */
exports.searchTranslations = async (req, res, next) => {
  try {
    const { q, sourceLang, targetLang, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $or: [
        { originalText: { $regex: q, $options: 'i' } },
        { translatedText: { $regex: q, $options: 'i' } }
      ]
    };

    if (sourceLang) query.sourceLang = sourceLang;
    if (targetLang) query.targetLang = targetLang;

    const results = await Translation.find(query)
      .sort({ usageCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
};