const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// All user management routes require admin privileges
router.use(protect, adminOnly);

router.get('/', userController.getAdminUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
