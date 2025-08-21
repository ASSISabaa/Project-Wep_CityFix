const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { notifyAdmins, notifyUser } = require('../utils/notify');

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message cannot exceed 1000 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // normalize subject to match schema enum (all lowercase)
    const subj = String(subject).trim().toLowerCase();

    let userId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cityfix-secret-key');
        userId = decoded._id || decoded.id || null;
      } catch { /* ignore */ }
    }

    let priority = 'medium';
    if (subj === 'technical' || subj === 'report-issue') priority = 'high';
    else if (subj === 'feedback' || subj === 'general') priority = 'low';

    const contact = await Contact.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).toLowerCase().trim(),
      subject: subj,
      message: String(message).trim(),
      priority,
      userId,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.get('user-agent') || ''
    });

    try {
      await notifyAdmins({
        title: 'New contact message',
        body: `${contact.firstName} ${contact.lastName}: ${contact.subject}`,
        type: 'general',
        priority: priority === 'high' ? 'high' : 'normal',
        link: `/admin/contact/${contact._id}`,
        data: { contactId: contact._id }
      });
    } catch { /* do not fail the request if notify throws */ }

    if (userId) {
      try {
        await notifyUser(userId, {
          title: 'Message received',
          body: 'We received your message.',
          type: 'general',
          priority: 'normal',
          link: `/contact-status.html?id=${contact._id}`,
          data: { contactId: contact._id }
        });
      } catch { /* ignore */ }
    }

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      contactId: contact._id,
      trackingNumber: `CONTACT-${contact._id.toString().slice(-8).toUpperCase()}`
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({ success: false, message: first?.message || 'Validation error' });
    }
    console.error('[CONTACT] POST error:', error);
    return res.status(500).json({ success: false, message: 'Error sending message. Please try again later.' });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select('status createdAt subject reply repliedAt');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact message not found' });
    return res.json({
      success: true,
      status: contact.status,
      submittedAt: contact.createdAt,
      subject: contact.subject,
      hasReply: Boolean(contact.reply),
      repliedAt: contact.repliedAt
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching message status' });
  }
});

router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status, priority, subject, search, startDate, endDate, page = 1, limit = 20, sort = 'newest' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = String(subject).toLowerCase();
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'priority') sortOption = { priority: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const contacts = await Contact.find(filter)
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip)
      .populate('userId', 'username email')
      .populate('repliedBy', 'username email');

    const total = await Contact.countDocuments(filter);
    const stats = {
      total: await Contact.countDocuments(),
      new: await Contact.countDocuments({ status: 'new' }),
      read: await Contact.countDocuments({ status: 'read' }),
      replied: await Contact.countDocuments({ status: 'replied' }),
      closed: await Contact.countDocuments({ status: 'closed' })
    };

    return res.json({
      success: true,
      contacts,
      stats,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('repliedBy', 'username email');
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }
    return res.json({ success: true, contact });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching message' });
  }
});

router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, message: 'Status updated successfully', contact });
  } catch {
    return res.status(500).json({ success: false, message: 'Error updating status' });
  }
});

router.put('/:id/reply', auth, adminAuth, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || reply.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Reply must be at least 10 characters long' });
    }
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });

    contact.status = 'replied';
    contact.reply = reply.trim();
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    await contact.save();

    if (contact.userId) {
      try {
        await notifyUser(contact.userId, {
          title: 'We replied to your message',
          body: reply.trim().slice(0, 140),
          type: 'general',
          priority: 'normal',
          link: `/contact-status.html?id=${contact._id}`,
          data: { contactId: contact._id }
        });
      } catch { /* ignore */ }
    }

    return res.json({ success: true, message: 'Reply sent successfully', contact });
  } catch {
    return res.status(500).json({ success: false, message: 'Error sending reply' });
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

module.exports = router;
