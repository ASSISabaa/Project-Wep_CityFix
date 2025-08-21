// server/routes/settings.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/User');
const SystemMeta = require('../models/SystemMeta');

router.use(auth);

const toRoleTitle = (role) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'moderator') return 'Moderator';
  return 'User';
};

const securityLevel = (twoFactor) => (twoFactor ? 'High' : 'Medium');

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const meta = await SystemMeta.getOrCreate('default');

    const prefs = user.preferences || {};
    const sec = user.security || {};
    const notif = user.notifications || {};

    const lastBackupHours =
      meta.lastBackupAt ? Math.max(0, Math.round((Date.now() - meta.lastBackupAt.getTime()) / 36e5)) : null;

    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activityCount30d = (meta.activity || []).filter(a => a.at >= last30d).length;

    res.json({
      success: true,
      data: {
        profile: {
          fullName: user.fullName || user.username || 'Admin',
          email: user.email,
          role: user.role || 'admin'
        },
        preferences: {
          sessionTimeout: Number(prefs.sessionTimeout ?? 30),
          autoSave: !!prefs.autoSave,
          soundAlerts: !!prefs.soundAlerts
        },
        security: {
          twoFactor: !!sec.twoFactor,
          rememberLogin: !!sec.rememberLogin
        },
        notifications: {
          emailAlerts: !!notif.emailAlerts,
          dailyDigest: !!notif.dailyDigest,
          weeklyReport: !!notif.weeklyReport,
          browserNotifications: !!notif.browserNotifications,
          urgentOnly: !!notif.urgentOnly,
          notificationSound: notif.notificationSound || 'default'
        },
        summary: {
          sectionsConfigured: meta.sectionsConfigured ?? 4,
          securityLevel: securityLevel(!!sec.twoFactor),
          uptimePct: meta.uptimePct ?? 98,
          lastBackupHours
        },
        quick: {
          autoBackupEnabled: true,
          nextAutoBackupHours: meta.nextAutoBackupHours ?? 6
        },
        stats: {
          lastExport: meta.lastExport || null,
          cacheSizeMB: meta.cacheSizeMB ?? 0,
          activityCount30d
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { preferences = {}, security = {}, notifications = {} } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    user.preferences = {
      sessionTimeout: Number(preferences.sessionTimeout ?? 30),
      autoSave: !!preferences.autoSave,
      soundAlerts: !!preferences.soundAlerts
    };
    user.security = {
      twoFactor: !!security.twoFactor,
      rememberLogin: !!security.rememberLogin
    };
    user.notifications = {
      emailAlerts: !!notifications.emailAlerts,
      dailyDigest: !!notifications.dailyDigest,
      weeklyReport: !!notifications.weeklyReport,
      browserNotifications: !!notifications.browserNotifications,
      urgentOnly: !!notifications.urgentOnly,
      notificationSound: notifications.notificationSound || 'default'
    };

    await user.save();

    const meta = await SystemMeta.getOrCreate('default');
    meta.sectionsConfigured = 4;
    await meta.save();

    res.json({ success: true, message: 'Settings saved' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, message: 'Missing new password' });

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hasPassword = !!user.password;

    if (hasPassword) {
      if (!currentPassword) return res.status(400).json({ success: false, message: 'Missing current password' });
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    await user.save();

    const meta = await SystemMeta.getOrCreate('default');
    meta.activity.push({ type: 'security', message: `Password changed by ${user.email}` });
    await meta.save();

    res.json({ success: true, message: 'Password updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

router.post('/export', async (_req, res) => {
  try {
    const meta = await SystemMeta.getOrCreate('default');
    meta.lastExport = new Date();
    meta.activity.push({ type: 'export', message: 'Data export triggered' });
    await meta.save();
    res.json({ success: true, message: 'Export started' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to start export' });
  }
});

router.post('/backup', async (_req, res) => {
  try {
    const meta = await SystemMeta.getOrCreate('default');
    meta.lastBackupAt = new Date();
    meta.nextAutoBackupHours = 24;
    meta.activity.push({ type: 'backup', message: 'Backup completed' });
    await meta.save();
    res.json({ success: true, message: 'Backup done' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to run backup' });
  }
});

router.post('/cache/clear', async (_req, res) => {
  try {
    const meta = await SystemMeta.getOrCreate('default');
    meta.cacheSizeMB = 0;
    meta.activity.push({ type: 'maintenance', message: 'Cache cleared' });
    await meta.save();
    res.json({ success: true, message: 'Cache cleared' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    user.preferences = { sessionTimeout: 30, autoSave: true, soundAlerts: false };
    user.security = { twoFactor: false, rememberLogin: false };
    user.notifications = {
      emailAlerts: true, dailyDigest: true, weeklyReport: false,
      browserNotifications: true, urgentOnly: false, notificationSound: 'default'
    };
    await user.save();

    const meta = await SystemMeta.getOrCreate('default');
    meta.activity.push({ type: 'settings', message: 'Settings reset to defaults' });
    await meta.save();

    res.json({ success: true, message: 'Settings reset' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reset settings' });
  }
});

router.get('/activity', async (_req, res) => {
  try {
    const meta = await SystemMeta.getOrCreate('default');
    const items = [...(meta.activity || [])].sort((a, b) => b.at - a.at).slice(0, 50);
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load activity' });
  }
});

const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, index: true },
  value: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);


module.exports = router;
