// server/routes/translationRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const translationController = require('../controllers/translationController');

// Public routes (لا تحتاج authentication)
router.get('/languages', translationController.getSupportedLanguages);

// Protected routes (تحتاج authentication)
router.use(authenticate);

// ترجمة نص واحد
router.post('/translate', translationController.translateText);

// ترجمة مجموعة نصوص
router.post('/batch', translationController.translateBatch);

// كشف اللغة
router.post('/detect', translationController.detectLanguage);

// ترجمة كائن
router.post('/object', translationController.translateObject);

// البحث في الترجمات
router.get('/search', translationController.searchTranslations);

// احصائيات
router.get('/stats', translationController.getTranslationStats);
router.get('/cache/stats', translationController.getCacheStats);

// Admin routes (للمسؤولين فقط)
router.delete('/cache', translationController.clearCache);
router.delete('/cleanup', translationController.cleanupOldTranslations);

module.exports = router;