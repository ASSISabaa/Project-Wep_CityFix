const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const Notification = require('../models/Notification');

router.use(protect);
router.use(tenantIsolation);

router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unread } = req.query;
        
        const query = {
            recipient: req.user._id
        };
        
        if (unread === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('data.reportId', 'title reportNumber')
            .populate('data.userId', 'username');

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: notifications,
            total,
            unreadCount: await Notification.countDocuments({
                recipient: req.user._id,
                isRead: false
            })
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/read', async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/mark-all-read', async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;