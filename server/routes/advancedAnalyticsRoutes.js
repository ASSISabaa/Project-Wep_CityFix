// server/routes/advancedAnalyticsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireRoleLevel, requireFeature } = require('../config/roles');
const {
  getComprehensiveOverview,
  getTrendAnalysis,
  getHeatmapData,
  getPerformanceMetrics,
  getComparativeAnalysis
} = require('../controllers/advancedAnalyticsController');

router.use(authenticate);
router.use(tenantIsolation);

router.get('/overview',
  requireRoleLevel(40),
  getComprehensiveOverview
);

router.get('/trends',
  requireRoleLevel(40),
  getTrendAnalysis
);

router.get('/heatmap',
  requireRoleLevel(20),
  getHeatmapData
);

router.get('/performance',
  requireRoleLevel(20),
  getPerformanceMetrics
);

router.get('/comparative',
  requireRoleLevel(60),
  requireFeature('view_analytics'),
  getComparativeAnalysis
);

router.get('/export',
  requireRoleLevel(60),
  async (req, res, next) => {
    try {
      const { format = 'json', type = 'overview' } = req.query;
      
      const ExportService = require('../services/ExportService');
      const Report = require('../models/Report');
      
      const data = await Report.find({ ...req.tenantFilter })
        .populate('reporter', 'username email')
        .populate('assignedTo', 'username email')
        .lean();
      
      if (format === 'csv') {
        const columns = [
          { header: 'Report Number', key: 'reportNumber' },
          { header: 'Title', key: 'title' },
          { header: 'Type', key: 'type' },
          { header: 'Status', key: 'status' },
          { header: 'Priority', key: 'priority' },
          { header: 'Created At', key: 'createdAt' }
        ];
        
        const filepath = await ExportService.exportToCSV(
          data,
          columns,
          `analytics-${Date.now()}`
        );
        
        res.download(filepath);
      } else if (format === 'excel') {
        const columns = [
          { header: 'Report Number', key: 'reportNumber', width: 15 },
          { header: 'Title', key: 'title', width: 30 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Priority', key: 'priority', width: 15 },
          { header: 'Created At', key: 'createdAt', width: 20 }
        ];
        
        const filepath = await ExportService.exportToExcel(
          data,
          columns,
          `analytics-${Date.now()}`
        );
        
        res.download(filepath);
      } else {
        res.json({
          success: true,
          count: data.length,
          data
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.get('/reports-by-location',
  requireRoleLevel(40),
  async (req, res, next) => {
    try {
      const Report = require('../models/Report');
      
      const locationStats = await Report.aggregate([
        { $match: { ...req.tenantFilter, 'location.district': { $exists: true } } },
        {
          $group: {
            _id: '$location.district',
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'resolved'] },
                  '$resolution.resolutionTime',
                  null
                ]
              }
            }
          }
        },
        { $sort: { total: -1 } }
      ]);
      
      res.json({
        success: true,
        data: locationStats
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/priority-distribution',
  requireRoleLevel(40),
  async (req, res, next) => {
    try {
      const Report = require('../models/Report');
      const { days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const distribution = await Report.aggregate([
        {
          $match: {
            ...req.tenantFilter,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              priority: '$priority',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.priority': -1, '_id.status': 1 } }
      ]);
      
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;