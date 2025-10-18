// server/routes/translation-free.js - Free Translation API (No OpenAI needed)
const express = require('express');
const router = express.Router();
const https = require('https');

// 🌐 Free Translation using Google Translate (unofficial API)
async function translateText(text, targetLang, sourceLang = 'en') {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translatedText = parsed[0]
            .map(item => item[0])
            .join('');
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

// 🤖 POST /api/translate - Translate text (FREE!)
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    // Validation
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, targetLanguage'
      });
    }

    // If target language is same as source, return original text
    if (targetLanguage === sourceLanguage) {
      return res.json({
        success: true,
        translatedText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    console.log(`🌐 Translating from ${sourceLanguage} to ${targetLanguage}`);

    // Translate using Google Translate
    const translatedText = await translateText(text, targetLanguage, sourceLanguage);

    console.log(`✅ Translation complete`);

    res.json({
      success: true,
      translatedText,
      sourceLanguage,
      targetLanguage,
      originalText: text
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error.message
    });
  }
});

// 🤖 POST /api/translate/batch - Translate multiple texts at once
router.post('/translate/batch', async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;

    // Validation
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: texts (array), targetLanguage'
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 texts per batch'
      });
    }

    console.log(`🌐 Batch translating ${texts.length} texts to ${targetLanguage}`);

    // Translate each text
    const translations = await Promise.all(
      texts.map(text => translateText(text, targetLanguage, sourceLanguage))
    );

    console.log(`✅ Batch translation complete`);

    res.json({
      success: true,
      translations,
      count: translations.length,
      sourceLanguage,
      targetLanguage
    });

  } catch (error) {
    console.error('❌ Batch translation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Batch translation failed',
      message: error.message
    });
  }
});

module.exports = router;