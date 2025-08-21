// server/routes/users.js - BACKEND CODE ONLY
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); // IMPORTANT - Add this line

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('reportsSubmitted');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = [
            'username', 'phoneNumber', 'address', 
            'preferences', 'profilePicture'
        ];
        
        // Filter allowed updates
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        // Check if username is taken
        if (updates.username) {
            const existingUser = await User.findOne({ 
                username: updates.username,
                _id: { $ne: req.user._id }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;
        
        const filter = { reportedBy: req.user._id };
        if (status) filter.status = status;
        
        const skip = (page - 1) * limit;
        
        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Report.countDocuments(filter);
        
        res.json({
            success: true,
            reports,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reports'
        });
    }
});

// Get user statistics - COMPLETE VERSION
router.get('/statistics', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all reports counts
        const totalReports = await Report.countDocuments({ reportedBy: userId });
        const pendingReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: 'pending' 
        });
        const inProgressReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: 'in-progress' 
        });
        const resolvedReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: 'resolved' 
        });
        const rejectedReports = await Report.countDocuments({ 
            reportedBy: userId, 
            status: 'rejected' 
        });
        
        // Get last report
        const lastReport = await Report.findOne({ reportedBy: userId })
            .sort({ createdAt: -1 });
        
        // Get reports by type
        const reportsByType = await Report.aggregate([
            { $match: { reportedBy: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$issueType', count: { $sum: 1 } } }
        ]);
        
        res.json({
            success: true,
            statistics: {
                totalReports,
                pendingReports,
                inProgressReports,
                resolvedReports,
                rejectedReports,
                reportsByType,
                lastReportDate: lastReport ? lastReport.createdAt : null
            }
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your password to confirm'
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Delete user's reports or anonymize them
        await Report.updateMany(
            { reportedBy: req.user._id },
            { 
                reportedBy: null,
                isAnonymous: true 
            }
        );
        
        // Delete user
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting account'
        });
    }
});

// Public user lookup by id for dashboard (admin or self only)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId early
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // Authorization: admins can read anyone; users can read only themselves
    const isAdmin = req.user?.role === 'admin';
    const isSelf = req.user?._id?.toString() === id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Select only safe, public fields
    const user = await User.findById(id).select('username email phone phoneNumber role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Normalize phone field name to 'phone' for frontend
    const normalized = {
      _id: user._id,
      username: user.username || null,
      email: user.email || null,
      phone: user.phone || user.phoneNumber || null,
      role: user.role || null
    };

    return res.json(normalized);
  } catch (e) {
    console.error('User lookup error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;