// server/services/AdvancedTranslationService.js
const OpenAI = require('openai');
const Translation = require('../models/Translation');
const TranslationCacheService = require('./TranslationCacheService');

class AdvancedTranslationService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
    
    this.cacheService = new TranslationCacheService();
    
    this.supportedLanguages = {
      en: { name: 'English', nativeName: 'English', rtl: false, code: 'en-US' },
      ar: { name: 'Arabic', nativeName: 'العربية', rtl: true, code: 'ar-SA' },
      he: { name: 'Hebrew', nativeName: 'עברית', rtl: true, code: 'he-IL' },
      ru: { name: 'Russian', nativeName: 'Русский', rtl: false, code: 'ru-RU' }
    };

    this.excludedFields = [
      '_id', 'id', 'createdAt', 'updatedAt', '__v',
      'password', 'token', 'email', 'phone',
      'lat', 'lng', 'coordinates', 'reportNumber',
      'status', 'priority', 'type', 'role', 'tenant'
    ];

    this.translatableTypes = ['string'];
  }

  async translate(text, fromLang, toLang, options = {}) {
    if (!text || typeof text !== 'string') return text;
    if (fromLang === toLang) return text;
    if (text.length < 2) return text;

    const cached = await this.cacheService.get(text, fromLang, toLang);
    if (cached) return cached;

    try {
      const dbTranslation = await Translation.findTranslation(text, fromLang, toLang);
      if (dbTranslation) {
        await this.cacheService.set(text, fromLang, toLang, dbTranslation.translatedText);
        return dbTranslation.translatedText;
      }

      const response = await this.openai.chat.completions.create({
        model: options.model === 'premium' ? 'gpt-4' : 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Translate this text from ${fromLang} to ${toLang}. Return only the translation:\n\n${text}`
        }],
        temperature: 0.3,
        max_tokens: Math.ceil(text.length * 1.5)
      });

      const translatedText = response.choices[0].message.content.trim();

      await Translation.create({
        originalText: text,
        translatedText,
        sourceLang: fromLang,
        targetLang: toLang,
        model: options.model || 'fast',
        metadata: {
          characterCount: text.length,
          wordCount: text.split(/\s+/).length,
          translationTime: Date.now()
        }
      });

      await this.cacheService.set(text, fromLang, toLang, translatedText);

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text;
    }
  }

  async translateObject(obj, fromLang, toLang, options = {}) {
    if (!obj || typeof obj !== 'object') return obj;
    if (fromLang === toLang) return obj;

    const translated = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.excludedFields.includes(key)) {
        translated[key] = value;
        continue;
      }

      if (typeof value === 'string' && value.length > 2) {
        translated[key] = await this.translate(value, fromLang, toLang, options);
      } else if (typeof value === 'object' && value !== null) {
        translated[key] = await this.translateObject(value, fromLang, toLang, options);
      } else {
        translated[key] = value;
      }
    }

    return translated;
  }

  async translateObjects(array, fromLang, toLang, options = {}) {
    if (!Array.isArray(array)) return array;
    if (fromLang === toLang) return array;

    const translated = [];
    for (const item of array) {
      translated.push(await this.translateObject(item, fromLang, toLang, options));
    }

    return translated;
  }

  async detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Detect language code (en, ar, he, or ru) only:\n\n${text.substring(0, 200)}`
        }],
        temperature: 0,
        max_tokens: 10
      });

      const detected = response.choices[0].message.content.trim().toLowerCase();
      return this.supportedLanguages[detected] ? detected : 'en';
    } catch (error) {
      return 'en';
    }
  }

  isRTL(language) {
    return this.supportedLanguages[language]?.rtl || false;
  }

  getLanguageInfo(code) {
    return this.supportedLanguages[code] || this.supportedLanguages.en;
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, info]) => ({
      code,
      ...info
    }));
  }

  shouldTranslateField(key, value) {
    if (this.excludedFields.includes(key)) return false;
    if (typeof value !== 'string') return false;
    if (value.length < 2) return false;
    if (/^[\d\s\-+()]+$/.test(value)) return false;
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) return false;
    
    return true;
  }

  async autoTranslateResponse(data, userLanguage, sourceLanguage = 'en') {
    if (userLanguage === sourceLanguage) return data;

    if (data.data) {
      if (Array.isArray(data.data)) {
        data.data = await this.translateObjects(data.data, sourceLanguage, userLanguage);
      } else if (typeof data.data === 'object') {
        data.data = await this.translateObject(data.data, sourceLanguage, userLanguage);
      }
    }

    if (data.message && typeof data.message === 'string') {
      data.message = await this.translate(data.message, sourceLanguage, userLanguage);
    }

    return data;
  }
}

module.exports = new AdvancedTranslationService();