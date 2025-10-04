const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { USER_ROLES } = require('../config/constants');
const Report = require('../models/Report');
const User = require('../models/User');

router.use(protect);
router.use(tenantIsolation);

router.get('/stats', async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            totalReports: await Report.countDocuments(req.tenantFilter),
            newReports: await Report.countDocuments({
                ...req.tenantFilter,
                status: 'new'
            }),
            inProgressReports: await Report.countDocuments({
                ...req.tenantFilter,
                status: 'inProgress'
            }),
            resolvedReports: await Report.countDocuments({
                ...req.tenantFilter,
                status: 'resolved'
            }),
            todayReports: await Report.countDocuments({
                ...req.tenantFilter,
                createdAt: { $gte: today }
            })
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

router.get('/recent-activity', async (req, res, next) => {
    try {
        const recentReports = await Report.find(req.tenantFilter)
            .sort('-createdAt')
            .limit(10)
            .populate('reporter', 'username email')
            .populate('assignedTo', 'username');

        res.json({
            success: true,
            data: recentReports
        });
    } catch (error) {
        next(error);
    }
});

router.get('/chart-data', async (req, res, next) => {
    try {
        const { type = 'weekly' } = req.query;
        let dateFilter = {};
        
        const now = new Date();
        if (type === 'weekly') {
            dateFilter = {
                $gte: new Date(now.setDate(now.getDate() - 7))
            };
        } else if (type === 'monthly') {
            dateFilter = {
                $gte: new Date(now.setMonth(now.getMonth() - 1))
            };
        }

        const chartData = await Report.aggregate([
            {
                $match: {
                    ...req.tenantFilter,
                    createdAt: dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;