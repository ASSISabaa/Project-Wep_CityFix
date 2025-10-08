const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/register', authController.register);
router.get('/verify', authenticate, authController.verifyToken);
router.get('/me', authenticate, authController.getMe);

module.exports = router;