const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

function normPrefs(u) {
  const p = u.notificationPrefs || {};
  return {
    email: { enabled: !!p?.email?.enabled, lastSentAt: p?.email?.lastSentAt || null },
    push: { enabled: !!p?.push?.enabled },
    sms: { enabled: !!p?.sms?.enabled },
    dailyDigest: { enabled: !!p?.dailyDigest?.enabled, hourLocal: Number.isFinite(p?.dailyDigest?.hourLocal) ? p.dailyDigest.hourLocal : 8 },
    teamUpdates: { enabled: !!p?.teamUpdates?.enabled }
  };
}

router.use(auth);

router.get('/preferences', async (req, res) => {
  const me = await User.findById(req.user._id).lean();
  if (!me) return res.status(404).json({ success: false, message: 'User not found' });
  const prefs = normPrefs(me);
  const aliases = {
    emailNotifications: !!prefs.email.enabled,
    pushNotifications: !!prefs.push.enabled,
    smsAlerts: !!prefs.sms.enabled,
    dailyDigest: { enabled: !!prefs.dailyDigest.enabled, hourLocal: prefs.dailyDigest.hourLocal },
    teamUpdates: !!prefs.teamUpdates.enabled
  };
  res.json({ success: true, preferences: { ...prefs, ...aliases } });
});

router.put('/preferences', async (req, res) => {
  const payload = {};
  if (req.body?.email) payload['notificationPrefs.email.enabled'] = !!req.body.email.enabled;
  if (req.body?.push) payload['notificationPrefs.push.enabled'] = !!req.body.push.enabled;
  if (req.body?.sms) payload['notificationPrefs.sms.enabled'] = !!req.body.sms.enabled;
  if (req.body?.teamUpdates) payload['notificationPrefs.teamUpdates.enabled'] = !!req.body.teamUpdates.enabled;
  if (req.body?.dailyDigest) {
    if (req.body.dailyDigest.enabled !== undefined) payload['notificationPrefs.dailyDigest.enabled'] = !!req.body.dailyDigest.enabled;
    if (req.body.dailyDigest.hourLocal !== undefined) payload['notificationPrefs.dailyDigest.hourLocal'] = Number(req.body.dailyDigest.hourLocal) || 8;
  }
  const me = await User.findByIdAndUpdate(req.user._id, { $set: payload }, { new: true }).lean();
  if (!me) return res.status(404).json({ success: false, message: 'User not found' });
  const prefs = normPrefs(me);
  const aliases = {
    emailNotifications: !!prefs.email.enabled,
    pushNotifications: !!prefs.push.enabled,
    smsAlerts: !!prefs.sms.enabled,
    dailyDigest: { enabled: !!prefs.dailyDigest.enabled, hourLocal: prefs.dailyDigest.hourLocal },
    teamUpdates: !!prefs.teamUpdates.enabled
  };
  res.json({ success: true, preferences: { ...prefs, ...aliases } });
});

router.get('/overview', async (req, res) => {
  const userId = req.user._id;
  const [unread, urgent, systemUpdates] = await Promise.all([
    Notification.countDocuments({ userId, read: false, archived: { $ne: true }, dismissed: { $ne: true } }),
    Notification.countDocuments({ userId, priority: 'high', archived: { $ne: true }, dismissed: { $ne: true } }),
    Notification.countDocuments({ userId, type: 'system', archived: { $ne: true }, dismissed: { $ne: true } })
  ]);
  const me = await User.findById(userId).lean();
  const p = normPrefs(me || {});
  const activeSubscriptions = ['email','push','sms','dailyDigest','teamUpdates'].filter(k => p[k]?.enabled).length;
  res.json({ success: true, stats: { unread, urgent, systemUpdates, activeSubscriptions } });
});

router.get('/', async (req, res) => {
  const userId = req.user._id;
  const filter = String(req.query.filter || 'all');
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const q = { userId, archived: { $ne: true }, dismissed: { $ne: true } };
  if (filter === 'unread') q.read = false;
  if (filter === 'urgent') q.priority = 'high';

  const [items, total] = await Promise.all([
    Notification.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(q)
  ]);

  const mapped = items.map(n => ({
    ...n,
    message: n.body
  }));

  res.json({ success: true, notifications: mapped, total, page, limit });
});

router.put('/mark-all-read', async (req, res) => {
  const userId = req.user._id;
  const r = await Notification.updateMany({ userId, read: false, archived: { $ne: true }, dismissed: { $ne: true } }, { $set: { read: true } });
  res.json({ success: true, updated: r.modifiedCount || 0 });
});

router.put('/:id/read', async (req, res) => {
  const r = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } }, { new: true }).lean();
  if (!r) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
});

router.put('/:id/archive', async (req, res) => {
  const r = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { archived: true } }, { new: true }).lean();
  if (!r) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
});

router.put('/:id/dismiss', async (req, res) => {
  const r = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { dismissed: true } }, { new: true }).lean();
  if (!r) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
});

router.post('/seed-demo', async (req, res) => {
  const userId = req.user._id;
  const exists = await Notification.countDocuments({ userId });
  if (!exists) {
    await Notification.insertMany([
      { userId, title: 'System backup completed', body: 'Automatic backup finished', type: 'system', priority: 'low' },
      { userId, title: 'New report assigned', body: 'Pothole on Main St.', type: 'report_update', priority: 'high', link: '/reports.html' },
      { userId, title: 'Team member joined', body: 'Moderator added', type: 'team', priority: 'normal' }
    ]);
  }
  res.json({ success: true });
});

module.exports = router;
