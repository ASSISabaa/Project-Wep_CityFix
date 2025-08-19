const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// protect all admin routes
router.use(auth);
router.use(adminAuth);

/* ---------- Dashboard ---------- */
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const rejectedReports = await Report.countDocuments({ status: 'rejected' });

    const reportsByType = await Report.aggregate([{ $group: { _id: '$issueType', count: { $sum: 1 } } }]);
    const reportsByDistrict = await Report.aggregate([{ $group: { _id: '$district', count: { $sum: 1 } } }]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayReports = await Report.countDocuments({ createdAt: { $gte: today } });
    const todayResolved = await Report.countDocuments({ status: 'resolved', 'resolution.resolvedAt': { $gte: today } });

    res.json({
      success: true,
      dashboard: {
        users: { total: totalUsers, active: activeUsers, verified: verifiedUsers },
        reports: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          resolved: resolvedReports,
          rejected: rejectedReports,
          todayNew: todayReports,
          todayResolved
        },
        reportsByType,
        reportsByDistrict
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

/* ---------- Users (filters on server) ---------- */
router.get('/users', async (req, res) => {
  try {
    const {
      role,
      isActive,
      search = '',
      department,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = String(isActive) === 'true';

    const or = [];
    if (department) {
      const rx = new RegExp(String(department).trim(), 'i');
      or.push({ department: rx }, { 'profile.department': rx }, { 'profile.dept': rx });
    }
    if (status) {
      const rx = new RegExp(String(status).trim(), 'i');
      or.push({ status: rx }, { 'presence.status': rx });
    }
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      or.push(
        { fullName: rx }, { name: rx }, { username: rx }, { email: rx },
        { role: rx }, { roleTitle: rx },
        { department: rx }, { 'profile.department': rx }, { 'profile.dept': rx }
      );
    }
    if (or.length) filter.$or = or;

    const _page = Number(page) || 1;
    const _limit = Math.min(Number(limit) || 50, 500);
    const skip = (_page - 1) * _limit;

    const users = await User.find(filter)
      .select('-password')
      .sort({ lastLoginAt: -1, updatedAt: -1 })
      .limit(_limit)
      .skip(skip)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: { total, page: _page, pages: Math.ceil(total / _limit) }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

/* ---------- Invite (email + nationalId) ---------- */
router.post('/invite', async (req, res) => {
  try {
    let { email, nationalId, role = 'moderator' } = req.body;

    if (!email || !nationalId) {
      return res.status(400).json({ success: false, message: 'email and nationalId are required' });
    }

    email = String(email).trim().toLowerCase();
    nationalId = String(nationalId).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'invalid email' });
    }
    if (!['admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'invalid role' });
    }

    const emailExists = await User.findOne({ email: new RegExp(`^${email}$`, 'i') }).lean();
    if (emailExists) return res.status(409).json({ success: false, message: 'email already exists' });

    const nidExists = await User.findOne({ nationalId }).lean();
    if (nidExists) return res.status(409).json({ success: false, message: 'national id already exists' });

    const username = email.split('@')[0];

    // temp password -> hash (to satisfy required password)
    const tempPassword = 'inv_' + crypto.randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const doc = {
      email,
      username,
      role,
      nationalId,
      isActive: false,
      isVerified: false,
      password: passwordHash,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let user;
    try {
      user = await User.create(doc);
    } catch (e) {
      if (e && e.code === 11000) {
        const key = Object.keys(e.keyPattern || {})[0] || 'unique';
        return res.status(409).json({ success: false, message: `${key} already exists` });
      }
      try {
        const ins = await User.collection.insertOne(doc);
        user = { _id: ins.insertedId, email, username, role, isActive: false };
      } catch (iErr) {
        if (iErr && iErr.code === 11000) {
          const key = Object.keys(iErr.keyPattern || {})[0] || 'unique';
          return res.status(409).json({ success: false, message: `${key} already exists` });
        }
        console.error('Invite insert error:', iErr);
        return res.status(500).json({ success: false, message: 'Error creating invitation' });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation created',
      user: { _id: user._id, email, username, role, isActive: false }
    });
  } catch (error) {
    console.error('Invite error:', error);
    return res.status(500).json({ success: false, message: 'Error creating invitation' });
  }
});

/* ---------- Mutations ---------- */
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User status updated', user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['citizen', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User role updated', user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    if (u._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await Report.updateMany({ reportedBy: u._id }, { reportedBy: null, isAnonymous: true });
    await u.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

/* ---------- Reports workflow ---------- */
router.put('/reports/:id/assign', async (req, res) => {
  try {
    const { assignTo } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: assignTo,
        status: 'in-progress',
        $push: {
          statusHistory: {
            status: 'in-progress',
            changedBy: req.user._id,
            changedAt: new Date(),
            notes: `Assigned to user ${assignTo}`
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'username email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report assigned successfully', report });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({ success: false, message: 'Error assigning report' });
  }
});

router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const { resolutionNotes, resolutionImages } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolution: {
          resolvedBy: req.user._id,
          resolvedAt: new Date(),
          resolutionNotes,
          resolutionImages: resolutionImages || []
        },
        $push: {
          statusHistory: {
            status: 'resolved',
            changedBy: req.user._id,
            changedAt: new Date(),
            notes: resolutionNotes
          }
        }
      },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    await User.findByIdAndUpdate(report.reportedBy, {
      $inc: { 'statistics.resolvedReports': 1, 'statistics.pendingReports': -1 }
    });

    res.json({ success: true, message: 'Report resolved successfully', report });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, message: 'Error resolving report' });
  }
});

router.put('/reports/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejection: { rejectedBy: req.user._id, rejectedAt: new Date(), rejectionReason },
        $push: {
          statusHistory: {
            status: 'rejected',
            changedBy: req.user._id,
            changedAt: new Date(),
            notes: rejectionReason
          }
        }
      },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    await User.findByIdAndUpdate(report.reportedBy, {
      $inc: { 'statistics.rejectedReports': 1, 'statistics.pendingReports': -1 }
    });

    res.json({ success: true, message: 'Report rejected', report });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting report' });
  }
});

module.exports = router;
