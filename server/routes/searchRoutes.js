const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const Report = require('../models/Report');
const User = require('../models/User');

router.use(protect);
router.use(tenantIsolation);

router.get('/', async (req, res, next) => {
    try {
        const { q, type = 'all' } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: {
                    reports: [],
                    users: []
                }
            });
        }

        const results = {};

        if (type === 'all' || type === 'reports') {
            results.reports = await Report.find({
                ...req.tenantFilter,
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { reportNumber: { $regex: q, $options: 'i' } }
                ]
            })
            .limit(10)
            .select('title reportNumber status type createdAt')
            .populate('reporter', 'username');
        }

        if (type === 'all' || type === 'users') {
            results.users = await User.find({
                ...req.tenantFilter,
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
            })
            .limit(10)
            .select('username email role profile.avatar');
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
});

router.get('/suggestions', async (req, res, next) => {
    try {
        const { field, value } = req.query;
        
        if (!field || !value) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await Report.distinct(field, {
            ...req.tenantFilter,
            [field]: { $regex: value, $options: 'i' }
        }).limit(10);

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;