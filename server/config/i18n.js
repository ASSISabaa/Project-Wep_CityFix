const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: path.join(__dirname, '../locales/{{lng}}.json')
        },
        fallbackLng: 'en',
        preload: ['en', 'ar', 'he', 'ru'],
        saveMissing: true,
        detection: {
            order: ['header', 'querystring', 'cookie'],
            caches: ['cookie']
        }
    });

module.exports = i18nextMiddleware.handle(i18next);