const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const {
    createTenant,
    getTenants,
    getTenant,
    updateTenant,
    deleteTenant,
    getTenantStatistics
} = require('../controllers/tenantController');

router.use(protect);
router.use(authorize(USER_ROLES.SUPER_SUPER_ADMIN));

router.route('/')
    .get(getTenants)
    .post([
        body('name').notEmpty().withMessage('Tenant name is required'),
        body('code').notEmpty().withMessage('Tenant code is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('country').notEmpty().withMessage('Country is required'),
        validate
    ], createTenant);

router.route('/:id')
    .get(getTenant)
    .patch(updateTenant)
    .delete(deleteTenant);

router.route('/:id/statistics')
    .get(getTenantStatistics);

module.exports = router;