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
    if (firstName.length < 2 || lastName.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
    }
    if (message.length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message cannot exceed 1000 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    let userId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cityfix-secret-key');
        userId = decoded._id || decoded.id || null;
      } catch {}
    }

    let priority = 'medium';
    if (subject === 'technical' || subject === 'report-issue') priority = 'high';
    else if (subject === 'feedback' || subject === 'general') priority = 'low';

    const contact = new Contact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      subject,
      message: message.trim(),
      priority,
      userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    await contact.save();

    await notifyAdmins({
      title: 'New contact message',
      body: `${firstName} ${lastName}: ${subject}`,
      type: 'general',
      priority: priority === 'high' ? 'high' : 'normal',
      link: `/admin/contact/${contact._id}`,
      data: { contactId: contact._id }
    });

    if (userId) {
      await notifyUser(userId, {
        title: 'Message received',
        body: 'We received your message.',
        type: 'general',
        priority: 'normal',
        link: `/contact-status.html?id=${contact._id}`,
        data: { contactId: contact._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      contactId: contact._id,
      trackingNumber: `CONTACT-${contact._id.toString().slice(-8).toUpperCase()}`
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: errors[0] || 'Validation error' });
    }
    res.status(500).json({ success: false, message: 'Error sending message. Please try again later.' });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select('status createdAt subject reply repliedAt');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact message not found' });
    res.json({
      success: true,
      status: contact.status,
      submittedAt: contact.createdAt,
      subject: contact.subject,
      hasReply: !!contact.reply,
      repliedAt: contact.repliedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching message status' });
  }
});

router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status, priority, subject, search, startDate, endDate, page = 1, limit = 20, sort = 'newest' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = subject;
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

    const skip = (page - 1) * limit;
    const contacts = await Contact.find(filter)
      .sort(sortOption)
      .limit(parseInt(limit))
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

    res.json({
      success: true,
      contacts,
      stats,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching messages' });
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
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching message' });
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
    res.json({ success: true, message: 'Status updated successfully', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status' });
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
      await notifyUser(contact.userId, {
        title: 'We replied to your message',
        body: reply.trim().slice(0, 140),
        type: 'general',
        priority: 'normal',
        link: `/contact-status.html?id=${contact._id}`,
        data: { contactId: contact._id }
      });
    }

    res.json({ success: true, message: 'Reply sent successfully', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending reply' });
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

module.exports = router;
