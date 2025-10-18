// server/routes/translation.js - AI Translation API
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Language names mapping
const languageNames = {
  'en': 'English',
  'ar': 'Arabic',
  'he': 'Hebrew',
  'ru': 'Russian'
};

// 🤖 POST /api/translate - Translate text using AI
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

    console.log(`🌐 Translating "${text.substring(0, 50)}..." from ${sourceLanguage} to ${targetLanguage}`);

    // Call OpenAI for translation
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given text from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}. 
          
Rules:
- Provide ONLY the translated text, no explanations
- Maintain the same tone and style
- Keep proper nouns unchanged unless they have standard translations
- Preserve formatting characters like newlines
- For technical terms, use commonly accepted translations
- Return ONLY the translation, nothing else`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const translatedText = completion.choices[0].message.content.trim();

    console.log(`✅ Translation complete: "${translatedText.substring(0, 50)}..."`);

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

    // Join texts with delimiter
    const combinedText = texts.join('\n###SEPARATOR###\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate ALL the texts separated by "###SEPARATOR###" from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

Rules:
- Translate each segment separately
- Keep the ###SEPARATOR### markers in the EXACT same positions
- Provide ONLY the translations, no explanations
- Maintain the same tone and style for each segment
- Preserve line breaks within segments`
        },
        {
          role: "user",
          content: combinedText
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const translatedCombined = completion.choices[0].message.content.trim();
    const translatedTexts = translatedCombined.split('###SEPARATOR###').map(t => t.trim());

    console.log(`✅ Batch translation complete`);

    res.json({
      success: true,
      translations: translatedTexts,
      count: translatedTexts.length,
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