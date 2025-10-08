const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(authenticate);

router.get('/', reportController.getReports);
router.post('/', reportController.createReport);
router.get('/:id', reportController.getReport);
router.patch('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
