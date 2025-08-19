const Notification = require('../models/Notification');
const User = require('../models/User');

const normPriority = p => (['low','normal','high'].includes(p) ? p : 'normal');

async function notifyMany(userIds, payload) {
  if (!Array.isArray(userIds) || !userIds.length) return { insertedCount: 0 };
  const docs = userIds.map(id => ({
    userId: id,
    title: payload.title,
    body: payload.body || '',
    type: payload.type || 'general',
    priority: normPriority(payload.priority),
    link: payload.link || '',
    icon: payload.icon || '',
    data: payload.data || {}
  }));
  const res = await Notification.insertMany(docs);
  return { insertedCount: res.length };
}

async function notifyUser(userId, payload) {
  if (!userId) return { insertedCount: 0 };
  return notifyMany([userId], payload);
}

async function notifyAdmins(payload) {
  const admins = await User.find({
    isActive: { $ne: false },
    role: { $in: ['admin','administrator','Admin','Administrator'] }
  }).select('_id');
  return notifyMany(admins.map(u => u._id), payload);
}

async function notifyRole(role, payload) {
  const users = await User.find({ role, isActive: { $ne: false } }).select('_id');
  return notifyMany(users.map(u => u._id), payload);
}

async function notifyAll(payload) {
  const users = await User.find({ isActive: { $ne: false } }).select('_id');
  return notifyMany(users.map(u => u._id), payload);
}

const reportLink = r => `/reports.html?id=${r._id}`;

async function notifyReportStatus({ report, oldStatus, newStatus, actorId }) {
  const type = newStatus === 'resolved' ? 'report_resolved' : 'report_update';
  const priority = newStatus === 'resolved' ? 'normal' : 'high';
  const payload = {
    title: `Report ${newStatus}`,
    body: report.title || report.issueType || 'Report update',
    type,
    priority,
    link: reportLink(report),
    data: { reportId: report._id, oldStatus, newStatus, actorId }
  };
  const targets = new Set();
  if (report.reportedBy) targets.add(String(report.reportedBy));
  if (report.assignee) targets.add(String(report.assignee));
  const admins = await User.find({ role: { $in: ['admin','administrator','Admin','Administrator'] } }).select('_id');
  admins.forEach(u => targets.add(String(u._id)));
  return notifyMany([...targets], payload);
}

async function notifyReportNote({ report, note, actorId }) {
  const payload = {
    title: 'Report note added',
    body: String(note || '').slice(0, 140),
    type: 'report_update',
    priority: 'normal',
    link: reportLink(report),
    data: { reportId: report._id, note, actorId }
  };
  const targets = new Set();
  if (report.reportedBy) targets.add(String(report.reportedBy));
  if (report.assignee) targets.add(String(report.assignee));
  const admins = await User.find({ role: { $in: ['admin','administrator','Admin','Administrator'] } }).select('_id');
  admins.forEach(u => targets.add(String(u._id)));
  return notifyMany([...targets], payload);
}

module.exports = {
  notifyUser,
  notifyAdmins,
  notifyRole,
  notifyAll,
  notifyReportStatus,
  notifyReportNote
};
