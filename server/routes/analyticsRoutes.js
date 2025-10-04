const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { USER_ROLES } = require('../config/constants');
const {
    getOverview,
    getTrends,
    getHeatmapData,
    getPerformanceMetrics
} = require('../controllers/analyticsController');

router.use(protect);
router.use(tenantIsolation);
router.use(authorize(
    USER_ROLES.SUPER_SUPER_ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
));

router.get('/overview', getOverview);
router.get('/trends', getTrends);
router.get('/heatmap', getHeatmapData);
router.get('/performance', getPerformanceMetrics);

module.exports = router;