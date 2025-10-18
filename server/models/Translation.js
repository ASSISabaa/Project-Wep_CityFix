// server/models/Translation.js
const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  originalText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  translatedText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  sourceLang: {
    type: String,
    required: true,
    enum: ['en', 'ar', 'he', 'ru']
  },
  targetLang: {
    type: String,
    required: true,
    enum: ['en', 'ar', 'he', 'ru']
  },
  model: {
    type: String,
    enum: ['fast', 'quality', 'premium'],
    default: 'fast'
  },
  usageCount: {
    type: Number,
    default: 1
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  metadata: {
    characterCount: Number,
    wordCount: Number,
    translationTime: Number
  }
}, {
  timestamps: true
});

translationSchema.index({ 
  originalText: 1, 
  sourceLang: 1, 
  targetLang: 1 
}, { unique: true });

translationSchema.index({ lastUsed: -1 });
translationSchema.index({ usageCount: -1 });

translationSchema.statics.findTranslation = async function(text, fromLang, toLang) {
  return this.findOneAndUpdate(
    {
      originalText: text,
      sourceLang: fromLang,
      targetLang: toLang
    },
    {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    },
    { new: true }
  );
};

translationSchema.statics.cleanupOld = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    lastUsed: { $lt: cutoffDate },
    usageCount: { $lte: 1 }
  });

  console.log(`🗑️ Cleaned ${result.deletedCount} translations`);
  return result.deletedCount;
};

module.exports = mongoose.model('Translation', translationSchema);