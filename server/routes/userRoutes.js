const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { USER_ROLES } = require('../config/constants');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserStatistics
} = require('../controllers/userController');

router.use(protect);
router.use(tenantIsolation);

router.route('/')
    .get(
        authorize(USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        getUsers
    )
    .post(
        authorize(USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        [
            body('username').notEmpty().withMessage('Username is required'),
            body('email').isEmail().withMessage('Valid email is required'),
            body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
            body('role').notEmpty().withMessage('Role is required'),
            validate
        ],
        createUser
    );

router.route('/:id')
    .get(getUser)
    .patch(
        authorize(USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        updateUser
    )
    .delete(
        authorize(USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN),
        deleteUser
    );

router.route('/:id/statistics')
    .get(getUserStatistics);

module.exports = router;