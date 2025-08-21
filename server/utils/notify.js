const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create notifications for all admins/moderators.
 * Safe to call even if no Socket.IO is configured.
 */
async function notifyAdmins(payload, io) {
  const admins = await User.find({ role: { $in: ['admin', 'moderator'] } }, { _id: 1 }).lean();
  if (!admins.length) return;

  const docs = admins.map(a => ({
    userId: a._id,
    title: payload.title,
    body: payload.body,
    type: payload.type || 'general',
    priority: payload.priority || 'normal',
    link: payload.link || '',
    icon: payload.icon || '',
    data: payload.data || {},
    read: false
  }));

  const created = await Notification.insertMany(docs);

  if (io) {
    created.forEach(n => {
      io.to(String(n.userId)).emit('notification:new', {
        id: n._id,
        title: n.title,
        body: n.body,
        type: n.type,
        priority: n.priority,
        link: n.link,
        data: n.data,
        createdAt: n.createdAt
      });
    });
  }
}

/**
 * Create a notification for a single user.
 */
async function notifyUser(userId, payload, io) {
  const n = await Notification.create({
    userId,
    title: payload.title,
    body: payload.body,
    type: payload.type || 'general',
    priority: payload.priority || 'normal',
    link: payload.link || '',
    icon: payload.icon || '',
    data: payload.data || {},
    read: false
  });

  if (io) {
    io.to(String(userId)).emit('notification:new', {
      id: n._id,
      title: n.title,
      body: n.body,
      type: n.type,
      priority: n.priority,
      link: n.link,
      data: n.data,
      createdAt: n.createdAt
    });
  }
}

module.exports = { notifyAdmins, notifyUser };
