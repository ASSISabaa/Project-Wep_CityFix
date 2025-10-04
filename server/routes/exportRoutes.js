const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { USER_ROLES } = require('../config/constants');
const Report = require('../models/Report');
const path = require('path');
const fs = require('fs');

router.use(protect);
router.use(tenantIsolation);
router.use(authorize(USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN));

router.get('/reports', async (req, res, next) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;
        
        const query = { ...req.tenantFilter };
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const reports = await Report.find(query)
            .populate('reporter', 'username email')
            .populate('assignedTo', 'username email')
            .lean();

        if (format === 'json') {
            res.json({
                success: true,
                count: reports.length,
                data: reports
            });
        } else if (format === 'csv') {
            const csv = convertToCSV(reports);
            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', 'attachment; filename="reports.csv"');
            res.send(csv);
        }
    } catch (error) {
        next(error);
    }
});

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = [
        'Report Number',
        'Title',
        'Type',
        'Status',
        'Priority',
        'Location',
        'Reporter',
        'Assigned To',
        'Created At',
        'Resolved At'
    ];
    
    const rows = data.map(report => [
        report.reportNumber,
        report.title,
        report.type,
        report.status,
        report.priority,
        report.location?.address || '',
        report.reporter?.username || '',
        report.assignedTo?.username || '',
        report.createdAt,
        report.resolution?.resolvedAt || ''
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') 
                ? `"${cell}"` 
                : cell
        ).join(','))
    ].join('\n');
}

module.exports = router;