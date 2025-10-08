const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics
} = require('../controllers/userController');

router.use(authenticate);

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/statistics', getUserStatistics);

module.exports = router;
