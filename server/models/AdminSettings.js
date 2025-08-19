const mongoose = require('mongoose');

const AdminSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    general: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      role: { type: String, enum: ['admin','manager','operator'], default: 'admin' }
    },
    security: {
      twoFactor: { type: Boolean, default: false },
      rememberLogin: { type: Boolean, default: false },
      sessionTimeout: { type: Number, default: 30 },
      passwordHash: { type: String, select: false }
    },
    preferences: {
      autoSave: { type: Boolean, default: true },
      soundAlerts: { type: Boolean, default: false }
    },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false },
      browserNotifications: { type: Boolean, default: true },
      urgentOnly: { type: Boolean, default: false },
      notificationSound: { type: String, enum: ['default','chime','bell','silent'], default: 'default' }
    },
    cards: {
      profileSections: { type: Number, default: 4 },
      securityLevel: { type: String, default: 'Medium' },          // derive to “High” when twoFactor
      systemUptimePct: { type: Number, default: 98 },
      lastBackup: { type: String, default: '2h' },
      autoBackupEnabled: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
