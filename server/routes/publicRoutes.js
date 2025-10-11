const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Public endpoint - no authentication needed
router.get('/reports', async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            district, 
            type, 
            status,
            limit = 100 
        } = req.query;

        let query = { isDeleted: false };

        // Apply filters
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (district) {
            query['location.district'] = district;
        }

        if (type) {
            const types = type.split(',');
            query.type = { $in: types };
        }

        if (status) {
            const statuses = status.split(',');
            query.status = { $in: statuses };
        }

        const reports = await Report.find(query)
            .select('title description type status priority location createdAt images')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Public stats endpoint
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate, district } = req.query;

        let query = { isDeleted: false };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (district) {
            query['location.district'] = district;
        }

        const [
            totalReports,
            resolvedReports,
            inProgressReports,
            pendingReports
        ] = await Promise.all([
            Report.countDocuments(query),
            Report.countDocuments({ ...query, status: 'resolved' }),
            Report.countDocuments({ ...query, status: 'inProgress' }),
            Report.countDocuments({ ...query, status: 'new' })
        ]);

        // Calculate weekly trend
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const lastWeekQuery = { 
            ...query,
            createdAt: { $gte: oneWeekAgo }
        };

        const lastWeekReports = await Report.countDocuments(lastWeekQuery);
        const weeklyTrend = totalReports > 0 
            ? Math.round((lastWeekReports / totalReports) * 100) 
            : 0;

        res.json({
            success: true,
            data: {
                totalReports,
                resolvedReports,
                inProgressReports,
                newReports: pendingReports,
                resolutionRate: totalReports > 0 
                    ? Math.round((resolvedReports / totalReports) * 100) 
                    : 0,
                weeklyTrend
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Public report details endpoint
router.get('/reports/:id', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .select('title description type status priority location createdAt images')
            .lean();

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report'
        });
    }
});

module.exports = router;