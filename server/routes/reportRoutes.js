const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const upload = require('../middleware/upload');
const {
    createReport,
    getReports,
    getReport,
    updateReport,
    addComment,
    deleteReport,
    getNearbyReports
} = require('../controllers/reportController');

router.use(protect);
router.use(tenantIsolation);

router.route('/')
    .get(getReports)
    .post(
        upload.array('images', 5),
        [
            body('title').notEmpty().withMessage('Title is required'),
            body('description').notEmpty().withMessage('Description is required'),
            body('type').notEmpty().withMessage('Type is required'),
            body('location.address').notEmpty().withMessage('Location is required'),
            validate
        ],
        createReport
    );

router.route('/nearby')
    .get(getNearbyReports);

router.route('/:id')
    .get(getReport)
    .patch(updateReport)
    .delete(deleteReport);

router.route('/:id/comments')
    .post(addComment);

module.exports = router;