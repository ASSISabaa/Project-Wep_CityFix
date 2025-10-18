// server/services/GoogleTranslateService.js
const Translation = require('../models/Translation');

class GoogleTranslateService {
  constructor() {
    this.supportedLanguages = {
      en: { name: 'English', nativeName: 'English', rtl: false },
      ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
      he: { name: 'Hebrew', nativeName: 'עברית', rtl: true },
      ru: { name: 'Russian', nativeName: 'Русский', rtl: false }
    };

    this.excludedFields = [
      '_id', 'id', 'createdAt', 'updatedAt', '__v',
      'password', 'token', 'email', 'phone',
      'lat', 'lng', 'coordinates', 'reportNumber',
      'status', 'priority', 'type', 'role', 'tenant'
    ];

    this.cache = new Map();
  }

  async translate(text, fromLang, toLang) {
    if (!text || typeof text !== 'string') return text;
    if (fromLang === toLang) return text;
    if (text.length < 2) return text;

    const cacheKey = `${text}:${fromLang}:${toLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const dbTranslation = await Translation.findTranslation(text, fromLang, toLang);
      if (dbTranslation) {
        this.cache.set(cacheKey, dbTranslation.translatedText);
        return dbTranslation.translatedText;
      }

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const translatedText = data[0].map(item => item[0]).join('');

      await Translation.create({
        originalText: text,
        translatedText,
        sourceLang: fromLang,
        targetLang: toLang,
        model: 'google',
        metadata: {
          characterCount: text.length,
          wordCount: text.split(/\s+/).length,
          translationTime: Date.now()
        }
      }).catch(() => {});

      this.cache.set(cacheKey, translatedText);

      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text;
    }
  }

  async translateObject(obj, fromLang, toLang) {
    if (!obj || typeof obj !== 'object') return obj;
    if (fromLang === toLang) return obj;

    const translated = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.excludedFields.includes(key)) {
        translated[key] = value;
        continue;
      }

      if (typeof value === 'string' && value.length > 2 && this.shouldTranslateField(key, value)) {
        translated[key] = await this.translate(value, fromLang, toLang);
      } else if (typeof value === 'object' && value !== null) {
        translated[key] = await this.translateObject(value, fromLang, toLang);
      } else {
        translated[key] = value;
      }
    }

    return translated;
  }

  async translateObjects(array, fromLang, toLang) {
    if (!Array.isArray(array)) return array;
    if (fromLang === toLang) return array;

    const translated = [];
    for (const item of array) {
      translated.push(await this.translateObject(item, fromLang, toLang));
    }

    return translated;
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
}

module.exports = new GoogleTranslateService();