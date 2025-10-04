const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Public endpoint - no authentication needed
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find()
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(100)
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
        const totalReports = await Report.countDocuments();
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        
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
                weeklyTrend: 10
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;