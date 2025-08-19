const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/User');

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k, obj[k]]));

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const me = await User.findById(req.user._id).lean();
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    const securityLevel = me.security?.twoFactor ? 'High' : 'Medium';
    res.json({
      success: true,
      cards: {
        profileSections: 4,
        securityLevel,
        systemUptimePct: 98,
        lastBackup: null,
        autoBackupEnabled: true
      },
      general: {
        fullName: me.fullName || me.username || '',
        email: me.email,
        role: me.role
      },
      security: {
        twoFactor: !!me.security?.twoFactor,
        rememberLogin: !!me.security?.rememberLogin,
        sessionTimeout: me.preferences?.sessionTimeout ?? 30
      },
      preferences: {
        autoSave: !!me.preferences?.autoSave,
        soundAlerts: !!me.preferences?.soundAlerts
      },
      notifications: {
        emailAlerts: !!me.notifications?.emailAlerts,
        dailyDigest: !!me.notifications?.dailyDigest,
        weeklyReport: !!me.notifications?.weeklyReport,
        browserNotifications: !!me.notifications?.browserNotifications,
        urgentOnly: !!me.notifications?.urgentOnly,
        notificationSound: me.notifications?.notificationSound || 'default'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

router.put('/general', async (req, res) => {
  try {
    const payload = pick(req.body, ['fullName', 'email']);
    const me = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(payload.fullName !== undefined ? { fullName: String(payload.fullName) } : {}),
        ...(payload.email !== undefined ? { email: String(payload.email) } : {})
      },
      { new: true, runValidators: true }
    ).lean();
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, general: { fullName: me.fullName, email: me.email, role: me.role } });
  } catch (_) {
    res.status(400).json({ success: false, message: 'Failed to update general settings' });
  }
});

router.put('/security', async (req, res) => {
  try {
    const toBool = v => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
    const twoFactor = toBool(req.body.twoFactor);
    const rememberLogin = toBool(req.body.rememberLogin);
    const sessionTimeout = Number(req.body.sessionTimeout ?? 30);

    const me = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'security.twoFactor': !!twoFactor,
          'security.rememberLogin': !!rememberLogin,
          'preferences.sessionTimeout': Number.isFinite(sessionTimeout) ? sessionTimeout : 30
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      security: {
        twoFactor: !!me.security?.twoFactor,
        rememberLogin: !!me.security?.rememberLogin,
        sessionTimeout: me.preferences?.sessionTimeout ?? 30
      }
    });
  } catch (_) {
    res.status(400).json({ success: false, message: 'Failed to update security' });
  }
});

router.put('/notifications', async (req, res) => {
  try {
    const toBool = v => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
    const allowedSounds = ['default', 'chime', 'bell', 'silent'];

    const payload = {
      emailAlerts: toBool(req.body.emailAlerts),
      dailyDigest: toBool(req.body.dailyDigest),
      weeklyReport: toBool(req.body.weeklyReport),
      browserNotifications: toBool(req.body.browserNotifications),
      urgentOnly: toBool(req.body.urgentOnly),
      notificationSound: allowedSounds.includes(req.body.notificationSound) ? req.body.notificationSound : 'default'
    };

    const me = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: Object.fromEntries(Object.entries(payload).map(([k, v]) => [`notifications.${k}`, v]))
      },
      { new: true, runValidators: true }
    ).lean();

    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, notifications: me.notifications });
  } catch (_) {
    res.status(400).json({ success: false, message: 'Failed to update notifications' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password too short' });
    }

    const me = await User.findById(req.user._id).select('+password');
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    if (me.password) {
      const ok = await bcrypt.compare(currentPassword, me.password);
      if (!ok) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    me.password = await bcrypt.hash(newPassword, salt);
    me.passwordChangedAt = new Date();
    await me.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (_) {
    res.status(400).json({ success: false, message: 'Failed to change password' });
  }
});

router.post('/actions/export', async (_req, res) => {
  res.json({ success: true, message: 'Export started', url: null });
});

router.post('/actions/backup', async (_req, res) => {
  res.json({ success: true, message: 'Backup started' });
});

router.post('/actions/clear-cache', async (_req, res) => {
  res.json({ success: true, message: 'Cache cleared' });
});

router.post('/actions/reset-preferences', async (req, res) => {
  try {
    const me = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'preferences.sessionTimeout': 30,
          'preferences.autoSave': true,
          'preferences.soundAlerts': false,
          'security.twoFactor': false,
          'security.rememberLogin': false,
          'notifications.emailAlerts': true,
          'notifications.dailyDigest': true,
          'notifications.weeklyReport': false,
          'notifications.browserNotifications': true,
          'notifications.urgentOnly': false,
          'notifications.notificationSound': 'default'
        }
      },
      { new: true }
    );
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Preferences reset' });
  } catch (_) {
    res.status(400).json({ success: false, message: 'Failed to reset preferences' });
  }
});

module.exports = router;
