const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const reportRoutes = require('./reportRoutes');
const userRoutes = require('./userRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const searchRoutes = require('./searchRoutes');
const exportRoutes = require('./exportRoutes');
const tenantRoutes = require('./tenantRoutes');
const districtsRoutes = require('./districtsRoutes');
const reportTypesRoutes = require('./reportTypesRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);
router.use('/export', exportRoutes);
router.use('/tenants', tenantRoutes);
router.use('/districts', districtsRoutes);
router.use('/report-types', reportTypesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;