// server/routes/translation.js - Fixed Translation API
const express = require('express');
const router = express.Router();
const https = require('https');

// Enable CORS for all routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Translation function
async function translateText(text, targetLang, sourceLang = 'en') {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translatedText = parsed[0].map(item => item[0]).join('');
          resolve(translatedText);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// POST /api/translate
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    console.log('🌐 Translation request:', { text: text?.substring(0, 50), targetLanguage });

    if (!text || !targetLanguage) {
      console.log('❌ Missing parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, targetLanguage'
      });
    }

    if (targetLanguage === sourceLanguage) {
      console.log('✅ Same language, returning original');
      return res.json({
        success: true,
        translatedText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    const translatedText = await translateText(text, targetLanguage, sourceLanguage);
    console.log('✅ Translation successful:', translatedText?.substring(0, 50));

    res.json({
      success: true,
      translatedText,
      sourceLanguage,
      targetLanguage,
      originalText: text
    });

  } catch (error) {
    console.error('❌ Translation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error.message
    });
  }
});

module.exports = router;