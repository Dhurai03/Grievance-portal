const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateJWT, authController.getMe);
router.patch('/profile', authenticateJWT, authController.updateProfile);
router.post('/change-password', authenticateJWT, authController.changePassword);

module.exports = router;
